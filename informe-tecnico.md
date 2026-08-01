# Informe Técnico — SIGNUM (Sistema de Reconocimiento de Lengua de Señas)

## 1. Resumen de Arquitectura

SIGNUM es un sistema **distribuido** compuesto por tres frontales (Next.js web + Expo/React Native mobile) que comparten un backend de datos único (Supabase) y un servicio auxiliar de entrenamiento ML (ml-service). La inferencia de señas ocurre **100% en el cliente** (navegador/WebView) mediante MediaPipe Tasks-Vision para detección de landmarks y Random Forest en JavaScript puro para clasificación. Un servidor WebSocket Python FastAPI existió originalmente pero fue eliminado; la predicción ahora es exclusivamente local.

---

## 2. Stack Tecnológico Activo

### 2.1 Frontend Web (`frontend/`)

| Tecnología                 | Versión   | Archivos clave                              | Propósito                                     |
| -------------------------- | --------- | ------------------------------------------- | --------------------------------------------- |
| **Next.js** (App Router)   | 16.2.6    | `app/`, `app/layout.tsx`                    | Framework web con server components y routing |
| **React**                  | 19.2.4    | Todos los `*.tsx`                           | UI declarativa                                |
| **TypeScript**             | 5.9.3     | `tsconfig.json`                             | Tipado estático                               |
| **Tailwind CSS**           | 4.3.0     | `app/globals.css`, `postcss.config.mjs`     | Estilos utilitarios                           |
| **Supabase JS**            | 2.110.1   | `src/lib/supabase.ts`                       | Cliente DB/Auth/Storage                       |
| **MediaPipe Tasks-Vision** | 0.10.35   | `src/services/mediapipe.service.ts`         | HandLandmarker (GPU, 2 manos, CDN)            |
| **RF-trainer (JS puro)**   | —         | `src/services/rf-trainer.ts`                | Entrenamiento Random Forest en cliente        |
| **RF-inference (JS puro)** | —         | `src/services/rf-inference.ts`              | Inferencia Random Forest en cliente           |
| **Groq API**               | —         | `app/api/ai/complete/route.ts`              | LLM para completar frases (Llama 4 Scout)     |
| **ElevenLabs TTS**         | —         | `app/api/tts/elevenlabs/route.ts`           | TTS server-side con fallback Web Speech API   |
| **Framer Motion**          | 12.42.2   | `src/components/ui/FramerCarousel.tsx`      | Animaciones UI                                |
| **xlsx**                   | 0.18.5    | `app/app/admin/dashboard/page.tsx`          | Exportar Excel (dashboard admin)              |
| **WebGL (manual)**         | —         | `PaperContainer.tsx`, `liquid-gradient.tsx` | Efectos visuales sin Three.js                 |
| **WebSocket (nativo)**     | —         | `src/services/websocket.service.ts`         | Cliente WebSocket (inactivo, sin server)      |
| **IndexedDB**              | Navegador | `src/lib/db.ts`                             | Caché local de modelos y muestras             |

**Frontend web NO USA**: TensorFlow.js, ONNX, Three.js, @paper-design/shaders-react, @react-three/\*, jspdf, Socket.IO. Esas dependencias están en package.json pero nunca se importan (residuos del prototipado).

### 2.2 Frontend Mobile (`mobile/`)

| Tecnología                        | Versión | Archivos clave                              | Propósito                                 |
| --------------------------------- | ------- | ------------------------------------------- | ----------------------------------------- |
| **Expo SDK**                      | 54.0.36 | `App.tsx`, `app.json`                       | Framework React Native con newArchEnabled |
| **React**                         | 19.1.0  | Todos los `*.tsx`                           | UI declarativa                            |
| **React Native**                  | 0.81.5  | Todos los screens/hooks                     | Runtime mobile                            |
| **React Navigation native-stack** | 6.11.0  | `src/navigation/AppNavigator.tsx`           | Navegación con 8 rutas                    |
| **react-native-webview**          | 13.15   | `MainScreen.tsx`                            | Renderiza MediaPipe + cámara en WebView   |
| **expo-camera**                   | ~17.0   | `use-live-prediction.ts`                    | SOLO permisos (no feed nativo)            |
| **MediaPipe Tasks-Vision**        | 0.10.35 | Dentro del WebView (`mediapipe-html.ts`)    | HandLandmarker desde CDN (jsdelivr)       |
| **Supabase JS**                   | 2.110.1 | `src/lib/supabase.ts`                       | Cliente DB/Auth/Storage                   |
| **expo-sqlite**                   | ~16.0   | `src/lib/db.ts`                             | DB local (muestras, modelos, caché IA)    |
| **AsyncStorage**                  | 2.2     | `src/lib/storage.ts`, `src/lib/supabase.ts` | Settings KV + sesión Supabase             |
| **expo-speech**                   | ~14.0   | `src/services/tts.service.ts`               | TTS nativo (es-MX)                        |
| **RF-trainer (JS puro)**          | —       | `src/services/rf-trainer.ts`                | Entrenamiento RF en JS puro               |
| **RF-inference (JS puro)**        | —       | `src/services/rf-inference.ts`              | Inferencia RF en JS puro                  |
| **Groq API**                      | —       | `src/services/ai-complete.service.ts`       | LLM para completar frases                 |
| **react-native-url-polyfill**     | 2.0.0   | `src/lib/supabase.ts`                       | Polyfill URL para Supabase en RN          |

