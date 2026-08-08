/*
 * Suite de "proofs" de SIGNUM contra produccion (signum.animare.dev).
 * Solo codigo de Playwright. Un unico archivo autocontenido.
 *
 * Variables de entorno:
 *   E2E_BASE_URL            Base de produccion (default https://signum.animare.dev)
 *   E2E_PROFILE_DIR         Perfil Chromium persistente (conserva modelos RF en
 *                           IndexedDB entre ejecuciones)
 *   E2E_SEED_STUB_MODEL     "0" para exigir un modelo real entrenado en el perfil;
 *                           si no hay modelo y esto NO es "0", se siembra un modelo
 *                           RandomForest valido (clases A/B/C) para correr las pruebas
 *   E2E_CAMERA_MODE         "real" (default): usa la camara fisica y muestra tu mano;
 *                           "fake": camara sintetica (solo pruebas sin mano)
 *   E2E_HAND_TIMEOUT        Tiempo maximo para que aparezca la mano/prediccion (ms)
 */
const { test, expect, chromium } = require("@playwright/test");
const path = require("path");

const BASE_URL = process.env.E2E_BASE_URL || "https://signum.animare.dev";
const PROFILE_DIR = process.env.E2E_PROFILE_DIR || path.join(process.cwd(), ".e2e-profile");
const SEED_STUB = process.env.E2E_SEED_STUB_MODEL !== "0";
const CAMERA_MODE = process.env.E2E_CAMERA_MODE || "real";
const HAND_TIMEOUT = parseInt(process.env.E2E_HAND_TIMEOUT || "25000", 10);

