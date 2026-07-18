# Reporte Tecnico — Signum

**Sistema de Reconocimiento de Lengua de Senas Mexicana (LSM) en Tiempo Real**

Julio 2026

---

## 1. Resumen Ejecutivo

Signum es una aplicacion web progresiva (Next.js + React) que reconoce en tiempo real la Lengua de Senas Mexicana mediante vision por computadora en el navegador. Captura video desde la camara web, detecta los 21 landmarks 3D de la mano con MediaPipe (acelerado por GPU), y clasifica las senas con tres modelos Random Forest implementados desde cero en TypeScript y entrenados localmente en IndexedDB. Soporta letras estaticas, palabras estaticas y senas dinamicas. Incorpora un LLM (Groq / Llama 4) para convertir glosas LSM a espanol natural, sintesis de voz en cascada (ElevenLabs → Web Speech API → Google TTS), y autenticacion completa con Supabase.

---

## 2. Stack Tecnologico

| Categoria | Tecnologia | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **UI** | React | 19.2.4 |
| **Lenguaje** | TypeScript | ^5 |
| **Estilos** | Tailwind CSS | ^4 |
| **Animaciones** | Framer Motion | ^12.42.2 |
| **3D / Shaders** | Three.js, React Three Fiber, Drei | 0.185 / 9.6 / 10.7 |
| **Gradientes procedurales** | shadergradient, @paper-design/shaders-react | 1.3 / 0.0.77 |
| **Vision / Manos** | @mediapipe/tasks-vision (HandLandmarker) | 0.10.35 |
| **ML en navegador** | Random Forest propio en TypeScript | — |
| **Persistencia local** | IndexedDB | — |
| **Auth + DB** | Supabase (PostgreSQL + JWT) | 2.110.1 |
| **LLM** | Groq (Llama 4 Scout 17B) | — |
| **TTS neuronal** | ElevenLabs (multilingual v2) | — |
| **Hosting** | Vercel | — |

---

## 3. Arquitectura General

```
NAVEGADOR
├── Camara web (getUserMedia, 800×600)
├── MediaPipe HandLandmarker (GPU/WASM, hasta 2 manos)
│     └── 21 landmarks 3D → normalizacion → 63 features
├── 3 Random Forest (TypeScript puro, IndexedDB)
│     ├── Letras (63 features estaticos)
│     ├── Palabras (63 features estaticos)
│     └── Dinamicas (3150 features: 50 frames × 63)
├── Builder de frases con auto-add inteligente
├── Detector de movimiento (estatico vs dinamico)
├── Captura de muestras para entrenamiento
└── Suavizado de predicciones (buffer circular 5 frames)

SERVIDOR (Next.js API Routes serverless en Vercel)
├── POST /api/ai/complete  → Groq (correccion de frases LSM → espanol)
├── GET  /api/tts          → Google Translate TTS (proxy CORS)
└── GET  /api/tts/elevenlabs → ElevenLabs TTS (proxy + API key oculta)

NUBE
├── Supabase (PostgreSQL + Auth JWT + RLS + triggers)
├── Groq (inferencia LLM gratuita <1s)
└── ElevenLabs (sintesis neuronal)
```

**No existe backend en Python.** El sistema opera completamente en el navegador para prediccion y entrenamiento. Las unicas piezas server-side son las API routes de Next.js como proxies ligeros.

---

## 4. Estructura del Proyecto