**Mobile NO USA**: expo-av, expo-secure-store, @react-navigation/drawer, @expo/vector-icons, react-native-reanimated. Son residuos sin importar.

### 2.3 Backend

| Componente        | Tecnología                         | Propósito                                                                     |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| **Base de datos** | Supabase PostgreSQL                | DB compartida: usuarios, roles, muestras, modelos, traducciones, evaluaciones |
| **Auth**          | Supabase Auth (JWT)                | Login/registro con RLS                                                        |
| **Storage**       | Supabase Storage                   | Bucket `modelos` (JSON de RF entrenados)                                      |
| **ML Service**    | Node.js Express 4.21 (puerto 8000) | `POST /ml/train` — entrena RF en servidor y sube a Supabase                   |
| **LLM API**       | Groq (Llama 4 Scout 17B)           | Proxy desde frontend y mobile                                                 |
| **TTS API**       | ElevenLabs                         | Proxy desde frontend y mobile                                                 |

**No hay backend Python, no hay WebSocket server, no hay FastAPI.** El ML Service solo entrena; inferencia es 100% cliente.

---

## 3. Arquitectura Distribuida — Por qué lo es

SIGNUM es una arquitectura **distribuida** porque el procesamiento, almacenamiento e inferencia ocurren en múltiples nodos independientes conectados por red, sin un monolito central. Cada componente escala independientemente y puede fallar sin colapsar el sistema:

### 3.1 Separación de responsabilidades

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INFERENCIA (Cliente)                              │
│  ┌──────────────┐   getUserMedia   ┌──────────────┐   landmarks (63 floats)  │
│  │ Cámara (web) │ ───────────────► │ MediaPipe     │ ────────────────────────►│
│  │ o WebView    │                  │ Tasks-Vision  │                         │
│  └──────────────┘                  │ (WebView/host)│                         │
│                                    └──────────────┘                         │
│                                                         ▼                   │
│                                                ┌──────────────────┐         │
│                                                │ RandomForest     │         │
│                                                │ Predictor (local)│         │
│                                                │ 3 modelos:       │         │
│                                                │ letras/palabras/  │         │
│                                                │ dinámicas        │         │
│                                                └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE (Backend-as-a-Service)                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │ PostgreSQL     │  │ Auth (JWT)       │  │ Storage                  │    │
│  │ - usuarios     │  │ - register/login │  │ - modelos RF (.json)    │    │
│  │ - muestras     │  │ - RLS row-level  │  │ - upload/download        │    │
│  │ - traducciones │  │ - triggers       │  └──────────────────────────┘    │
│  │ - avances      │  └──────────────────┘                                  │
│  │ - evaluaciones │                                                       │
│  └────────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
     ▲                    ▲                    ▲
     │ HTTPS              │ HTTPS              │ HTTPS
     ▼                    ▼                    ▼
┌──────────┐      ┌──────────┐      ┌────────────────┐
│ Web App  │      │ Mobile   │      │ ML Service     │
│ (Next.js)│      │ (Expo)   │      │ (Express 8000) │
│ Vercel   │      │ AppStore │      │ Render         │
└──────────┘      └──────────┘      └────────────────┘
                                        │ Solo entrena
                                        │ y sube modelos
                                        ▼
                                   Supabase Storage
