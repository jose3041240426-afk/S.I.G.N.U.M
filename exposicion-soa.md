---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section { font-size: 26px; }
  section.lead { text-align: center; }
  section.lead h1 { font-size: 52px; }
  h1 { font-size: 38px; color: #3b82f6; }
  h2 { font-size: 30px; color: #1e40af; }
  h3 { font-size: 26px; }
---

<!-- _class: lead -->

# **SIGNUM**
### Sistema de Reconocimiento de Lengua de Señas Mexicana

## Exposición: Aplicaciones Web Orientadas a Servicios

---

# **El Problema**

<br>

- **2.3 millones** de personas con discapacidad auditiva en México
- Solo **~5,000** intérpretes certificados de LSM
- Las apps existentes de traducción LSM requieren hardware especializado
- No existe una plataforma **colaborativa** donde la comunidad pueda entrenar y compartir modelos

<br>

### **SIGNUM resuelve esto con una arquitectura SOA desde cero**

---

# **Visión General de SIGNUM**

<br>

- Traducción de señas en **tiempo real** usando cámara del dispositivo
- **Inferencia 100% local**: MediaPipe + Random Forest en JavaScript puro
- **Colaborativo**: usuarios pueden subir muestras y entrenar modelos compartidos
- **Multidispositivo**: app web + app móvil nativa (Expo)
- **3 tipos de señas**: letras, palabras estáticas y señas dinámicas

<br>

> La predicción funciona **sin conexión a internet**

---

<!-- _class: lead -->

# **Arquitectura Orientada a Servicios**

![height:500px](https://kroki.io/d2svg/s/eNrFlE1zmzAQhu_6FRofOoNwYufQSR-QHjstPaCOF7BAXRytkM2X_76CpBxbNHadDPWYHaQHvfuuta8lsSQ5ggAJ4IB8oUIyhVq-0xw5JkAMtIC0IG_gAITU62NkZTySVk5dJZZZ3aiSeOHGSZYurBMLyCtdgVVNKAA5r4q7OpmXxec6cX4kvLJGdIXVKdKYR3isSooCkVkq3fEhTfC3LTvxS9cbbGyobt1ClQpeNsnWoM56wzUF-psvKa3UqnSNy27o8kIRsZ7oAFLGNJk_4cWWsxkHBPyEITMfCEgs9gRUmBG6wbLgWB-F8UqiRDm4l3jjxRl0T2W2o2H4kYC-_g6sVi7gvqBL6itksBD2nB31mDPW-J_wUBO3m_wV1vCneCwImNOF-OhVc0BXBNmHYZq9aAWCi02L6o5bFgRkgtN1cjwj_iBIoOYQ7ltNdfd8NNVetdVpqpN-okveGF68xtfz5GMilcQSwJ8Fz4HSShpDDjTnmcEwAM5zOjCSRS9yTlj6QtX9k4tSxJmEutl_1W-k6eW3QVotV-VytS3SGF1nmYJNiImCYlSfR4UT7sbmzE4Jj3vNy2Tql_QlBT-P8G8WqI37do7lnDdRRN_yJtm24TBcX4U8ORuB5jf-2_pn8b-AbqF9SFsT0FIZILbJ9NfxVKM_ZdthV8di-vu5uf_AnGOZFa-umI51dn3j37yWk3Pn86nsfuObHEyxrkC3TCkKbskPNAqMbYJfnm1KuG1OJBcSiVzWNLCJejWJ-5jhmkKyfBuFE-JMFDPBMTNfAW5gHhh-hp22Qw8fAJYxjkJrtPv3J_mLA80HdHFFhLkNrPnUhoInQC4rGX2ktUSGfqWF_XGYG89w8NBYHBAOll3UHVcdF2Z0TfOYHusY2SdnCq9Nn3wEptu4rC2KxmRQ9M2_Z9YTb9UsHbx1lbO-u3UfQh_b2fiHzZ0YrCu32QOIGv82_Tc3vwU61TZv)

---

# **Servicio 1: Frontend Web (Next.js)**

<br>

| Aspecto | Detalle |
|---|---|
| **Framework** | Next.js 16 + React 19 |
| **Hosting** | Vercel (serverless) |
| **Cámara** | `getUserMedia` + MediaPipe Tasks-Vision CDN |
| **Inferencia** | RandomForest en JS puro (cliente) |
| **TTS** | Web Speech API + ElevenLabs (proxy servidor) |
| **Almacenamiento** | IndexedDB local |
| **API Routes** | POST `/api/ai/complete`, GET `/api/tts/elevenlabs` |

<br>

- La app web es un **servicio independiente** que corre 100% en el navegador
- No depende del ML Service ni de la app móvil para funcionar

---

# **Servicio 2: App Móvil (Expo/React Native)**

<br>

| Aspecto | Detalle |
|---|---|
| **Framework** | Expo SDK 54 + React Native 0.81 |
| **Plataformas** | iOS + Android |
| **Cámara** | WebView con HTML de MediaPipe embebido |
| **Inferencia** | RandomForest JS puro |
| **TTS** | expo-speech nativo |
| **Almacenamiento** | expo-sqlite local (WAL mode) |
| **Auth** | Supabase JWT con AsyncStorage |

<br>

- Misma lógica de predicción que el frontend, implementación nativa distinta
- Compatible con los mismos modelos RF

---

# **Servicio 3: ML Service (Express)**

<br>

| Aspecto | Detalle |
|---|---|
| **Runtime** | Node.js + Express 4 |
| **Puerto** | 8000 |
| **Hosting** | Render |
| **Endpoints** | `GET /ml/health`, `POST /ml/train` |

<br>

**POST /ml/train** — Entrena un Random Forest colaborativo:
1. Lee muestras de Supabase (`muestras_entrenamiento`)
2. Split 80/20 train/test
3. Entrena RF (50 árboles, profundidad 15)
4. Evalúa: accuracy, precision, recall, F1, matriz de confusión
5. Sube modelo a Supabase Storage (`bucket modelos`)
6. Versiona: `letter_v3`, `word_v5`, `dynamic_v2`

---

# **Servicio 4: Supabase (Backend-as-a-Service)**

<br>

| Capa | Descripción |
|---|---|
| **Auth** | Email/password con JWT |
| **Base de datos** | PostgreSQL con esquema relacional |
| **Storage** | S3-compatible (`bucket modelos`) |
| **RLS** | Row Level Security en todas las tablas |
| **Triggers** | Auto-crear perfil al registrarse |

<br>

**Tablas principales**: `usuarios`, `traducciones`, `avances`, `muestras_entrenamiento`, `modelos`

Supabase actúa como **servicio de datos central** compartido por todos los clientes

---

# **Servicios Externos**

<br>

### **Groq** (LLM)
```
POST https://api.groq.com/openai/v1/chat/completions
Modelo: Llama 4 Scout 17B
Propósito: completar frases (gloss → español natural)
Proxy: API key oculta en servidor Next.js
```

<br>

### **ElevenLabs** (TTS)
```
GET https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
Modelo: eleven_multilingual_v2
Propósito: voz natural para frases completadas
Proxy: API key oculta en servidor Next.js
```

---

<!-- _class: lead -->

# **CRITERIO 1**
# Autonomía del Servicio
### Peso: 25%

---

# **Autonomía del Servicio**

<br>

> Cada servicio puede ejecutarse y desplegarse de forma independiente, sin depender del código interno o del proceso del otro.

<br>

| Servicio | ¿Funciona solo? | Evidencia |
|---|---|---|
| **Frontend Web** | ✅ | Inferencia local, sin backend obligatorio |
| **App Móvil** | ✅ | Misma inferencia local, SQLite local |
| **ML Service** | ✅ | Lee de Supabase, no del frontend |
| **Supabase** | ✅ | Gestionado externamente, no acoplado al código |

<br>

**Ningún servicio comparte código entre sí: cada uno tiene su propio repositorio lógico (`frontend/`, `mobile/`, `ml-service/`)**

---

# **Autonomía del Servicio — Evidencia**

<br>

### Prueba de independencia:

1. **Frontend sin ML Service**: la predicción es local, no requiere el server. Solo no hay modelos colaborativos.
2. **Frontend sin Supabase**: la cámara y predicción siguen funcionando. Solo no se persisten traducciones ni hay login.
3. **Mobile sin backend**: igual que el frontend, todo es local.
4. **ML Service sin frontend**: se puede invocar con `curl POST /ml/train` → entrena, evalúa y sube a Supabase. No necesita que ningún cliente esté activo.

```bash
# ML Service funciona de forma totalmente autónoma
curl -X POST http://localhost:8000/ml/train \
  -H "Content-Type: application/json" \
  -d '{"type": "letter", "activate": true}'
```

---

<!-- _class: lead -->

# **CRITERIO 2**
# Contrato de Servicio Bien Definido
### Peso: 20%

---

# **Contrato: Frontend API Routes**

<br>

### `POST /api/ai/complete`
```
Request:  { "phrase": "yo comer manzana" }
Response: { "completed": "Yo como una manzana." }
```
- Entrada: frase en notación "gloss" (secuencia de palabras sin gramática)
- Salida: frase corregida en español mexicano natural
- Modelo: `meta-llama/llama-4-scout-17b-16e-instruct`, temp 0.2, max_tokens 200

<br>

### `GET /api/tts/elevenlabs?text={}&voice_id={}`
```
Parámetros: text (string, máx 500 chars), voice_id (whitelist)
Response:   audio/mpeg binario
```
- Valida `voice_id` contra whitelist del tier gratuito
- Si falla, el frontend usa Web Speech API como fallback

---

# **Contrato: ML Service API**

<br>

### `POST /ml/train`
```json
// Request
{
  "type": "letter" | "word" | "dynamic",
  "hyperparams": { "nTrees": 50, "maxDepth": 15, "minSamplesLeaf": 2 },
  "activate": false
}
```
```json
// Response
{
  "success": true,
  "version": "letter_v3",
  "type": "letter",
  "metrics": {
    "accuracy": 0.85, "precisionAvg": 0.83,
    "recallAvg": 0.81, "f1Score": 0.82
  },
  "samples": { "total": 120, "train": 96, "test": 24 },
  "modelSummary": { "nTrees": 50, "nFeatures": 63, "classes": ["A","B","C"] }
}
```

<br>

### `GET /ml/health`
```json
{ "status": "ok", "service": "signum-ml-service", "uptime": 123.4 }
```

---

# **Contrato: Supabase**

<br>

### Tabla `muestras_entrenamiento` (datos de entrenamiento)
```sql
id_muestra SERIAL PRIMARY KEY,
id_usuario UUID REFERENCES auth.users,
tipo TEXT CHECK (tipo IN ('letter','word','dynamic')),
etiqueta TEXT NOT NULL,
landmarks JSONB NOT NULL,   -- [63 floats] normalizados
created_at TIMESTAMPTZ DEFAULT now()
```

### Tabla `modelos` (metadatos de modelos)
```sql
id_modelo SERIAL PRIMARY KEY,
tipo TEXT NOT NULL,
version TEXT NOT NULL UNIQUE,     -- "letter_v3"
storage_path TEXT NOT NULL,       -- ruta en Supabase Storage
accuracy NUMERIC(5,4),
n_trees INTEGER, n_features INTEGER,
clases TEXT[],
activo BOOLEAN DEFAULT false
```

---

<!-- _class: lead -->

# **CRITERIO 3**
# Bajo Acoplamiento
### Peso: 10%

---

# **Bajo Acoplamiento**

<br>

> La comunicación entre servicios debe darse únicamente a través de su interfaz pública.

| Par de servicios | Acoplamiento | Canal |
|---|---|---|
| **Frontend ↔ Supabase** | Solo SDK público | HTTPS + JWT |
| **Mobile ↔ Supabase** | Solo SDK público | HTTPS + JWT |
| **ML Service ↔ Supabase** | Solo SDK público | HTTPS + SRK |
| **Frontend ↔ Groq** | Solo body JSON | Proxy Next.js |
| **Frontend ↔ ML Service** | No hay comunicación directa | — |

<br>

- **Los clientes nunca consultan al ML Service** para predecir; la inferencia es local
- **El ML Service nunca consulta a los clientes**; solo lee/escribe Supabase
- **No hay shared state, código compartido ni dependencias circulares**

---

# **Bajo Acoplamiento — Evidencia en Código**

<br>

### Frontend no importa nada del ML Service:
```typescript
// frontend/src/services/rf-inference.ts
// RandomForestPredictor corre ENTERAMENTE en el navegador
// No hace fetch al ML Service
// La URL "ws://localhost:8000/ws/predict" es un fallback inactivo
// que ni siquiera tiene endpoint implementado en ml-service
```

### ML Service no importa nada del frontend:
```javascript
// ml-service/src/server.js
// Lee de supabase directamente con SERVICE_ROLE_KEY
const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
// No tiene ruta que reciba landmarks del frontend
```

---

<!-- _class: lead -->

# **CRITERIO 4**
# Mecanismo de Seguridad entre Servicios
### Peso: 10%

---

# **Seguridad — Autenticación**

<br>

### Supabase Auth (JWT)
- Registro/login con email y contraseña
- JWT gestionado automáticamente por `@supabase/supabase-js`
- **Frontend**: sesión en localStorage del navegador
- **Mobile**: sesión en AsyncStorage (RN)

```typescript
// Login: JWT generado y adjuntado a todas las requests
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});
// El SDK automáticamente incluye Authorization: Bearer <jwt>
```

### ML Service — Autenticación server-to-server
```javascript
// Usa SERVICE_ROLE_KEY para bypass RLS
// No requiere login de usuario
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
```

---

# **Seguridad — Autorización (RLS)**

<br>

Todas las tablas de Supabase tienen **Row Level Security**:

| Tabla | Política |
|---|---|
| `usuarios` | Solo ver/editar tu propio perfil |
| `traducciones` | Solo insertar/ver las tuyas |
| `muestras_entrenamiento` | Insertar tuyas, ver todas |
| `modelos` | Ver todos (auth), modificar solo admin/service_role |
| `evaluaciones` | Insertar tuya, admin ve todas |

<br>

```sql
-- Ejemplo de política RLS en muestras_entrenamiento
CREATE POLICY "Usuarios insertan sus muestras"
  ON muestras_entrenamiento FOR INSERT
  WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Usuarios leen todas las muestras"
  ON muestras_entrenamiento FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

# **Seguridad — Protección de API Keys**

<br>

| Clave | Dónde vive | ¿Expuesta? |
|---|---|---|
| `GROQ_API_KEY` | `.env.local` → servidor Next.js | ❌ No — proxy server-side |
| `ELEVENLABS_API_KEY` | `.env.local` → servidor Next.js | ❌ No — proxy server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | `ml-service/.env` → Render | ❌ No — solo server |
| `EXPO_PUBLIC_GROQ_API_KEY` | `.env` → bundle app | ⚠️ **Sí** (trade-off aceptado) |

<br>

**Estrategia de proxy en Next.js**:
```typescript
// app/api/ai/complete/route.ts
export async function POST(req: Request) {
  const { phrase } = await req.json();
  const response = await fetch("https://api.groq.com/...", {
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
  });
  return Response.json(await response.json());
}
// La API key NUNCA llega al navegador
```

---

# **Seguridad — Manejo de fallos de autenticación**

<br>

### Frontend (`auth.service.ts`)
```typescript
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Invalid login")) {
      throw new Error("Credenciales inválidas");
    }
    if (error.status === 429) {
      throw new Error("Demasiados intentos. Espera unos minutos.");
    }
    throw error;
  }
  return data.user;
}
```

- Errores específicos para cada caso de fallo
- Rate limiting de Supabase (HTTP 429) manejado explícitamente
- Middleware de seguridad: CSP, HSTS, X-Frame-Options, XSS Protection

---

<!-- _class: lead -->

# **CRITERIO 5**
# Recursos y Calidad de la Exposición
### Peso: 10%

---

<!-- _class: lead -->

# **Diagrama de Arquitectura**
### Dirección real de la comunicación entre servicios

![height:500px](https://kroki.io/d2svg/s/eNrFlE1zmzAQhu_6FRofOoNwYufQSR-QHjstPaCOF7BAXRytkM2X_76CpBxbNHadDPWYHaQHvfuuta8lsSQ5ggAJ4IB8oUIyhVq-0xw5JkAMtIC0IG_gAITU62NkZTySVk5dJZZZ3aiSeOHGSZYurBMLyCtdgVVNKAA5r4q7OpmXxec6cX4kvLJGdIXVKdKYR3isSooCkVkq3fEhTfC3LTvxS9cbbGyobt1ClQpeNsnWoM56wzUF-psvKa3UqnSNy27o8kIRsZ7oAFLGNJk_4cWWsxkHBPyEITMfCEgs9gRUmBG6wbLgWB-F8UqiRDm4l3jjxRl0T2W2o2H4kYC-_g6sVi7gvqBL6itksBD2nB31mDPW-J_wUBO3m_wV1vCneCwImNOF-OhVc0BXBNmHYZq9aAWCi02L6o5bFgRkgtN1cjwj_iBIoOYQ7ltNdfd8NNVetdVpqpN-okveGF68xtfz5GMilcQSwJ8Fz4HSShpDDjTnmcEwAM5zOjCSRS9yTlj6QtX9k4tSxJmEutl_1W-k6eW3QVotV-VytS3SGF1nmYJNiImCYlSfR4UT7sbmzE4Jj3vNy2Tql_QlBT-P8G8WqI37do7lnDdRRN_yJtm24TBcX4U8ORuB5jf-2_pn8b-AbqF9SFsT0FIZILbJ9NfxVKM_ZdthV8di-vu5uf_AnGOZFa-umI51dn3j37yWk3Pn86nsfuObHEyxrkC3TCkKbskPNAqMbYJfnm1KuG1OJBcSiVzWNLCJejWJ-5jhmkKyfBuFE-JMFDPBMTNfAW5gHhh-hp22Qw8fAJYxjkJrtPv3J_mLA80HdHFFhLkNrPnUhoInQC4rGX2ktUSGfqWF_XGYG89w8NBYHBAOll3UHVcdF2Z0TfOYHusY2SdnCq9Nn3wEptu4rC2KxmRQ9M2_Z9YTb9UsHbx1lbO-u3UfQh_b2fiHzZ0YrCu32QOIGv82_Tc3vwU61TZv)

---

# **Demostración en Vivo**

<br>

### Plan de demostración:
1. **Registro/Login** en Supabase Auth
2. **Cámara activa** — MediaPipe detecta la mano en tiempo real
3. **Predicción local** — Random Forest clasifica letra/palabra/seña
4. **Auto-añadir** — la letra se agrega a la frase
5. **Completar frase** — Groq convierte gloss a español natural
6. **TTS** — ElevenLabs reproduce la frase

<br>

### Video alternativo preparado por si algo falla

---

<!-- _class: lead -->

# **CRITERIO 6**
# Defensa Técnica
### Peso: 25%

---

# **¿Por qué inferencia local y no en servidor?**

<br>

| Enfoque | Latencia | Offline | Escalabilidad | Privacidad |
|---|---|---|---|---|
| **Inferencia en servidor** | 200-500ms por frame | ❌ No funciona sin red | Requiere servidor GPU | Landmarks salen del dispositivo |
| **Inferencia local (SIGNUM)** | <5ms por frame | ✅ Funciona sin internet | Escala con cada dispositivo | Datos nunca salen |

<br>

- 63 floats × 30 fps × N usuarios = inviable en servidor
- MediaPipe corre en GPU del navegador vía WebGL/WASM
- Modelo RandomForest pesa pocos KB, se entrena en <1 segundo
- Solo se suben muestras a Supabase cuando el usuario decide colaborar

---

# **¿Por qué 4 servicios separados?**

<br>

| Decisión | Justificación |
|---|---|
| **Frontend ≠ Mobile** | Diferentes APIs de cámara, TTS, almacenamiento local. Comparten inferencia pero no UI. |
| **ML Service separado** | El entrenamiento colaborativo requiere leer toda la base de datos (costoso). No debe bloquear a los clientes. |
| **Supabase como BaaS** | PostgreSQL gestionado con Auth y Storage integrado. Evita montar y mantener un servidor de base de datos propio. |
| **Groq/ElevenLabs externos** | LLMs requieren GPU especializada. Más barato y rápido usar APIs existentes que hostear modelos. |

<br>

> Separamos lo que escala distinto, lo que falla distinto y lo que evoluciona distinto.

---

# **¿Qué pasa si un servicio deja de estar disponible?**

<br>

| Servicio caído | Impacto | ¿El sistema sigue funcionando? |
|---|---|---|
| **Supabase** | Sin login, sin historial, sin modelos colaborativos | ✅ Sí — cámara y predicción local intactas |
| **ML Service** | Sin entrenamiento colaborativo | ✅ Sí — entrenamiento local sigue disponible |
| **Groq API** | Sin completar frases con IA | ✅ Sí — el fraseador manual y TTS nativo siguen |
| **ElevenLabs API** | Sin voz premium | ✅ Sí — Web Speech API / expo-speech como fallback |
| **Vercel (hosting web)** | App web inaccesible | ⚠️ La app web no carga; la app móvil sigue al 100% |

<br>

> **La inferencia de señas —la funcionalidad crítica— nunca depende de un servidor externo.**

---

<!-- _class: lead -->

# **¿Por qué Random Forest y no Red Neuronal?**

<br>

## Random Forest (elegido)

| Ventaja | Detalle |
|---|---|
| **Velocidad de entrenamiento** | <1 segundo en JS, viable en navegador y móvil |
| **Tamaño del modelo** | Pocos KB serializado como JSON |
| **Inferencia** | O(N_trees × depth), ~50k operaciones por predicción |
| **Sin dependencias** | JS puro, no requiere TensorFlow.js, ONNX ni WASM extra |
| **Interpretabilidad** | Feature importance por Gini, comprensible |

<br>

## Red Neuronal (descartada)
- Requiere TensorFlow.js o ONNX runtime (~2 MB extra)
- Entrenamiento lento en navegador, inviable en móvil
- Modelo más pesado, no aporta mejora significativa con 63 features
- Overkill para este dominio (clasificación de landmarks espaciales)

---

# **Seguridad: Decisiones de Diseño**

<br>

| Decisión | ¿Por qué? |
|---|---|
| **JWT + RLS** | Cada usuario solo accede a sus datos. Las políticas viven en la DB, no en el código de la app. |
| **Proxy server-side** | Las API keys de Groq y ElevenLabs nunca se exponen al navegador. |
| **SERVICE_ROLE_KEY** | El ML Service necesita leer todas las muestras para entrenar. Bypassea RLS de forma controlada. |
| **Whitelist de voces TTS** | Evita que un atacante use el proxy para consumir voces premium fuera del tier gratuito. |
| **Triggers SQL** | `handle_new_user()` auto-crea el perfil al registrarse. La lógica vive en la DB, no en el código. |
| **Content-Security-Policy** | Previene XSS. `frame-ancestors 'self'` evita clickjacking. |

---

# **Autonomía: ¿está garantizada realmente?**

<br>

### Prueba de autonomía real:

```
1. Detener el ML Service (kill process)
   → Frontend y Mobile siguen prediciendo normalmente ✅
   → Solo se pierde el endpoint POST /ml/train ⚠️