```
Signum/
├── frontend/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Raiz: metadata, fondos 3D, transiciones
│   │   ├── page.tsx                      # Landing: logo, login, registro
│   │   ├── globals.css + styles/         # CSS global y temas
│   │   ├── login/page.tsx                # Login Supabase
│   │   ├── register/page.tsx             # Registro con datos personales
│   │   ├── api/
│   │   │   ├── ai/complete/route.ts      # Proxy Groq (POST)
│   │   │   └── tts/
│   │   │       ├── route.ts              # Proxy Google TTS (GET)
│   │   │       └── elevenlabs/route.ts   # Proxy ElevenLabs (GET)
│   │   └── app/                          # Zona autenticada
│   │       ├── layout.tsx                # Menu lateral, header animado
│   │       ├── page.tsx                  # Pantalla principal (camara + prediction)
│   │       ├── estadisticas/page.tsx     # Metricas de uso
│   │       ├── perfil/page.tsx           # Perfil editable
│   │       ├── ajustes/page.tsx          # Configuracion (TTS, glass, camara)
│   │       ├── acerca-de/page.tsx        # Acerca de
│   │       ├── acerca-de/evaluar/page.tsx # Evaluacion de usabilidad
│   │       └── admin/dashboard/page.tsx  # Dashboard admin
│   ├── src/
│   │   ├── types/index.ts               # Tipos centrales
│   │   ├── lib/
│   │   │   ├── db.ts                     # Abstraccion IndexedDB
│   │   │   ├── supabase.ts               # Cliente Supabase
│   │   │   └── env.ts                    # Variables de entorno tipadas
│   │   ├── services/
│   │   │   ├── mediapipe.service.ts      # Pipeline MediaPipe (init + render loop)
│   │   │   ├── rf-inference.ts           # Predictor Random Forest
│   │   │   ├── rf-trainer.ts             # Entrenador Random Forest
│   │   │   ├── capture-local.service.ts   # Captura de muestras
│   │   │   ├── auth.service.ts           # Auth + perfil Supabase
│   │   │   └── tts.service.ts            # TTS en cascada
│   │   ├── hooks/
│   │   │   ├── use-live-prediction.ts    # Hook principal: camara → prediccion
│   │   │   ├── use-capture.ts            # Captura de muestras
│   │   │   ├── use-phrase-builder.ts     # Construccion de frases
│   │   │   ├── use-motion-detector.ts    # Detector de movimiento
│   │   │   ├── use-model-training.ts     # Entrenamiento desde UI
│   │   │   └── use-tts.ts                # Abstraccion TTS
│   │   └── components/
│   │       ├── camera/CameraFeed.tsx      # Video + canvas overlay
│   │       ├── capture/CaptureStudio.tsx  # Interfaz de captura de muestras
│   │       ├── prediction/
│   │       │   ├── WordOverlay.tsx        # Overlay de prediccion
│   │       │   └── CyberCard.tsx          # Tarjeta de resultado
│   │       ├── layout/
│   │       │   ├── FluidBackground.tsx    # Fondo 3D con shaders
│   │       │   └── PageTransition.tsx     # Animaciones de transicion
│   │       ├── profile/ProfileScreen.tsx
│   │       ├── stats/StatsScreen.tsx
│   │       └── ui/                        # Componentes reutilizables
│   │           ├── LiquidGlass.tsx        # Efecto vidrio liquido
│   │           ├── MenuDrawer.tsx         # Menu lateral
│   │           ├── FlipButton.tsx         # Boton con giro
│   │           ├── NavButton.tsx          # Navegacion estilizada
│   │           ├── PaperContainer.tsx     # Textura papel
│   │           ├── LightPoints.tsx        # Puntos de luz animados
│   │           ├── FramerCarousel.tsx     # Carrusel
│   │           ├── button.tsx / input.tsx / checkbox.tsx / modal.tsx
│   │           └── progress-bar.tsx
│   ├── bd/
│   │   └── supabase-schema.sql           # Esquema completo PostgreSQL
│   ├── public/
│   │   └── models/                       # Modelos JSON pre-entrenados
│   │       ├── modelo_letras.json
│   │       └── modelo_palabras.json
│   ├── package.json
│   ├── tsconfig.json (strict, bundler, path alias @/)
│   ├── next.config.ts
│   ├── postcss.config.mjs                # Tailwind 4 via PostCSS
│   └── vercel.json
├── .kilo/                                # Configuracion CLI Kilo
└── recomendacion.md                      # Documento de estrategia LLM
```

---

## 5. Pipeline de Vision por Computadora

### 5.1 Flujo

```
getUserMedia({ video: 800x600, facingMode: "user" })
  │
  ▼
MediaPipe HandLandmarker (tasks-vision, GPU delegate, WASM)
  ├── 21 landmarks 3D por mano (x, y, z)
  ├── Hasta 2 manos simultaneas
  └── Handedness: "Right" / "Left"
  │
  ▼
Render loop (requestAnimationFrame, 60fps video)
  ├── Dibuja video en canvas (con mirror opcional)
  ├── Detecta manos cada ~60ms (~16fps IA)
  ├── Dibuja landmarks + conexiones + bounding boxes
  ├── Normaliza (traslacion a wrist, escalado por maxDist)
  └── 63 features normalizados [−1, +1] por mano
```

