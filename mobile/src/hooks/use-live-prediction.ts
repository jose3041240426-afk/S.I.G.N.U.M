import { useState, useEffect, useRef, useCallback } from "react";
import { Camera } from "expo-camera";
import { RandomForestPredictor, type PredictionResult } from "@/services/rf-inference";
import { db } from "@/lib/db";
import { feedCaptureFrame, isCapturing, resampleSequence } from "@/services/capture-local.service";
import type { MediaPipeDetectionResult } from "@/services/mediapipe.service";
import { storage } from "@/lib/storage";
import { ENV } from "@/lib/env";

export interface LivePredictionData {
  letter: string;
  confidence: number;
  handDetected: boolean;
  word: string;
  wordConfidence: number;
  dynamicSign: string;
  dynamicConfidence: number;
  mediapipeReady: boolean;
  localModelReady: boolean;
  snapshot: string | null;
  autoState: AutoState;
  autoProgress: number;
  autoResult: AutoResult | null;
}

type AutoState = "idle" | "waiting_hand" | "waiting_motion" | "capturing" | "classifying";

export interface AutoResult {
  isDynamic: boolean;
  motionScore: number;
  prediction: string;
  confidence: number;
  frames: number;
  letterPrediction?: string;
  letterConfidence?: number;
  wordPrediction?: string;
  wordConfidence?: number;
  dynamicPrediction?: string;
  dynamicConfidence?: number;
}

const DEFAULT_PREDICTION: LivePredictionData = {
  letter: "", confidence: 0, handDetected: false,
  word: "", wordConfidence: 0, dynamicSign: "", dynamicConfidence: 0,
  mediapipeReady: false, localModelReady: false, snapshot: null,
  autoState: "idle", autoProgress: 0, autoResult: null,
};

const BUFFER_SIZE = 5;
const DYNAMIC_FRAMES_PER_SEQUENCE = 50;
const MOTION_THRESHOLD = 0.018;
const MOTION_TIMEOUT_MS = 500;

