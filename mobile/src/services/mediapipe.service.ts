export interface MediaPipeDetectionResult {
  handDetected: boolean;
  landmarks: number[];
  snapshot: string | null;
}

export type OnMediaPipeResult = (result: MediaPipeDetectionResult) => void;

let isRunning = false;
let isCanvasMirrored = true;
let captureInterval = 60;

export function setMirrored(mirrored: boolean) {
  isCanvasMirrored = mirrored;
}

export function setCaptureInterval(ms: number) {
  captureInterval = ms;
}

export function isMediaPipeRunning(): boolean {
  return isRunning;
}

export function getMirrored(): boolean {
  return isCanvasMirrored;
}

export function getCaptureInterval(): number {
  return captureInterval;
}

export function stopMediaPipe() {
  isRunning = false;
}

export function markRunning() {
  isRunning = true;
}

export function markStopped() {
  isRunning = false;
}
