import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[supabase] Variables de entorno faltantes en el cliente:",
    { hasUrl: Boolean(supabaseUrl), hasKey: Boolean(supabaseAnonKey) },
  );
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export const supabaseConfig = {
  url: supabaseUrl,
  hasKey: Boolean(supabaseAnonKey),
};
