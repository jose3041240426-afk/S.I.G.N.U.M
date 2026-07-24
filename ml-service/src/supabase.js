import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[ml-service] SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function readAllSamples(type) {
  const allSamples = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("muestras_entrenamiento")
      .select("id_muestra, id_usuario, tipo, etiqueta, landmarks, metadatos")
      .eq("tipo", type)
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order("id_muestra", { ascending: true });

    if (error) throw new Error(`Error leyendo muestras: ${error.message}`);
    if (!data || data.length === 0) break;

    allSamples.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  return allSamples.map((s) => ({
    features: s.landmarks,
    label: s.etiqueta,
  }));
}

export async function getModelVersion(type) {
  const { data, error } = await supabase
    .from("modelos")
    .select("version")
    .eq("tipo", type)
    .order("id_modelo", { ascending: false })
    .limit(1);

  if (error) throw new Error(`Error leyendo versiones: ${error.message}`);

  const lastVersion = data?.[0]?.version;
  if (!lastVersion) return `${type}_v1`;

  const num = parseInt(lastVersion.match(/v(\d+)$/)?.[1] || "0", 10);
  return `${type}_v${num + 1}`;
}

export async function uploadModelToStorage(path, modelBuffer) {
  const { error } = await supabase.storage
    .from("modelos")
    .upload(path, modelBuffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) throw new Error(`Error subiendo modelo a Storage: ${error.message}`);

  const { data: urlData } = supabase.storage.from("modelos").getPublicUrl(path);

  return urlData?.publicUrl || path;
}

export async function saveModelMetadata(metadata) {
  const { error } = await supabase.from("modelos").insert({
    version: metadata.version,
    tipo: metadata.type,
    storage_path: metadata.storagePath,
    n_trees: metadata.nTrees,
    n_features: metadata.nFeatures,
    n_clases: metadata.nClasses,
    n_muestras: metadata.nSamples,
    clases: metadata.classes,
    accuracy: metadata.accuracy ?? null,
    precision_promedio: metadata.precisionAvg ?? null,
    recall_promedio: metadata.recallAvg ?? null,
    f1_score: metadata.f1Score ?? null,
    matriz_confusion: metadata.confusionMatrix ?? null,
    hiperparametros: metadata.hyperparams ?? {},
    tamanio_bytes: metadata.sizeBytes ?? null,
    activo: metadata.active ?? false,
  });

  if (error) throw new Error(`Error guardando metadatos: ${error.message}`);
}

export async function activateModel(modelId) {
  const { error } = await supabase.rpc("activar_modelo", {
    p_id_modelo: modelId,
  });

  if (error) throw new Error(`Error activando modelo: ${error.message}`);
}

export async function getLatestActiveModel(type) {
  const { data, error } = await supabase
    .from("modelos")
    .select("*")
    .eq("tipo", type)
    .eq("activo", true)
    .order("id_modelo", { ascending: false })
    .limit(1);

  if (error) throw new Error(`Error leyendo modelo activo: ${error.message}`);
  return data?.[0] || null;
}

export async function downloadModel(storagePath) {
  const { data, error } = await supabase.storage
    .from("modelos")
    .download(storagePath);

  if (error) throw new Error(`Error descargando modelo: ${error.message}`);
  return data;
}
