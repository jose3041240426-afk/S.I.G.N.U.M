export const ENV = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  AUTO_ADD_CONFIDENCE_MIN: 55,
  AUTO_ADD_STABLE_FRAMES: 6,
} as const;