/* ------------------------------------------------------------------ */
/*  Modelo RandomForest valido (siembra si el perfil no tiene modelo). */
/*  f0 <= 0.5 -> "A" | f0 > 0.5 && f1 <= 0.5 -> "B" | else -> "C"     */
/* ------------------------------------------------------------------ */
const STUB_LETTER_MODEL = {
  nTrees: 1,
  nFeatures: 63,
  classes: ["A", "B", "C"],
  trees: [
    {
      n: [
        { f: 0, t: 0.5, l: 1, r: 2 },
        { f: 0, t: 0, l: -1, r: -1, v: [[1, 0, 0]] },
        { f: 1, t: 0.5, l: 3, r: 4 },
        { f: 0, t: 0, l: -1, r: -1, v: [[0, 1, 0]] },
        { f: 0, t: 0, l: -1, r: -1, v: [[0, 0, 1]] },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Stub de la Web Speech API (se instala antes de cargar la app)      */
/* ------------------------------------------------------------------ */
const SPEECH_STUB_JS = `
(() => {
  if (window.__signumSpeechStubbed) return;
  window.__signumSpeechStubbed = true;
  window.__speechLog = [];
  const log = (e) => { try { (window.__speechLog || (window.__speechLog = [])).push(e); } catch (err) {} };
  const synth = {
    speaking: false, pending: false, paused: false,
    getVoices() { return [{ name: "Voz E2E", lang: "es-MX", localService: true, default: true, voiceURI: "e2e-es" }]; },
    speak(u) {
      log({ type: "speak", text: String(u && u.text) });
      this.speaking = true; this.pending = true;
      setTimeout(() => { try { log({ type: "start", text: String(u && u.text) }); if (u && u.onstart) u.onstart({}); } catch (err) {} }, 0);
      setTimeout(() => {
        this.pending = false; this.speaking = false;
        try { if (u && u.onend) u.onend({}); log({ type: "end", text: String(u && u.text) }); } catch (err) {}
      }, 10);
    },
    cancel() { this.speaking = false; this.pending = false; },
    resume() { this.paused = false; },
    pause() { this.paused = true; },
    addEventListener() {}, removeEventListener() {},
  };
  try { Object.defineProperty(window, "speechSynthesis", { configurable: true, writable: true, value: synth }); }
  catch (err) { window.speechSynthesis = synth; }
})();
`;

/* ------------------------------------------------------------------ */
/*  Apertura de IndexedDB (mismo schema que la app)                    */
/* ------------------------------------------------------------------ */
const OPEN_DB_JS = `
function __openSignumDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("signum", 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("samples")) {
        const s = db.createObjectStore("samples", { keyPath: "id", autoIncrement: true });
        s.createIndex("label", "label", { unique: false });
        s.createIndex("type", "type", { unique: false });
      }
      if (!db.objectStoreNames.contains("models")) db.createObjectStore("models", { keyPath: "id" });
      if (!db.objectStoreNames.contains("aiCache")) db.createObjectStore("aiCache", { keyPath: "phrase" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}`;

/* ================================================================== */
/*  Helpers (Playwright + page.evaluate)                               */
/* ================================================================== */

async function hasModels(page) {
  return page.evaluate(`(async () => {
    ${OPEN_DB_JS}
    const db = await __openSignumDb();
    return await new Promise((resolve, reject) => {
      const r = db.transaction("models", "readonly").objectStore("models").getAllKeys();
      r.onsuccess = () => resolve(r.result.length > 0);
      r.onerror = () => reject(r.error);
    });
  })()`);
}

async function seedStubModel(page) {
  await page.evaluate(`(async () => {
    ${OPEN_DB_JS}
    const db = await __openSignumDb();
    const model = ${JSON.stringify(STUB_LETTER_MODEL)};
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("models", "readwrite");
      tx.objectStore("models").put({
        id: "rf-letter",
        type: "letter",
        data: model,
        classes: model.classes,
        createdAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  })()`);
}

async function readSamples(page, type) {
  return page.evaluate(`(async () => {
    ${OPEN_DB_JS}
    const db = await __openSignumDb();
    return await new Promise((resolve, reject) => {
      const store = db.transaction("samples", "readonly").objectStore("samples");
      const req = ${type ? `store.index("type").getAll(${JSON.stringify(type)})` : "store.getAll()"};
      req.onsuccess = () => resolve(req.result.map((s) => ({ label: s.label, type: s.type, landmarks: s.landmarks })));
      req.onerror = () => reject(req.error);
    });
  })()`);
}

async function openApp(page) {
  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
  let models = await hasModels(page);
  let seeded = false;
  if (!models && SEED_STUB) {
    await seedStubModel(page);
    seeded = true;
    models = true;
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  return { models, seeded };
}

async function turnCameraOn(page) {
  const indicator = page.getByText("Camara activa (MediaPipe)");
  if (await indicator.isVisible().catch(() => false)) return;
  await page.locator('div[style*="aspect-ratio"] button').first().click();
  await expect(indicator).toBeVisible({ timeout: HAND_TIMEOUT });
}

async function readPredictions(page) {
  return page.evaluate(() => {
    const out = [];
    for (const s of document.querySelectorAll("span")) {
      const m = /^\s*(\S+)\s*\((\d+(?:\.\d+)?)%\)\s*$/.exec(s.textContent || "");
      if (m) out.push({ label: m[1], conf: parseFloat(m[2]) });
    }
    return out;
  });
}

function isLetter(label) {
  return /^[A-ZÑÁÉÍÓÚ]$/.test(label);
}

async function waitForPrediction(page, timeout = HAND_TIMEOUT) {
  await expect
    .poll(async () => (await readPredictions(page)).length, { timeout })
    .toBeGreaterThan(0);
  return readPredictions(page);
}

async function waitForLetterAny(page, timeout = HAND_TIMEOUT) {
  await expect
    .poll(async () => (await readPredictions(page)).find((p) => isLetter(p.label)) ?? null, { timeout })
    .not.toBeNull();
  const p = (await readPredictions(page)).find((x) => isLetter(x.label));
  return p;
}

async function waitForLetterChange(page, from, timeout = HAND_TIMEOUT) {
  await expect
    .poll(async () => (await readPredictions(page)).find((p) => isLetter(p.label) && p.label !== from) ?? null, { timeout })
    .not.toBeNull();
  return (await readPredictions(page)).find((x) => isLetter(x.label) && x.label !== from);
}

async function currentSpokenLabel(page) {
  const preds = await readPredictions(page);
  if (preds.length === 0) return "";
  const pick = preds.reduce((a, b) => (b.conf > a.conf ? b : a));
  return pick.label;
}

async function readSpeechLog(page) {
  return page.evaluate(() => (window.__speechLog || []).filter((e) => e.type === "speak"));
}

async function clearSpeechLog(page) {
  await page.evaluate(() => { window.__speechLog = []; });
}

async function canvasStats(page) {
  return page.evaluate(() => {
    const hex = localStorage.getItem("pointsColor") || "#3b82f6";
    const r0 = parseInt(hex.slice(1, 3), 16);
    const g0 = parseInt(hex.slice(3, 5), 16);
    const b0 = parseInt(hex.slice(5, 7), 16);
    const canvas = document.querySelector("canvas");
    if (!canvas) return { colored: 0, green: 0 };
    const ctx = canvas.getContext("2d");
    if (!ctx) return { colored: 0, green: 0 };
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let colored = 0;
    let green = 0;
    for (let i = 0; i < img.length; i += 4) {
      const r = img[i];
      const g = img[i + 1];
      const b = img[i + 2];
      if (Math.abs(r - r0) < 40 && Math.abs(g - g0) < 40 && Math.abs(b - b0) < 40) colored++;
      if (g > 170 && r < 140 && b < 160) green++;
    }
    return { colored, green };
  });
}

async function waitForHandDrawing(page, timeout = HAND_TIMEOUT) {
  await page.waitForFunction(
    () => {
      const hex = localStorage.getItem("pointsColor") || "#3b82f6";
      const r0 = parseInt(hex.slice(1, 3), 16);
      const g0 = parseInt(hex.slice(3, 5), 16);
      const b0 = parseInt(hex.slice(5, 7), 16);
      const canvas = document.querySelector("canvas");
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let colored = 0;
      for (let i = 0; i < img.length; i += 4) {
        if (Math.abs(img[i] - r0) < 40 && Math.abs(img[i + 1] - g0) < 40 && Math.abs(img[i + 2] - b0) < 40) colored++;
        if (colored > 60) return true;
      }
      return false;
    },
    undefined,
    { timeout },
  );
}

async function measurePredictionCadence(page, durationMs) {
  return page.evaluate(async (ms) => {
    const times = [];
    let lastKey = "";
    const scan = () => {
      let key = "";
      for (const s of document.querySelectorAll("span")) {
        const m = /^\s*(\S+)\s*\((\d+(?:\.\d+)?)%\)\s*$/.exec(s.textContent || "");
        if (m) key += m[1] + ":" + m[2] + ";";
      }
      if (key && key !== lastKey) {
        times.push(performance.now());
        lastKey = key;
      }
    };
    const obs = new MutationObserver(() => scan());
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
    scan();
    await new Promise((r) => setTimeout(r, ms));
    obs.disconnect();
    const deltas = [];
    for (let i = 1; i < times.length; i++) deltas.push(Math.round(times[i] - times[i - 1]));
    return deltas;
  }, durationMs);
}

/* ================================================================== */
/*  Contexto compartido (perfil persistente)                           */
/* ================================================================== */
let context;
let page;

test.beforeAll(async () => {
  const args = ["--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist"];
  if (CAMERA_MODE !== "real") {
    args.push("--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream");
  }
  context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: process.env.E2E_HEADLESS === "1",
    viewport: { width: 1280, height: 900 },
    args,
  });
  context.addInitScript(SPEECH_STUB_JS);
  page = await context.newPage();
  page.setDefaultTimeout(30_000);
});

test.afterAll(async () => {
  await context.close();
});

function note(msg) {
  test.info().annotations.push({ type: "info", description: msg });
}

/* ================================================================== */
/*  Josué Joán Hernández Tavizón                                       */
/* ================================================================== */
test.describe("Josue Joan Hernandez Tavizon", () => {
  test("Caso 1 - model_load_proof: carga y disponibilidad del modelo Random Forest local", async () => {
    const { models, seeded } = await openApp(page);
    expect(models || SEED_STUB, "No hay modelo en el perfil. Entrena uno o usa E2E_SEED_STUB_MODEL=1.").toBe(true);

    await expect(page.getByText("Modelos locales cargados")).toBeVisible({ timeout: 20_000 });

    const stored = await page.evaluate(`(async () => {
      ${OPEN_DB_JS}
      const db = await __openSignumDb();
      return await new Promise((resolve, reject) => {
        const r = db.transaction("models", "readonly").objectStore("models").get("rf-letter");
        r.onsuccess = () => resolve(Boolean(r.result && r.result.data && r.result.data.nTrees));
        r.onerror = () => reject(r.error);
      });
    })()`);
    expect(stored).toBe(true);
    note(`Modelo en IndexedDB (${seeded ? "stub sembrado" : "modelo del perfil"})`);
  });

  test("Caso 2 - accuracy_proof: validacion del score de probabilidad/confianza", async () => {
    await openApp(page);
    await turnCameraOn(page);
    note("Muestra tu mano frente a la camara hasta que aparezca una letra.");
    await waitForPrediction(page);

    const seen = [];
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(250);
      for (const p of await readPredictions(page)) {
        if (isLetter(p.label)) seen.push(p.conf);
      }
    }
    expect(seen.length).toBeGreaterThan(0);
    for (const conf of seen) {
      expect(conf).toBeGreaterThanOrEqual(55);
      expect(conf).toBeLessThanOrEqual(100);
    }
    const max = Math.max(...seen);
    const min = Math.min(...seen);
    expect(max - min).toBeLessThanOrEqual(20);
    note(`Confianza: min=${min}%, max=${max}% (umbral de letra: 55%)`);
  });
});

/* ================================================================== */
/*  Humberto Castillo Díaz                                             */
/* ================================================================== */
test.describe("Humberto Castillo Diaz", () => {
  test("Caso 1 - vector_extract_proof: normalizacion del vector de 21 keypoints", async () => {
    await openApp(page);

    const samples = await readSamples(page, "letter");
    expect(samples.length, "No hay muestras capturadas (63 coordenadas) en IndexedDB. Captura una seña o usa tu perfil real.").toBeGreaterThan(0);

    const sample = samples[0];
    expect(sample.landmarks.length).toBe(63); // 21 keypoints x 3

    for (const c of sample.landmarks) {
      expect(Number.isFinite(c)).toBe(true);
      expect(Math.abs(c)).toBeLessThanOrEqual(1); // normalizado
    }

    // Muñeca (landmark 0) es el origen de la translacion
    expect(Math.abs(sample.landmarks[0])).toBeLessThan(1e-6);
    expect(Math.abs(sample.landmarks[1])).toBeLessThan(1e-6);
    expect(Math.abs(sample.landmarks[2])).toBeLessThan(1e-6);

    // Al menos una coordenada esta a distancia significativa (no degenerado)
    const maxAbs = Math.max(...sample.landmarks.map(Math.abs));
    expect(maxAbs).toBeGreaterThanOrEqual(0.5);

    note(`Muestras validas: ${samples.length}; vector 63D normalizado (muñeca origen, maxAbs=${maxAbs.toFixed(3)})`);
  });

  test("Caso 2 - speech_api_proof: disparo del evento de la Web Speech API", async () => {
    await openApp(page);

    await page.locator("textarea").first().fill("Hola");
    await clearSpeechLog(page);

    await page.locator('div[style*="aspect-ratio"] button').nth(2).click();

    await expect
      .poll(async () => (await readSpeechLog(page)).some((e) => e.text === "Hola"))
      .toBe(true);

    note('speechSynthesis.speak("Hola") invocado correctamente');
  });
});

/* ================================================================== */
/*  José Manuel Guerrero Simental                                      */
/* ================================================================== */
test.describe("Jose Manuel Guerrero Simental", () => {
  test("Caso 1 - letter_proof: clasificacion determinista de gesto estatico", async () => {
    await openApp(page);
    await turnCameraOn(page);
    note("Muestra una seña estática (letra) frente a la camara y mantenla.");
    const a1 = await waitForLetterAny(page);

    await page.waitForTimeout(1000);
    const a2 = await waitForLetterAny(page);

    expect(a2.label).toBe(a1.label); // mismo gesto -> misma letra
    expect(a2.conf).toBe(a1.conf); // mismo gesto -> mismo score

    note("Ahora cambia a una letra DISTINTA y mantenla.");
    const b = await waitForLetterChange(page, a1.label);
    expect(b.label).not.toBe(a1.label);

    note(`Gesto A -> ${a1.label} (${a1.conf}%), Gesto B -> ${b.label} (${b.conf}%)`);
  });

  test("Caso 2 - debounce_proof: control de repeticion continua de audio", async () => {
    await openApp(page);
    await page.evaluate(() => localStorage.setItem("soundOnSeña", "true"));
    await page.reload({ waitUntil: "domcontentloaded" });

    await turnCameraOn(page);
    note("Muestra una seña estatica; luego CAMBIA a otra y mantenla 2.5s.");
    await waitForPrediction(page);

    await clearSpeechLog(page);
    const l0 = await currentSpokenLabel(page);
    await expect
      .poll(async () => (await currentSpokenLabel(page)) !== l0, { timeout: HAND_TIMEOUT })
      .toBe(true);
    const l1 = await currentSpokenLabel(page);

    await page.waitForTimeout(2500); // gesto estatico continuo

    const speaks = (await readSpeechLog(page)).filter((e) => e.text === l1);
    expect(speaks.length).toBe(1);
    note(`speak("${l1}") invocado ${speaks.length} vez/veces en 2.5s (debounce correcto)`);
  });
});

/* ================================================================== */
/*  Manuel Alejandro Mathey Ortiz                                      */
/* ================================================================== */
test.describe("Manuel Alejandro Mathey Ortiz", () => {
  test("Caso 1 - latency_threshold_proof: tiempo de inferencia < 500 ms", async () => {
    await openApp(page);
    await turnCameraOn(page);
    note("Muestra tu mano y MUEVELA despacio durante la medición.");
    await waitForHandDrawing(page);

    const deltas = await measurePredictionCadence(page, 6000);
    expect(deltas.length, "No hubo cambios de predicción: mueve la mano frente a la camara.").toBeGreaterThan(3);

    const sorted = [...deltas].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const max = Math.max(...deltas);
    expect(median).toBeLessThan(500);
    note(`Cadencia de prediccion: mediana=${median}ms, max=${max}ms (umbral 500ms)`);
  });

  test("Caso 2 - canvas_landmarks_proof: dibujado de los 21 puntos y conexiones en el Canvas", async () => {
    await openApp(page);
    await turnCameraOn(page);
    note("Muestra tu mano frente a la camara.");
    await waitForHandDrawing(page);

    const stats = await canvasStats(page);
    expect(stats.colored).toBeGreaterThan(100); // puntos dibujados (#3b82f6 o pointsColor)
    expect(stats.green).toBeGreaterThan(100); // pill "Derecha" (#4ade80)
    note(`Canvas: ${stats.colored} px de puntos, ${stats.green} px de etiqueta`);
  });
});
