# Reporte Técnico Completo — SIGNUM

## Sistema de Reconocimiento de Lengua de Señas Mexicana

### Arquitectura Distribuida Orientada a Servicios (SOA)

---

# Índice

1. [Conceptos Fundamentales](#1-conceptos-fundamentales)
2. [Visión General del Proyecto](#2-visión-general-del-proyecto)
3. [Arquitectura Distribuida](#3-arquitectura-distribuida)
4. [Servicio 1: Frontend Web (Next.js)](#4-servicio-1-frontend-web-nextjs)
5. [Servicio 2: App Móvil (Expo/React Native)](#5-servicio-2-app-móvil-expo-react-native)
6. [Servicio 3: ML Service (Express)](#6-servicio-3-ml-service-express)
7. [Servicio 4: Supabase (Backend-as-a-Service)](#7-servicio-4-supabase-backend-as-a-service)
8. [Servicios Externos: Groq y ElevenLabs](#8-servicios-externos-groq-y-elevenlabs)
9. [Autonomía del Servicio](#9-autonomía-del-servicio)
10. [Contrato de Servicio Bien Definido](#10-contrato-de-servicio-bien-definido)
11. [Bajo Acoplamiento](#11-bajo-acoplamiento)
12. [Seguridad entre Servicios](#12-seguridad-entre-servicios)
13. [Machine Learning Pipeline](#13-machine-learning-pipeline)
14. [Base de Datos y Persistencia](#14-base-de-datos-y-persistencia)
15. [Decisiones de Diseño Justificadas](#15-decisiones-de-diseño-justificadas)
16. [Cómo Probar el Sistema](#16-cómo-probar-el-sistema)
17. [Tolerancia a Fallos](#17-tolerancia-a-fallos)
18. [Pruebas E2E Automatizadas](#18-pruebas-e2e-automatizadas)
19. [Repositorio y Estructura de Archivos](#19-repositorio-y-estructura-de-archivos)
20. [Conclusión](#20-conclusión)

---

# 1. Conceptos Fundamentales

## 1.1 ¿Qué es Arquitectura Orientada a Servicios (SOA)?

SOA es un estilo arquitectónico donde las funcionalidades de una aplicación se organizan como **servicios independientes** que se comunican entre sí a través de **interfaces públicas bien definidas** (contratos). Cada servicio:

- **Es autónomo**: puede ejecutarse, desplegarse y escalarse sin depender de la implementación interna de otros servicios.
- **Expone un contrato**: define claramente qué espera recibir y qué responde.
- **Se comunica mediante su interfaz pública**: sin compartir código, base de datos interna ni estado en memoria.
- **Puede fallar sin colapsar el sistema**: otros servicios siguen funcionando (degradación parcial).

## 1.2 ¿Por qué SIGNUM es una arquitectura distribuida?

SIGNUM distribuye el procesamiento en **múltiples nodos independientes conectados por red**, sin un monolito central:

| Propiedad | Cómo la cumple SIGNUM |
|---|---|
| **Procesamiento distribuido** | La inferencia ML ocurre en el dispositivo del usuario (navegador o app), no en un servidor central. El entrenamiento colaborativo corre en un servidor aparte. |
| **Almacenamiento distribuido** | Cada cliente tiene su propia DB local (IndexedDB/SQLite). Supabase actúa como fuente de verdad compartida. Los modelos RF se almacenan localmente y en Supabase Storage. |
| **Escalabilidad horizontal** | Agregar más usuarios no aumenta la carga del servidor porque cada uno procesa sus propios landmarks. Vercel escala el frontend, Render escala el ML Service. |
| **Tolerancia a fallos** | Si cae Supabase, la cámara y predicción local siguen funcionando. Si cae Groq, el TTS nativo sigue disponible. No hay single point of failure para la funcionalidad crítica. |
| **Evolución independiente** | Cada servicio tiene su propio repositorio lógico (`frontend/`, `mobile/`, `ml-service/`) y puede actualizarse sin afectar a los demás. |

## 1.3 Diferencia con un monolito

En un monolito típico, una sola aplicación maneja la UI, la lógica de negocio, el acceso a datos y la inferencia ML. Esto implica:

- Si el servidor cae, **todo** deja de funcionar.
- Escalar requiere **replicar toda la aplicación**, aunque solo una parte tenga carga.
- Cambiar una funcionalidad requiere **redesplegar todo**.
- La inferencia remota introduce **latencia de red** en cada frame.

SIGNUM evita estos problemas distribuyendo cada responsabilidad a un componente especializado que escala y falla por separado.

---

# 2. Visión General del Proyecto

## 2.1 ¿Qué hace SIGNUM?

SIGNUM es un sistema de reconocimiento de Lengua de Señas Mexicana (LSM) que permite:

1. **Capturar** la mano del usuario mediante la cámara del dispositivo.
2. **Detectar** 21 landmarks (puntos clave) de la mano usando MediaPipe Tasks-Vision.
3. **Clasificar** la seña en tiempo real con un modelo Random Forest entrenado localmente.
4. **Construir frases** a partir de señas consecutivas.
5. **Completar frases** usando IA generativa (Groq/Llama 4) para convertir notación "gloss" a español natural.
6. **Reproducir** la frase con voz sintética (ElevenLabs o TTS nativo).
7. **Colaborar** subiendo muestras de entrenamiento y descargando modelos comunitarios.

## 2.2 Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend Web | Next.js (App Router) + React | 16.2.6 / 19.2.4 |
| Frontend Mobile | Expo SDK + React Native | 54.0.36 / 0.81.5 |
| ML Service | Node.js + Express | 20.x / 4.21 |
| Base de Datos | Supabase PostgreSQL | Gestionado |
| Auth | Supabase Auth (JWT) | Gestionado |
| Storage | Supabase Storage (S3) | Gestionado |
| Hand Detection | MediaPipe Tasks-Vision | 0.10.35 |
| ML Training/Inference | Random Forest (JS puro) | Propio |
| LLM | Groq (Llama 4 Scout 17B) | API |
| TTS | ElevenLabs / Web Speech API / expo-speech | API / Navegador |
| Hosting Frontend | Vercel | Serverless |
| Hosting ML Service | Render | Free tier |
| E2E Testing | Playwright | latest |

## 2.3 Tipos de Señas Soportadas

| Tipo | Descripción | Features | Muestras requeridas |
|---|---|---|---|
| **letter** | Letra del alfabeto LSM (pose estática) | 63 (21 landmarks × XYZ) | 50 |
| **word** | Palabra/seña estática de una sola mano | 63 (21 landmarks × XYZ) | 30 |
| **dynamic** | Seña con movimiento (secuencia de frames) | 3150 (50 frames × 63) | 5 secuencias |

---

# 3. Arquitectura Distribuida

## 3.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INFERENCIA (Cliente)                             │
│  ┌──────────────┐   getUserMedia   ┌──────────────────┐                 │
│  │ Cámara /     │ ───────────────► │ MediaPipe         │                │
│  │ WebView      │                  │ HandLandmarker    │                │
│  └──────────────┘                  │ (GPU/CPU, 2 manos)│                │
│                                    └────────┬─────────┘                │
│                                             │                           │
│                                    landmarks normalizados               │
│                                    (21 pts × XYZ = 63 floats)           │
│                                             │                           │
│                                             ▼                           │
│                                    ┌──────────────────┐                 │
│                                    │ RandomForest      │                │
│                                    │ Predictor (JS)    │                │
│                                    │ 3 modelos locales │                │
│                                    └────────┬─────────┘                │
│                                             │                           │
│                              label + confidence                        │
│                                             │                           │
│                                    ┌────────▼─────────┐                │
│                                    │   Phrase Builder  │               │
│                                    │   + TTS local     │               │
│                                    └──────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                     HTTPS (JWT)      │      HTTPS (proxy)
                                      │      HTTPS (directo mobile)
         ┌────────────────────────────┼────────────────────────┐
         │                            │                        │
         ▼                            ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│    Supabase     │    │   APIs Externas      │    │   ML Service     │
│  ┌───────────┐  │    │  ┌──────────────┐    │    │  ┌────────────┐  │
│  │ Auth JWT  │  │    │  │ Groq AI      │    │    │  │ POST /ml/  │  │
│  │ (login/   │  │    │  │ (Llama 4)    │    │    │  │ train      │  │
│  │ register) │  │    │  └──────────────┘    │    │  └────────────┘  │
│  └───────────┘  │    │  ┌──────────────┐    │    │  ┌────────────┐  │
│  ┌───────────┐  │    │  │ ElevenLabs   │    │    │  │ GET /ml/   │  │
│  │ PostgreSQL│  │    │  │ TTS          │    │    │  │ health     │  │
│  │ + RLS     │  │    │  └──────────────┘    │    │  └────────────┘  │
│  └───────────┘  │    └──────────────────────┘    │                  │
│  ┌───────────┐  │                                │  Render (8000)    │
│  │ Storage   │◄─┼────────────────────────────────┤  Lee/escribe     │
│  │ (modelos) │  │   HTTPS + SERVICE_ROLE_KEY     │  Supabase        │
│  └───────────┘  │                                └──────────────────┘
└─────────────────┘
  Supabase Cloud
```

## 3.2 Matriz de Comunicación entre Servicios

| Origen → Destino | Protocolo | Autenticación | Datos transferidos |
|---|---|---|---|
| **Frontend → Supabase** | HTTPS + SDK | JWT (anon key + user token) | CRUD de usuarios, traducciones, muestras, modelos |
| **Mobile → Supabase** | HTTPS + SDK | JWT (anon key + user token + AsyncStorage) | Igual que frontend |
| **Frontend → Groq** | HTTPS (proxy Next.js) | API key en servidor | `{ phrase }` → `{ completed }` |
| **Frontend → ElevenLabs** | HTTPS (proxy Next.js) | API key en servidor | `GET ?text=&voice_id=` → `audio/mpeg` |
| **Mobile → Groq** | HTTPS directo | API key en bundle | `{ phrase }` → `{ completed }` |
| **ML Service → Supabase** | HTTPS + SDK | SERVICE_ROLE_KEY | Lectura de muestras, escritura de modelos |
| **Frontend → ML Service** | ❌ No hay comunicación | — | — |
| **Mobile → ML Service** | ❌ No hay comunicación | — | — |

> **Nota importante**: La predicción de señas NUNCA pasa por el ML Service. La inferencia es 100% local en el dispositivo del usuario. El ML Service solo entrena modelos con datos colaborativos, y el resultado (modelo RF JSON) se distribuye vía Supabase Storage.

## 3.3 Flujo de Datos Completo

```
Paso 1:  Usuario abre SIGNUM → cámara se activa
Paso 2:  MediaPipe detecta 21 landmarks por frame (63 floats)
Paso 3:  Normalización: traslación a muñeca + escalado por distancia máxima
Paso 4:  RandomForestPredictor local clasifica → label + confidence
Paso 5:  Resultado se muestra en tiempo real en la UI
Paso 6:  Si auto-añadir activo, se agrega la letra/seña al fraseador
Paso 7:  Frase completa → Groq (opcional) → español natural
Paso 8:  TTS reproduce la frase (expo-speech nativo o ElevenLabs)
Paso 9:  Avances y traducciones se registran en Supabase PostgreSQL
Paso 10: Muestras colaborativas opcionales → Supabase (muestras_entrenamiento)
Paso 11: ML Service (bajo demanda) → entrena modelo colaborativo → Supabase Storage
Paso 12: Clientes descargan nuevo modelo → actualizan RandomForestPredictor local
```

---

# 4. Servicio 1: Frontend Web (Next.js)

## 4.1 Descripción

Aplicación web SPA (Single Page Application) construida con Next.js 16 (App Router) y React 19. Es la interfaz principal para usuarios de escritorio con cámara web.

**Carpeta**: `frontend/`  
**Hosting**: Vercel (serverless)  
**URL producción**: `https://signum.animare.dev`

## 4.2 Responsabilidades

| Responsabilidad | Implementación |
|---|---|
| **UI/UX** | React 19 + Tailwind CSS 4 + Framer Motion 12 |
| **Detección de mano** | `frontend/src/services/mediapipe.service.ts:44` — MediaPipe HandLandmarker con GPU |
| **Inferencia de señas** | `frontend/src/services/rf-inference.ts:42` — RandomForestPredictor en JS puro |
| **Entrenamiento local** | `frontend/src/services/rf-trainer.ts` — Random Forest desde cero en navegador |
| **Fraseador** | `frontend/src/hooks/use-phrase-builder.ts` — construcción incremental de frases |
| **Persistencia local** | `frontend/src/lib/db.ts:10` — IndexedDB (signum, v2) |
| **Auth** | `frontend/src/services/auth.service.ts:82` — Supabase Auth JWT |
| **Proxy Groq** | `frontend/app/api/ai/complete/route.ts:32` — oculta API key |
| **Proxy ElevenLabs** | `frontend/app/api/tts/elevenlabs/route.ts:45` — TTS premium |
| **Seguridad** | `frontend/app/proxy.ts` (middleware) — CSP, HSTS, X-Frame-Options |

## 4.3 Cómo Funciona la Detección de Mano

El archivo `frontend/src/services/mediapipe.service.ts` inicializa MediaPipe Tasks-Vision:

```typescript
// Línea 44-73: Inicialización de MediaPipe
export async function initMediaPipe(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  onResult: (result: MediaPipeDetectionResult) => void
) {
  // 1. Cargar WASM de visión desde CDN
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
  );

  // 2. Crear HandLandmarker con GPU
  handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/.../hand_landmarker.task",
      delegate: "GPU",  // Usa WebGL en el navegador
    },
    numHands: 2,
    runningMode: "VIDEO",
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  // 3. Loop de renderizado con requestAnimationFrame
  //    Ejecuta detectForVideo() cada ~60ms (configurable)
}
```

**Normalización de landmarks** (línea 186-203): Los 21 landmarks crudos de MediaPipe se normalizan para que sean invariantes a la posición y escala de la mano:

```typescript
// Paso 1: Trasladar al origen (muñeca = landmark 0)
const baseX = landmarks[0].x;  // landmark 0 = muñeca
const baseY = landmarks[0].y;
const baseZ = landmarks[0].z;

// Paso 2: Calcular distancia máxima para escalar a esfera unitaria
let maxDist = 0;
for (const lm of landmarks) {
  const dx = lm.x - baseX;
  const dy = lm.y - baseY;
  const dz = lm.z - baseZ;
  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
  if (dist > maxDist) maxDist = dist;
}
if (maxDist === 0) maxDist = 1;

// Paso 3: Dividir por distancia máxima → vector 63D normalizado
const normalized = [];
for (const lm of landmarks) {
  normalized.push((lm.x - baseX) / maxDist);
  normalized.push((lm.y - baseY) / maxDist);
  normalized.push((lm.z - baseZ) / maxDist);
}
// Resultado: [x0, y0, z0, x1, y1, z1, ..., x20, y20, z20] = 63 floats
// Todos los valores ∈ [-1, 1], muñeca en [0, 0, 0]
```

Esta normalización es **idéntica** en el frontend web y en la app móvil (dentro del WebView). Es la clave para que los modelos entrenados en un dispositivo funcionen en cualquier otro.

## 4.4 API Routes (Endpoints del Servidor Next.js)

### POST /api/ai/complete

```typescript
// frontend/app/api/ai/complete/route.ts:32
export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;  // NUNCA sale del servidor
  if (!apiKey) return NextResponse.json({ error: "API key missing" }, { status: 500 });

  const { phrase } = await request.json();
  if (!phrase || phrase.trim().length < 3) {
    return NextResponse.json({ error: "Frase inválida" }, { status: 400 });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },  // "Convierte gloss LSM a español"
        { role: "user", content: phrase },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `Groq API error ${response.status}` },
      { status: 502 }
    );
  }

  const data = await response.json();
  return NextResponse.json({ completed: data.choices[0].message.content });
}
```

El system prompt instruye al LLM a convertir notación "gloss" (secuencias de palabras de LSM) a español mexicano natural con gramática correcta.

### GET /api/tts/elevenlabs

```typescript
// frontend/app/api/tts/elevenlabs/route.ts:45
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const voiceId = searchParams.get("voice_id") || "pNInz6obpgDQGcFmaJgB"; // Adam

  // Whitelist: solo voces del tier gratuito
  const FREE_TIER_VOICES = {
    "pNInz6obpgDQGcFmaJgB": "Adam",
    "ErXwobaYiN019PkySvjV": "Antoni",
    // ... 22 voces más
  };

  if (!FREE_TIER_VOICES[voiceId]) {
    voiceId = "pNInz6obpgDQGcFmaJgB"; // fallback a Adam
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
      method: "POST",
      body: JSON.stringify({
        text: text.slice(0, 500),  // Máx 500 caracteres
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
```

Esta ruta **valida el voice_id contra una whitelist** del tier gratuito de ElevenLabs para evitar abuso. Si el cliente pide una voz premium, automáticamente usa Adam como fallback.

---

# 5. Servicio 2: App Móvil (Expo/React Native)

## 5.1 Descripción

Aplicación móvil nativa para iOS y Android construida con Expo SDK 54 y React Native 0.81. Proporciona la misma funcionalidad de reconocimiento de señas que el frontend web, adaptada al entorno móvil.

**Carpeta**: `mobile/`  
**Hosting**: Dispositivo del usuario (App Store / Play Store)

## 5.2 Diferencias Clave con el Frontend Web

| Aspecto | Frontend Web | App Móvil | Razón |
|---|---|---|---|
| **Cámara** | `getUserMedia` nativo del navegador | WebView con HTML de MediaPipe embebido | `@mediapipe/tasks-vision` no corre nativamente en React Native |
| **Permiso cámara** | Diálogo del navegador | `expo-camera` → `Camera.requestCameraPermissionsAsync()` | API nativa de permisos en iOS/Android |
| **Base de datos local** | IndexedDB del navegador | expo-sqlite (SQLite en WAL mode) | React Native no tiene IndexedDB |
| **Sesión Supabase** | localStorage del navegador | AsyncStorage (RN) | Persistencia nativa en mobile |
| **TTS** | Web Speech API + ElevenLabs | expo-speech (nativo) | TTS nativo del SO, sin API externa |
| **Groq** | Proxy server-side (Next.js) | Llamada directa con `EXPO_PUBLIC_GROQ_API_KEY` | No hay servidor intermedio en mobile |

## 5.3 Por Qué WebView para la Cámara

La biblioteca `@mediapipe/tasks-vision` está diseñada para correr en navegadores web (usa WebGL/WASM). React Native no expone estas APIs. La solución de SIGNUM:

1. Se embebe un HTML completo con el script de MediaPipe dentro de un `<WebView>` de React Native.
2. El HTML se genera dinámicamente en `mobile/src/services/mediapipe-html.ts:1` con:
   - Configuración de espejo (`IS_MIRRORED`)
   - Intervalo de captura (`CAPTURE_INTERVAL`)
   - Color de puntos (`POINTS_COLOR`)
3. La comunicación WebView → React Native se hace mediante `window.ReactNativeWebView.postMessage(JSON.stringify({...}))`.
4. React Native recibe los mensajes en `handleWebViewMessage` (`mobile/src/screens/MainScreen.tsx:197`).

Esto permite usar exactamente el mismo MediaPipe HandLandmarker que en la web, con la misma normalización de landmarks, garantizando compatibilidad de modelos.

## 5.4 expo-sqlite como Base de Datos Local

```typescript
// mobile/src/lib/db.ts:32
async function initDB(): Promise<SQLite.SQLiteDatabase> {
  const conn = await SQLite.openDatabaseAsync("signum.db");
  await conn.execAsync(`
    PRAGMA journal_mode = WAL;       // Write-Ahead Logging
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      landmarks TEXT NOT NULL,       // JSON.stringify del array 63D
      createdAt INTEGER NOT NULL
    );
    -- Índices, tablas models y ai_cache...
  `);
  return conn;
}
```

La DB usa **WAL mode** para permitir lecturas concurrentes durante escrituras. Los landmarks se almacenan como JSON en una columna TEXT (SQLite no tiene tipo JSONB nativo, pero expo-sqlite maneja la serialización).

El `addSamples` en lote usa `withTransactionAsync` para garantizar atomicidad:

```typescript
// mobile/src/lib/db.ts:107
async addSamples(samples) {
  await dbClient.withTransactionAsync(async () => {
    for (const sample of samples) {
      await dbClient.runAsync(
        "INSERT INTO samples (...) VALUES (?, ?, ?, ?)",
        [sample.label, sample.type, JSON.stringify(sample.landmarks), Date.now()]
      );
    }
  });
}
```

---

# 6. Servicio 3: ML Service (Express)

## 6.1 Descripción

Servicio Node.js que entrena modelos Random Forest con datos colaborativos de Supabase. **No** sirve predicciones en tiempo real; solo entrena bajo demanda y almacena los resultados.

**Carpeta**: `ml-service/`  
**Hosting**: Render (free tier)  
**Puerto**: 8000

## 6.2 API Endpoints

### GET /ml/health

```json
{
  "status": "ok",
  "service": "signum-ml-service",
  "timestamp": "2026-08-10T06:11:03.000Z",
  "uptime": 123.45
}
```

Health check simple. No requiere autenticación. Útil para monitoreo y para verificar que el servicio está desplegado.

### POST /ml/train

**Request:**
```json
{
  "type": "letter",
  "hyperparams": {
    "nTrees": 50,
    "maxDepth": 15,
    "minSamplesLeaf": 2
  },
  "activate": true
}
```

**Response:**
```json
{
  "success": true,
  "version": "letter_v3",
  "type": "letter",
  "metrics": {
    "accuracy": 0.8523,
    "precisionAvg": 0.8341,
    "recallAvg": 0.8127,
    "f1Score": 0.8233,
    "confusionMatrix": [[12,1,0],[2,10,1],[0,0,8]]
  },
  "samples": { "total": 120, "train": 96, "test": 24 },
  "elapsed": "2.34s",
  "modelSummary": {
    "nTrees": 50,
    "nFeatures": 63,
    "classes": ["A", "B", "C", "D", "E"]
  }
}
```

**Validaciones del endpoint** (ml-service/src/server.js):
- `type` debe ser `"letter"`, `"word"` o `"dynamic"` → HTTP 400 si no
- Mínimo 10 muestras en Supabase → HTTP 400 si no
- Mínimo 2 clases distintas → HTTP 400 si no
- Si no hay `SUPABASE_SERVICE_ROLE_KEY` → HTTP 500

## 6.3 Algoritmo de Entrenamiento

El archivo `ml-service/src/rf-trainer.js` implementa Random Forest desde cero en JavaScript puro (sin dependencias de ML):

```javascript
// ml-service/src/rf-trainer.js:139
export function trainRandomForest(samples, options = {}) {
  const { nTrees = 50, maxDepth = 15, minSamplesLeaf = 2 } = options;
  const classes = [...new Set(samples.map(s => s.label))].sort();
  const nFeatures = samples[0].features.length;
  const mFeatures = Math.floor(Math.sqrt(nFeatures)); // ~8 para 63 features

  const trees = [];
  for (let i = 0; i < nTrees; i++) {
    // Bootstrap: muestreo con reemplazo
    const bootstrapData = [];
    for (let j = 0; j < samples.length; j++) {
      bootstrapData.push(samples[Math.floor(Math.random() * samples.length)]);
    }

    // Selección aleatoria de features
    const featureSubset = shuffleArray([...Array(nFeatures).keys()])
      .slice(0, mFeatures);

    // Construir árbol con CART + Gini impurity
    trees.push(buildTree(bootstrapData, featureSubset, classes, 0, maxDepth, minSamplesLeaf));
  }

  return { nTrees, nFeatures, classes, trees };
}
```

El `buildTree` usa división binaria recursiva con **Gini impurity** como criterio de split:

```javascript
// Gini impurity: mide la "pureza" de un nodo
// Gini = Σ(p_i * (1 - p_i)) donde p_i es la proporción de la clase i
// 0 = completamente puro (todos de la misma clase)
// 0.5 = máxima impureza (para clasificación binaria balanceada)

function giniImpurity(samples, classes) {
  const counts = new Array(classes.length).fill(0);
  for (const s of samples) {
    counts[classes.indexOf(s.label)]++;
  }
  let impurity = 1;
  for (const c of counts) {
    const p = c / samples.length;
    impurity -= p * p;
  }
  return impurity;
}
```

## 6.4 Flujo de Entrenamiento Colaborativo

```
1. Cliente entrena modelo local → guarda en IndexedDB/SQLite
2. Cliente sube muestras a Supabase (muestras_entrenamiento) [opcional]
3. Administrador o proceso automático invoca POST /ml/train
4. ML Service:
   a. Lee TODAS las muestras de Supabase (paginadas, 1000 por página)
   b. Divide en train (80%) / test (20%)
   c. Entrena Random Forest con los hiperparámetros especificados
   d. Evalúa: accuracy, precision, recall, F1, matriz de confusión
   e. Versiona el modelo: letter_v1, letter_v2, letter_v3...
   f. Serializa a JSON y sube a Supabase Storage (bucket modelos)
   g. Guarda metadatos en tabla modelos
   h. Si activate=true, desactiva todos los modelos del mismo tipo y activa este
5. Clientes descargan el nuevo modelo desde Supabase Storage
6. Clientes actualizan su RandomForestPredictor local con el nuevo modelo
```

Este flujo es completamente asíncrono y desacoplado: el ML Service no sabe quién invocó el entrenamiento ni quién va a consumir el modelo. Solo conoce el contrato de Supabase (tabla `muestras_entrenamiento` y bucket `modelos`).

---

# 7. Servicio 4: Supabase (Backend-as-a-Service)

## 7.1 Descripción

Supabase es una plataforma BaaS (Backend-as-a-Service) de código abierto que proporciona:

- **Base de datos PostgreSQL** gestionada con replicación y backups automáticos
- **Autenticación** con JWT, email/password, OAuth (solo email usado en SIGNUM)
- **Storage** compatible con S3 para archivos binarios (modelos RF JSON)
- **Row Level Security (RLS)** para autorización a nivel de fila
- **Realtime** (no usado en SIGNUM)
- **Edge Functions** (no usado en SIGNUM)

**URL**: `https://nvkpfreeyemrpxxmqfqm.supabase.co`  
**SDK**: `@supabase/supabase-js` v2.110.1

## 7.2 Esquema de Base de Datos

### Tablas de Usuario y Catálogos

```sql
-- Catálogos (lectura para todos los autenticados)
catalogo_generos (id_genero PK, nombre_genero)         -- Hombre, Mujer, Otro
roles (id_rol PK, nombre_rol)                           -- Administrador, Usuario
catalogo_tipo_traduccion (id_tipo_traduccion PK, nombre_tipo)  -- LSM-TEXTO, TEXTO-VOZ, VOZ-TEXTO

-- Usuarios (1:1 con auth.users)
usuarios (
  id_usuario UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre_usuario TEXT, apellido_paterno TEXT, apellido_materno TEXT,
  id_genero INTEGER REFERENCES catalogo_generos,
  fecha_registro TIMESTAMPTZ DEFAULT now()
)

-- Roles de usuario (M:N)
usuario_roles (
  id_usuario UUID REFERENCES usuarios,
  id_rol INTEGER REFERENCES roles,
  PRIMARY KEY (id_usuario, id_rol)
)
```

### Tablas de Actividad

```sql
-- Sesiones
login (id_login SERIAL PK, id_usuario UUID, fecha_hora TIMESTAMPTZ, ip TEXT)

-- Traducciones
traducciones (
  id_traduccion SERIAL PK, id_usuario UUID,
  id_tipo_traduccion INTEGER,
  frase_original TEXT, frase_traducida TEXT,
  precision NUMERIC(5,2), fecha TIMESTAMPTZ DEFAULT now()
)

-- Progreso diario
avances (
  id_avance SERIAL PK, id_usuario UUID, fecha DATE,
  num_traducciones INTEGER, tiempo_activo INTEGER,  -- segundos
  precision_promedio NUMERIC(5,2)
)

-- Evaluaciones UX (SUS)
evaluaciones (
  id_evaluacion SERIAL PK, id_usuario UUID,
  puntuacion_sus NUMERIC(5,2), preguntas_json JSONB,
  fecha TIMESTAMPTZ DEFAULT now()
)
```

### Tablas de ML Colaborativo

```sql
-- Muestras de entrenamiento subidas por usuarios
muestras_entrenamiento (
  id_muestra SERIAL PK,
  id_usuario UUID REFERENCES auth.users(id),
  tipo TEXT CHECK (tipo IN ('letter','word','dynamic')),
  etiqueta TEXT NOT NULL,              -- La letra/palabra/seña
  landmarks JSONB NOT NULL,            -- Array 63D o 3150D normalizado
  metadatos JSONB,                     -- info adicional (dispositivo, versión)
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Modelos entrenados colaborativamente
modelos (
  id_modelo SERIAL PK,
  tipo TEXT NOT NULL,
  version TEXT NOT NULL UNIQUE,         -- "letter_v3"
  storage_path TEXT NOT NULL,           -- Ruta en Supabase Storage
  n_trees INTEGER, n_features INTEGER,
  clases TEXT[],                        -- ["A","B","C",...]
  accuracy NUMERIC(5,4),
  precision_avg NUMERIC(5,4),
  recall_avg NUMERIC(5,4),
  f1_score NUMERIC(5,4),
  matriz_confusion JSONB,
  hiperparametros JSONB,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

## 7.3 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Ejemplos:

```sql
-- Un usuario solo puede ver su propio perfil
CREATE POLICY "Usuarios ven su perfil" ON usuarios
  FOR SELECT USING (auth.uid() = id_usuario);

-- Un usuario solo puede insertar traducciones propias
CREATE POLICY "Usuarios insertan sus traducciones" ON traducciones
  FOR INSERT WITH CHECK (auth.uid() = id_usuario);

-- Muestras de entrenamiento: insertar propias, leer todas
CREATE POLICY "Insertar muestras propias" ON muestras_entrenamiento
  FOR INSERT WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Leer todas las muestras" ON muestras_entrenamiento
  FOR SELECT USING (auth.role() = 'authenticated');

-- Modelos: solo admin puede modificar; todos pueden leer
CREATE POLICY "Todos leen modelos" ON modelos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin gestiona modelos" ON modelos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuario_roles ur
      JOIN roles r ON ur.id_rol = r.id_rol
      WHERE ur.id_usuario = auth.uid()
      AND r.nombre_rol = 'Administrador'
    )
  );
```

## 7.4 Triggers y Funciones

```sql
-- Auto-crear perfil de usuario al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usuarios (id_usuario)
  VALUES (NEW.id);

  INSERT INTO usuario_roles (id_usuario, id_rol)
  VALUES (NEW.id, (SELECT id_rol FROM roles WHERE nombre_rol = 'Usuario'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

```sql
-- Activar un modelo (desactiva todos los del mismo tipo)
CREATE OR REPLACE FUNCTION activar_modelo(p_id_modelo INTEGER)
RETURNS void AS $$
DECLARE
  v_tipo TEXT;
BEGIN
  SELECT tipo INTO v_tipo FROM modelos WHERE id_modelo = p_id_modelo;
  UPDATE modelos SET activo = false WHERE tipo = v_tipo;
  UPDATE modelos SET activo = true WHERE id_modelo = p_id_modelo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

# 8. Servicios Externos: Groq y ElevenLabs

## 8.1 Groq (LLM para Completar Frases)

| Aspecto | Detalle |
|---|---|
| **Endpoint** | `https://api.groq.com/openai/v1/chat/completions` |
| **Modelo** | `meta-llama/llama-4-scout-17b-16e-instruct` |
| **Temperatura** | 0.2 (respuestas determinísticas) |
| **Max tokens** | 200 |
| **System prompt** | "Eres un asistente que convierte notación gloss de LSM a español mexicano natural con gramática correcta." |
| **Costo** | Gratuito (tier de Groq) |

El LLM recibe una secuencia de palabras (gloss) como "yo comer manzana ayer" y la convierte a "Yo comí una manzana ayer.", agregando artículos, conjugaciones y estructura gramatical del español mexicano.

## 8.2 ElevenLabs (Text-to-Speech Premium)

| Aspecto | Detalle |
|---|---|
| **Endpoint** | `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}` |
| **Modelo** | `eleven_multilingual_v2` |
| **Voz default** | Adam (`pNInz6obpgDQGcFmaJgB`) |
| **Voces permitidas** | 24 voces del tier gratuito (whitelist en el proxy) |
| **Límite texto** | 500 caracteres por request |

El proxy de Next.js (`/api/tts/elevenlabs`) protege la API key de ElevenLabs (que es de pago) y restringe las voces al tier gratuito mediante whitelist.

## 8.3 MediaPipe (Detección de Mano)

| Aspecto | Detalle |
|---|---|
| **WASM runtime** | `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm` |
| **Modelo** | `https://storage.googleapis.com/.../hand_landmarker.task` |
| **Modo** | GPU (WebGL) en navegador, CPU en WebView mobile |
| **Output** | 21 landmarks 3D por mano detectada |

MediaPipe se carga desde CDN público (jsdelivr) y el modelo desde Google Cloud Storage. No requiere API key. La versión está pineada a `0.10.35` para evitar breaking changes.

---

# 9. Autonomía del Servicio

> **Criterio SOA**: Cada servicio debe poder ejecutarse y desplegarse de forma independiente, sin depender del código interno o del proceso del otro.

## 9.1 Evidencia de Autonomía por Servicio

### Frontend Web

| Dependencia | ¿Obligatoria? | ¿Qué pasa si falta? |
|---|---|---|
| MediaPipe CDN | Sí (primera carga) | No se detecta la mano. Se cachea en el navegador. |
| Supabase | No | Sin login, sin historial, sin modelos colaborativos. La cámara y predicción local funcionan. |
| Groq | No | El botón "Completar frase" falla. El fraseador manual y TTS nativo siguen. |
| ElevenLabs | No | Se usa Web Speech API del navegador como fallback. |
| ML Service | No | Sin entrenamiento colaborativo. El entrenamiento local en navegador sigue disponible. |

**Prueba**: Abrir `http://localhost:3000` sin Supabase, sin Groq, sin ElevenLabs → la cámara funciona, los landmarks se detectan, el modelo local (si existe en IndexedDB) predice normalmente.

### App Móvil

| Dependencia | ¿Obligatoria? | ¿Qué pasa si falta? |
|---|---|---|
| MediaPipe CDN (en WebView) | Sí (primera carga) | No se detecta la mano. Se cachea en el WebView. |
| Supabase | No | Igual que frontend. |
| Groq | No | La API key está en el bundle; si la red falla, no completa frases. |
| expo-speech | No | Sin TTS nativo. |
| ML Service | No | Igual que frontend. |

**Prueba**: Activar modo avión en el dispositivo → abrir la app → la cámara y predicción funcionan. Solo fallan features que requieren red (login, Groq, modelos colaborativos).

### ML Service

| Dependencia | ¿Obligatoria? | ¿Qué pasa si falta? |
|---|---|---|
| Supabase | Sí | Sin acceso a muestras ni storage. El endpoint `/ml/train` devuelve 500. |
| Frontend/Mobile | No | No recibe requests de clientes; solo se invoca vía HTTP directo. |

**Prueba**: `curl -X POST http://localhost:8000/ml/train -H "Content-Type: application/json" -d '{"type": "letter"}'` → entrena, evalúa y sube a Supabase sin que ningún frontend esté activo.

### Supabase

Supabase es un servicio gestionado externamente. No depende del código de SIGNUM para funcionar. Su contrato es el esquema SQL y las políticas RLS.

**Prueba**: Conectarse a Supabase desde TablePlus/psql con las credenciales → todas las tablas, RLS y triggers funcionan independientemente de que el frontend esté corriendo.

## 9.2 Autonomía en el Código

Cada servicio tiene su propio directorio raíz con sus propias dependencias:

```
signum/
├── frontend/
│   ├── package.json        # Next.js, React, Supabase SDK, etc.
│   ├── tsconfig.json
│   └── src/                # Código del frontend (NO importa nada de mobile/ ni ml-service/)
├── mobile/
│   ├── package.json        # Expo, React Native, expo-sqlite, etc.
│   ├── tsconfig.json
│   └── src/                # Código del mobile (NO importa nada de frontend/ ni ml-service/)
└── ml-service/
    ├── package.json        # Express, supabase-js, etc.
    └── src/                # Código del ML Service (NO importa nada de frontend/ ni mobile/)
```

**No hay imports cruzados entre servicios.** El único código compartido es el formato del modelo RF (interfaz `RFModel`) y la normalización de landmarks (que está duplicada intencionalmente en cada servicio para mantener la autonomía).

---

# 10. Contrato de Servicio Bien Definido

> **Criterio SOA**: Debe quedar claro qué expone cada servicio, qué espera recibir y qué responde.

## 10.1 Contrato del Frontend (API Routes)

### POST /api/ai/complete

| Campo | Tipo | Descripción |
|---|---|---|
| **Request body** | | |
| `phrase` | `string` | Frase en notación gloss (mín 3 caracteres) |
| **Response 200** | | |
| `completed` | `string` | Frase en español mexicano natural |
| **Errores** | | |
| 400 | `{ error: string }` | Falta `phrase` o es muy corta |
| 500 | `{ error: string }` | Falta `GROQ_API_KEY` |
| 502 | `{ error: string }` | Error en Groq API |

### GET /api/tts/elevenlabs

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `text` | `string` | (requerido) | Texto a sintetizar (máx 500 chars) |
| `voice_id` | `string` | `pNInz6obpgDQGcFmaJgB` | ID de voz (whitelist de 24 voces gratuitas) |
| `model_id` | `string` | `eleven_multilingual_v2` | Modelo TTS |
| **Response 200** | `audio/mpeg` | | Audio binario |
| **Errores** | | |
| 400 | `{ error: string }` | Falta `text` |
| 500 | `{ error: string }` | Falta `ELEVENLABS_API_KEY` |
| 502 | `{ error: string }` | Error en ElevenLabs API |

## 10.2 Contrato del ML Service

### POST /ml/train

| Campo | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `type` | `"letter" \| "word" \| "dynamic"` | Sí | — | Tipo de modelo a entrenar |
| `hyperparams.nTrees` | `number` | No | 50 | Número de árboles |
| `hyperparams.maxDepth` | `number` | No | 15 | Profundidad máxima |
| `hyperparams.minSamplesLeaf` | `number` | No | 2 | Muestras mínimas por hoja |
| `activate` | `boolean` | No | `false` | Activar modelo tras entrenar |

| Response 200 | Tipo | Descripción |
|---|---|---|
| `success` | `boolean` | `true` |
| `version` | `string` | `"letter_v3"` |
| `type` | `string` | Tipo entrenado |
| `metrics.accuracy` | `number` | Accuracy en test set |
| `metrics.precisionAvg` | `number` | Precisión promedio macro |
| `metrics.recallAvg` | `number` | Recall promedio macro |
| `metrics.f1Score` | `number` | F1 score promedio macro |
| `metrics.confusionMatrix` | `number[][]` | Matriz de confusión |
| `samples.total` | `number` | Total de muestras |
| `samples.train` | `number` | Muestras de entrenamiento |
| `samples.test` | `number` | Muestras de prueba |
| `elapsed` | `string` | Tiempo de entrenamiento |
| `modelSummary.nTrees` | `number` | Árboles en el modelo |
| `modelSummary.nFeatures` | `number` | Features por muestra |
| `modelSummary.classes` | `string[]` | Clases del modelo |

| Error | Código | Descripción |
|---|---|---|
| Tipo inválido | 400 | `"Tipo de modelo inválido. Use: letter, word, dynamic"` |
| Pocas muestras | 400 | `"Se requieren al menos 10 muestras"` |
| Pocas clases | 400 | `"Se requieren al menos 2 clases distintas"` |
| Sin SRK | 500 | Error interno |

### GET /ml/health

| Response 200 | Tipo | Descripción |
|---|---|---|
| `status` | `string` | `"ok"` |
| `service` | `string` | `"signum-ml-service"` |
| `timestamp` | `string` | ISO 8601 |
| `uptime` | `number` | Segundos desde inicio |

## 10.3 Contrato de Supabase

Supabase expone su contrato mediante:

1. **Esquema SQL público**: las definiciones de tablas, columnas, tipos y restricciones están en `frontend/bd/supabase-schema.sql`.
2. **Políticas RLS documentadas**: cada política especifica quién puede hacer qué sobre cada tabla.
3. **API auto-generada**: el SDK de Supabase expone automáticamente endpoints REST basados en el esquema. Por ejemplo, `supabase.from("muestras_entrenamiento").select("*")` se traduce a `GET /rest/v1/muestras_entrenamiento?select=*`.

El contrato de Supabase **no es código**, es el esquema de base de datos. Cualquier cliente que conozca el esquema y tenga un JWT válido puede interactuar con los datos.

## 10.4 Contrato del Modelo Random Forest

El modelo RF serializado es el contrato más importante del sistema, porque es lo que permite que modelos entrenados en cualquier parte (navegador, mobile, ML Service) funcionen en cualquier otra:

```typescript
// Interfaz compartida (duplicada en cada servicio para autonomía)
interface RFModel {
  nTrees: number;        // Número de árboles
  nFeatures: number;     // Features por muestra (63 para letras/palabras)
  classes: string[];     // Etiquetas de clase ["A", "B", "C", ...]
  trees: RFTree[];       // Array de árboles
}

interface RFTree {
  n: RFNode[];           // Nodos del árbol (formato array plano)
}

interface RFNode {
  f: number;             // Índice de feature para split (-1 si es hoja)
  t: number;             // Umbral de split
  l: number;             // Índice del hijo izquierdo
  r: number;             // Índice del hijo derecho
  v?: number[][];        // Probabilidades de clase en hoja [ [clase_idx, prob], ... ]
}
```

Este contrato es **estable**: entrenar con más árboles o diferente profundidad no cambia la interfaz, solo los datos. Un modelo entrenado en el ML Service con 200 árboles funciona en el frontend sin cambios de código.

---

# 11. Bajo Acoplamiento

> **Criterio SOA**: La comunicación entre servicios debe darse únicamente a través de su interfaz pública.

## 11.1 Principio

En SIGNUM, los servicios **no comparten**:
- Código fuente (no hay imports entre `frontend/`, `mobile/`, `ml-service/`)
- Memoria o estado en runtime (cada servicio tiene su propio proceso)
- Base de datos interna (solo Supabase actúa como almacén compartido, y se accede vía su API pública)
- Variables de entorno (cada servicio tiene su propio `.env`)

## 11.2 Canales de Comunicación

| Par de servicios | Canal | ¿Es la interfaz pública? |
|---|---|---|
| Frontend ↔ Supabase | `@supabase/supabase-js` (REST sobre HTTPS + JWT) | ✅ Sí, el SDK es un wrapper sobre la API REST pública |
| Mobile ↔ Supabase | `@supabase/supabase-js` (REST sobre HTTPS + JWT) | ✅ Sí |
| Frontend ↔ Groq | `fetch("/api/ai/complete")` → proxy Next.js → Groq REST API | ✅ Sí |
| Frontend ↔ ElevenLabs | `fetch("/api/tts/elevenlabs")` → proxy Next.js → ElevenLabs REST API | ✅ Sí |
| ML Service ↔ Supabase | `@supabase/supabase-js` + SERVICE_ROLE_KEY | ✅ Sí |
| Frontend ↔ ML Service | **No hay comunicación** | N/A |
| Mobile ↔ ML Service | **No hay comunicación** | N/A |

## 11.3 Lo que NO existe (evidencia de bajo acoplamiento)

```typescript
// ❌ NO EXISTE: el frontend NUNCA importa código del ML Service
// frontend/src/services/rf-inference.ts
// Este archivo NO contiene:
//   import ... from "../../ml-service/..."
//   fetch("http://localhost:8000/ml/predict")

// ❌ NO EXISTE: el ML Service NUNCA importa código del frontend
// ml-service/src/server.js
// Este archivo NO contiene:
//   require("../../frontend/...")
//   fetch("https://signum.animare.dev/...")
```

```typescript
// ✅ Solo se comunican mediante contratos públicos
// El frontend descarga el modelo desde Supabase Storage (API pública)
const { data } = await supabase.storage.from("modelos").download(path);
const model = JSON.parse(await data.text());
rfLetter.current.loadFromModel(model);

// El ML Service lee muestras de Supabase (API pública)
const { data } = await supabase.from("muestras_entrenamiento").select("*");
```

## 11.4 Cambios Independientes

| Cambio | Archivos modificados | ¿Rompe otros servicios? |
|---|---|---|
| Migrar frontend de Tailwind a CSS Modules | Solo `frontend/` | ❌ No |
| Cambiar TTS de expo-speech a expo-av en mobile | Solo `mobile/` | ❌ No |
| Agregar hyperparámetro `maxFeatures` al ML Service | `ml-service/src/rf-trainer.js` y `ml-service/src/server.js` | ❌ No (el contrato `POST /ml/train` acepta hyperparams opcionales) |
| Agregar columna a tabla `muestras_entrenamiento` | `frontend/bd/` (schema SQL) | ❌ No (INSERT con columnas nuevas no afecta SELECTs existentes) |
| Migrar ML Service de Express a Fastify | Solo `ml-service/` | ❌ No (mientras los endpoints y respuestas sean iguales) |
| Agregar un tercer cliente (PWA, desktop app) | Nuevo directorio | ❌ No (solo necesita el SDK de Supabase y MediaPipe) |

---

# 12. Seguridad entre Servicios

> **Criterio SOA**: Debe existir un mecanismo de autenticación y/o autorización entre servicios, correctamente implementado: sin credenciales expuestas, con manejo explícito de los casos en que la autenticación falla.

## 12.1 Capas de Seguridad

```
┌─────────────────────────────────────────────┐
│ Capa 1: Transporte (HTTPS/TLS)              │
│ Todas las comunicaciones son sobre HTTPS    │
├─────────────────────────────────────────────┤
│ Capa 2: Autenticación (Supabase Auth JWT)   │
│ Login email/password → JWT → adjunto a      │
│ cada request al SDK de Supabase             │
├─────────────────────────────────────────────┤
│ Capa 3: Autorización (Row Level Security)   │
│ PostgreSQL RLS: cada fila tiene políticas    │
│ que restringen quién puede leer/escribir    │
├─────────────────────────────────────────────┤
│ Capa 4: Protección de Secretos              │
│ API keys de pago NUNCA en el cliente        │
│ Proxy server-side en Next.js                │
├─────────────────────────────────────────────┤
│ Capa 5: Cabeceras de Seguridad              │
│ CSP, HSTS, X-Frame-Options, XSS Protection  │
└─────────────────────────────────────────────┘
```

## 12.2 Autenticación: Supabase Auth JWT

**Registro** (`frontend/src/services/auth.service.ts:82`):
```typescript
export async function signUp(email, password, nombre, apellido_paterno,
                              apellido_materno, id_genero) {
  const { data: authData, error: authError } =
    await supabase.auth.signUp({ email, password });

  if (authError) throw authError;

  if (!authData.user) {
    throw new Error(
      "No se pudo crear el usuario. Verifica que el correo SMTP esté configurado."
    );
  }

  return authData;
}
```

**Login** (`frontend/src/services/auth.service.ts:116`):
```typescript
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  if (error) throw error;     // Propaga el error al caller
  return data;
}
```

**Verificación de sesión** (`frontend/src/services/auth.service.ts:140`):
```typescript
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    // Obtener perfil extendido de la tabla usuarios
    const { data: profile } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id_usuario", user.id)
      .single();
    return profile;
  } catch {
    return null;  // Si hay error, no hay sesión válida
  }
}
```

El JWT es gestionado automáticamente por `@supabase/supabase-js`:
- En el frontend web: se almacena en `localStorage` del navegador.
- En la app móvil: se almacena en `AsyncStorage` (RN).

## 12.3 Autorización: Row Level Security (RLS)

RLS garantiza que incluso si un atacante obtiene un JWT válido, solo puede acceder a los datos que le corresponden. Las políticas se ejecutan **en la base de datos**, no en el código de la aplicación:

```sql
-- Ejemplo: política en tabla evaluaciones
-- Un usuario normal solo ve sus propias evaluaciones
CREATE POLICY "Usuarios ven sus evaluaciones" ON evaluaciones
  FOR SELECT USING (auth.uid() = id_usuario);

-- Un administrador ve todas las evaluaciones
CREATE POLICY "Admin ve todas las evaluaciones" ON evaluaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuario_roles ur
      JOIN roles r ON ur.id_rol = r.id_rol
      WHERE ur.id_usuario = auth.uid()
      AND r.nombre_rol = 'Administrador'
    )
  );
```

**Esto significa** que un frontend no puede hacer `supabase.from("evaluaciones").select("*")` y ver todas las evaluaciones a menos que el usuario autenticado tenga rol de Administrador. La lógica de autorización está en la BD, no en el código del frontend.

## 12.4 Protección de API Keys

| Clave | Dónde se define | Alcance | ¿Expuesta al cliente? | Mecanismo de protección |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `frontend/.env.local` | Solo lectura con RLS | ✅ Sí (por diseño) | Es la anon key de Supabase, diseñada para ser pública |
| `SUPABASE_SERVICE_ROLE_KEY` | `ml-service/.env` | Admin total (bypass RLS) | ❌ No | Solo existe en el servidor Render, nunca en cliente |
| `GROQ_API_KEY` | `frontend/.env.local` | API de Groq | ❌ No | Proxy server-side de Next.js (`/api/ai/complete`) |
| `ELEVENLABS_API_KEY` | `frontend/.env.local` | API de ElevenLabs (pago) | ❌ No | Proxy server-side de Next.js (`/api/tts/elevenlabs`) |
| `EXPO_PUBLIC_GROQ_API_KEY` | `mobile/.env` | API de Groq | ⚠️ Sí (trade-off aceptado) | Se compila en el bundle de la app; mitigado por rate limiting de Groq |

**Estrategia de proxy**: Las API keys de servicios de pago (Groq, ElevenLabs) nunca se envían al navegador. En su lugar, el frontend llama a rutas de Next.js (`/api/ai/complete`, `/api/tts/elevenlabs`) que actúan como proxy:

```
Navegador                    Servidor Next.js               API Externa
   │                              │                              │
   │  POST /api/ai/complete      │                              │
   │  { phrase: "yo comer" }     │                              │
   │─────────────────────────────►                              │
   │                              │  POST groq.com/v1/chat      │
   │                              │  Authorization: Bearer KEY  │
   │                              │─────────────────────────────►
   │                              │                              │
   │                              │  { choices: [...] }         │
   │                              │◄─────────────────────────────
   │  { completed: "Yo como" }   │                              │
   │◄─────────────────────────────                              │
```

La API key de Groq existe **solo en la variable de entorno del servidor** y se adjunta a la request saliente. El navegador nunca ve la key. Esto se verifica en `frontend/app/api/ai/complete/route.ts:34`:

```typescript
const apiKey = process.env.GROQ_API_KEY;  // Solo accesible en el servidor
// ...
headers: { Authorization: `Bearer ${apiKey}` }
```

## 12.5 Manejo Explícito de Fallos de Autenticación

Cada operación autenticada maneja explícitamente los casos de error:

```typescript
// frontend/src/services/auth.service.ts:9
function getAuthErrorMessage(err: any, fallback: string): string {
  if (err?.name === "AuthRetryableFetchError" || err?.status === 0 || !err?.message) {
    return "Error de conexión: no se pudo contactar al servidor de autenticación. Verifica tu conexión a internet.";
  }
  // ... otros casos
  return fallback;
}
```

```typescript
// frontend/src/services/auth.service.ts:175 (saveEvaluation)
export async function saveEvaluation(data: EvaluacionData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Debes iniciar sesión para enviar la evaluación.");
  }
  // ... procede a guardar
}
```

En todas las pantallas que requieren autenticación (`login`, `register`, `app`), los errores del servidor de auth se muestran al usuario con mensajes en español específicos para cada caso (credenciales inválidas, rate limit, error de red).

## 12.6 Cabeceras de Seguridad HTTP

El middleware de Next.js (`frontend/app/proxy.ts`) agrega cabeceras de seguridad a todas las respuestas:

```
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Permissions-Policy: camera=self, microphone=self
```

---

# 13. Machine Learning Pipeline

## 13.1 Captura de Landmarks

```
Cámara → getUserMedia / WebView → video frame
  → MediaPipe HandLandmarker (GPU, 2 manos)
  → 21 landmarks × (x, y, z)
  → Normalización: traslación a muñeca + división por distancia máxima
  → Vector 63D con valores ∈ [-1, 1]
```

**¿Por qué esta normalización?** La posición absoluta de la mano en la imagen depende de qué tan lejos está de la cámara y en qué parte del encuadre aparece. Al trasladar al origen (muñeca) y dividir por la distancia máxima, el vector resultante es invariante a:

- **Posición** en el encuadre (traslación)
- **Distancia** a la cámara (escala)
- **Tamaño** de la mano (escala)

Esto permite que la misma seña hecha por diferentes personas, a diferentes distancias, produzca vectores de features similares.

## 13.2 Entrenamiento: Random Forest

### ¿Por qué Random Forest?

| Criterio | Random Forest | Red Neuronal (TensorFlow.js) |
|---|---|---|
| **Tamaño del modelo** | ~10-50 KB (JSON) | ~500 KB - 2 MB |
| **Tiempo de entrenamiento** | <1 segundo (50 árboles, 100 muestras) | 10-60 segundos (varias épocas) |
| **Inferencia** | ~50K operaciones por predicción | ~500K operaciones |
| **Dependencias** | 0 (JS puro) | TensorFlow.js (~2 MB) |
| **Funciona en móvil** | ✅ Sí | ⚠️ Pesado en RN |
| **Interpretabilidad** | Feature importance | Caja negra |
| **Precisión con 63 features** | 80-95% | 85-95% |

Para 63 features y 20-30 clases, Random Forest ofrece precisión comparable a una red neuronal pequeña, con una fracción del costo computacional y sin dependencias externas.

### Hiperparámetros

| Parámetro | Valor | Justificación |
|---|---|---|
| `nTrees = 50` | 50 árboles | Balance velocidad-precisión. Más árboles reducen varianza pero aumentan tiempo de entrenamiento linealmente. |
| `maxDepth = 15` | Profundidad máxima 15 | Un árbol balanceado de 63 features rara vez necesita más de 10-12 niveles. 15 da margen sin overfitting excesivo. |
| `minSamplesLeaf = 2` | Mínimo 2 muestras por hoja | Permite hojas puras incluso con pocas muestras. |
| `maxFeatures = √63 ≈ 8` | ~8 features por split | Valor estándar para clasificación (raíz cuadrada). Reduce correlación entre árboles. |
| `Bootstrap = true` | Muestreo con reemplazo | Cada árbol ve ~63% de los datos. El 37% restante se usa para estimación OOB (out-of-bag). |

## 13.3 Inferencia

```typescript
// frontend/src/services/rf-inference.ts:42
predict(features: number[]): PredictionResult | null {
  if (!this.model) return null;
  if (features.length !== this.model.nFeatures) return null;

  const votes = new Array(this.model.classes.length).fill(0);

  // Recorrer cada árbol
  for (const tree of this.model.trees) {
    let nodeIdx = 0;
    // Navegar el árbol hasta una hoja
    while (tree.n[nodeIdx].f >= 0) {  // f >= 0 = nodo interno
      const node = tree.n[nodeIdx];
      if (features[node.f] <= node.t) {
        nodeIdx = node.l;  // izquierda
      } else {
        nodeIdx = node.r;  // derecha
      }
    }
    // Nodo hoja: votar por la clase mayoritaria
    const leaf = tree.n[nodeIdx];
    let bestClass = 0, bestProb = 0;
    for (const [classIdx, prob] of leaf.v!) {
      if (prob > bestProb) { bestProb = prob; bestClass = classIdx; }
    }
    votes[bestClass]++;
  }

  const bestClass = votes.indexOf(Math.max(...votes));
  return {
    label: this.model.classes[bestClass],
    confidence: Math.round((votes[bestClass] / this.model.nTrees) * 1000) / 10,
  };
}
```

Complejidad: O(nTrees × maxDepth) ≈ 50 × 15 = 750 comparaciones por predicción. En un dispositivo moderno, esto toma <1ms.

## 13.4 Smoothing de Predicciones

Para reducir el ruido (falsos positivos por frames individuales), se aplica un buffer de smoothing (`mobile/src/hooks/use-live-prediction.ts:119`):

```typescript
const BUFFER_SIZE = 5;

function smoothPredict(buf, label, confidence) {
  b.push({ label, confidence });
  if (b.length > BUFFER_SIZE) b.shift();  // Ventana deslizante de 5 frames
  if (b.length < 2) return null;           // Necesita al menos 2 frames

  // Voto mayoritario en el buffer
  const counts = {};
  for (const p of b) {
    if (!counts[p.label]) counts[p.label] = { count: 0, totalConf: 0 };
    counts[p.label].count++;
    counts[p.label].totalConf += p.confidence;
  }
  // Retorna la clase más frecuente y su confianza promedio
  const best = Object.entries(counts).sort((a, b) => b[1].count - a[1].count)[0];
  return {
    label: best[0],
    confidence: Math.round((best[1].totalConf / best[1].count) * 10) / 10
  };
}
```

## 13.5 Detección de Movimiento para Señas Dinámicas

Las señas dinámicas requieren detectar que la mano está en movimiento (a diferencia de las letras/palabras que son poses estáticas):

```typescript
// mobile/src/hooks/use-live-prediction.ts:193
const MOTION_THRESHOLD = 0.018;
const MOTION_TIMEOUT_MS = 500;

// Calcular delta de movimiento entre frames
let motionDelta = 0;
for (let i = 0; i < 63; i++) {
  const diff = landmarksToUse[i] - prevMotionLms[i];
  motionDelta += diff * diff;
}
motionDelta = Math.sqrt(motionDelta / 63);

if (motionDelta > MOTION_THRESHOLD) {
  lastSignificantMotionTimeRef.current = now;  // Hubo movimiento
}

// Si no hay movimiento en 500ms → la mano está estática → clasificar letra/palabra
const isStatic = (now - lastSignificantMotionTimeRef.current) > MOTION_TIMEOUT_MS;

// Si hay movimiento → clasificar seña dinámica
```

---

# 14. Base de Datos y Persistencia

## 14.1 Estrategia de Doble Capa

SIGNUM usa dos capas de persistencia:

| Capa | Ubicación | Tecnología | Propósito |
|---|---|---|---|
| **Local** | Dispositivo del usuario | IndexedDB (web) / SQLite (mobile) | Muestras de entrenamiento, modelos RF, caché de IA |
| **Remota** | Supabase Cloud | PostgreSQL | Datos compartidos: usuarios, traducciones, avances, muestras colaborativas, modelos |

Esta estrategia permite que la funcionalidad crítica (predicción) funcione completamente offline, mientras que los datos compartidos (login, historial, colaboración) requieren conexión.

## 14.2 Base de Datos Local (Web)

```typescript
// frontend/src/lib/db.ts
const DB_NAME = "signum";
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("samples")) {
        const store = db.createObjectStore("samples", {
          keyPath: "id", autoIncrement: true
        });
        store.createIndex("label", "label", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
      if (!db.objectStoreNames.contains("models")) {
        db.createObjectStore("models", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("aiCache")) {
        const store = db.createObjectStore("aiCache", { keyPath: "phrase" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
```

IndexedDB fue elegido sobre localStorage porque:
- Soporta almacenamiento de objetos grandes (modelos RF serializados pueden pesar 50+ KB)
- Soporta índices para búsquedas eficientes (`getSamplesByLabel`, `getSamplesByType`)
- Soporta transacciones para garantizar integridad en escrituras batch
- Es asíncrono (no bloquea el hilo principal)

## 14.3 Base de Datos Local (Mobile)

```typescript
// mobile/src/lib/db.ts
async function initDB() {
  const conn = await SQLite.openDatabaseAsync("signum.db");
  await conn.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL, type TEXT NOT NULL,
      landmarks TEXT NOT NULL, createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_samples_label ON samples(label);
    CREATE INDEX IF NOT EXISTS idx_samples_type ON samples(type);
  `);
  return conn;
}
```

SQLite en WAL mode permite lecturas concurrentes con escrituras, crucial para guardar muestras mientras se sigue prediciendo. `expo-sqlite` proporciona una API similar a la de IndexedDB (runAsync, getAllAsync, withTransactionAsync).

---

# 15. Decisiones de Diseño Justificadas

## 15.1 ¿Por qué inferencia local y no en servidor?

**Decisión**: Toda la inferencia de señas ocurre en el dispositivo del usuario (navegador o app), nunca en un servidor.

**Justificación**:
1. **Latencia**: Enviar 63 floats × 30 fps al servidor introduce 200-500ms de latencia de red. La inferencia local toma <5ms.
2. **Offline**: La predicción funciona sin internet. Crítico para una app de accesibilidad.
3. **Escalabilidad**: Cada nuevo usuario agrega su propia capacidad de cómputo (su dispositivo). Un servidor central recibiría N × 30 requests/segundo.
4. **Privacidad**: Los landmarks de la mano son datos biométricos. Procesarlos localmente evita transmitir esta información.
5. **Costo**: Cero costo de servidor para la funcionalidad principal. Los costos son solo de APIs opcionales (Groq, ElevenLabs).

## 15.2 ¿Por qué Random Forest y no Red Neuronal?

**Decisión**: Implementar Random Forest desde cero en JavaScript en lugar de usar TensorFlow.js o una red neuronal pre-entrenada.

**Justificación**:
1. **Tamaño de modelo**: 10-50 KB vs 500 KB - 2 MB. Crítico para descarga en móvil.
2. **Sin dependencias**: 0 bytes de librerías externas para ML. TensorFlow.js pesa ~2 MB.
3. **Entrenamiento en navegador**: Entrenar un RF de 50 árboles con 100 muestras toma <1 segundo. Una red neuronal tomaría 30-60 segundos en el mismo hardware y podría congelar la UI.
4. **Precisión suficiente**: Con 63 features normalizadas, RF alcanza 80-95% de accuracy en 20-30 clases. Una red neuronal pequeña ofrecería 85-95%, una diferencia marginal que no justifica la complejidad adicional.
5. **Interpretabilidad**: RF permite ver feature importance (qué landmarks son más relevantes para cada seña). Una red neuronal es caja negra.

## 15.3 ¿Por qué MediaPipe y no otra solución de hand tracking?

**Decisión**: Usar MediaPipe Tasks-Vision en lugar de TensorFlow.js HandPose, OpenCV.js, o APIs nativas.

**Justificación**:
1. **Precisión**: MediaPipe HandLandmarker es el estado del arte en detección de landmarks de mano (ganador del benchmark HA GRID).
2. **Rendimiento**: Usa GPU vía WebGL/WASM. Corre a 30 fps en dispositivos móviles.
3. **21 landmarks 3D**: Otros modelos dan 21 puntos 2D. La coordenada Z es crucial para distinguir señas con profundidad.
4. **Gratuito y open source**: Sin límites de API, sin costos.
5. **Dos manos**: Soporta detección simultánea de ambas manos, necesario para señas bimanuales de LSM.

## 15.4 ¿Por qué Supabase y no Firebase o un backend propio?

**Decisión**: Usar Supabase como BaaS en lugar de Firebase o un backend PostgreSQL auto-gestionado.

**Justificación**:
1. **Open source**: Sin vendor lock-in. Se puede migrar a PostgreSQL auto-gestionado en cualquier momento.
2. **PostgreSQL**: Base de datos relacional real con triggers, RLS, funciones, índices. Firestore es NoSQL.
3. **RLS nativo**: Row Level Security integrado en la DB. Las políticas de seguridad viven en la base de datos, no en el código de la app.
4. **Storage S3**: Compatible con S3, útil para modelos RF serializados.
5. **SDK unificado**: Auth, DB y Storage en un solo SDK (`@supabase/supabase-js`).
6. **Costo**: Generoso tier gratuito (500 MB DB, 1 GB Storage, 50K usuarios).

## 15.5 ¿Por qué 4 servicios y no 1 o 2?

**Decisión**: Separar el sistema en Frontend Web, Mobile, ML Service y Supabase.

**Justificación**: Principio de "separar lo que escala distinto, lo que falla distinto y lo que evoluciona distinto":

- **Frontend y Mobile escalan distinto**: más usuarios = más navegadores/dispositivos, no más servidores.
- **ML Service escala distinto**: el entrenamiento colaborativo es un batch job que corre ocasionalmente. No debe compartir recursos con el frontend.
- **Supabase escala distinto**: es un servicio gestionado. Su escalabilidad es responsabilidad del proveedor.
- **Cada uno falla distinto**: si Supabase cae, la predicción local sigue. Si el ML Service cae, el entrenamiento colaborativo se pausa pero la app sigue. Si Vercel cae, la app móvil sigue.

## 15.6 ¿Por qué Next.js App Router y no Pages Router o Vite?

**Decisión**: Usar Next.js 16 con App Router para el frontend web.

**Justificación**:
1. **API Routes**: Permite crear endpoints server-side (`/api/ai/complete`, `/api/tts/elevenlabs`) en el mismo proyecto, sin necesidad de un servidor Express separado.
2. **Server Components**: Las páginas estáticas (landing, about) se renderizan en el servidor para mejor SEO.
3. **Vercel**: Despliegue automático con integración nativa.
4. **React 19**: Última versión con mejoras de rendimiento.

---

# 16. Cómo Probar el Sistema

## 16.1 Prueba de Autonomía

### Probar que el Frontend funciona sin Supabase

```bash
# 1. Desconectar internet o agregar una entrada falsa en /etc/hosts
# 2. Abrir el frontend localmente
cd frontend && npm run dev

# 3. Verificar que:
#    - La cámara se activa ✅
#    - Se detecta la mano (puntos verdes/azules sobre los landmarks) ✅
#    - Si hay modelo local en IndexedDB, se muestra la predicción ✅
#    - El login falla con mensaje de error de conexión ✅
#    - El texto del error de conexión es claro y en español ✅
```

### Probar que el ML Service funciona sin clientes

```bash
# 1. Iniciar el ML Service
cd ml-service && npm start

# 2. Verificar health
curl http://localhost:8000/ml/health
# → {"status":"ok","service":"signum-ml-service","timestamp":"...","uptime":0.5}

# 3. Entrenar un modelo (requiere tener SUPABASE_SERVICE_ROLE_KEY en .env)
curl -X POST http://localhost:8000/ml/train \
  -H "Content-Type: application/json" \
  -d '{"type": "letter"}'

# Si hay muestras en Supabase:
# → {"success":true,"version":"letter_v1","metrics":{...},"samples":{...}}

# Si no hay muestras:
# → HTTP 400 {"error":"Se requieren al menos 10 muestras para entrenar"}
```

### Probar que la app móvil funciona sin servidor

```bash
# 1. Activar modo avión en el dispositivo
# 2. Abrir la app móvil
# 3. Verificar:
#    - La cámara se activa (WebView carga MediaPipe desde caché) ✅
#    - Se detecta la mano ✅
#    - Si hay modelo en SQLite, se predicen señas ✅
#    - El login muestra error de conexión con mensaje claro ✅
#    - El TTS nativo (expo-speech) funciona (no requiere red) ✅
```

## 16.2 Prueba de Contratos de Servicio

### Probar el contrato de Groq (proxy)

```bash
# Request válido
curl -X POST http://localhost:3000/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{"phrase": "yo comer manzana ayer"}'
# → {"completed": "Yo comí una manzana ayer."}

# Request inválido (frase muy corta)
curl -X POST http://localhost:3000/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{"phrase": "yo"}'
# → HTTP 400 {"error": "La frase debe tener al menos 3 caracteres"}

# Request sin body
curl -X POST http://localhost:3000/api/ai/complete
# → HTTP 400 (error de parseo JSON)
```

### Probar el contrato de ElevenLabs (proxy)

```bash
# Request válido
curl "http://localhost:3000/api/tts/elevenlabs?text=hola&voice_id=pNInz6obpgDQGcFmaJgB" \
  -o test.mp3
# → Archivo test.mp3 con audio válido (~20 KB)

# Voz fuera de whitelist → fallback a Adam
curl "http://localhost:3000/api/tts/elevenlabs?text=hola&voice_id=VOZ_PREMIUM_NO_PERMITIDA" \
  -o test.mp3
# → Usa Adam como fallback (registrado en logs del servidor)

# Sin texto
curl "http://localhost:3000/api/tts/elevenlabs"
# → HTTP 400 {"error": "Falta el parámetro text"}
```

## 16.3 Prueba de Bajo Acoplamiento

### Verificar que no hay imports cruzados

```bash
# El frontend NO debe importar nada del ML Service
cd frontend && grep -r "ml-service" src/ --include="*.ts" --include="*.tsx"
# → (sin resultados, o solo referencias en comentarios)

# El ML Service NO debe importar nada del frontend
cd ml-service && grep -r "frontend" src/ --include="*.js"
# → (sin resultados)
```

### Verificar que los cambios en un servicio no rompen otro

```bash
# 1. Modificar un color en el frontend (ej: cambiar primary color en CSS)
# 2. Verificar que el ML Service sigue funcionando
curl http://localhost:8000/ml/health
# → {"status":"ok",...} ✅ (no afectado)

# 3. Agregar un endpoint nuevo al ML Service
# 4. Verificar que el frontend sigue funcionando
# → No debería tener errores porque no consume el nuevo endpoint ✅
```

## 16.4 Prueba de Seguridad

### Verificar que las API keys no se exponen

```bash
# En el frontend compilado (producción), buscar las keys
cd frontend && npm run build
grep -r "GROQ_API_KEY\|ELEVENLABS_API_KEY" .next/ --include="*.js"
# → (sin resultados) ✅ Las keys no están en el bundle del cliente

# En el source del frontend, verificar que solo se usan en rutas API
grep -r "GROQ_API_KEY\|ELEVENLABS_API_KEY" src/ app/ --include="*.ts" --include="*.tsx" \
  | grep -v "api/ai/complete\|api/tts/elevenlabs\|\.env"
# → (sin resultados) ✅ Solo se usan en los archivos de ruta API
```

### Verificar RLS

```bash
# 1. Obtener un JWT de un usuario normal
# 2. Intentar leer evaluaciones de otro usuario
curl "https://nvkpfreeyemrpxxmqfqm.supabase.co/rest/v1/evaluaciones" \
  -H "Authorization: Bearer <JWT_USUARIO_NORMAL>" \
  -H "apikey: <ANON_KEY>"
# → Solo devuelve las evaluaciones del propio usuario ✅

# 3. Intentar modificar un modelo siendo usuario normal
curl -X POST "https://nvkpfreeyemrpxxmqfqm.supabase.co/rest/v1/modelos" \
  -H "Authorization: Bearer <JWT_USUARIO_NORMAL>" \
  -H "apikey: <ANON_KEY>" \
  -d '{"tipo": "letter", "version": "hack_v1", ...}'
# → HTTP 401/403 (RLS bloquea el INSERT) ✅
```

### Verificar manejo de errores de autenticación

```typescript
// Test en el navegador (consola)
// 1. Intentar login con credenciales inválidas
const result = await signIn("noexiste@test.com", "wrongpass");
// → Error: "Credenciales inválidas" ✅

// 2. Intentar guardar evaluación sin sesión
await supabase.auth.signOut();
await saveEvaluation({...});
// → Error: "Debes iniciar sesión para enviar la evaluación." ✅

// 3. Simular caída de Supabase
// Desconectar internet, intentar login
// → Error: "Error de conexión: no se pudo contactar al servidor..." ✅
```

---

# 17. Tolerancia a Fallos

> Criterio de defensa técnica: ¿Qué pasa si uno de los servicios deja de estar disponible?

## 17.1 Escenarios de Falla y Comportamiento del Sistema

### Escenario 1: Supabase cae

```
Simulación: Desconectar el frontend de internet o denegar tráfico a supabase.co

Comportamiento observado:
✅ Cámara: funciona (getUserMedia es local)
✅ MediaPipe: funciona (cargado desde CDN, cacheado)
✅ Predicción: funciona (RandomForestPredictor es local)
✅ Entrenamiento local: funciona (IndexedDB/SQLite son locales)
✅ TTS nativo: funciona (Web Speech API / expo-speech)
❌ Login/registro: muestra error de conexión con mensaje claro
❌ Historial de traducciones: no disponible
❌ Modelos colaborativos: no disponibles
❌ Groq/ElevenLabs: no disponibles (requieren internet)

El sistema se DEGRADA, no colapsa. La funcionalidad crítica sigue al 100%.
```

### Escenario 2: ML Service cae

```
Simulación: kill del proceso Node.js en Render

Comportamiento observado:
✅ Frontend: funciona completamente normal
✅ Mobile: funciona completamente normal
✅ Predicción: sin cambios (nunca dependió del ML Service)
✅ Entrenamiento local: sin cambios
❌ Entrenamiento colaborativo: no disponible
❌ Nuevos modelos colaborativos: no se generan

Impacto mínimo: el entrenamiento colaborativo es una operación batch ocasional.
```

### Escenario 3: Groq API cae

```
Simulación: Denegar tráfico a api.groq.com desde el servidor Next.js

Comportamiento:
✅ Cámara + predicción: sin cambios
✅ Fraseador manual: funciona (se puede escribir/editando la frase)
✅ TTS: Web Speech API / expo-speech como fallback
❌ Botón "Completar frase": muestra error "Groq API error 502"

El proxy de Next.js devuelve HTTP 502 con mensaje claro.
La app móvil muestra el error de fetch directamente.
```

### Escenario 4: Vercel cae (hosting del frontend web)

```
Simulación: Vercel outage (el frontend web no carga)

Comportamiento observado:
❌ App web: inaccesible (no carga en el navegador)
✅ App móvil: funciona al 100% (no depende de Vercel)
✅ ML Service: sigue funcionando (hosteado en Render)
✅ Supabase: sigue funcionando (gestionado independientemente)

La app móvil es un canal alternativo que mantiene el servicio disponible.
```

### Escenario 5: ElevenLabs API cae

```
Simulación: Denegar tráfico a api.elevenlabs.io

Comportamiento:
✅ Frontend web: fallback automático a Web Speech API del navegador
✅ App móvil: usa expo-speech nativo siempre (no depende de ElevenLabs)
❌ Voz premium: no disponible

El sistema tiene TTS redundante: ElevenLabs (premium) → Web Speech API (navegador) → expo-speech (móvil).
```

## 17.2 Matriz de Degradación

| Servicio caído | ¿Predicción? | ¿Login? | ¿Historial? | ¿TTS? | ¿Entrenamiento local? | ¿Entrenamiento colaborativo? |
|---|---|---|---|---|---|---|
| **Supabase** | ✅ | ❌ | ❌ | ✅ (nativo) | ✅ | ❌ |
| **ML Service** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Groq** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ElevenLabs** | ✅ | ✅ | ✅ | ✅ (fallback) | ✅ | ✅ |
| **Vercel** | ✅ (móvil) | ✅ (móvil) | ✅ (móvil) | ✅ (móvil) | ✅ (móvil) | ✅ (móvil) |
| **MediaPipe CDN** | ❌ (si no cacheado) | ✅ | ✅ | ✅ | ✅ | ✅ |

**Conclusión**: No hay single point of failure para la funcionalidad crítica (detección + predicción de señas). El sistema se degrada parcialmente pero nunca colapsa por completo.

---

# 18. Pruebas E2E Automatizadas

## 18.1 Suite de Pruebas con Playwright

El proyecto incluye una suite de pruebas end-to-end en `frontend/e2e/spec.js` (495 líneas) que valida el sistema contra la URL de producción (`https://signum.animare.dev`).

### Pruebas Implementadas

| Prueba | Responsable | Qué valida | Criterio SOA |
|---|---|---|---|
| `model_load_proof` | Josué J. Hernández | El modelo RF existe en IndexedDB y el mensaje "Modelos locales cargados" aparece en la UI | Autonomía |
| `accuracy_proof` | Josué J. Hernández | Las confianzas de predicción están en el rango [55%, 100%] con spread ≤20% | Contrato |
| `vector_extract_proof` | Humberto Castillo | El vector de landmarks es 63D, normalizado (≤1), muñeca en origen (±1e-6) | Contrato |
| `speech_api_proof` | Humberto Castillo | `speechSynthesis.speak("Hola")` se ejecuta correctamente | Autonomía |
| `letter_proof` | José M. Guerrero | El mismo gesto → misma letra+confianza; gesto distinto → letra distinta | Contrato |
| `debounce_proof` | José M. Guerrero | Solo 1 invocación de `speak()` en 2.5s con gesto estático | Bajo acoplamiento |
| `latency_threshold_proof` | Manuel A. Mathey | La cadencia mediana de predicción es <500ms | Autonomía |
| `canvas_landmarks_proof` | Manuel A. Mathey | El canvas tiene >100 píxeles de color (landmarks dibujados) | Contrato |

### Ejecución

```bash
cd frontend
npx playwright test e2e/spec.js --project=chromium
```

### Inyección de Modelo de Prueba

Para pruebas sin modelo real, el spec soporta `E2E_SEED_STUB_MODEL`:

```javascript
// Inyecta un modelo RF determinístico de 1 árbol con clases A, B, C
await page.evaluate(() => {
  const stubModel = {
    nTrees: 1, nFeatures: 63,
    classes: ["A", "B", "C"],
    trees: [{ n: [ /* nodos que mapean landmarks → clase conocida */ ] }]
  };
  // Guardar en IndexedDB
  const db = await openDB();
  const tx = db.transaction("models", "readwrite");
  tx.objectStore("models").put({ id: "rf-letter", data: stubModel, ... });
});
```

Esto permite validar el pipeline completo (cámara → MediaPipe → RF → UI) incluso si el usuario de prueba no ha entrenado modelos.

---

# 19. Repositorio y Estructura de Archivos

```
signum/
│
├── frontend/                          # Servicio 1: Frontend Web (Next.js)
│   ├── app/                           # App Router de Next.js
│   │   ├── page.tsx                   # Landing page (login/registro)
│   │   ├── layout.tsx                 # Layout raíz + metadata
│   │   ├── login/page.tsx             # Página de login
│   │   ├── register/page.tsx          # Página de registro
│   │   ├── app/                       # App autenticada
│   │   │   ├── page.tsx               # Pantalla principal (cámara + predicción)
│   │   │   ├── layout.tsx             # Layout con Navbar + fondo
│   │   │   ├── ajustes/               # Configuración
│   │   │   └── admin/                 # Dashboard de administrador
│   │   └── api/                       # API Routes (server-side)
│   │       ├── ai/complete/route.ts   # Proxy Groq
│   │       └── tts/elevenlabs/route.ts # Proxy ElevenLabs
│   ├── src/
│   │   ├── components/                # Componentes React
│   │   │   ├── camera/CameraFeed.tsx  # Feed de cámara + overlay
│   │   │   ├── layout/                # Navbar, fondo, fluid
│   │   │   ├── stats/                 # Estadísticas
│   │   │   ├── profile/               # Perfil de usuario
│   │   │   └── ui/                    # Botones, toggles, carrusel
│   │   ├── hooks/                     # Custom hooks
│   │   │   ├── use-live-prediction.ts # Predicción en tiempo real
│   │   │   ├── use-phrase-builder.ts  # Construcción de frases
│   │   │   ├── use-model-training.ts  # Entrenamiento local
│   │   │   └── use-tts.ts             # Text-to-speech
│   │   ├── services/                  # Lógica de negocio
│   │   │   ├── auth.service.ts        # Auth (login, register, sesión)
│   │   │   ├── mediapipe.service.ts   # MediaPipe HandLandmarker
│   │   │   ├── rf-trainer.ts          # Random Forest (entrenamiento)
│   │   │   ├── rf-inference.ts        # Random Forest (inferencia)
│   │   │   ├── capture-local.service.ts # Captura de muestras
│   │   │   ├── ai-complete.service.ts # Cliente Groq
│   │   │   └── collaborative.service.ts # Subir/bajar modelos
│   │   ├── lib/                       # Utilidades y config
│   │   │   ├── db.ts                  # IndexedDB wrapper
│   │   │   ├── supabase.ts            # Cliente Supabase
│   │   │   ├── env.ts                 # Variables de entorno tipadas
│   │   │   └── storage.ts             # localStorage wrapper
│   │   └── theme/                     # Tema y colores
│   ├── bd/                            # Esquemas SQL
│   │   ├── supabase-schema.sql        # Schema completo + RLS
│   │   ├── ml-training-tables.sql     # Tablas colaborativas
│   │   └── seed-20-evaluadores.sql    # Datos de prueba
│   ├── e2e/                           # Pruebas end-to-end
│   │   └── spec.js                    # Suite Playwright
│   ├── vercel.json                    # Config de despliegue
│   ├── package.json                   # Dependencias
│   └── tsconfig.json                  # Config TypeScript
│
├── mobile/                            # Servicio 2: App Móvil (Expo)
│   ├── App.tsx                        # Entry point
│   ├── src/
│   │   ├── screens/                   # Pantallas
│   │   │   ├── MainScreen.tsx         # Cámara + predicción
│   │   │   ├── SettingsScreen.tsx     # Configuración
│   │   │   ├── ReferencesScreen.tsx   # Diccionario LSM
│   │   │   └── ...                    # Login, Registro, Landing, Stats
│   │   ├── hooks/                     # Mismos hooks que frontend
│   │   ├── services/                  # Misma lógica que frontend
│   │   │   ├── mediapipe-html.ts      # HTML para WebView
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── db.ts                  # expo-sqlite wrapper
│   │   │   ├── supabase.ts            # Cliente Supabase + AsyncStorage
│   │   │   └── ...
│   │   └── navigation/               # React Navigation
│   ├── app.json                       # Config Expo
│   └── package.json                   # Dependencias
│
├── ml-service/                        # Servicio 3: ML Training
│   ├── src/
│   │   ├── server.js                  # Express server (GET /health, POST /train)
│   │   └── rf-trainer.js              # Random Forest (igual algoritmo que frontend)
│   ├── .env                           # SUPABASE_SERVICE_ROLE_KEY
│   └── package.json                   # Dependencias (express, supabase-js)
│
├── informe-tecnico.md                 # Reporte técnico detallado
├── exposicion-soa.md                  # Diapositivas de exposición
└── vercel.json                        # Config global Vercel
```

---

# 20. Conclusión

## 20.1 Resumen de Cumplimiento SOA

| Criterio | Peso | Evidencia de cumplimiento |
|---|---|---|
| **Autonomía del servicio** | 25% | 4 servicios independientes con sus propias dependencias y directorios. La predicción funciona sin backend. Cada servicio puede probarse aisladamente con curl o el navegador. |
| **Contrato bien definido** | 20% | APIs REST documentadas (Groq proxy, ElevenLabs proxy, ML Service). Esquema SQL público con tipos y constraints. Formato de modelo RF estable. |
| **Bajo acoplamiento** | 10% | Sin imports cruzados entre servicios. Comunicación solo vía HTTPS + SDK. Cambios en un servicio no rompen otros. |
| **Seguridad** | 10% | 5 capas: HTTPS, JWT, RLS, API key proxy, cabeceras HTTP. Manejo explícito de todos los casos de error de auth. |
| **Recursos de exposición** | 10% | Diagrama de arquitectura detallado + demo en vivo preparada + video backup. |
| **Defensa técnica** | 25% | Decisiones justificadas con criterios técnicos. Tolerancia a fallos documentada con escenarios. Pruebas E2E automatizadas. |

## 20.2 Fortalezas de la Arquitectura

1. **Offline-first**: La funcionalidad crítica no depende de conexión a internet.
2. **Escalabilidad natural**: Cada dispositivo agrega su propia capacidad de cómputo.
3. **Tolerancia a fallos**: No hay single point of failure. El sistema se degrada, no colapsa.
4. **Evolución independiente**: Frontend, mobile y ML Service pueden actualizarse en ciclos distintos.
5. **Privacidad**: Los datos biométricos (landmarks) se procesan localmente.
6. **Costo eficiente**: Solo se paga por APIs opcionales. La funcionalidad principal tiene costo marginal $0.

## 20.3 Áreas de Mejora Futura

1. **WebSocket para predicción server-side**: Como fallback cuando el dispositivo no tiene capacidad de cómputo (dispositivos muy antiguos). El código cliente ya está (`websocket.service.ts`), falta implementar el endpoint en el ML Service.
2. **EXPO_PUBLIC_GROQ_API_KEY en mobile**: Migrar a un proxy server-side (requiere un backend ligero para mobile o usar Supabase Edge Functions).
3. **CI/CD**: Agregar GitHub Actions para ejecutar las pruebas E2E automáticamente en cada PR.
4. **Métricas de producción**: Agregar monitoreo de uptime para el ML Service y Supabase.
5. **Cache de MediaPipe**: Servir el WASM y el modelo desde un CDN propio para reducir dependencia de terceros.

---

# Apéndice A: Comandos Útiles

```bash
# ===== FRONTEND =====
cd frontend

# Desarrollo
npm run dev                       # Iniciar en http://localhost:3000

# Producción
npm run build && npm start        # Build y servir

# Pruebas E2E
npx playwright test e2e/spec.js   # Contra producción
E2E_BASE_URL=http://localhost:3000 npx playwright test e2e/spec.js  # Contra local

# ===== MOBILE =====
cd mobile

# Desarrollo
npx expo start                    # Iniciar Metro bundler

# Android
npx expo run:android              # Build y ejecutar en emulador/dispositivo

# iOS
npx expo run:ios                  # Build y ejecutar en simulador

# ===== ML SERVICE =====
cd ml-service

# Desarrollo
npm start                         # Iniciar en http://localhost:8000

# Probar
curl http://localhost:8000/ml/health
curl -X POST http://localhost:8000/ml/train \
  -H "Content-Type: application/json" \
  -d '{"type": "letter"}'

# ===== PROBAR CONTRATOS =====

# Groq proxy (frontend corriendo)
curl -X POST http://localhost:3000/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{"phrase": "yo comer manzana"}'

# ElevenLabs proxy
curl "http://localhost:3000/api/tts/elevenlabs?text=hola" -o test.mp3

# ===== VERIFICAR SEGURIDAD =====

# Verificar que API keys no están en el bundle
grep -r "GROQ_API_KEY\|ELEVENLABS_API_KEY" frontend/.next/static/

# Verificar RLS (requiere JWT)
curl "https://nvkpfreeyemrpxxmqfqm.supabase.co/rest/v1/traducciones" \
  -H "Authorization: Bearer <JWT>" \
  -H "apikey: <ANON_KEY>"
```

---

# Apéndice B: Glosario

| Término | Definición |
|---|---|
| **SOA** | Service-Oriented Architecture. Estilo arquitectónico donde las funcionalidades se organizan como servicios independientes que se comunican mediante interfaces públicas. |
| **BaaS** | Backend-as-a-Service. Plataforma que proporciona backend gestionado (DB, auth, storage) sin necesidad de administrar servidores. |
| **JWT** | JSON Web Token. Token de autenticación que contiene claims firmados digitalmente. |
| **RLS** | Row Level Security. Mecanismo de PostgreSQL que restringe qué filas puede ver/modificar un usuario según políticas definidas en la base de datos. |
| **Landmark** | Punto de referencia anatómico detectado por MediaPipe (ej. punta del pulgar, muñeca). |
| **Random Forest** | Algoritmo de ensemble learning que combina múltiples árboles de decisión entrenados con diferentes subconjuntos de datos. |
| **Gini impurity** | Métrica de pureza de un nodo. 0 = todas las muestras son de la misma clase. |
| **Gloss** | Notación que representa señas como palabras sin estructura gramatical. Ej: "yo comer manzana ayer". |
| **WAL** | Write-Ahead Logging. Modo de SQLite que permite lecturas concurrentes con escrituras. |
| **WASM** | WebAssembly. Formato binario para ejecutar código de alto rendimiento en navegadores. |
| **SRK** | Service Role Key. Clave de Supabase con acceso administrativo total (bypassea RLS). |
