"use client";
import { useEffect, useState } from "react";
import { LiquidGlass } from "@/components/ui/LiquidGlass";
import { ELEVENLABS_VOICES } from "@/services/tts.service";
import { db } from "@/lib/db";

export default function AjustesPage() {
  const [isMirrored, setIsMirrored] = useState(true);
  const [autoAddConfidence, setAutoAddConfidence] = useState(55);
  const [autoAddStableFrames, setAutoAddStableFrames] = useState(6);
  const [ttsRate, setTtsRate] = useState(0.95);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [glassOpacity, setGlassOpacity] = useState(0.05);
  const [glassBorder, setGlassBorder] = useState(0);
  const [ttsProvider, setTtsProvider] = useState("native");
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState("pNInz6obpgDQGcFmaJgB");
  const [voiceListVisible, setVoiceListVisible] = useState(false);
  const [voiceListAnimation, setVoiceListAnimation] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [fontScale, setFontScale] = useState(1);
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [pointsColor, setPointsColor] = useState("#3b82f6");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [captureSpeed, setCaptureSpeed] = useState(60);

  // Load settings on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMirror = localStorage.getItem("isCameraMirrored");
      if (savedMirror !== null) setIsMirrored(savedMirror !== "false");

      const savedConf = localStorage.getItem("autoAddConfidence");
      if (savedConf) setAutoAddConfidence(parseInt(savedConf, 10));

      const savedFrames = localStorage.getItem("autoAddStableFrames");
      if (savedFrames) setAutoAddStableFrames(parseInt(savedFrames, 10));

      const savedRate = localStorage.getItem("ttsRate");
      if (savedRate) setTtsRate(parseFloat(savedRate));

      const savedPitch = localStorage.getItem("ttsPitch");
      if (savedPitch) setTtsPitch(parseFloat(savedPitch));

      const savedOpacity = localStorage.getItem("glassOpacity");
      if (savedOpacity) {
        setGlassOpacity(parseFloat(savedOpacity));
      } else {
        setGlassOpacity(0.05);
      }

      const savedBorder = localStorage.getItem("glassBorder");
      if (savedBorder) {
        setGlassBorder(parseInt(savedBorder, 10));
      }

      const savedProvider = localStorage.getItem("ttsProvider");
      if (savedProvider) setTtsProvider(savedProvider);

      const savedVoiceId = localStorage.getItem("elevenlabsVoiceId");
      if (savedVoiceId) setElevenlabsVoiceId(savedVoiceId);

      const savedFontScale = localStorage.getItem("fontScale");
      if (savedFontScale) setFontScale(parseFloat(savedFontScale));

      const savedColor = localStorage.getItem("primaryColor");
      if (savedColor) setPrimaryColor(savedColor);

      const savedPointsColor = localStorage.getItem("pointsColor");
      if (savedPointsColor) setPointsColor(savedPointsColor);

      const savedSpeed = localStorage.getItem("captureSpeed");
      if (savedSpeed) setCaptureSpeed(parseInt(savedSpeed, 10));
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isCameraMirrored", String(isMirrored));
      localStorage.setItem("autoAddConfidence", String(autoAddConfidence));
      localStorage.setItem("autoAddStableFrames", String(autoAddStableFrames));
      localStorage.setItem("ttsRate", String(ttsRate));
      localStorage.setItem("ttsPitch", String(ttsPitch));
      localStorage.setItem("glassOpacity", String(glassOpacity));
      localStorage.setItem("glassBorder", String(glassBorder));
      localStorage.setItem("ttsProvider", ttsProvider);
      localStorage.setItem("elevenlabsVoiceId", elevenlabsVoiceId);
      localStorage.setItem("fontScale", String(fontScale));
      localStorage.setItem("primaryColor", primaryColor);
      localStorage.setItem("pointsColor", pointsColor);
      localStorage.setItem("captureSpeed", String(captureSpeed));

      // Disparar evento para actualizar layout.tsx de inmediato en la misma pestaña
      window.dispatchEvent(new Event("glassOpacityChange"));
      window.dispatchEvent(new Event("glassBorderChange"));
      window.dispatchEvent(new Event("fontScaleChange"));
      window.dispatchEvent(new Event("primaryColorChange"));
      
      setSavedMessage("¡Configuración guardada correctamente!");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  };

  const handleClearCache = async () => {
    try {
      await db.clearAll();
      const keys = [
        "isCameraMirrored", "soundOnSeña", "autoAddActive", "preventRepeat",
        "autoAddConfidence", "autoAddStableFrames", "ttsRate", "ttsPitch",
        "glassOpacity", "glassBorder", "ttsProvider", "elevenlabsVoiceId",
        "fontScale", "primaryColor", "pointsColor", "captureSpeed",
      ];
      keys.forEach((k) => localStorage.removeItem(k));
      setIsMirrored(true);
      setAutoAddConfidence(55);
      setAutoAddStableFrames(6);
      setTtsRate(0.95);
      setTtsPitch(1.0);
      setGlassOpacity(0.05);
      setGlassBorder(0);
      setTtsProvider("native");
      setElevenlabsVoiceId("pNInz6obpgDQGcFmaJgB");
      setFontScale(1);
      setPrimaryColor("#3b82f6");
      setPointsColor("#3b82f6");
      setCaptureSpeed(60);
      window.dispatchEvent(new Event("glassOpacityChange"));
      window.dispatchEvent(new Event("glassBorderChange"));
      window.dispatchEvent(new Event("fontScaleChange"));
      window.dispatchEvent(new Event("primaryColorChange"));
      setSavedMessage("Caché limpiado y configuración restablecida");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch {
      setSavedMessage("Error al limpiar la caché");
      setTimeout(() => setSavedMessage(""), 3000);
    }
    setConfirmAction(null);
  };

  const handleResetLetters = async () => {
    try {
      await db.clearSamples();
      await db.deleteModel("rf-letter");
      await db.deleteModel("rf-word");
      await db.deleteModel("rf-dynamic");
      window.dispatchEvent(new Event("modelReset"));
      setSavedMessage("Modelo vaciado completamente");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch {
      setSavedMessage("Error al vaciar el modelo");
      setTimeout(() => setSavedMessage(""), 3000);
    }
    setConfirmAction(null);
  };

  const handleReset = () => {
    setIsMirrored(true);
    setAutoAddConfidence(55);
    setAutoAddStableFrames(6);
    setTtsRate(0.95);
    setTtsPitch(1.0);
    setGlassOpacity(0.05);
    setGlassBorder(0);
    setTtsProvider("native");
    setElevenlabsVoiceId("pNInz6obpgDQGcFmaJgB");
    setVoiceListVisible(false);
    setVoiceListAnimation("");

    if (typeof window !== "undefined") {
      localStorage.removeItem("isCameraMirrored");
      localStorage.removeItem("autoAddConfidence");
      localStorage.removeItem("autoAddStableFrames");
      localStorage.removeItem("ttsRate");
      localStorage.removeItem("ttsPitch");
      localStorage.removeItem("glassOpacity");
      localStorage.removeItem("glassBorder");
      localStorage.removeItem("ttsProvider");
      localStorage.removeItem("elevenlabsVoiceId");
      localStorage.removeItem("fontScale");
      localStorage.removeItem("primaryColor");
      localStorage.removeItem("pointsColor");
      localStorage.removeItem("captureSpeed");

      // Disparar evento para actualizar layout.tsx de inmediato en la misma pestaña
      window.dispatchEvent(new Event("glassOpacityChange"));
      window.dispatchEvent(new Event("glassBorderChange"));
      window.dispatchEvent(new Event("fontScaleChange"));
      window.dispatchEvent(new Event("primaryColorChange"));
      
      setSavedMessage("Configuración restablecida a valores por defecto");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  };

  return (
    <>
      <style>{`
        @keyframes alertSlideIn {
          0% { opacity: 0; transform: translateY(-8px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .save-btn {
          cursor: pointer;
          position: relative;
          padding: 14px 28px;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--color-primary-text, #ffffff);
          border: 2px solid var(--color-primary, #3b82f6);
          border-radius: 50px;
          background-color: transparent;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
          overflow: hidden;
          z-index: 0;
        }
        .save-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          margin: auto;
          width: 200px;
          height: 200px;
          border-radius: inherit;
          scale: 0;
          z-index: -1;
          background-color: var(--color-primary, #3b82f6);
          transition: all 1.5s cubic-bezier(0.23, 1, 0.320, 1);
        }
        .save-btn:hover::before {
          scale: 3;
        }
        .save-btn:hover {
          color: var(--color-primary-text, #ffffff);
          box-shadow: 0 0px 20px rgba(var(--color-primary-rgb, 59, 130, 246), 0.4);
        }
        .reset-btn {
          cursor: pointer;
          position: relative;
          padding: 10px 20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #fca5a5;
          border: 2px solid #ef4444;
          border-radius: 50px;
          background-color: transparent;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
          overflow: hidden;
          z-index: 0;
        }
        .reset-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          margin: auto;
          width: 50px;
          height: 50px;
          border-radius: inherit;
          scale: 0;
          z-index: -1;
          background-color: #ef4444;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.320, 1);
        }
        .reset-btn:hover::before {
          scale: 3;
        }
        .reset-btn:hover {
          color: var(--color-primary-text, #ffffff);
          scale: 1.1;
          box-shadow: 0 0px 20px rgba(239, 68, 68, 0.4);
        }
        .reset-btn:active {
          scale: 1;
        }
      `}</style>
    <div className="stagger" style={{ maxWidth: "650px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--text-color, #ffffff)" }}>
          Ajustes
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-color, rgba(255,255,255,0.8))", opacity: 0.85, marginTop: "4px" }}>
          Personaliza tu experiencia de traducción y voz en Signum
        </p>
      </div>

      <LiquidGlass style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Sección Cámara */}
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "1rem" }}>
            Configuración de Cámara
          </h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>Efecto Espejo</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", opacity: 0.7 }}>Refleja horizontalmente la transmisión de la cámara</p>
            </div>
            <input 
              type="checkbox" 
              checked={isMirrored}
              onChange={(e) => setIsMirrored(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
          </div>
          <div style={{ marginTop: "1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Velocidad de Captura: {captureSpeed}ms</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: 60ms (~16fps)</span>
            </div>
            <input 
              type="range" 
              className="custom-slider"
              min="20" 
              max="200" 
              value={captureSpeed}
              onChange={(e) => setCaptureSpeed(parseInt(e.target.value, 10))}
            />
            <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Intervalo entre detecciones (menor = más rápido, mayor = menos CPU).</p>
          </div>
        </div>

        {/* Sección Auto-Añadir */}
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "1.2rem" }}>
            Parámetros de Auto-Añadir
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Confianza Mínima: {autoAddConfidence}%</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: 55%</span>
              </div>
              <input 
                type="range" 
                className="custom-slider"
                min="30" 
                max="95" 
                value={autoAddConfidence}
                onChange={(e) => setAutoAddConfidence(parseInt(e.target.value, 10))}
              />
              <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Precisión requerida del modelo para registrar una seña.</p>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Fotogramas Estables: {autoAddStableFrames}</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: 6</span>
              </div>
              <input 
                type="range" 
                className="custom-slider"
                min="2" 
                max="20" 
                value={autoAddStableFrames}
                onChange={(e) => setAutoAddStableFrames(parseInt(e.target.value, 10))}
              />
              <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Frames consecutivos que la seña debe mantenerse para auto-añadirse.</p>
            </div>
          </div>
        </div>

        {/* Sección TTS */}
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "1.2rem" }}>
            Texto a Voz (TTS)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Velocidad: {ttsRate}x</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: 0.95x</span>
              </div>
              <input 
                type="range" 
                className="custom-slider"
                min="0.5" 
                max="2" 
                step="0.05"
                value={ttsRate}
                onChange={(e) => setTtsRate(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Tono (Pitch): {ttsPitch}</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: 1.0</span>
              </div>
              <input 
                type="range" 
                className="custom-slider"
                min="0.5" 
                max="2" 
                step="0.05"
                value={ttsPitch}
                onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
              />
            </div>

            {/* Proveedor TTS estilo glass-radio */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Motor de Voz</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: Navegador</span>
              </div>
              <div className="glass-radio-group-2">
                <input
                  type="radio"
                  name="tts-provider"
                  id="tts-native"
                  checked={ttsProvider === "native"}
                  onChange={() => {
                    if (voiceListVisible) {
                      setVoiceListAnimation("accordion-close");
                    }
                    setTtsProvider("native");
                  }}
                />
                <label htmlFor="tts-native">Navegador</label>

                <input
                  type="radio"
                  name="tts-provider"
                  id="tts-elevenlabs"
                  checked={ttsProvider === "elevenlabs"}
                  onChange={() => {
                    setTtsProvider("elevenlabs");
                    setVoiceListVisible(true);
                    setVoiceListAnimation("accordion-open");
                  }}
                />
                <label htmlFor="tts-elevenlabs">ElevenLabs</label>

                <div className="glass-glider" />
              </div>
            </div>

            {/* Selector de voz ElevenLabs */}
            {voiceListVisible && (
              <div
                className={voiceListAnimation}
                onAnimationEnd={() => {
                  if (voiceListAnimation === "accordion-close") {
                    setVoiceListVisible(false);
                    setVoiceListAnimation("");
                  }
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Voz ElevenLabs</span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Modelo multilingüe</span>
                </div>
                <p style={{ margin: "0 0 8px 0", fontSize: "0.75rem", opacity: 0.6 }}>
                  Voces con "(recomendado español)" se adaptan mejor al español latino con el modelo multilingüe.
                </p>
                <div className="voice-list">
                  {Object.entries(ELEVENLABS_VOICES).map(([id, name]) => (
                    <button
                      key={id}
                      className={`voice-option${id === elevenlabsVoiceId ? " selected" : ""}`}
                      onClick={() => setElevenlabsVoiceId(id)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección Apariencia (Transparencia) */}
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "1.2rem" }}>
            Apariencia de la Interfaz
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Opacidad del Vidrio: {Math.round(glassOpacity * 100)}%</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: 5%</span>
              </div>
              <input 
                type="range" 
                className="custom-slider"
                min="0.05" 
                max="0.95" 
                step="0.05"
                value={glassOpacity}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setGlassOpacity(v);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("glassOpacity", String(v));
                  }
                }}
                onPointerUp={() => {
                  window.dispatchEvent(new Event("glassOpacityChange"));
                }}
              />
              <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Ajusta la opacidad del efecto de vidrio esmerilado en los paneles.</p>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Grosor del Borde: {glassBorder}px</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: 0px</span>
              </div>
              <input
                type="range"
                className="custom-slider"
                min="0"
                max="10"
                step="1"
                value={glassBorder}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setGlassBorder(v);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("glassBorder", String(v));
                  }
                }}
                onPointerUp={() => {
                  window.dispatchEvent(new Event("glassBorderChange"));
                }}
              />
              <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Controla el grosor del borde de los paneles de vidrio.</p>
            </div>
          </div>
        </div>

        {/* Sección Apariencia - Tamaño de fuente */}
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "1.2rem" }}>
            Personalización Visual
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Tamaño de fuente: {Math.round(fontScale * 100)}%</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Por defecto: 100%</span>
              </div>
              <input
                type="range"
                className="custom-slider"
                min="0.7"
                max="1.5"
                step="0.05"
                value={fontScale}
                onChange={(e) => setFontScale(parseFloat(e.target.value))}
              />
              <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Escala todo el texto de la interfaz.</p>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Color principal</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Actual: {primaryColor}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: "48px", height: "48px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", background: "none" }}
                />
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Cambia el color de acento de la aplicación.</p>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Color de puntos</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Actual: {pointsColor}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input
                  type="color"
                  value={pointsColor}
                  onChange={(e) => setPointsColor(e.target.value)}
                  style={{ width: "48px", height: "48px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", background: "none" }}
                />
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Color de los puntos de referencia de la mano en la cámara.</p>
            </div>
          </div>
        </div>

        {/* Sección Mantenimiento */}
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "1.2rem" }}>
            Mantenimiento
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>Vaciar modelo</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", opacity: 0.7 }}>Elimina todas las letras, palabras y señas registradas</p>
              </div>
              {confirmAction === "resetLetters" ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setConfirmAction(null)} className="reset-btn" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Cancelar</button>
                  <button onClick={handleResetLetters} className="save-btn" style={{ padding: "6px 14px", fontSize: "0.8rem", color: "#fca5a5", border: "2px solid #ef4444" }}>Confirmar</button>
                </div>
              ) : (
                <button onClick={() => setConfirmAction("resetLetters")} className="reset-btn">Vaciar</button>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>Limpiar caché</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", opacity: 0.7 }}>Borra todos los datos guardados y restablece ajustes</p>
              </div>
              {confirmAction === "clearCache" ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setConfirmAction(null)} className="reset-btn" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Cancelar</button>
                  <button onClick={handleClearCache} className="save-btn" style={{ padding: "6px 14px", fontSize: "0.8rem", color: "#fca5a5", border: "2px solid #ef4444" }}>Confirmar</button>
                </div>
              ) : (
                <button onClick={() => setConfirmAction("clearCache")} className="reset-btn">Limpiar</button>
              )}
            </div>
          </div>
        </div>

        {savedMessage && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(16,185,129,0.25)",
              color: "#065f46",
              fontSize: "0.9rem",
              fontWeight: 600,
              textAlign: "center",
              border: "1px solid rgba(16,185,129,0.4)",
              animation: "alertSlideIn 0.4s ease",
            }}
          >
            {savedMessage}
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button
            onClick={handleReset}
            className="reset-btn"
          >
            Restablecer
          </button>
          <button
            onClick={handleSave}
            className="save-btn"
          >
            Guardar Cambios
          </button>
        </div>

      </LiquidGlass>
    </div>
    </>
  );
}