2. Detener Supabase (simular caída de red)
   → Cámara + predicción local funcionan ✅
   → Login no disponible, datos no se persisten ⚠️

3. Detener Groq API
   → El botón "Completar frase" falla
   → Web Speech API sigue funcionando para TTS ✅
   → expo-speech nativo en mobile sigue funcionando ✅

4. Detener Vercel (frontend web caído)
   → La app móvil de Expo sigue 100% funcional ✅
```

> **No hay single point of failure para la funcionalidad principal.**

---

# **Contratos: Interfaz pública estricta**

<br>

Todos los servicios se comunican exclusivamente mediante **interfaces públicas documentadas**:

| Servicio | Interfaz pública | Sin acceso a |
|---|---|---|
| **Frontend** | API routes (HTTP POST/GET) | Código del ML Service |
| **Mobile** | Supabase SDK + API Groq directa | Código del frontend web |
| **ML Service** | Endpoints REST (HTTP POST/GET) | Variables de entorno de los clientes |
| **Supabase** | PostgreSQL + Storage + Auth (SDK) | Lógica de negocio de ningún cliente |

```typescript
// Ejemplo: el frontend NO sabe cómo entrena el ML Service
// Solo conoce el contrato del modelo RF serializado
const model = await db.getModel("rf-letter");
rfLetter.current.loadFromModel(model.data);
```

---

# **Bajo Acoplamiento — ¿Puede un servicio cambiar sin romper otros?**

<br>

### Escenarios de cambio independiente:

| Cambio | Servicios afectados | ¿Rompe a otros? |
|---|---|---|
| Cambiar UI del frontend (Tailwind → CSS Modules) | Solo frontend web | ❌ No |
| Cambiar TTS de expo-speech a otra librería | Solo mobile | ❌ No |
| Cambiar RF hyperparámetros en ML Service | Solo ML Service | ❌ No (el contrato es el modelo JSON) |
| Agregar tabla a Supabase | Solo Supabase | ❌ No (clientes consultan por nombre de tabla) |
| Migrar ML Service de Express a Fastify | Solo ML Service | ❌ No (contrato REST no cambia) |

<br>

> **El contrato es el modelo JSON serializado y los endpoints REST. Mientras eso no cambie, cada servicio evoluciona libremente.**

---

<!-- _class: lead -->

# **Conclusión**

<br>

## SIGNUM cumple con los 6 criterios SOA:

<br>

| Criterio | Peso | Cumplimiento |
|---|---|---|
| Autonomía del servicio | 25% | ✅ 4 servicios independientes, 0 código compartido |
| Contrato bien definido | 20% | ✅ API REST + esquema SQL públicos |
| Bajo acoplamiento | 10% | ✅ Solo comunicación vía interfaz pública |
| Seguridad entre servicios | 10% | ✅ JWT + RLS + API key proxy + CSP |
| Recursos de exposición | 10% | ✅ Diagrama + demo en vivo + video backup |
| Defensa técnica | 25% | ✅ Decisiones justificadas, tolerancia a fallos |

---

<!-- _class: lead -->

# **¿Preguntas?**

<br>

### Gracias

<br>

> "Conecta con el mundo usando Lengua de Señas Mexicana."
