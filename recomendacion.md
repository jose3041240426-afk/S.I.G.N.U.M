# Plan de Arquitectura Distribuida — Signum (100% Gratis)

## Resumen del proyecto

Signum es un traductor de Lengua de Señas Mexicana (LSM) a texto y voz, ejecutado completamente en el navegador. Usa **MediaPipe Hands** para detectar 21 puntos de referencia de la mano (63 coordenadas en total) y un **Random Forest** implementado en JavaScript puro para clasificar letras, palabras y señas dinámicas del abecedario mexicano. La interfaz está construida con **Next.js 16**, **React 19** y **TypeScript**. La autenticación y base de datos corren en **Supabase** (free tier). La síntesis de voz usa **Web Speech API** (nativa del navegador) y el completado de oraciones LSM a español natural se hace mediante la API gratuita de **Groq** con Llama 4 Scout.

## Tecnologías actuales

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.2.6 | Framework web (App Router) |
| React | 19.2.4 | UI |
| TypeScript | 5 | Tipado |
| MediaPipe Tasks-Vision | 0.10.35 | Detección de manos (WASM) |
| Supabase | 2.110.1 | Auth + PostgreSQL + Storage + Realtime |
| Groq (Llama 4 Scout) | — | Completado de oraciones |
| Tailwind CSS | 4 | Estilos |
| Framer Motion | 12.42.2 | Animaciones |
| Three.js / React Three Fiber | — | Efectos 3D decorativos |

---

## Arquitectura Definitiva (Optimizada y Gratuita)

```
[ NAVEGADOR (100% Tiempo Real) ]
├── Next.js UI (React 19)
├── MediaPipe WASM (Captura 63 landmarks)
├── Random Forest JS (Inferencia local instantánea)
├── IndexedDB (Caché de frases de Groq + Modelo .json local de respaldo)
└── Web Speech API (Voz local gratuita)
        │
        │ (REST)  ↓ Subir muestras para entrenar / Descargar nuevo modelo
        ▼
[ BACKEND SERVIDORES (Tareas pesadas asíncronas) ]
├── Vercel Serverless (API)
│   └── /api/ai/complete → Groq (Llama 3 8B) [Completado de oraciones]
├── ML Service en Render Free (REST, no WebSocket)
│   └── /ml/train → Recibe muestras, entrena Random Forest, devuelve .json
└── Supabase Free
    ├── Auth + PostgreSQL (Perfiles, metadatos de modelos, métricas)
    ├── Storage (modelos_v1.json, modelo_v2.json... y datasets colaborativos)
    └── Realtime (Solo para notificar al frontend: "Nuevo modelo disponible")
```

---

## Por qué inferencia local y no remota

Enviar 63 coordenadas por WebSocket 16 veces por segundo a Render es un error:

- **Inferencia JS**: < 5ms (instantáneo en el navegador)
- **Viaje de ida y vuelta por internet**: 100ms-300ms → lag visible
- **Cold starts de Render**: pueden tardar hasta 60 segundos (no 5s)

**Decisión**: mantener MediaPipe + Random Forest en el navegador para tiempo real cero latencia. Mover solo el **entrenamiento** al servidor (tarea asíncrona que bloquearía la UI).

---

## Tabla de Responsabilidades

| Tarea | Dónde se ejecuta | Por qué |
|---|---|---|
| Captura de Cámara y Landmarks | Navegador | MediaPipe usa WebGL/WASM, ultra eficiente, no envía video por la red |
| Inferencia (Predicción) | Navegador | Latencia CERO. El usuario ve la letra/palabra al instante |
| Entrenamiento de Modelo | Render Free | El entrenamiento bloquea el hilo principal. Hacerlo en servidor evita congelar la UI |
| Completado de Oraciones | Vercel + Groq | Aísla las API Keys y aprovecha la velocidad de Llama 3 8B |
| Síntesis de Voz (TTS) | Navegador | Web Speech API es gratis y suficiente. Se elimina el proxy de Google Translate (inestable y bloqueable) |

---

## Mejoras clave

