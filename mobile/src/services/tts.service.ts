import * as Speech from "expo-speech";
import { storage } from "@/lib/storage";

let cachedVoice: string | null = null;
let voiceSearchDone = false;

async function findBestVoice(): Promise<string | null> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (voices.length === 0) return null;

    const pick =
      voices.find((v) => v.language === "es-MX") ||
      voices.find((v) => v.language?.startsWith("es-")) ||
      voices[0];

    if (pick) {
      cachedVoice = pick.identifier;
      console.log(`[TTS] Selected voice: "${pick.name ?? pick.identifier}" (${pick.language})`);
    }
    return pick?.identifier || null;
  } catch (e) {
    console.warn("[TTS] Error getting voices:", e);
    return null;
  }
}

let voicePromise: Promise<string | null> | null = (async () => {
  const v = await findBestVoice();
  voiceSearchDone = true;
  cachedVoice = v;
  return v;
})();

export type TTSProvider = "native" | "elevenlabs";

export async function getTTSProvider(): Promise<TTSProvider> {
  const saved = await storage.getItem("ttsProvider");
  if (saved === "elevenlabs") return "elevenlabs";
  return "native";
}

export async function speak(text: string): Promise<void> {
  if (!text) return;

  const provider = await getTTSProvider();
  console.log(`[TTS] speak("${text}") via ${provider}`);

  if (provider === "elevenlabs") {
    const ok = await speakElevenlabs(text);
    if (ok) return;
    console.log("[TTS] ElevenLabs failed, falling back to native.");
  }

  const voice = cachedVoice || (voicePromise ? await voicePromise : null);

  try {
    Speech.stop();
    const savedRate = await storage.getItem("ttsRate");
    const savedPitch = await storage.getItem("ttsPitch");

    const options: Speech.SpeechOptions = {
      language: "es-MX",
      rate: savedRate ? parseFloat(savedRate) : 0.95,
      pitch: savedPitch ? parseFloat(savedPitch) : 1.0,
    };
    if (voice) options.voice = voice;

    await new Promise<void>((resolve) => {
      Speech.speak(text, {
        ...options,
        onDone: () => resolve(),
        onError: () => resolve(),
        onStopped: () => resolve(),
      });
      setTimeout(() => resolve(), 15000);
    });
  } catch (e) {
    console.warn("[TTS] expo-speech error:", e);
  }
}

export async function speakElevenlabs(text: string): Promise<boolean> {
  return false;
}

export function isNativeTTSAvailable(): boolean {
  return true;
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch {}
}
