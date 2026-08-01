import { ENV } from "@/lib/env";
import { db } from "@/lib/db";

const SYSTEM_PROMPT = `Eres un asistente de lengua de senas mexicana (LSM).
Recibes una secuencia de palabras en notacion "gloss" (palabras sueltas sin gramatica).
Tu tarea es convertirla a espanol mexicano natural y fluido, respetando el significado original.

REGLAS ESTRICTAS:
1. SOLO agrega articulos, preposiciones, conjugaciones, conectores y puntuacion.
2. NO inventes contenido, conceptos ni palabras que no esten en la frase original.
3. NO agregues saludos, despedidas ni formulas de cortesia (a menos que esten en la frase).
4. Si la frase ya es gramaticalmente correcta, devuelvela identica.
5. RESPONDE UNICAMENTE con la frase completada. Sin explicaciones, sin markdown, sin comillas.`;

export async function completePhrase(phrase: string): Promise<{ completed: string; error?: string }> {
  if (!phrase || phrase.length < 3) {
    return { error: "Frase demasiado corta. Mínimo 3 caracteres.", completed: phrase };
  }

  const cached = await db.getCachedCompletion(phrase);
  if (cached) {
    if (cached.completed === phrase) {
      return { completed: phrase, error: "no_improve" };
    }
    return { completed: cached.completed };
  }

  if (!ENV.GROQ_API_KEY) {
    return { completed: phrase, error: "Groq API key no configurada" };
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: phrase },
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      return { completed: phrase, error: `Groq API error ${response.status}` };
    }

    const data = await response.json();
    const completed = data.choices?.[0]?.message?.content?.trim() || phrase;

    await db.saveCompletion(phrase, completed).catch(() => {});

    if (completed === phrase) {
      return { completed, error: "no_improve" };
    }

    return { completed };
  } catch (e: any) {
    console.error("[AI] proxy error:", e);
    return { completed: phrase, error: "Error de conexión con la IA" };
  }
}
