import "dotenv/config";
import express from "express";
import cors from "cors";
import { trainRandomForest } from "./rf-trainer.js";
import { evaluateModel, trainTestSplit } from "./evaluate.js";
import {
  readAllSamples,
  getModelVersion,
  uploadModelToStorage,
  saveModelMetadata,
  activateModel,
} from "./supabase.js";

const PORT = process.env.PORT || 8000;
const RF_N_TREES = parseInt(process.env.RF_N_TREES || "50", 10);
const RF_MAX_DEPTH = parseInt(process.env.RF_MAX_DEPTH || "15", 10);
const RF_MIN_SAMPLES_LEAF = parseInt(process.env.RF_MIN_SAMPLES_LEAF || "2", 10);

const VALID_TYPES = ["letter", "word", "dynamic"];

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/ml/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "signum-ml-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// POST /ml/train
// Body: { type: "letter"|"word"|"dynamic", hyperparams?: {...}, activate?: boolean }
app.post("/ml/train", async (req, res) => {
  const startTime = Date.now();

  try {
    const { type, hyperparams = {}, activate = false } = req.body;

    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `El campo "type" es requerido. Valores válidos: ${VALID_TYPES.join(", ")}`,
      });
    }

    // Leer muestras desde Supabase
    console.log(`[train] ${type}: leyendo muestras de Supabase...`);
    const samples = await readAllSamples(type);

    if (samples.length < 10) {
      return res.status(400).json({
        error: `Muestras insuficientes (${samples.length}). Se necesitan al menos 10.`,
      });
    }

    const labels = [...new Set(samples.map((s) => s.label))];
    if (labels.length < 2) {
      return res.status(400).json({
        error: `Se necesitan al menos 2 clases diferentes. Solo hay: ${labels.join(", ")}`,
      });
    }

    console.log(`[train] ${type}: ${samples.length} muestras, ${labels.length} clases`);

    // Train/test split para evaluación
    const { train, test } = trainTestSplit(samples, 0.2);

    // Hiperparámetros
    const options = {
      nTrees: hyperparams.nTrees ?? RF_N_TREES,
      maxDepth: hyperparams.maxDepth ?? RF_MAX_DEPTH,
      minSamplesLeaf: hyperparams.minSamplesLeaf ?? RF_MIN_SAMPLES_LEAF,
      maxFeatures: hyperparams.maxFeatures ?? undefined,
    };

    console.log(`[train] ${type}: entrenando con ${train.length} muestras...`);
    const model = trainRandomForest(train, options);

    // Evaluación
    console.log(`[train] ${type}: evaluando con ${test.length} muestras...`);
    const metrics = evaluateModel(model, test);

    // Versionado
    const version = await getModelVersion(type);
    const storagePath = `${type}/${version}.json`;
    const modelJson = JSON.stringify(model);
    const modelBuffer = Buffer.from(modelJson, "utf-8");

    // Subir modelo a Storage
    console.log(`[train] ${type}: subiendo ${version} a Storage...`);
    await uploadModelToStorage(storagePath, modelBuffer);

    // Guardar metadatos
    console.log(`[train] ${type}: guardando metadatos...`);
    await saveModelMetadata({
      version,
      type,
      storagePath,
      nTrees: model.nTrees,
      nFeatures: model.nFeatures,
      nClasses: model.classes.length,
      nSamples: samples.length,
      classes: model.classes,
      accuracy: metrics.accuracy,
      precisionAvg: metrics.precisionAvg,
      recallAvg: metrics.recallAvg,
      f1Score: metrics.f1Score,
      confusionMatrix: metrics.confusionMatrix,
      hyperparams: options,
      sizeBytes: modelBuffer.length,
      active: false,
    });

    // Activar si se solicita
    if (activate) {
      await activateModel(version);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[train] ${type}: completado en ${elapsed}s (${version})`);

    res.json({
      success: true,
      version,
      type,
      metrics,
      samples: { total: samples.length, train: train.length, test: test.length },
      elapsed: `${elapsed}s`,
      modelSummary: {
        nTrees: model.nTrees,
        nFeatures: model.nFeatures,
        classes: model.classes,
      },
    });
  } catch (error) {
    console.error(`[train] Error:`, error);
    res.status(500).json({
      error: error.message || "Error interno durante el entrenamiento",
    });
  }
});

// Error handling
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`[server] Signum ML Service iniciado en puerto ${PORT}`);
  console.log(`[server] Hiperparámetros default: nTrees=${RF_N_TREES}, maxDepth=${RF_MAX_DEPTH}, minSamplesLeaf=${RF_MIN_SAMPLES_LEAF}`);
});