### 5.2 Configuracion de MediaPipe

```
delegate: "GPU"
numHands: 2
runningMode: "VIDEO"
minHandDetectionConfidence: 0.5
minHandPresenceConfidence: 0.5
minTrackingConfidence: 0.5
```

### 5.3 Normalizacion de Landmarks

Traslacion al landmark 0 (wrist) y escalado por la distancia maxima desde el wrist. Esto garantiza invarianza a la posicion y escala de la mano en la imagen.

### 5.4 Suavizado de Predicciones

Buffer circular de 5 predicciones consecutivas por mayoria simple, con umbrales variables segun la modalidad. Elimina fluctuaciones sin latencia perceptible.

---

## 6. Modelos de Machine Learning

### 6.1 Tres Predictores Random Forest en TypeScript

Signum no depende de TensorFlow.js ni ONNX en el cliente. Todo el ML esta implementado en TypeScript puro (~330 lineas entre trainer e inference).

| Modelo | ID IndexedDB | Entrada | Arboles | Profundidad |
|---|---|---|---|---|
| Letras | `rf-letter` | 63 features | 50 | 15 |
| Palabras | `rf-word` | 63 features | 50 | 15 |
| Dinamicas | `rf-dynamic` | 3150 features (50×63) | 50 | 15 |

### 6.2 Algoritmo de Entrenamiento (`rf-trainer.ts`)

1. **Bagging:** bootstrap sampling de los datos de entrenamiento
2. **Feature bagging:** seleccion aleatoria de √n_features por arbol
3. **Criterio de split:** indice de Gini
4. **Busqueda exhaustiva** del mejor punto de corte sobre los valores unicos de cada feature
5. **Construccion recursiva** hasta profundidad maxima o pureza de nodo
6. **Probabilidades por hoja:** proporcion de clases en la hoja terminal

### 6.3 Algoritmo de Inferencia (`rf-inference.ts`)

Recorre cada arbol del ensemble: evalua splits hasta hoja terminal, acumula votos ponderados por probabilidad, retorna clase ganadora y confianza (votos ganadores / total de arboles).

### 6.4 Serializacion

Los modelos se serializan a JSON y se almacenan en IndexedDB. Cada modelo incluye todos los arboles, clases, y metadatos. Tambien existe fallback para cargar modelos pre-entrenados desde `/public/models/`.

---

## 7. Estrategia de Prediccion en Tiempo Real

### 7.1 El hook `useLivePrediction` (832 lineas, nucleo del sistema)

```
handleMediaPipeResult():
  │
  ├─ Persistencia: ultimos 3 frames sin deteccion usan ultimo frame valido
  ├─ Si hay captura activa → feedCaptureFrame()
  ├─ Deteccion de movimiento instantaneo (delta entre frames consecutivos)
  │
  ├─ SIEMPRE predice letras (modelo local rf-letter)
  ├─ SIEMPRE predice palabras (modelo local rf-word)
  │
  ├─ SIEMPRE mantiene buffer dinamico (ultimos 90 frames)
  │     └─ Re-muestreo a 50 frames con interpolacion lineal
  │     └─ Prediccion multi-escala: 30, 45, 60, 75, 90 frames
  │
  ├─ Decision modal:
  │     ├─ Sin movimiento >500ms → estatico
  │     │     ├─ Si letra.confianza > palabra.confianza → emitir letra
  │     │     └─ Si no → emitir palabra
  │     └─ Con movimiento → dinamico (anula letras/palabras)
  │
  └─ setData() actualiza estado React
```

### 7.2 Parametros de Movimiento

| Parametro | Valor | Proposito |
|---|---|---|
| MOTION_THRESHOLD | 0.018 | Umbral de movimiento entre frames |
| MOTION_TIMEOUT_MS | 500 | Tiempo sin movimiento para volver a estatico |
| BUFFER_SIZE | 5 | Frames para suavizado |
| DYNAMIC_FRAMES_PER_SEQUENCE | 50 | Normalizacion de secuencias |

### 7.3 Auto-Captura

