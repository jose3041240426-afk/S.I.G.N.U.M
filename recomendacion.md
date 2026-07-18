# Recomendación: Completar oraciones con IA (Groq)

## Conclusión

**Implementarlo, pero como botón manual de "Traducir a español natural"**, no como autocompletado automático.

## Por qué manual en vez de automático

En LSM el orden de las palabras **no es igual** al español. Ejemplo:

| Señas LSM (gloss) | Español natural |
|---|---|
| YO QUERER AGUA | Quiero agua, por favor |
| TÚ IR TIENDA AYER | ¿Fuiste a la tienda ayer? |
| MAÑANA CLASE CANCELAR | La clase de mañana se canceló |

Si el LLM completa automáticamente tras cada seña, va a alucinar conectores sobre frases incompletas. Es mejor que el usuario termine de señar y **luego** presione el botón para obtener la oración natural.

## Plan de implementación (mínimo, ~3 archivos)

### 1. Endpoint serverless (`frontend/app/api/ai/complete/route.ts`)

```ts
// POST /api/ai/complete
// Body: { phrase: "yo querer agua" }
// Response: { completed: "Quiero agua, por favor" }
//
// Usa Groq SDK con Llama 4 (gratuito, rápido, buen español).
// Prompt clave: "Convierte esta secuencia de glosas LSM a español
// natural. Solo agrega artículos, preposiciones y conjugaciones.
// NO inventes contenido nuevo."
```

### 2. Botón en el panel de transcripción (`page.tsx`)

Añadir un botón "✨ Corregir con IA" junto a los botones Espacio / Añadir / Borrar. Solo se muestra si `phrase.length > 0`.

```tsx
const [isCompleting, setIsCompleting] = useState(false);

const handleAIComplete = async () => {
  setIsCompleting(true);
  const res = await fetch("/api/ai/complete", {
    method: "POST",
    body: JSON.stringify({ phrase }),
  });
  const { completed } = await res.json();
  setPhrase(completed); // reemplaza la frase actual
  setIsCompleting(false);
};
```

### 3. API key en `.env.local` (server-side, nunca al cliente)

```
GROQ_API_KEY=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
```

## Prompt ingeniería (crítico para evitar alucinaciones)

```
Eres un asistente de lengua de señas mexicana (LSM).
Recibes una secuencia de palabras en notación "gloss" (palabras sueltas sin gramática).
Tu tarea es convertirla a español mexicano natural y fluido.

REGLAS ESTRICTAS:
1. SOLO agrega artículos, preposiciones, conjugaciones y conectores.
2. NO inventes contenido que no esté en la frase original.
3. NO agregues saludos, despedidas ni cortesías (a menos que estén en la frase).
4. Si la frase ya es gramaticalmente correcta, devuélvela igual.
5. Respuesta: SOLO la frase completada, sin explicaciones ni markdown.
```

## Riesgos y cómo mitigarlos

| Riesgo | Mitigación |
|---|---|
| Alucina contenido nuevo | Prompt restrictivo + modelo pequeño (Llama 3.2 3B) que sigue instrucciones mejor que alucinar |
| Latencia >2s | Mostrar spinner en el botón; Groq es rápido (<1s típico) |
| Frase vacía o 1 palabra | Deshabilitar botón si `phrase.length < 3` |
| Errores de red | Fallback: mostrar error y conservar frase original |

## Modelo recomendado

- **`llama-3.2-3b-preview`** — gratuito en Groq, <500ms de latencia, buen español, sigue instrucciones
- Alternativa: `mixtral-8x7b-32768` — mejor español, ~1s latencia, también gratuito

## Lo que NO recomiendo

- ❌ Autocompletado frame por frame (alucinaciones constantes)
- ❌ Usar la API de OpenAI (cuesta dinero, Groq es gratis)
- ❌ LLM local en navegador (muy lento, consume RAM)
- ❌ Reemplazar la frase actual — mejor mostrar resultado en un panel aparte para que el usuario compare
