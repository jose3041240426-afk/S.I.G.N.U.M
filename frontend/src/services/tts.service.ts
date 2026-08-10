/**
 * TTS Service - browser + server fallbacks.
 *
 * Strategy (driven by localStorage "ttsProvider"):
 *   - "native": Web Speech API (window.speechSynthesis).
 *   - "elevenlabs": Server-side /api/tts/elevenlabs proxy using ELEVENLABS_API_KEY.
 *
 * ElevenLabs requests fail silently to native on 4xx/5xx so the UI stays
 * responsive even if the user runs out of free credits.
 */

/* ------------------------------------------------------------------ */
/*  Voice cache                                                       */
/* ------------------------------------------------------------------ */

let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceSearchDone = false;

function findBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  console.log(`[TTS] getVoices() returned ${voices.length} voices`);

  if (voices.length === 0) return null;

  // Preferir español, luego cualquier idioma
  const pick =
    voices.find((v) => v.lang === "es-MX") ||
    voices.find((v) => v.lang.startsWith("es-")) ||
    voices.find((v) => v.lang.startsWith("es")) ||
    voices.find((v) => v.default) ||
    voices[0];

  if (pick) {
    console.log(`[TTS] Selected voice: "${pick.name}" (${pick.lang})`);
  }
  return pick;
}

/** Waits up to ~3 s for voices to appear. Resolves to the best voice or null. */
function waitForVoices(): Promise<SpeechSynthesisVoice | null> {
  voiceSearchDone = false;
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      voiceSearchDone = true;
      resolve(null);
      return;
    }

    // Fast path – voices already loaded
    const immediate = findBestVoice();
    if (immediate) {
      cachedVoice = immediate;
      voiceSearchDone = true;
      resolve(immediate);
      return;
    }

    // Listen for the async event Chrome/Firefox fire
    const onVoicesChanged = () => {
      const v = findBestVoice();
      if (v) {
        cachedVoice = v;
        voiceSearchDone = true;
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(v);
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

    // Polling fallback for Edge / older browsers
    const intervals = [50, 150, 300, 600, 1200, 2500];
    let i = 0;
    const poll = () => {
      if (voiceSearchDone) return;
      const v = findBestVoice();
      if (v) {
        cachedVoice = v;
        voiceSearchDone = true;
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(v);
        return;
      }
      if (i < intervals.length) {
        setTimeout(poll, intervals[i++]);
      } else {
        voiceSearchDone = true;
        console.warn("[TTS] No voices found after waiting. Native TTS unavailable.");
        resolve(null);
      }
    };
    setTimeout(poll, intervals[i++]);
  });
}

// Kick off voice loading as soon as the module is imported
let voicePromise: Promise<SpeechSynthesisVoice | null> | null = null;
if (typeof window !== "undefined") {
  voicePromise = waitForVoices();
}

/* ------------------------------------------------------------------ */
/*  Native speech (Web Speech API)                                    */
/* ------------------------------------------------------------------ */

function speakWithNativeAPI(text: string, voice: SpeechSynthesisVoice): Promise<boolean> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;

    // Cancel anything queued (also un-stucks Chrome's paused state)
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang || "es-MX";
    
    const savedRate = typeof window !== "undefined" ? window.localStorage.getItem("ttsRate") : null;
    const savedPitch = typeof window !== "undefined" ? window.localStorage.getItem("ttsPitch") : null;
    
    utterance.rate = savedRate ? parseFloat(savedRate) : 0.95;
    utterance.pitch = savedPitch ? parseFloat(savedPitch) : 1.0;
    utterance.volume = 1.0;

    let settled = false;
    const settle = (success: boolean) => {
      if (settled) return;
      settled = true;
      resolve(success);
    };

    const timer = setTimeout(() => {
      console.warn("[TTS] Native speech timed out (8 s).");
      synth.cancel();
      settle(false);
    }, 8000);

    utterance.onend = () => {
      clearTimeout(timer);
      console.log("[TTS] Native speech finished.");
      settle(true);
    };

    utterance.onerror = (ev) => {
      clearTimeout(timer);
      console.warn("[TTS] Native speech error:", ev.error);
      settle(false);
    };

    try {
      synth.speak(utterance);

      if (synth.paused) {
        synth.resume();
      }
    } catch (e) {
      console.error("[TTS] synth.speak() threw:", e);
      clearTimeout(timer);
      settle(false);
    }
  });
}

/* ------------------------------------------------------------------ */
/*  ElevenLabs catalog – voices confirmed working on the free tier  */
/* ------------------------------------------------------------------ */