```

### 3.2 Distribución de responsabilidades

| Componente            | Hace                                                                                                           | No hace                                       | Escala                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------- |
| **Frontend web**      | Captura landmarks vía MediaPipe, clasifica con RF local, muestra UI, entrena modelos localmente, exporta Excel | No almacena datos propios                     | Escala horizontal (Vercel edge) |
| **Mobile app**        | Misma inferencia que web pero dentro de WebView, sin servidor intermedio                                       | No tiene servidor propio                      | Cada dispositivo es un nodo     |
| **Supabase**          | Almacena datos compartidos (muestras, modelos, usuarios, avances)                                              | No ejecuta inferencia ni entrenamiento        | Escala administrada             |
| **ML Service**        | Entrena RF con muestras colaborativas de Supabase y sube el modelo                                             | No sirve APIs al frontend, no hace inferencia | Escala independiente            |
| **Groq / ElevenLabs** | IA generativa para completar frases y TTS premium                                                              | No tocan el pipeline de señas                 | SaaS externo                    |

### 3.3 Beneficios de esta distribución

1. **Inferencia offline-ready**: La predicción de señas funciona sin conexión a internet porque MediaPipe + RandomForest corren localmente. Solo requieren red para descargar el modelo y para funcionalidades opcionales (LLM, TTS premium).

2. **Privacidad**: Los landmarks de la mano nunca salen del dispositivo para la predicción en tiempo real. Solo cuando el usuario sube explícitamente muestras colaborativas.

3. **Tolerancia a fallos**: Si Supabase cae, la cámara y la predicción local siguen funcionando. Si Groq cae, el TTS nativo de expo-speech sigue disponible.

4. **Escalabilidad horizontal**: La inferencia escala con la cantidad de dispositivos, no con servidores. Supabase escala automáticamente.

5. **Evolución independiente**: frontend web, mobile y backend pueden actualizarse por separado. El contrato es la base de datos y los modelos RF compartidos.

6. **Colaboración**: Cualquier usuario puede entrenar su modelo local. Los modelos colaborativos se agregan vía ml-service o manualmente en Supabase y se distribuyen a todos los clientes.

### 3.4 Flujo de datos completo

```
1. Usuario abre SIGNUM → Cámara se activa
2. MediaPipe detecta landmarks (21 puntos × 3 coordenadas = 63 features)
3. RandomForestPredictor local clasifica → letter/word/dynamic + confidence
4. Resultado se muestra en tiempo real en la UI
5. Si auto-add está activo, se agrega al fraseador
6. Frase completa → Groq (opcional) → español natural
7. TTS reproduce la frase (expo-speech nativo o ElevenLabs)
8. Avances y traducciones se registran en Supabase PostgreSQL
9. Muestras colaborativas opcionales → Supabase (tabla muestras_entrenamiento)
10. ML Service (ocasional) → entrena modelo colaborativo → Supabase Storage
11. Clientes descargan nuevo modelo → actualizan RandomForest local
```

---

## 4. Base de Datos — Esquema Activo

### 4.1 Supabase PostgreSQL (instancia `nvkpfreeyemrpxxmqfqm.supabase.co`)

| Tabla                      | Columnas clave                                                                    | Propósito                           |
| -------------------------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| `usuarios`                 | id, auth_user_id, nombre_usuario, genero, nivel, rol                              | Perfiles vinculados a auth.users    |
| `roles`                    | id_rol, nombre_rol                                                                | Catálogo: Administrador, Usuario    |
| `catalogo_generos`         | id_genero, nombre_genero                                                          | Catálogo: Hombre, Mujer, Otro       |
| `catalogo_tipo_traduccion` | id_tipo_traduccion, nombre_tipo                                                   | LSM-TEXTO, TEXTO-VOZ, etc.          |
| `login`                    | id_login, id_usuario, timestamp, ip                                               | Historial de sesiones               |
| `traducciones`             | id_traduccion, id_usuario, tipo, frase_original, frase_traducida                  | Registro de traducciones            |
| `avances`                  | id_avance, id_usuario, fecha, num_traducciones, tiempo_activo, precision_promedio | Progreso diario                     |
| `evaluaciones`             | id_evaluacion, id_usuario, puntuacion_sus, preguntas_json                         | Encuestas SUS                       |
| `muestras_entrenamiento`   | id_muestra, id_usuario, seña, mano, landmarks (jsonb), created_at                 | Muestras colaborativas ML           |
| `modelos`                  | id_modelo, tipo, version, activo, storage_path, accuracy                          | Metadatos de modelos RF versionados |

### 4.2 Base de datos local (cliente)

| Base                 | Tecnología                   | Stores                    | Propósito                                               |
| -------------------- | ---------------------------- | ------------------------- | ------------------------------------------------------- |
| `signum.db` (web)    | IndexedDB (via custom db.ts) | samples, models, aiCache  | Caché local de modelos, muestras offline y caché de LLM |
| `signum.db` (mobile) | expo-sqlite (WAL)            | samples, models, ai_cache | Mismo propósito, implementación nativa                  |

---

## 5. Machine Learning — Pipeline Completo

### 5.1 Captura de landmarks

```
Cámara → MediaPipe HandLandmarker → 21 landmarks × (x, y, z) → 63 floats
Normalización: traslación a muñeca (landmark 0) + escalado por distancia máxima
```

### 5.2 Entrenamiento (Random Forest)

| Parámetro               | Valor                     |
| ----------------------- | ------------------------- |
| Árboles                 | 50                        |
| Profundidad máxima      | 15                        |
| Mínimo samples por hoja | 2                         |
| Features por split      | √n ≈ 8                    |
| Criterio de split       | Gini impurity             |
| Muestreo                | Bootstrap (con reemplazo) |
| Validación              | OOB (out-of-bag)          |

**Tres modelos independientes**: letras, palabras, señas dinámicas.

### 5.3 Inferencia

```
63 features → recorrer N árboles → votación → label + confidence
Smoothing: buffer de 5 frames + majority vote
Detección de movimiento: varianza entre frames para distinguir estático/dinámico
```

### 5.4 Dónde se entrena

- **Local (cliente)**: `rf-trainer.ts` — entrenamiento en JS puro, guarda en IndexedDB/SQLite
- **Servidor**: `ml-service` (Express) — entrena desde `muestras_entrenamiento` colaborativas en Supabase

---

## 6. APIs Externas

| API            | Endpoint                                          | Modelo                                      | Propósito                          | Key en .env                                       |
| -------------- | ------------------------------------------------- | ------------------------------------------- | ---------------------------------- | ------------------------------------------------- |
| **Groq**       | `https://api.groq.com/openai/v1/chat/completions` | `meta-llama/llama-4-scout-17b-16e-instruct` | Completar frases (gloss → español) | `GROQ_API_KEY`                                    |
| **ElevenLabs** | `https://api.elevenlabs.io/v1/text-to-speech/...` | `eleven_multilingual_v2`                    | TTS premium                        | `ELEVENLABS_API_KEY`                              |
| **Supabase**   | `https://nvkpfreeyemrpxxmqfqm.supabase.co`        | PostgreSQL/Auth/Storage                     | DB, auth, archivos                 | `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` |