export function useLivePrediction(
  mode: string = "letters",
  captureActiveRef?: React.MutableRefObject<boolean>,
  onDetectionResult?: (result: MediaPipeDetectionResult) => void,
) {
  const [data, setData] = useState<LivePredictionData>(DEFAULT_PREDICTION);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const modeRef = useRef(mode);
  const rfLetter = useRef(new RandomForestPredictor());
  const rfWord = useRef(new RandomForestPredictor());
  const rfDynamic = useRef(new RandomForestPredictor());
  const localReadyRef = useRef(false);
  const letterPredictionBuffer = useRef<PredictionResult[]>([]);
  const wordPredictionBuffer = useRef<PredictionResult[]>([]);
  const dynamicPredictionBuffer = useRef<PredictionResult[]>([]);
  const dynamicBuffer = useRef<number[][]>([]);
  const lastValidLandmarks = useRef<number[]>([]);
  const noDetectionFrames = useRef(0);
  const autoBuffer = useRef<number[][]>([]);
  const autoStateRef = useRef<AutoState>("idle");
  const autoStartRef = useRef<number>(0);
  const autoDurationMsRef = useRef<number>(3000);
  const autoMotionThresholdRef = useRef<number>(0.015);
  const autoInstantThresholdRef = useRef<number>(0.025);
  const autoMaxWaitMsRef = useRef<number>(1500);
  const autoMinFramesRef = useRef<number>(8);
  const lastAutoLandmarksRef = useRef<number[] | null>(null);
  const autoMotionDetectedRef = useRef<boolean>(false);
  const lastMotionLandmarksRef = useRef<number[] | null>(null);
  const lastSignificantMotionTimeRef = useRef<number>(0);
  const latestSnapshotRef = useRef<string | null>(null);

  modeRef.current = mode;

  const loadLocalModels = useCallback(async (): Promise<boolean> => {
    let letterReady = false;
    let wordReady = false;
    let dynamicReady = false;
    try {
      const letterModel = await db.getModel("rf-letter");
      if (letterModel?.data) { rfLetter.current.loadFromModel(letterModel.data as any); letterReady = true; }
    } catch {}
    try {
      const wordModel = await db.getModel("rf-word");
      if (wordModel?.data) { rfWord.current.loadFromModel(wordModel.data as any); wordReady = true; }
    } catch {}
    try {
      const dynamicModel = await db.getModel("rf-dynamic");
      if (dynamicModel?.data) { rfDynamic.current.loadFromModel(dynamicModel.data as any); dynamicReady = true; }
    } catch {}
    return letterReady || wordReady || dynamicReady;
  }, []);

  useEffect(() => {
    let alive = true;
    loadLocalModels().then((ready) => {
      if (alive) {
        localReadyRef.current = ready;
        setData((prev) => ({ ...prev, localModelReady: ready }));
      }
    });
    return () => { alive = false; };
  }, [loadLocalModels]);

  const smoothPredict = (
    buf: React.MutableRefObject<PredictionResult[]>,
    label: string,
    confidence: number,
  ): PredictionResult | null => {
    const b = buf.current;
    b.push({ label, confidence });
    if (b.length > BUFFER_SIZE) b.shift();
    if (b.length < 2) return null;
    const counts: Record<string, { count: number; totalConf: number }> = {};
    for (const p of b) {
      if (!counts[p.label]) counts[p.label] = { count: 0, totalConf: 0 };
      counts[p.label].count++;
      counts[p.label].totalConf += p.confidence;
    }
    let best = label;
    let bestCount = 0;
    for (const [key, c] of Object.entries(counts)) {
      if (c.count > bestCount) { best = key; bestCount = c.count; }
    }
    return { label: best, confidence: Math.round((counts[best].totalConf / counts[best].count) * 10) / 10 };
  };

  const smoothPredictDynamic = (label: string, confidence: number): PredictionResult | null => {
    const buf = dynamicPredictionBuffer.current;
    buf.push({ label, confidence });
    if (buf.length > BUFFER_SIZE) buf.shift();
    if (buf.length < 2) return null;
    const counts: Record<string, { count: number; totalConf: number }> = {};
    for (const p of buf) {
      if (!counts[p.label]) counts[p.label] = { count: 0, totalConf: 0 };
      counts[p.label].count++;
      counts[p.label].totalConf += p.confidence;
    }
    let bestLabel = "";
    let maxCount = 0;
    for (const [lbl, dc] of Object.entries(counts)) {
      if (dc.count > maxCount) { maxCount = dc.count; bestLabel = lbl; }
    }
    if (maxCount >= Math.ceil(BUFFER_SIZE * 0.4)) {
      return { label: bestLabel, confidence: counts[bestLabel].totalConf / maxCount };
    }
    return null;
  };

  const handleDetectionResult = useCallback(
    (result: MediaPipeDetectionResult) => {
      latestSnapshotRef.current = result.snapshot;

      let landmarksToUse = result.landmarks;

      if (!result.handDetected || result.landmarks.length !== 63) {
        noDetectionFrames.current += 1;
        if (noDetectionFrames.current <= 3 && lastValidLandmarks.current.length === 63) {
          landmarksToUse = lastValidLandmarks.current;
        } else {
          setData((prev) => ({
            ...prev,
            handDetected: false,
            snapshot: result.snapshot || prev.snapshot,
            mediapipeReady: true,
          }));
          if (onDetectionResult) onDetectionResult(result);
          return;
        }
      } else {
        noDetectionFrames.current = 0;
        lastValidLandmarks.current = result.landmarks;
      }

      if (captureActiveRef?.current || isCapturing()) {
        feedCaptureFrame(landmarksToUse);
      }

      const now = performance.now();
      const prevMotionLms = lastMotionLandmarksRef.current;
      if (prevMotionLms && prevMotionLms.length === 63) {
        let motionDelta = 0;
        for (let i = 0; i < 63; i++) {
          const diff = landmarksToUse[i] - prevMotionLms[i];
          motionDelta += diff * diff;
        }
        motionDelta = Math.sqrt(motionDelta / 63);
        if (motionDelta > MOTION_THRESHOLD) {
          lastSignificantMotionTimeRef.current = now;
        }
      }
      lastMotionLandmarksRef.current = landmarksToUse;

      if (autoStateRef.current !== "idle") {
        if (autoStateRef.current === "waiting_hand") {
          autoStateRef.current = "waiting_motion";
          autoStartRef.current = now;
          autoBuffer.current = [];
          lastAutoLandmarksRef.current = landmarksToUse;
          autoMotionDetectedRef.current = false;
          setData((prev) => ({
            ...prev, autoState: "waiting_motion", autoProgress: 0,
            handDetected: true, mediapipeReady: true, snapshot: result.snapshot || prev.snapshot,
          }));
        } else if (autoStateRef.current === "waiting_motion") {
          autoBuffer.current.push(landmarksToUse);
          if (autoBuffer.current.length > 60) autoBuffer.current.shift();

          const prevLms = lastAutoLandmarksRef.current;
          if (prevLms && prevLms.length === 63) {
            let instantDelta = 0;
            for (let i = 0; i < 63; i++) {
              const diff = landmarksToUse[i] - prevLms[i];
              instantDelta += diff * diff;
            }
            instantDelta = Math.sqrt(instantDelta / 63);
            if (instantDelta > autoInstantThresholdRef.current) {
              autoMotionDetectedRef.current = true;
              autoStateRef.current = "capturing";
              autoStartRef.current = now;
              setData((prev) => ({ ...prev, autoState: "capturing", autoProgress: 0 }));
            }
          }
          lastAutoLandmarksRef.current = landmarksToUse;

          const waited = now - autoStartRef.current;
          if (!autoMotionDetectedRef.current && waited >= autoMaxWaitMsRef.current && autoBuffer.current.length >= autoMinFramesRef.current) {
            autoStateRef.current = "classifying";
            setData((prev) => ({
              ...prev, autoState: "classifying", autoProgress: 1,
              handDetected: true, mediapipeReady: true, snapshot: result.snapshot || prev.snapshot,
            }));
          } else {
            setData((prev) => ({
              ...prev,
              autoProgress: Math.min(1, waited / autoMaxWaitMsRef.current),
              handDetected: true, mediapipeReady: true, snapshot: result.snapshot || prev.snapshot,
            }));
          }
        } else if (autoStateRef.current === "capturing") {
          autoBuffer.current.push(landmarksToUse);
          const elapsed = now - autoStartRef.current;
          const progress = Math.min(1, elapsed / autoDurationMsRef.current);
          setData((prev) => ({
            ...prev, autoProgress: progress,
            handDetected: true, mediapipeReady: true, snapshot: result.snapshot || prev.snapshot,
          }));
          if (elapsed >= autoDurationMsRef.current) {
            autoStateRef.current = "classifying";
            setData((prev) => ({
              ...prev, autoState: "classifying", autoProgress: 1,
              handDetected: true, mediapipeReady: true, snapshot: result.snapshot || prev.snapshot,
            }));
          }
        }
        if (onDetectionResult) onDetectionResult(result);
        return;
      }

      if (localReadyRef.current) {
        let letterSmoothed: PredictionResult | null = null;
        let wordSmoothed: PredictionResult | null = null;
        let dynamicSmoothed: PredictionResult | null = null;

        const letterPred = rfLetter.current.predict(landmarksToUse);
        if (letterPred) {
          letterSmoothed = smoothPredict(letterPredictionBuffer, letterPred.label, letterPred.confidence);
        }
        const wordPred = rfWord.current.predict(landmarksToUse);
        if (wordPred) {
          wordSmoothed = smoothPredict(wordPredictionBuffer, wordPred.label, wordPred.confidence);
        }

        dynamicBuffer.current.push(landmarksToUse);
        const MAX_DYNAMIC_BUFFER = 90;
        if (dynamicBuffer.current.length > MAX_DYNAMIC_BUFFER) {
          dynamicBuffer.current.shift();
        }

        if (dynamicBuffer.current.length >= 30) {
          const scales = [30, 45, 60, 75, 90];
          let bestPred: PredictionResult | null = null;
          if (rfDynamic.current.isLoaded()) {
            for (const scale of scales) {
              if (dynamicBuffer.current.length >= scale) {
                const slice = dynamicBuffer.current.slice(dynamicBuffer.current.length - scale);
                const resampled = resampleSequence(slice, DYNAMIC_FRAMES_PER_SEQUENCE);
                const expectedFeatures = rfDynamic.current.model?.nFeatures;
                if (resampled.length !== expectedFeatures) continue;
                const pred = rfDynamic.current.predict(resampled);
                if (pred && (!bestPred || pred.confidence > bestPred.confidence)) {
                  bestPred = pred;
                }
              }
            }
          }
          if (bestPred && bestPred.confidence >= 0.4) {
            dynamicSmoothed = smoothPredictDynamic(bestPred.label, bestPred.confidence);
          }
        }

        const isStatic = (now - lastSignificantMotionTimeRef.current) > MOTION_TIMEOUT_MS;
        if (isStatic) {
          dynamicSmoothed = null;
          if (letterSmoothed && wordSmoothed) {
            if (wordSmoothed.confidence > letterSmoothed.confidence) {
              letterSmoothed = null;
            } else {
              wordSmoothed = null;
            }
          }
        } else {
          letterSmoothed = null;
          wordSmoothed = null;
        }

        setData((prev) => ({
          ...prev,
          letter: letterSmoothed ? letterSmoothed.label : "",
          confidence: letterSmoothed ? letterSmoothed.confidence : 0,
          word: wordSmoothed ? wordSmoothed.label : "",
          wordConfidence: wordSmoothed ? wordSmoothed.confidence : 0,
          dynamicSign: dynamicSmoothed ? dynamicSmoothed.label : "",
          dynamicConfidence: dynamicSmoothed ? dynamicSmoothed.confidence : 0,
          handDetected: true,
          mediapipeReady: true,
          snapshot: result.snapshot || prev.snapshot,
        }));
      } else {
        setData((prev) => ({
          ...prev,
          handDetected: result.handDetected,
          mediapipeReady: true,
          snapshot: result.snapshot || prev.snapshot,
        }));
      }

      if (onDetectionResult) onDetectionResult(result);
    },
    [captureActiveRef, onDetectionResult],
  );

  const handleMediaPipeResultRef = useRef(handleDetectionResult);
  handleMediaPipeResultRef.current = handleDetectionResult;

  const reloadModels = useCallback(async () => {
    const ready = await loadLocalModels();
    localReadyRef.current = ready;
    setData((prev) => ({ ...prev, localModelReady: ready }));
  }, [loadLocalModels]);

  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      setCameraOn(false);
      setData((prev) => ({ ...prev, mediapipeReady: false, handDetected: false }));
      return;
    }

    try {
      const perm = await Camera.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        setCameraError(
          "Permiso de cámara denegado. Activa el acceso a la cámara en los ajustes del sistema y vuelve a intentarlo.",
        );
        return;
      }
      setCameraError(null);
      setCameraOn(true);
    } catch (e) {
      setCameraError("No se pudo solicitar el permiso de cámara.");
    }
  }, [cameraOn]);

  const startAutoCapture = useCallback((durationSec: number, motionThreshold: number = 0.015, instantThreshold?: number) => {
    autoBuffer.current = [];
    autoDurationMsRef.current = Math.max(500, durationSec * 1000);
    autoMotionThresholdRef.current = motionThreshold;
    autoInstantThresholdRef.current = instantThreshold ?? Math.max(0.01, motionThreshold * 1.6);
    autoStateRef.current = "waiting_hand";
    autoMotionDetectedRef.current = false;
    lastAutoLandmarksRef.current = null;
    setData((prev) => ({ ...prev, autoState: "waiting_hand", autoProgress: 0, autoResult: null }));
  }, []);

  const stopAutoCapture = useCallback(() => {
    autoStateRef.current = "idle";
    lastAutoLandmarksRef.current = null;
    autoMotionDetectedRef.current = false;
  }, []);

  const classifyAuto = useCallback((): AutoResult | null => {
    const frames = autoBuffer.current;
    if (frames.length < autoMinFramesRef.current) {
      autoStateRef.current = "idle";
      setData((prev) => ({ ...prev, autoState: "idle", autoProgress: 0 }));
      return null;
    }

    const dims = frames[0].length;
    const means = new Array<number>(dims).fill(0);
    for (const frame of frames) {
      for (let i = 0; i < dims; i++) means[i] += frame[i];
    }
    for (let i = 0; i < dims; i++) means[i] /= frames.length;

    let totalSq = 0;
    let count = 0;
    for (const frame of frames) {
      for (let i = 0; i < dims; i++) {
        const diff = frame[i] - means[i];
        totalSq += diff * diff;
        count++;
      }
    }
    const variance = count > 0 ? totalSq / count : 0;
    const motionScore = Math.sqrt(variance);

    let peakInstantMotion = 0;
    for (let f = 1; f < frames.length; f++) {
      let delta = 0;
      for (let i = 0; i < dims; i++) {
        const diff = frames[f][i] - frames[f - 1][i];
        delta += diff * diff;
      }
      peakInstantMotion = Math.max(peakInstantMotion, Math.sqrt(delta / dims));
    }

    const isDynamic =
      autoMotionDetectedRef.current ||
      motionScore > autoMotionThresholdRef.current ||
      peakInstantMotion > autoInstantThresholdRef.current;

    let letterPrediction = "";
    let letterConfidence = 0;
    let wordPrediction = "";
    let wordConfidence = 0;
    let dynamicPrediction = "";
    let dynamicConfidence = 0;

    const centroid = frames[Math.floor(frames.length / 2)];
    const letterPred = rfLetter.current.predict(centroid);
    if (letterPred) { letterPrediction = letterPred.label; letterConfidence = letterPred.confidence; }
    const wordPred = rfWord.current.predict(centroid);
    if (wordPred) { wordPrediction = wordPred.label; wordConfidence = wordPred.confidence; }

    if (isDynamic) {
      const slice = frames.slice(-Math.min(frames.length, 90));
      const resampled = resampleSequence(slice, DYNAMIC_FRAMES_PER_SEQUENCE);
      const expected = rfDynamic.current.model?.nFeatures;
      if (expected && resampled.length === expected) {
        const pred = rfDynamic.current.predict(resampled);
        if (pred) { dynamicPrediction = pred.label; dynamicConfidence = pred.confidence; }
      }
    } else {
      const slice = frames.slice(-Math.min(frames.length, 90));
      if (slice.length >= DYNAMIC_FRAMES_PER_SEQUENCE) {
        const resampled = resampleSequence(slice, DYNAMIC_FRAMES_PER_SEQUENCE);
        const expected = rfDynamic.current.model?.nFeatures;
        if (expected && resampled.length === expected) {
          const pred = rfDynamic.current.predict(resampled);
          if (pred) { dynamicPrediction = pred.label; dynamicConfidence = pred.confidence; }
        }
      }
    }

    let prediction = "";
    let confidence = 0;
    if (isDynamic && dynamicPrediction) {
      prediction = dynamicPrediction; confidence = dynamicConfidence;
    } else if (letterPrediction && (!wordPrediction || letterConfidence >= wordConfidence)) {
      prediction = letterPrediction; confidence = letterConfidence;
    } else if (wordPrediction) {
      prediction = wordPrediction; confidence = wordConfidence;
    }

    const result: AutoResult = {
      isDynamic, motionScore, prediction, confidence, frames: frames.length,
      letterPrediction, letterConfidence, wordPrediction, wordConfidence,
      dynamicPrediction, dynamicConfidence,
    };

    autoBuffer.current = [];
    autoStateRef.current = "idle";
    lastAutoLandmarksRef.current = null;
    autoMotionDetectedRef.current = false;

    const bestStaticPrediction =
      letterPrediction && wordPrediction
        ? wordConfidence > letterConfidence
          ? { label: wordPrediction, confidence: wordConfidence }
          : { label: letterPrediction, confidence: letterConfidence }
        : letterPrediction
          ? { label: letterPrediction, confidence: letterConfidence }
          : wordPrediction
            ? { label: wordPrediction, confidence: wordConfidence }
            : null;

    if (isDynamic) lastSignificantMotionTimeRef.current = performance.now();

    setData((prev) => ({
      ...prev, autoState: "idle", autoProgress: 0, autoResult: result,
      letter: !isDynamic && bestStaticPrediction?.label === letterPrediction ? letterPrediction : "",
      confidence: !isDynamic && bestStaticPrediction?.label === letterPrediction ? letterConfidence : 0,
      word: !isDynamic && bestStaticPrediction?.label === wordPrediction ? wordPrediction : "",
      wordConfidence: !isDynamic && bestStaticPrediction?.label === wordPrediction ? wordConfidence : 0,
      dynamicSign: isDynamic && dynamicPrediction ? dynamicPrediction : "",
      dynamicConfidence: isDynamic && dynamicPrediction ? dynamicConfidence : 0,
    }));

    return result;
  }, []);

  return {
    data, cameraOn, cameraError, setCameraError, toggleCamera,
    reloadModels, startAutoCapture, stopAutoCapture, classifyAuto,
    handleMediaPipeResult: handleMediaPipeResultRef,
    latestSnapshotRef,
  };
}
