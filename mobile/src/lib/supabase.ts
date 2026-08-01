import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "./env";

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error(
    "[supabase] Variables de entorno faltantes:",
    { hasUrl: Boolean(ENV.SUPABASE_URL), hasKey: Boolean(ENV.SUPABASE_ANON_KEY) },
  );
}

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const supabaseConfig = {
  url: ENV.SUPABASE_URL,
  hasKey: Boolean(ENV.SUPABASE_ANON_KEY),
};
