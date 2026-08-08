export function buildMediaPipeHTML(isMirrored: boolean, captureInterval: number, pointsColor: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>SIGNUM Camera</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  #container { position: relative; width: 100%; height: 100%; }
  video, canvas {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: cover;
  }
  video { visibility: hidden; }
  #status {
    position: absolute;
    top: 12px; left: 12px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-family: -apple-system, sans-serif;
    z-index: 10;
  }
</style>
</head>
<body>
<div id="container">
  <video id="video" autoplay playsinline muted></video>
  <canvas id="canvas"></canvas>
  <div id="status">Iniciando...</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs" type="module"></script>
<script type="module">
  const IS_MIRRORED = ${isMirrored};
  const CAPTURE_INTERVAL = ${captureInterval};
  const POINTS_COLOR = "${pointsColor}";

  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");

  const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17]
  ];

  let handLandmarker = null;
  let running = true;
  let lastDetectTime = 0;
  let lastSnapshot = null;

  function hexToContrast(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    return l > 0.5 ? "#000000" : "#ffffff";
  }

  function getPointsTextColor() {
    return hexToContrast(POINTS_COLOR);
  }

  async function init() {
    try {
      statusEl.textContent = "Solicitando cámara...";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 480 },
          height: { ideal: 360 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      statusEl.textContent = "Cargando modelo...";

      const modelTimeout = setTimeout(() => {
        if (!handLandmarker) {
          statusEl.textContent = "No se pudo cargar el modelo (sin conexión). Revisa tu red e intenta de nuevo.";
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: "No se pudo cargar el modelo de MediaPipe. Verifica tu conexión a internet." }));
        }
      }, 20000);

      const module = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs");
      const { HandLandmarker, FilesetResolver } = module;
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );
      const delegate = (typeof navigator !== "undefined" && navigator.gpu) ? "GPU" : "CPU";
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
          delegate: delegate,
        },
        numHands: 2,
        runningMode: "VIDEO",
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      clearTimeout(modelTimeout);
      statusEl.textContent = "Listo";
      setTimeout(() => { statusEl.style.display = "none"; }, 1000);
      scheduleNext();
    } catch (e) {
      console.error("init error", e);
      let msg = "Error de cámara";
      const name = e && (e.name || e.code);
      if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
        msg = "Permiso de cámara denegado. Actívalo en los ajustes del sistema y vuelve a intentarlo.";
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
        msg = "No se encontró cámara o no soporta la resolución solicitada.";
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        msg = "La cámara está en uso por otra app. Ciérrala e intenta de nuevo.";
      } else if (e && e.message) {
        msg = "Cámara: " + e.message;
      }
      statusEl.textContent = msg;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: msg }));
    }
  }

  function drawHand(landmarks, label, color, cw, ch) {
    const pts = landmarks.map((lm) => ({
      x: IS_MIRRORED ? (1 - lm.x) * cw : lm.x * cw,
      y: lm.y * ch,
    }));

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      ctx.stroke();
    }

    for (const pt of pts) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = POINTS_COLOR;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pt of pts) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const pad = 18;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
    ctx.setLineDash([]);

    ctx.font = "bold 16px sans-serif";
    const textW = ctx.measureText(label).width;
    const pillX = minX - pad;
    const pillY = minY - pad - 28;

    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(pillX, pillY, textW + 16, 24, 6);
    } else {
      ctx.rect(pillX, pillY, textW + 16, 24);
    }
    ctx.fill();

    ctx.fillStyle = getPointsTextColor();
    ctx.fillText(label, pillX + 8, pillY + 17);
  }

  let cachedResults = null;
  let frameCount = 0;
  const SNAPSHOT_EVERY = 8;
  let videoFrameCb = null;

  function postResult(detectionResult, withSnapshot) {
    const payload = {
      type: "detection",
      handDetected: detectionResult.handDetected,
      landmarks: detectionResult.landmarks,
      snapshot: null,
    };
    if (withSnapshot) {
      try { payload.snapshot = canvas.toDataURL("image/jpeg", 0.5); } catch {}
    }
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }

  function renderLoop() {
    if (!running) return;
    if (!ctx || video.readyState < 2) {
      scheduleNext();
      return;
    }

    const w = video.videoWidth || 480;
    const h = video.videoHeight || 360;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    ctx.save();
    if (IS_MIRRORED) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const now = performance.now();
    if (handLandmarker && now - lastDetectTime >= CAPTURE_INTERVAL) {
      try {
        cachedResults = handLandmarker.detectForVideo(video, now);
      } catch {}
      lastDetectTime = now;
    }

    let detectionResult;
    let handsDrawn = false;

    if (cachedResults && cachedResults.landmarks && cachedResults.landmarks.length > 0) {
      for (let i = 0; i < cachedResults.landmarks.length; i++) {
        const lms = cachedResults.landmarks[i];
        const handedness = cachedResults.handedness?.[i]?.[0];
        const isRightHand = handedness?.categoryName === "Right";
        const label = isRightHand ? "Derecha" : "Izquierda";
        const color = isRightHand ? "#4ade80" : POINTS_COLOR;
        drawHand(lms, label, color, canvas.width, canvas.height);
      }
      handsDrawn = true;

      const firstHand = cachedResults.landmarks[0];
      const baseX = firstHand[0].x;
      const baseY = firstHand[0].y;
      const baseZ = firstHand[0].z;

      const translated = [];
      let maxDist = 0;
      for (const lm of firstHand) {
        const dx = lm.x - baseX;
        const dy = lm.y - baseY;
        const dz = lm.z - baseZ;
        translated.push([dx, dy, dz]);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > maxDist) maxDist = dist;
      }
      if (maxDist === 0) maxDist = 1;

      const normalized = [];
      for (const [x, y, z] of translated) {
        normalized.push(x / maxDist, y / maxDist, z / maxDist);
      }

      detectionResult = {
        handDetected: true,
        landmarks: normalized,
        snapshot: null,
      };
    } else {
      detectionResult = {
        handDetected: false,
        landmarks: [],
        snapshot: null,
      };
    }

    if (detectionResult.handDetected !== undefined) {
      frameCount++;
      const withSnapshot = (frameCount % SNAPSHOT_EVERY) === 0 || detectionResult.handDetected !== true;
      postResult(detectionResult, withSnapshot);
    }

    scheduleNext();
  }

  function scheduleNext() {
    if (!running) return;
    if (video.requestVideoFrameCallback) {
      video.requestVideoFrameCallback(renderLoop);
    } else {
      requestAnimationFrame(renderLoop);
    }
  }

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ready" }));
  }

  window.addEventListener("message", (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === "stop") running = false;
      if (msg.type === "start") { running = true; scheduleNext(); }
    } catch {}
  });

  init();
</script>
</body>
</html>`;
}