Modo opcional que:
1. Espera mano detectada (`waiting_hand`)
2. Espera movimiento significativo (`waiting_motion`, timeout 1500ms)
3. Captura frames durante N segundos (`capturing`)
4. Clasifica todos los modelos simultaneamente (`classifying`)
5. Emite el mejor resultado segun confianza y tipo de movimiento

---

## 8. Captura y Entrenamiento de Muestras

### 8.1 Modos de Captura

| Modo | Muestras | Metodo |
|---|---|---|
| Letras | 50 frames | Automatica frame por frame |
| Palabras | 30 frames | Automatica frame por frame |
| Dinamicas | 5 secuencias | Manual (iniciar/parar por muestra) |

### 8.2 Captura de Senas Dinamicas

```
startManualSample()
  └─ Activa buffer temporal (tempSampleBuffer)

feedCaptureFrame() en cada frame
  └─ Almacena landmarks normalizados

stopManualSample()
  ├─ Cierra buffer temporal
  ├─ Re-muestrea a 50 frames (interpolacion lineal)
  ├─ Aplana: 50 × 63 = 3150 features
  └─ Agrega al array de muestras

Al alcanzar 5 secuencias:
  ├─ Guarda en IndexedDB (db.addSamples)
  ├─ Entrena modelo (trainRandomForest)
  └─ Guarda modelo en IndexedDB (db.saveModel)
```

### 8.3 Re-muestreo de Secuencias

Algoritmo de interpolacion lineal que normaliza cualquier cantidad de frames a exactamente 50, garantizando dimensionalidad fija para el modelo dinamico.

---

## 9. Persistencia

### 9.1 IndexedDB (local, navegador)

Base: `signum` v1

**Store `samples`** — Muestras de entrenamiento con indices `label` y `type`:
```
{ id, label, type ("letter" | "word" | "dynamic"), landmarks: number[], createdAt }
```

**Store `models`** — Modelos Random Forest serializados:
```
{ id ("rf-letter" | "rf-word" | "rf-dynamic"), type, data: RFModel, classes: string[], createdAt }
```

Operaciones: CRUD completo, consultas por etiqueta/tipo, conteo, limpieza, reentrenamiento automatico al eliminar muestras.

### 9.2 Supabase PostgreSQL (nube)

| Tabla | Proposito |
|---|---|
| `usuarios` | Perfil (nombre, apellidos, genero, FK a auth.users) |
| `catalogo_generos` | Hombre, Mujer, Otro |
| `roles` | Administrador, Usuario |
| `usuario_roles` | Asignacion usuario ↔ rol |
| `login` | Registro de sesiones (IP, timestamp) |
| `traducciones` | Historial de traducciones LSM → espanol |
| `avances` | Metricas diarias (traducciones, tiempo, precision) |
| `catalogo_tipo_traduccion` | LSM-TEXTO, TEXTO-VOZ, VOZ-TEXTO |
| `evaluaciones` | Evaluaciones de usabilidad (escala SUS-like) |

### 9.3 LocalStorage (preferencias)

| Clave | Proposito |
|---|---|
| `autoAddActive` | Activar auto-add |
| `autoAddConfidence` | Umbral de confianza (default 55%) |
| `autoAddStableFrames` | Frames consecutivos requeridos (default 6) |
| `preventRepeat` | Evitar letras repetidas consecutivas |
| `ttsProvider` | `native` o `elevenlabs` |
| `ttsRate` / `ttsPitch` | Velocidad y tono TTS nativo |
| `elevenlabsVoiceId` | Voz ElevenLabs seleccionada |
| `glassOpacity` / `glassBorder` | Personalizacion del efecto glass |
| `isCameraMirrored` | Mirror de camara on/off |

---

## 10. Autenticacion y Autorizacion

### 10.1 Supabase Auth

- **Metodo:** email + password con JWT
- **Registro:** `signUp()` envia metadatos (nombre, apellidos, genero)
- **Trigger SQL:** `on_auth_user_created` crea automaticamente perfil en `usuarios` y asigna rol `Usuario`
- **Login:** `signIn()` registra IP y timestamp en tabla `login`
- **Sesion:** gestionada por Supabase client, refresco automatico de token

### 10.2 Row Level Security (RLS)

