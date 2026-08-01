import { Platform } from "react-native";

export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://nvkpfreeyemrpxxmqfqm.supabase.co",
  SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52a3BmcmVleWVtcnB4eG1xZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0OTI4OTgsImV4cCI6MjA5OTA2ODg5OH0.-NFAKJqS-Tzpwi0VSaeb0ibZWyUMirt_WnwKF-HSCrE",
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || "",
  BACKEND_URL: "http://localhost:8000",
  AUTO_ADD_CONFIDENCE_MIN: 55,
  AUTO_ADD_STABLE_FRAMES: 6,
  IS_ANDROID: Platform.OS === "android",
  IS_IOS: Platform.OS === "ios",
} as const;
