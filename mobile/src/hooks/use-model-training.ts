import { useState } from "react";
import { db, type SignType } from "@/lib/db";
import { trainRandomForest } from "@/services/rf-trainer";
import type { RFModel } from "@/services/rf-inference";
import {
  checkEligibility, uploadSamples, downloadModelFromStorage,
  hasCollaborativeModel, type EligibilityCheck, type UploadResult,
} from "@/services/collaborative.service";

async function trainForType(type: SignType): Promise<{ model: RFModel; classes: string[]; total: number }> {
  const samples = await db.getSamplesByType(type);
  if (samples.length === 0) throw new Error(`No hay muestras de tipo "${type}" para entrenar.`);
  const labels = [...new Set(samples.map((s) => s.label))];
  if (labels.length < 2) throw new Error(`Se necesitan al menos 2 clases diferentes. Solo hay: ${labels.join(", ")}`);
  const trainingData = samples.map((s) => ({ features: s.landmarks, label: s.label }));
  const model = trainRandomForest(trainingData, { nTrees: 50, maxDepth: 15 });
  let modelId = "rf-letter";
  if (type === "word") modelId = "rf-word";
  if (type === "dynamic") modelId = "rf-dynamic";
  await db.saveModel({ id: modelId, type, data: model, classes: model.classes });
  return { model, classes: model.classes, total: samples.length };
}

export function useModelTraining() {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState("");
  const [isTrainingWords, setIsTrainingWords] = useState(false);
  const [trainingWordsMessage, setTrainingWordsMessage] = useState("");
  const [isTrainingDynamic, setIsTrainingDynamic] = useState(false);
  const [trainingDynamicMessage, setTrainingDynamicMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);

  const trainLetters = async (): Promise<RFModel | null> => {
    setIsTraining(true);
    setTrainingMessage("Entrenando clasificador de letras...");
    try {
      const { model, classes, total } = await trainForType("letter");
      setTrainingMessage(`Modelo entrenado con ${total} muestras. Clases: ${classes.join(", ")}`);
      return model;
    } catch (e: any) {
      if (e.message.includes("No hay muestras")) setTrainingMessage("");
      else setTrainingMessage(`Fallo en letras: ${e.message}`);
      return null;
    } finally { setIsTraining(false); }
  };
  const trainWords = async (): Promise<RFModel | null> => {
    setIsTrainingWords(true);
    setTrainingWordsMessage("Entrenando clasificador de palabras...");
    try {
      const { model, classes, total } = await trainForType("word");
      setTrainingWordsMessage(`Modelo de palabras entrenado con ${total} muestras. Clases: ${classes.join(", ")}`);
      return model;
    } catch (e: any) {
      if (e.message.includes("No hay muestras")) setTrainingWordsMessage("");
      else setTrainingWordsMessage(`Fallo en palabras: ${e.message}`);
      return null;
    } finally { setIsTrainingWords(false); }
  };
  const trainDynamic = async (): Promise<RFModel | null> => {
    setIsTrainingDynamic(true);
    setTrainingDynamicMessage("Entrenando clasificador de señas dinámicas...");
    try {
      const { model, classes, total } = await trainForType("dynamic");
      setTrainingDynamicMessage(`Modelo dinámico entrenado con ${total} muestras. Clases: ${classes.join(", ")}`);
      return model;
    } catch (e: any) {
      if (e.message.includes("No hay muestras")) setTrainingDynamicMessage("");
      else setTrainingDynamicMessage(`Fallo en dinámicas: ${e.message}`);
      return null;
    } finally { setIsTrainingDynamic(false); }
  };

  const checkEligibilityForType = async (type: SignType) => {
    const result = await checkEligibility(type);
    setEligibility(result);
    return result;
  };
  const uploadToCollaborative = async (type: SignType): Promise<UploadResult | null> => {
    setIsUploading(true);
    const label = type === "letter" ? "letras" : type === "word" ? "palabras" : "senas dinamicas";
    setUploadMessage(`Verificando y subiendo ${label}...`);
    try {
      const el = await checkEligibility(type);
      if (!el.eligible) { setUploadMessage(`No elegible: ${el.reason}`); return null; }
      const result = await uploadSamples(type);
      if (result.success) setUploadMessage(`Subido: ${result.uploaded} muestras. Rechazadas: ${result.rejected} (baja confianza: ${result.rejectedLowConf})`);
      else setUploadMessage("No se subio ninguna muestra (todas rechazadas por baja confianza)");
      return result;
    } catch (e: any) { setUploadMessage(`Error: ${e.message}`); return null; } finally { setIsUploading(false); }
  };
  const downloadCollaborativeModel = async (type: SignType) => {
    setIsDownloading(true);
    const label = type === "letter" ? "letras" : type === "word" ? "palabras" : "senas dinamicas";
    setDownloadMessage(`Buscando modelo comunitario de ${label}...`);
    try {
      const result = await downloadModelFromStorage(type);
      if (result) setDownloadMessage(`Modelo ${result.version} descargado (${result.classes.length} clases)`);
      else setDownloadMessage("No hay modelo comunitario disponible aun");
      return result;
    } catch (e: any) { setDownloadMessage(`Error: ${e.message}`); return null; } finally { setIsDownloading(false); }
  };
  const checkHasCollaborative = async (type: SignType) => hasCollaborativeModel(type);

  return {
    isTraining, trainingMessage, trainLetters,
    isTrainingWords, trainingWordsMessage, trainWords,
    isTrainingDynamic, trainingDynamicMessage, trainDynamic,
    isUploading, uploadMessage, uploadToCollaborative,
    isDownloading, downloadMessage, downloadCollaborativeModel,
    eligibility, checkEligibilityForType, checkHasCollaborative,
  };
}
