import { supabase } from "@/lib/supabase";
import { ENV } from "@/lib/env";

export function getAuthErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  const name = err?.name;
  const status = err?.status;
  const raw = typeof err?.message === "string" ? err.message : "";
  const isEmptyish = !raw.trim() || raw.trim() === "{}";
  if (name === "AuthRetryableFetchError" || status === 0 || isEmptyish) {
    return "No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.";
  }
  return raw || fallback;
}

export async function probeSupabaseConnectivity(): Promise<string> {
  try {
    const res = await fetch(`${ENV.SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: ENV.SUPABASE_ANON_KEY },
    });
    return `fetch OK: HTTP ${res.status}`;
  } catch (e: any) {
    return `fetch FALLÓ: ${e?.name || "Error"}: ${e?.message || "(sin mensaje)"}`;
  }
}

export async function signUp(
  email: string,
  password: string,
  nombre: string,
  apellido_paterno: string,
  apellido_materno: string,
  id_genero: number,
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellido_paterno,
        apellido_materno,
        id_genero,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("No se pudo crear el usuario. Verifica que el correo SMTP esté bien configurado.");

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getGeneros() {
  const { data, error } = await supabase
    .from("catalogo_generos")
    .select("*")
    .order("id_genero");
  if (error) throw error;
  return data;
}

export async function getRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("id_rol");
  if (error) throw error;
  return data;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*, catalogo_generos(genero)")
    .eq("id_usuario", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No se encontró el perfil del usuario. Es posible que la cuenta no tenga un registro en la base de datos.");
  return data;
}

export async function getUserRoles(userId: string) {
  const { data, error } = await supabase
    .from("usuario_roles")
    .select("*, roles(nombre_rol)")
    .eq("id_usuario", userId);
  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: { nombre: string; apellido_paterno: string; apellido_materno?: string; id_genero: number },
) {
  const { data, error } = await supabase
    .from("usuarios")
    .update(updates)
    .eq("id_usuario", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from("avances")
    .select("*")
    .eq("id_usuario", userId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getUserTranslations(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from("traducciones")
    .select("*, catalogo_tipo_traduccion(tipo)")
    .eq("id_usuario", userId)
    .order("fecha_hora", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getUserLogins(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from("login")
    .select("*")
    .eq("id_usuario", userId)
    .order("fecha_hora", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function recordTranslation(
  userId: string,
  id_tipo: number,
  texto_original: string,
  texto_traducido: string,
  precision: number = 0,
) {
  const { error: transError } = await supabase.from("traducciones").insert({
    id_usuario: userId,
    id_tipo,
    texto_original,
    texto_traducido,
    precision,
  });

  if (transError) throw transError;

  const today = new Date().toISOString().split("T")[0];

  const { data: avanceData, error: avanceError } = await supabase
    .from("avances")
    .select("*")
    .eq("id_usuario", userId)
    .eq("fecha", today)
    .single();

  if (avanceError && avanceError.code !== "PGRST116") {
    throw avanceError;
  }

  if (!avanceData) {
    const { error: insertError } = await supabase.from("avances").insert({
      id_usuario: userId,
      fecha: today,
      traducciones_realizadas: 1,
      tiempo_uso_minutos: 0,
      precision_promedio: precision,
    });
    if (insertError) throw insertError;
  } else {
    const currentCount = avanceData.traducciones_realizadas || 0;
    const currentAvg = avanceData.precision_promedio || 0;
    const newAvg = Math.round(((currentAvg * currentCount + precision) / (currentCount + 1)) * 10) / 10;

    const { error: updateError } = await supabase
      .from("avances")
      .update({
        traducciones_realizadas: currentCount + 1,
        precision_promedio: newAvg,
      })
      .eq("id_avance", avanceData.id_avance);

    if (updateError) throw updateError;
  }
}
export async function recordActiveTime(userId: string, minutesToAdd: number = 1) {
  const today = new Date().toISOString().split("T")[0];

  const { data: avanceData, error: avanceError } = await supabase
    .from("avances")
    .select("*")
    .eq("id_usuario", userId)
    .eq("fecha", today)
    .single();

  if (avanceError && avanceError.code !== "PGRST116") {
    throw avanceError;
  }

  if (!avanceData) {
    await supabase.from("avances").insert({
      id_usuario: userId,
      fecha: today,
      traducciones_realizadas: 0,
      tiempo_uso_minutos: minutesToAdd,
    });
  } else {
    await supabase
      .from("avances")
      .update({
        tiempo_uso_minutos: (avanceData.tiempo_uso_minutos || 0) + minutesToAdd,
      })
      .eq("id_avance", avanceData.id_avance);
  }
}

export interface EvaluacionData {
  resolucion: string;
  iluminacion: string;
  distancia: string;
  p4_uso_frecuente: number | null;
  p5_complicado: number | null;
  p6_facil_interactuar: number | null;
  p7_necesita_ayuda: number | null;
  p8_traduccion_natural: number | null;
  voz_satisfaccion: number | null;
  esfuerzo_mental: string;
  dispositivo: string;
  navegador: string;
  experiencia_previa: string;
  problemas: string;
  sugerencias: string;
  experiencia_general: number | null;
  recomendaria: string;
  facil_aprender: number | null;
  util_educativo: number | null;
  funcion_mas_util: string;
  senas_dificiles: string;
}

export async function saveEvaluation(data: EvaluacionData) {
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error("Debes iniciar sesión para enviar la evaluación.");
  if (!userRes?.user) throw new Error("Debes iniciar sesión para enviar la evaluación.");

  const userId = userRes.user.id;

  const { error: perfilError } = await supabase
    .from("usuarios")
    .upsert(
      {
        id_usuario: userId,
        nombre: (userRes.user.user_metadata?.nombre as string) || "",
        apellido_paterno: (userRes.user.user_metadata?.apellido_paterno as string) || "",
        apellido_materno: (userRes.user.user_metadata?.apellido_materno as string) || "",
        correo: userRes.user.email || "",
        id_genero: Number(userRes.user.user_metadata?.id_genero) || 1,
      },
      { onConflict: "id_usuario" },
    );

  if (perfilError && perfilError.code !== "23505") {
    throw perfilError;
  }

  const { error } = await supabase.from("evaluaciones").insert({
    id_usuario: userId,
    ...data,
  });

  if (error) throw error;
}