Todas las tablas tienen RLS activado:
- **Catalogos** (generos, roles, tipos): lectura publica para autenticados
- **Usuarios:** solo ven/editan su propio perfil
- **Login, traducciones, avances:** solo el propietario inserta/lee
- **Evaluaciones:** administrador ve todas, usuarios solo las propias
- **Avances:** politicas separadas para INSERT, SELECT, UPDATE

### 10.3 Control de Acceso en Frontend

- Rutas `/app/*` verifican sesion en el layout, redirigen a `/` si no hay usuario
- Rol `Administrador` desbloquea la ruta `/app/admin/dashboard`
- Boton de `Cerrar sesion` llama a `signOut()` y redirige al landing

---

## 11. API Routes (Next.js Serverless)

### 11.1 Correccion de Frases con Groq

**`POST /api/ai/complete`**

```
Modelo:   meta-llama/llama-4-scout-17b-16e-instruct
Prompt:   Convierte glosas LSM a espanol mexicano natural.
          Solo agrega articulos, preposiciones, conjugaciones y puntuacion.
          NO inventes contenido.
Temp:     0.2
Tokens:   200 max
Latencia: <1s tipico en Groq
Costo:    Gratuito (Groq free tier)
Seguridad: GROQ_API_KEY solo en .env.local (server-side)
```

### 11.2 TTS via Google Translate

**`GET /api/tts?text=...&lang=es`**

Proxy server-side a `translate.google.com/translate_tts`. Evita CORS. User-Agent simulado como Chrome. Cache HTTP de 24h.

### 11.3 TTS via ElevenLabs

**`GET /api/tts/elevenlabs?text=...&voice_id=...&model_id=eleven_multilingual_v2`**

26 voces disponibles. Parametros: stability=0.5, similarity_boost=0.75, speaker_boost=true. Fallback silencioso a TTS nativo si la API key no esta configurada o se agotan los creditos.

---

## 12. Texto a Voz (Estrategia en Cascada)

```
speak(text)
  │
  ├─ proveedor = "elevenlabs"?
  │   └─ Si → speakElevenlabs() ──── exito? → fin
  │                                  └─ fallo → continuar
  │
  ├─ speakWithNativeAPI(text)
  │     ├─ Busca voz es-MX → es-* → primera disponible
  │     ├─ Polling de voiceschanged (timeouts 50ms → 2.5s)
  │     ├─ Fix Chrome: resume() si synth esta pausado
  │     ├─ Timeout de seguridad: 8s
  │     └─ exito? → fin
  │         fallo → continuar
  │
  └─ speakOnline(text)
        └─ Google Translate TTS via /api/tts
```

---

## 13. Correccion de Frases con LLM

### 13.1 Estrategia: Boton Manual

El LLM **no** se ejecuta automaticamente tras cada sena. Hay un boton "Corregir con IA" que el usuario presiona cuando termina de senar. Se inhabilita si la frase tiene menos de 3 caracteres.

**Motivo:** En LSM el orden de palabras no coincide con el espanol. El autocompletado frame por frame generaria alucinaciones sobre frases incompletas.

### 13.2 Prompt de Sistema

```
Eres un asistente de lengua de senas mexicana (LSM).
Recibes una secuencia de palabras en notacion "gloss" (palabras sueltas sin gramatica).
Tu tarea es convertirla a espanol mexicano natural y fluido.

REGLAS ESTRICTAS:
1. SOLO agrega articulos, preposiciones, conjugaciones, conectores y puntuacion.
2. NO inventes contenido, conceptos ni palabras que no esten en la frase original.
3. NO agregues saludos, despedidas ni formulas de cortesia.
4. Si la frase ya es gramaticalmente correcta, devuelvela identica.
5. RESPONDE UNICAMENTE con la frase completada. Sin explicaciones, sin markdown.
```

---

## 14. Interfaz de Usuario

### 14.1 Diseno Visual

