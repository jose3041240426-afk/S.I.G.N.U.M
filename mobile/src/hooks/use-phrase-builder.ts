import { useState, useRef, useCallback, useEffect } from "react";
import { storage } from "@/lib/storage";
import { ENV } from "@/lib/env";

export function usePhraseBuilder(onAdd?: (label: string, confidence: number, isWord: boolean) => void) {
  const [phrase, setPhrase] = useState("");
  const [autoAddActive, setAutoAddActive] = useState(false);
  const [preventRepeat, setPreventRepeat] = useState(false);
  const [confidenceMin, setConfidenceMin] = useState<number>(ENV.AUTO_ADD_CONFIDENCE_MIN);
  const [stableFrames, setStableFrames] = useState<number>(ENV.AUTO_ADD_STABLE_FRAMES);

  useEffect(() => {
    (async () => {
      const a = await storage.getBool("autoAddActive");
      setAutoAddActive(a);
      const p = await storage.getBool("preventRepeat");
      setPreventRepeat(p);
      const c = await storage.getNumber("autoAddConfidence", ENV.AUTO_ADD_CONFIDENCE_MIN);
      setConfidenceMin(c);
      const s = await storage.getNumber("autoAddStableFrames", ENV.AUTO_ADD_STABLE_FRAMES);
      setStableFrames(s);
    })();
  }, []);

  const persistAutoAdd = useCallback(async (v: boolean) => {
    setAutoAddActive(v);
    await storage.setItem("autoAddActive", String(v));
  }, []);
  const persistPreventRepeat = useCallback(async (v: boolean) => {
    setPreventRepeat(v);
    await storage.setItem("preventRepeat", String(v));
  }, []);

  const lastAddedRef = useRef("");
  const lastPredictedRef = useRef("");
  const stableCountRef = useRef(0);

  const addLetter = useCallback((letter: string) => {
    setPhrase((prev) => {
      if (preventRepeat && lastAddedRef.current === letter) return prev;
      return prev + letter;
    });
    lastAddedRef.current = letter;
    stableCountRef.current = 0;
  }, [preventRepeat]);

  const addWord = useCallback((word: string) => {
    setPhrase((prev) => {
      const trimmed = word.trim();
      if (!trimmed) return prev;
      const needSpace = prev.length > 0 && !prev.endsWith(" ");
      return prev + (needSpace ? " " : "") + trimmed;
    });
    lastAddedRef.current = word.trim();
    stableCountRef.current = 0;
  }, []);

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

    if (normalized !== lastPredictedRef.current) {
      lastPredictedRef.current = normalized;
      stableCountRef.current = 1;
      return;
    }

    if (normalized === lastAddedRef.current) {
      stableCountRef.current = 0;
      return;
    }

    stableCountRef.current += 1;
    if (stableCountRef.current >= stableFrames) {
      if (isWord) addWord(normalized);
      else addLetter(normalized);
      onAdd?.(normalized, confidence, isWord);
      stableCountRef.current = 0;
    }
  }, [autoAddActive, addLetter, addWord, confidenceMin, stableFrames, onAdd]);

  const resetStableCount = useCallback(() => {
    stableCountRef.current = 0;
    lastAddedRef.current = "";
    lastPredictedRef.current = "";
  }, []);

  return {
    phrase, setPhrase,
    autoAddActive, setAutoAddActive: persistAutoAdd,
    preventRepeat, setPreventRepeat: persistPreventRepeat,
    addLetter, addWord, addSpace, backspace, clear, tryAutoAdd, resetStableCount,
  };
}