1. **Eliminación del WebSocket Gateway**: sobraba. Un servicio menos que mantener, menos puntos de fallo, menos latencia.
2. **Caché en IndexedDB** (no localStorage): guarda las respuestas de Groq para no repetir peticiones. localStorage se llena rápido (5MB) y bloquea el hilo; IndexedDB es asíncrono y soporta cientos de MB.
3. **Versionado de Modelos**: en Supabase Storage se guarda `modelo_v1.json`, `modelo_v2.json`, etc. En la BD se guardan métricas (accuracy, precision, recall, fecha). Si un modelo nuevo sale mal, el usuario vuelve al anterior.
4. **Preparación para el Futuro (Abstracción)**: diseñar la función de inferencia local para que mañana se pueda cambiar el Random Forest por TensorFlow.js o ONNX sin romper el frontend.
5. **Dataset Colaborativo**: permitir que los usuarios suban muestras de entrenamiento a Supabase. Con el tiempo se construye un dataset global de LSM valioso para futuros modelos.

---

## Infraestructura

| Componente | Tecnología | Despliegue | Costo |
|---|---|---|---|
| Frontend | Next.js | Vercel (Free) | $0 |
| Completado IA | Vercel Serverless → Groq | Vercel (Free) | $0 |
| Entrenamiento ML | Node + Express (REST) | Render (Free) | $0 |
| Auth + DB | Supabase | Supabase (Free) | $0 |
| Storage modelos | Supabase Storage | Supabase (Free) | $0 |
| Realtime notificaciones | Supabase Realtime | Supabase (Free) | $0 |
| Voz (TTS) | Web Speech API | Navegador | $0 |

---

## Plan de Migración (3 semanas)

### Fase 1: Aislamiento de IA y Voz (Semana 1)
1. Mover llamadas a Groq a `/api/ai/complete` en Vercel Serverless (ya existe).
2. Implementar caché en IndexedDB para las frases de Groq (no repetir peticiones).
3. Eliminar la dependencia de TTS de Google Translate y usar nativamente Web Speech API.

### Fase 2: Servidor de Entrenamiento (Semana 2)
1. Extraer la lógica de `rf-trainer.ts` a una API REST en Render (`POST /ml/train`).
2. Configurar Supabase Storage para guardar modelos versionados (`.json`).
3. Conectar el ML Service a Supabase para leer muestras y escribir el modelo resultante.
4. Guardar metadatos (accuracy, precision, recall, fecha) en PostgreSQL.

### Fase 3: Sincronización Local (Semana 3)
1. Al iniciar sesión, descargar el último modelo `.json` desde Supabase y guardarlo en IndexedDB.
2. Asegurar que MediaPipe + Random Forest corran fluidamente en el cliente.
3. Usar Supabase Realtime para emitir un evento al frontend cuando un nuevo modelo esté entrenado, sugiriendo al usuario actualizar.
4. Versionar modelos para permitir rollback si uno nuevo sale mal.

---

## Beneficios

| Aspecto | Antes (monolito browser) | Después (distribuido optimizado) | Costo |
|---|---|---|---|
| Inferencia | Latencia cero (local) | Latencia cero (local, sin cambios) | $0 |
| Entrenamiento | Bloquea UI del usuario | Servidor dedicado, UI libre | $0 |
| Modelos | Se pierden (IndexedDB) | Persisten + versionados (Supabase Storage) | $0 |
| Voz | Tres proveedores (inestable) | Web Speech API nativo | $0 |
| IA | API route serverless | Mismo + caché IndexedDB | $0 |
| Offline | Sí | Sí (inferencia local + caché) | $0 |
| Colaboración | No | Dataset + modelos compartidos | $0 |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Render duerme a los 15min | El entrenamiento es asíncrono — el usuario no espera; se notifica vía Realtime cuando termina |
| Supabase Free (500MB DB) | Comprimir datos de muestras; limpiar periódicamente |
| Groq Free (30 req/min) | Caché en IndexedDB elimina la mayoría de peticiones repetidas |
| Vercel Free (100GB/mes) | Optimizar assets; el peso de inference WASM es aceptable |
| Modelo nuevo con baja precisión | Versionado permite rollback al modelo anterior |