- **Tema:** Oscuro futurista, glassmorphism con fondo 3D animado
- **Fondo:** Shader 3D en tiempo real (Three.js + React Three Fiber + shadergradient)
- **Efecto glass:** Vidrio esmerilado con filtro SVG (feTurbulence + feDisplacementMap), opacidad y borde ajustables por el usuario
- **Tipografia:** Geist Sans + Geist Mono (fuentes de Vercel)
- **Animaciones:** SVG animado del titulo SIGNUM (drawText + fillText), transiciones con Framer Motion
- **Colores:** Azul profundo (#0f3a73), acentos verde (#4ade80) y azul (#60a5fa) para manos

### 14.2 Navegacion

- Landing page con logo, login y registro
- Menu lateral (MenuDrawer) en zona autenticada
- Header con titulo animado que cambia segun la seccion
- Navegacion: Traductor / Estadisticas / Perfil / Ajustes / Acerca de (+ Evaluar) / Dashboard (admin)

### 14.3 Funcionalidades Clave de UI

- Camara con overlay de prediccion y bounding boxes por mano
- Selector de modo (letras/palabras/dinamicas)
- Panel de frase con botones: Espacio, Agregar, Borrar, Corregir con IA, Hablar
- Toggle de mirror, auto-add, anti-repeticion
- Indicador de confianza en tiempo real
- Barras de progreso para captura de muestras
- Feedback visual: WebSocket conectado, modelo cargado, camara activa

---

## 15. Patrones de Diseno y Decisiones

| Decision | Justificacion |
|---|---|
| **ML en el navegador (IndexedDB)** | Cero latencia de red, funciona offline, sin costo de servidor |
| **Random Forest propio en TS** vs TensorFlow.js | ~330 lineas, <5KB serializado, sin dependencia WASM extra, mas rapido para arboles pequenos |
| **3 modelos separados** | Cada modalidad tiene dimensionalidades y comportamientos distintos |
| **Buffer de suavizado de 5 frames** | Elimina ruido de predicciones sin latencia perceptible |
| **Re-muestreo a 50 frames** | Normaliza secuencias de duracion variable para entrada de dimensionalidad fija |
| **Normalizacion por wrist** | Invariante a posicion y escala de la mano |
| **Deteccion de movimiento para conmutar** | Evita que letras compitan con dinamicas cuando hay gesto en movimiento |
| **API routes Next.js como proxy** | Oculta API keys (GROQ, ELEVENLABS), evita CORS, unifica en un solo proyecto |
| **TTS en cascada** | Maxima calidad cuando disponible, fallback garantizado |
| **Auto-add con umbral de estabilidad** | Evita falsos positivos en el builder de frases |
| **Boton manual de IA** | Previene alucinaciones del LLM sobre frases incompletas |
| **Glass personalizable** | El usuario ajusta opacidad y borde segun preferencia |
| **Supabase RLS + triggers** | Seguridad a nivel base de datos, creacion automatica de perfil |

---

## 16. Base de Datos (Esquema Supabase)

### 16.1 Diagrama Relacional

```
auth.users ──< usuarios ──< usuario_roles >── roles
                  │
                  ├──< login
                  ├──< traducciones >── catalogo_tipo_traduccion
                  ├──< avances
                  └──< evaluaciones

catalogo_generos ──< usuarios
```

### 16.2 Trigger de Registro

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id_usuario, nombre, apellido_paterno,
    apellido_materno, correo, id_genero)
  VALUES (NEW.id, ...);

  INSERT INTO public.usuario_roles (id_usuario, id_rol)
  VALUES (NEW.id, 2); -- Usuario por defecto

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 17. Despliegue

| Componente | Plataforma | Configuracion |
|---|---|---|
| Frontend | Vercel | `vercel.json`: build `npx next build`, output `.next` |
| Base de datos | Supabase | PostgreSQL 15, RLS, triggers |
| Auth | Supabase Auth | JWT, email/password |
| LLM | Groq Cloud | API key server-side |
| TTS neuronal | ElevenLabs | API key server-side |

### Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GROQ_API_KEY            (solo server)
ELEVENLABS_API_KEY       (solo server)
```

---

## 18. Metricas del Proyecto

| Metrica | Valor |
|---|---|
| Archivos TypeScript/TSX | ~37 |
| Lineas de codigo (estimado) | ~5,500 |
| Componentes React | ~20 |
| Hooks personalizados | 6 |
| Servicios | 6 |
| API Routes | 3 |
| Modelos ML | 3 Random Forest |
| Tablas PostgreSQL | 9 |
| Voces ElevenLabs disponibles | 26 |
| Modos de reconocimiento | 3 (letras, palabras, dinamicas) |

---

*Reporte generado del analisis completo del repositorio Signum. Julio 2026.*
