import { supabase } from "@/lib/supabase";
import { db, type SignType } from "@/lib/db";
import { RandomForestPredictor } from "@/services/rf-inference";

const MIN_SAMPLES_TOTAL = 50;
const MIN_CLASSES = 5;
const MIN_CONFIDENCE = 70;

export interface EligibilityCheck {
  eligible: boolean;
  type: SignType;
  totalSamples: number;
  totalClasses: number;
  classes: string[];
  missingSamples: number;
  missingClasses: number;
  reason?: string;
}

export interface UploadResult {
  success: boolean;
  type: SignType;
  uploaded: number;
  rejected: number;
  rejectedLowConf: number;
  errors: number;
}

async function validateSample(
  predictor: RandomForestPredictor | null,
  sample: { landmarks: number[]; label: string; type: SignType },
): Promise<boolean> {
  if (!predictor || !predictor.isLoaded()) return true;
  if (predictor.model!.nFeatures !== sample.landmarks.length) return false;
  const result = predictor.predict(sample.landmarks);
  if (!result) return false;
  return result.label === sample.label && result.confidence >= MIN_CONFIDENCE;
}

export async function checkEligibility(type: SignType): Promise<EligibilityCheck> {
  const samples = await db.getSamplesByType(type);
  const classes = [...new Set(samples.map((s) => s.label))];

  const missingSamples = Math.max(0, MIN_SAMPLES_TOTAL - samples.length);
  const missingClasses = Math.max(0, MIN_CLASSES - classes.length);

  const eligible = missingSamples === 0 && missingClasses === 0;

  let reason: string | undefined;
  if (!eligible) {
    const parts: string[] = [];
    if (missingSamples > 0) parts.push(`faltan ${missingSamples} muestras`);
    if (missingClasses > 0) parts.push(`faltan ${missingClasses} clases`);
    reason = parts.join(" y ");
  }

  return {
    eligible,
    type,
    totalSamples: samples.length,
    totalClasses: classes.length,
    classes: classes.sort(),
    missingSamples,
    missingClasses,
    reason,
  };
}

export async function uploadSamples(type: SignType): Promise<UploadResult> {
  const result: UploadResult = {
    success: false,
    type,
    uploaded: 0,
    rejected: 0,
    rejectedLowConf: 0,
    errors: 0,
  };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Debes iniciar sesion para contribuir");

  const userId = userData.user.id;

  const modelId =
    type === "letter" ? "rf-letter" : type === "word" ? "rf-word" : "rf-dynamic";

  const stored = await db.getModel(modelId);
  const predictor = new RandomForestPredictor();
  if (stored?.data) {
    predictor.loadFromModel(stored.data as any);
  }

  const samples = await db.getSamplesByType(type);

  const batchSize = 50;
  for (let i = 0; i < samples.length; i += batchSize) {
    const batch = samples.slice(i, i + batchSize);

    const validRows: any[] = [];
    for (const sample of batch) {
      const isValid = await validateSample(predictor, {
        landmarks: sample.landmarks,
        label: sample.label,
        type: sample.type,
      });

      if (isValid) {
        validRows.push({
          id_usuario: userId,
          tipo: sample.type,
          etiqueta: sample.label,
          landmarks: sample.landmarks,
          metadatos: { source: "user_upload", validated: true },
        });
        result.uploaded++;
      } else {
        result.rejectedLowConf++;
        result.rejected++;
      }
    }

    if (validRows.length > 0) {
      const { error } = await supabase
        .from("muestras_entrenamiento")
        .insert(validRows);

      if (error) {
        result.errors += validRows.length;
        console.error(`Error subiendo lote ${type}:`, error.message);
      }
    }
  }

  result.success = result.uploaded > 0;

  return result;
}

export async function downloadModelFromStorage(
  type: SignType,
): Promise<{ version: string; modelId: string; classes: string[] } | null> {
  const { data: models, error } = await supabase
    .from("modelos")
    .select("*")
    .eq("tipo", type)
    .eq("activo", true)
    .order("id_modelo", { ascending: false })
    .limit(1);

  if (error || !models || models.length === 0) return null;

  const activeModel = models[0];
  const { data: blob, error: dlError } = await supabase.storage
    .from("modelos")
    .download(activeModel.storage_path);

  if (dlError || !blob) return null;

  const modelJson = await blob.text();
  const modelData = JSON.parse(modelJson);

  const modelId =
    type === "letter" ? "rf-letter" : type === "word" ? "rf-word" : "rf-dynamic";

  await db.saveModel({
    id: modelId,
    type,
    data: modelData,
    classes: activeModel.clases,
  });

  return {
    version: activeModel.version,
    modelId,
    classes: activeModel.clases,
  };
}

export async function hasCollaborativeModel(type: SignType): Promise<boolean> {
  const { data, error } = await supabase
    .from("modelos")
    .select("version")
    .eq("tipo", type)
    .eq("activo", true)
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
