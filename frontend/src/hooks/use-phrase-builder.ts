import { useState, useEffect, useRef, useCallback } from "react";
import { ENV } from "@/lib/env";

export function usePhraseBuilder(onAdd?: (label: string, confidence: number, isWord: boolean) => void) {
  const [phrase, setPhrase] = useState("");
  const [autoAddActive, setAutoAddActive] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("autoAddActive") === "true";
    return false;
  });
  const [preventRepeat, setPreventRepeat] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("preventRepeat") === "true";
    return false;
  });

  const persistAutoAdd = useCallback((v: boolean) => {
    setAutoAddActive(v);
    if (typeof window !== "undefined") localStorage.setItem("autoAddActive", String(v));
  }, []);
  const persistPreventRepeat = useCallback((v: boolean) => {
    setPreventRepeat(v);
    if (typeof window !== "undefined") localStorage.setItem("preventRepeat", String(v));
  }, []);
  const lastAddedRef = useRef("");
  const lastPredictedRef = useRef("");
  const stableCountRef = useRef(0);

  const [confidenceMin, setConfidenceMin] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("autoAddConfidence");
      return saved ? parseInt(saved, 10) : ENV.AUTO_ADD_CONFIDENCE_MIN;
    }
    return ENV.AUTO_ADD_CONFIDENCE_MIN;
  });

  const [stableFrames, setStableFrames] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("autoAddStableFrames");
      return saved ? parseInt(saved, 10) : ENV.AUTO_ADD_STABLE_FRAMES;
    }
    return ENV.AUTO_ADD_STABLE_FRAMES;
  });

  // Re-read settings when they change (from the settings page or another tab)
  useEffect(() => {
    const handleSettingsChange = () => {
      const savedConf = localStorage.getItem("autoAddConfidence");
      setConfidenceMin(savedConf ? parseInt(savedConf, 10) : ENV.AUTO_ADD_CONFIDENCE_MIN);
      const savedFrames = localStorage.getItem("autoAddStableFrames");
      setStableFrames(savedFrames ? parseInt(savedFrames, 10) : ENV.AUTO_ADD_STABLE_FRAMES);
    };
    window.addEventListener("settingsChanged", handleSettingsChange);
    window.addEventListener("storage", handleSettingsChange);
    return () => {
      window.removeEventListener("settingsChanged", handleSettingsChange);
      window.removeEventListener("storage", handleSettingsChange);
    };
  }, []);

  const addLetter = useCallback((letter: string) => {
    setPhrase((prev) => {
      if (preventRepeat && prev.endsWith(letter)) {
        return prev;
      }
      return prev + letter;
    });
    lastAddedRef.current = letter;
    stableCountRef.current = 0;
  }, [preventRepeat]);

  const addWord = useCallback((word: string) => {
    setPhrase((prev) => {
      const trimmed = word.trim();
      if (!trimmed) return prev;
      if (preventRepeat && prev.endsWith(trimmed)) {
        return prev;
      }
      const needSpace = prev.length > 0 && !prev.endsWith(" ");
      return prev + (needSpace ? " " : "") + trimmed;
    });
    lastAddedRef.current = word.trim();
    stableCountRef.current = 0;
  }, [preventRepeat]);

  const addSpace = useCallback(() => {
    setPhrase((prev) => prev + " ");
    lastAddedRef.current = " ";
    stableCountRef.current = 0;
  }, []);

  const backspace = useCallback(() => {
    setPhrase((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setPhrase("");
    lastAddedRef.current = "";
    lastPredictedRef.current = "";
    stableCountRef.current = 0;
  }, []);

  const tryAutoAdd = useCallback((label: string, confidence: number, isWord = false) => {
    if (!autoAddActive) return;
    if (confidence < confidenceMin) return;

    const normalized = label.trim();
    if (!normalized) return;

    // Si es exactamente lo que acabamos de agregar en el ciclo actual, prevenimos duplicado
    if (normalized === lastAddedRef.current) {
      return;
    }

    if (isWord) addWord(normalized);
    else addLetter(normalized);
    onAdd?.(normalized, confidence, isWord);
    lastAddedRef.current = normalized;
    
  }, [autoAddActive, addLetter, addWord, confidenceMin, onAdd]);

  const resetStableCount = useCallback(() => {
    lastAddedRef.current = "";
    lastPredictedRef.current = "";
  }, []);

  return {
    phrase,
    setPhrase,
    autoAddActive,
    setAutoAddActive: persistAutoAdd,
    preventRepeat,
    setPreventRepeat: persistPreventRepeat,
    addLetter,
    addWord,
    addSpace,
    backspace,
    clear,
    tryAutoAdd,
    resetStableCount,
    confidenceMin,
    stableFrames,
  };
}