export const ELEVENLABS_VOICES: Record<string, string> = {
  "pNInz6obpgDQGcFmaJgB": "Adam (recomendado español)",
  "EXAVITQu4vr4xnSDxMaL": "Sarah (recomendado español)",
  "Xb7hH8MSUJpSbSDYk0k2": "Alice",
  "hpp4J3VqNfWAUOO0d1Us": "Bella",
  "pqHfZKP75CvOlQylNhV4": "Bill",
  "nPczCjzI2devNBz1zQrb": "Brian",
  "N2lVS1w4EtoT3dr4eOWO": "Callum",
  "IKne3meq5aSn9XLyUdCD": "Charlie",
  "iP95p4xoKVk53GoZ742B": "Chris",
  "onwK4e9ZLuTAKqWW03F9": "Daniel",
  "cjVigY5qzO86Huf0OWal": "Eric",
  "JBFqnCBsd6RMkjVDRZzb": "George",
  "SOYHLrjzK2X1ezoPC6cr": "Harry",
  "cgSgspJ2msm6clMCkdW9": "Jessica",
  "FGY2WhTYpPnrIDTdsKH5": "Laura",
  "TX3LPaxmHKxFdv7VOQHJ": "Liam",
  "pFZP5JQG7iQjIQuC4Bku": "Lily",
  "XrExE9yKIg1WjnnlVkGX": "Matilda",
  "SAz9YHcvj6GT2YYXdXww": "River",
  "CwhRBWXzGAHq8TQ4Fs17": "Roger",
  "bIHbv24MWmeRgasZH58o": "Will",
};

/* ------------------------------------------------------------------ */
/*  ElevenLabs via /api/tts/elevenlabs                                 */
/* ------------------------------------------------------------------ */

let elevenlabsAudio: HTMLAudioElement | null = null;

async function speakElevenlabs(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const voiceId = localStorage.getItem("elevenlabsVoiceId") || "pNInz6obpgDQGcFmaJgB";
    const encoded = encodeURIComponent(text.slice(0, 500));
    const url = `/api/tts/elevenlabs?text=${encoded}&voice_id=${voiceId}&model_id=eleven_multilingual_v2`;

    if (!elevenlabsAudio) {
      elevenlabsAudio = new Audio();
    } else {
      elevenlabsAudio.pause();
    }

    elevenlabsAudio.src = url;
    elevenlabsAudio.volume = 1.0;

    let success = false;
    await new Promise<void>((resolve) => {
      elevenlabsAudio!.onended = () => {
        success = true;
        resolve();
      };
      elevenlabsAudio!.onerror = (e) => {
        console.error("[TTS] ElevenLabs audio error", e);
        resolve();
      };
      const playPromise = elevenlabsAudio!.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== "AbortError") {
            console.error("[TTS] ElevenLabs play() rejected", err);
          }
          resolve();
        });
      }
      // Safety timeout
      setTimeout(() => resolve(), 15000);
    });

    return success;
  } catch (e) {
    console.error("[TTS] ElevenLabs exception", e);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export type TTSProvider = "native" | "elevenlabs";

export function getTTSProvider(): TTSProvider {
  if (typeof window === "undefined") return "native";
  const saved = localStorage.getItem("ttsProvider");
  if (saved === "elevenlabs") return "elevenlabs";
  return "native";
}

export async function speak(text: string): Promise<void> {
  if (!text || typeof window === "undefined") return;

  const provider = getTTSProvider();
  console.log(`[TTS] speak("${text}") via ${provider}`);

  if (provider === "elevenlabs") {
    const ok = await speakElevenlabs(text);
    if (ok) return;
    console.log("[TTS] ElevenLabs failed, falling back to native.");
    // Fall through to native as backup
  }

  // Try native speech
  let voice = cachedVoice;
  if (!voice) {
    voice = await waitForVoices();
  }

  // Chrome on Linux sometimes needs a kick — retry once
  if (!voice && window.speechSynthesis) {
    window.speechSynthesis.getVoices(); // trigger lazy load
    await new Promise((r) => setTimeout(r, 300));
    voice = findBestVoice();
    if (voice) cachedVoice = voice;
  }

  if (voice) {
    await speakWithNativeAPI(text, voice);
    return;
  }

  // Only fall back to ElevenLabs if the user DIDN'T explicitly choose native
  if (provider !== "native") {
    console.log("[TTS] No native voices, trying ElevenLabs fallback.");
    const ok = await speakElevenlabs(text);
    if (ok) return;
  }

  console.warn("[TTS] TTS could not speak — no voices available for the selected provider.");
}

// Kept for backwards compatibility – now delegates to speak()
export async function speakNative(text: string): Promise<void> {
  await speak(text);
}

export function isNativeTTSAvailable(): boolean {
  return typeof window !== "undefined";
}