---

## 7. Despliegue

| Componente    | Plataforma                        | Comando/Config                                     |
| ------------- | --------------------------------- | -------------------------------------------------- |
| Frontend web  | **Vercel**                        | `next build` + `vercel.json`                       |
| Mobile app    | **Expo / App Store / Play Store** | `expo start` / `expo run:android` / `expo run:ios` |
| ml-service    | **Render Free**                   | Puero 8000, Node.js                                |
| Base de datos | **Supabase** (gestionado)         | SQL schema en `bd/supabase-schema.sql`             |

---

## 8. Por qué NO se usan otras arquitecturas

- **No es monolito**: La inferencia en servidor requeriría enviar 63 landmarks × N fps por cada usuario, introduciendo latencia, dependencia de red y cuello de botella en el servidor. Al clasificar en cliente, el sistema escala horizontalmente de forma natural.

- **No es edge computing puro**: Aunque la inferencia es local, el almacenamiento y colaboración son en la nube (Supabase). No hay servidor edge para ML porque la inferencia local es más rápida que cualquier round-trip.

- **No es serverless ML**: Las funciones serverless (Vercel Edge/Functions) no tienen GPU ni suficiente memoria/tiempo para correr MediaPipe o RandomForest en cada request, validate la decisión de hacerlo en cliente.

---

## 9. Residuos Detectados (No incluidos en stack activo)

| Dependencia/Archivo                       | Proyecto | Razón                                              |
| ----------------------------------------- | -------- | -------------------------------------------------- |
| `@mediapipe/holistic`                     | frontend | Reemplazado por tasks-vision                       |
| `@mediapipe/camera_utils`                 | frontend | No importado, setup manual                         |
| `@mediapipe/drawing_utils`                | frontend | No importado, dibujo custom                        |
| `@react-three/fiber`, `drei`, `spring`    | frontend | No importados; WebGL es manual                     |
| `three`, `three-stdlib`                   | frontend | No importados                                      |
| `@paper-design/shaders-react`             | frontend | No importado                                       |
| `@shadergradient/react`, `shadergradient` | frontend | No importados                                      |
| `camera-controls`                         | frontend | No importado                                       |
| `jspdf`, `jspdf-autotable`                | frontend | No importados; solo exporta Excel                  |
| `@expo/vector-icons`                      | mobile   | No importado; usa emojis/Text                      |
| `@react-navigation/drawer`                | mobile   | No importado; menú lateral custom                  |
| `expo-av`                                 | mobile   | No importado; TTS usa expo-speech                  |
| `expo-secure-store`                       | mobile   | No importado; sesión en AsyncStorage               |
| `react-native-reanimated`                 | mobile   | No importado                                       |
| `proxy.ts` (frontend)                     | frontend | Debería llamarse `middleware.ts`; inactivo         |
| `ENV.BACKEND_URL`                         | ambos    | Apunta a `localhost:8000`; el backend WS no existe |
| `speakElevenlabs()`                       | mobile   | Stub que retorna `false`                           |
| WebSocket prediction                      | frontend | Código cliente WS presente pero sin servidor       |
