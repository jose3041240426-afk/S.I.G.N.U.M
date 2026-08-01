"use client";
import React, { useEffect, useRef, useState } from "react";
import ColorsPanel, { ColorsPanelHandle } from "@/components/ui/ColorsPanel";
import { ELEVENLABS_VOICES } from "@/services/tts.service";
import { db } from "@/lib/db";

type TabKey = "camara" | "autoAdd" | "tts" | "apariencia" | "mantenimiento";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "camara",
    label: "Cámara",
    icon: (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path fill="currentColor" d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m8 3a5 5 0 0 0-5 5a5 5 0 0 0 5 5a5 5 0 0 0 5-5a5 5 0 0 0-5-5m0 2a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3" />
      </svg>
    ),
  },
  {
    key: "autoAdd",
    label: "Auto-Añadir",
    icon: (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path fill="currentColor" d="M11 15H6l7-14v8h5l-7 14z" />
      </svg>
    ),
  },
  {
    key: "tts",
    label: "Voz",
    icon: (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path fill="currentColor" fillRule="evenodd" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m.308-5.192l.849.849A7.98 7.98 0 0 0 15.5 12c0-2.21-.895-4.21-2.343-5.657l-.849.849A6.77 6.77 0 0 1 14.3 12c0 1.83-.724 3.54-1.992 4.808m-1.98-1.98l.849.849A5.18 5.18 0 0 0 12.7 12a5.18 5.18 0 0 0-1.523-3.677l-.849.849A3.98 3.98 0 0 1 11.5 12a3.98 3.98 0 0 1-1.172 2.828m-1.13-1.13A2.4 2.4 0 0 0 9.9 12c0-.663-.269-1.263-.703-1.697L7.5 12l1.697 1.697z" />
      </svg>
    ),
  },
  {
    key: "apariencia",
    label: "Apariencia",
    icon: (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path fill="currentColor" d="M12 22q-2.05 0-3.875-.788t-3.187-2.15t-2.15-3.187T2 12q0-2.075.813-3.9t2.2-3.175T8.25 2.788T12.2 2q2 0 3.775.688t3.113 1.9t2.125 2.875T22 11.05q0 2.875-1.75 4.413T16 17h-1.85q-.225 0-.312.125t-.088.275q0 .3.375.863t.375 1.287q0 1.25-.687 1.85T12 22m-4.425-9.425Q8 12.15 8 11.5t-.425-1.075T6.5 10t-1.075.425T5 11.5t.425 1.075T6.5 13t1.075-.425m3-4Q11 8.15 11 7.5t-.425-1.075T9.5 6t-1.075.425T8 7.5t.425 1.075T9.5 9t1.075-.425m5 0Q16 8.15 16 7.5t-.425-1.075T14.5 6t-1.075.425T13 7.5t.425 1.075T14.5 9t1.075-.425m3 4Q19 12.15 19 11.5t-.425-1.075T17.5 10t-1.075.425T16 11.5t.425 1.075T17.5 13t1.075-.425" />
      </svg>
    ),
  },
  {
    key: "mantenimiento",
    label: "Mantenimiento",
    icon: (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path fill="currentColor" d="m22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9c-2-2-5-2.4-7.4-1.3L9 6L6 9L1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4" />
      </svg>
    ),
  },
];

export default function AjustesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("camara");
  const [isMirrored, setIsMirrored] = useState(true);
  const [autoAddConfidence, setAutoAddConfidence] = useState(55);
  const [autoAddStableFrames, setAutoAddStableFrames] = useState(6);
  const [ttsRate, setTtsRate] = useState(0.95);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [glassBorder, setGlassBorder] = useState(0);
  const [ttsProvider, setTtsProvider] = useState("native");
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState("pNInz6obpgDQGcFmaJgB");
  const [savedMessage, setSavedMessage] = useState("");
  const [fontScale, setFontScale] = useState(1);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [captureSpeed, setCaptureSpeed] = useState(60);
  const [tabDirection, setTabDirection] = useState<"left" | "right">("right");
  const colorsPanelRef = useRef<ColorsPanelHandle>(null);

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

      const savedBorder = localStorage.getItem("glassBorder");
      if (savedBorder) setGlassBorder(parseInt(savedBorder, 10));

      const savedProvider = localStorage.getItem("ttsProvider");
      if (savedProvider) setTtsProvider(savedProvider);

      const savedVoiceId = localStorage.getItem("elevenlabsVoiceId");
      if (savedVoiceId) setElevenlabsVoiceId(savedVoiceId);

      const savedFontScale = localStorage.getItem("fontScale");
      if (savedFontScale) setFontScale(parseFloat(savedFontScale));

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
      localStorage.setItem("glassBorder", String(glassBorder));
      localStorage.setItem("ttsProvider", ttsProvider);
      localStorage.setItem("elevenlabsVoiceId", elevenlabsVoiceId);
      localStorage.setItem("fontScale", String(fontScale));
      localStorage.setItem("captureSpeed", String(captureSpeed));

      window.dispatchEvent(new Event("glassBorderChange"));
      window.dispatchEvent(new Event("fontScaleChange"));

      colorsPanelRef.current?.save();

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
        "fontScale", "captureSpeed",
      ];
      keys.forEach((k) => localStorage.removeItem(k));
      setIsMirrored(true);
      setAutoAddConfidence(55);
      setAutoAddStableFrames(6);
      setTtsRate(0.95);
      setTtsPitch(1.0);
      setGlassBorder(0);
      setTtsProvider("native");
      setElevenlabsVoiceId("pNInz6obpgDQGcFmaJgB");
      setFontScale(1);
      setCaptureSpeed(60);
      window.dispatchEvent(new Event("glassBorderChange"));
      window.dispatchEvent(new Event("fontScaleChange"));
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
    setGlassBorder(0);
    setTtsProvider("native");
    setElevenlabsVoiceId("pNInz6obpgDQGcFmaJgB");
    setFontScale(1);
    setCaptureSpeed(60);

    if (typeof window !== "undefined") {
      localStorage.removeItem("isCameraMirrored");
      localStorage.removeItem("autoAddConfidence");
      localStorage.removeItem("autoAddStableFrames");
      localStorage.removeItem("ttsRate");
      localStorage.removeItem("ttsPitch");
      localStorage.removeItem("glassBorder");
      localStorage.removeItem("ttsProvider");
      localStorage.removeItem("elevenlabsVoiceId");
      localStorage.removeItem("fontScale");
      localStorage.removeItem("captureSpeed");

      window.dispatchEvent(new Event("glassBorderChange"));
      window.dispatchEvent(new Event("fontScaleChange"));

      setSavedMessage("Configuración restablecida a valores por defecto");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  };

  const handleTabChange = (newTab: TabKey) => {
    const currentIdx = TABS.findIndex((t) => t.key === activeTab);
    const newIdx = TABS.findIndex((t) => t.key === newTab);
    setTabDirection(newIdx > currentIdx ? "right" : "left");
    setActiveTab(newTab);
  };

  const activeTabIndex = TABS.findIndex((t) => t.key === activeTab);

  return (
    <>
      <style>{`
        @keyframes containerPopIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes slideFromRight {
          0% { opacity: 0; transform: translateX(30px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideFromLeft {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes toastBounce {
          0% { opacity: 0; transform: translateY(-14px) scale(0.94); }
          60% { opacity: 1; transform: translateY(3px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes confirmPop {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }

        .aj-root {
          max-width: 1040px;
          width: 95%;
          margin: 0 auto;
          height: calc(100vh - 160px);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          animation: containerPopIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* ─── Main Card ─── */
        .aj-card {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow:
            0 20px 50px -14px rgba(0, 0, 0, 0.18),
            0 10px 20px -6px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* ─── Tab Bar ─── */
        .aj-tabs {
          display: flex;
          gap: 0;
          padding: 12px 20px 0 20px;
          background: rgba(241, 245, 249, 0.6);
          border-bottom: 1px solid #e2e8f0;
          position: relative;
          flex-shrink: 0;
        }

        .aj-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 14px 8px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #64748b;
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          transition: color 0.25s ease;
        }

        .aj-tab:hover {
          color: #334155;
        }

        .aj-tab.active {
          color: #0f172a;
        }

        .aj-tab-icon {
          font-size: 1.05rem;
          transition: transform 0.2s ease;
        }

        .aj-tab.active .aj-tab-icon {
          transform: scale(1.15);
        }

        .aj-tab-indicator {
          position: absolute;
          bottom: 0;
          height: 3px;
          background: linear-gradient(90deg, #0f172a, #334155);
          border-radius: 3px 3px 0 0;
          transition: left 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ─── Tab Content ─── */
        .aj-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 2.5rem 3.5rem;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .aj-panel {
          animation-duration: 0.35s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .aj-panel.from-right { animation-name: slideFromRight; }
        .aj-panel.from-left  { animation-name: slideFromLeft;  }

        /* ─── Form Elements ─── */
        .aj-label {
          font-size: 0.92rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.55rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .aj-label-center {
          font-size: 0.92rem;
          font-weight: 600;
          color: #1e293b;
          text-align: center;
          margin-bottom: 0.7rem;
        }

        .aj-hint {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 6px;
        }

        .aj-badge {
          font-size: 0.78rem;
          font-weight: 700;
          color: #0284c7;
          background: #e0f2fe;
          padding: 3px 12px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        /* ─── Slider ─── */
        .aj-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 40px;
          background: #1e293b;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          outline: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.25s ease;
        }

        .aj-slider:hover {
          background: #0f172a;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.22);
        }

        .aj-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 0; height: 0;
          box-shadow: -9999px 0 0 9999px var(--color-primary, #38bdf8);
        }

        .aj-slider::-moz-range-thumb {
          width: 0; height: 0;
          border: none;
          box-shadow: -9999px 0 0 9999px var(--color-primary, #38bdf8);
        }

        /* ─── Grid ─── */
        .aj-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }

        .aj-grid-apariencia {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2.5rem;
          align-items: stretch;
        }

        /* ─── Toggle (iOS style) ─── */
        .aj-toggle-wrap {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 30px;
        }

        .aj-toggle-input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .aj-toggle-rail {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #cbd5e1;
          border-radius: 30px;
          transition: background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .aj-toggle-rail::before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 5px rgba(0,0,0,0.18);
        }

        .aj-toggle-input:checked + .aj-toggle-rail {
          background-color: #0f172a;
        }

        .aj-toggle-input:checked + .aj-toggle-rail::before {
          transform: translateX(22px);
        }

        /* ─── Segmented Control ─── */
        .aj-segmented {
          display: flex;
          width: 100%;
          height: 50px;
          background: #f1f5f9;
          border-radius: 25px;
          padding: 4px;
          position: relative;
          border: 1px solid #e2e8f0;
        }

        .aj-seg-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.92rem;
          color: #64748b;
          z-index: 2;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: color 0.3s ease, transform 0.15s ease;
        }

        .aj-seg-option.active-text { color: #ffffff; }

        .aj-seg-option:active { transform: scale(0.97); }

        .aj-seg-glider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          width: calc(50% - 4px);
          background: linear-gradient(135deg, #0f172a, #1e293b);
          border-radius: 21px;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
        }

        .aj-seg-glider.native { transform: translateX(0%); }
        .aj-seg-glider.elevenlabs { transform: translateX(calc(100% + 4px)); }

        /* ─── Maintenance Buttons ─── */
        .aj-maint-btn {
          position: relative;
          overflow: hidden;
          z-index: 0;
          background: #ffffff;
          color: var(--color-primary, #315cfd);
          border: 2px solid var(--color-primary, #315cfd);
          border-radius: 18px;
          padding: 0.9rem 1.5rem;
          font-size: 1.4rem;
          font-weight: 800;
          width: 100%;
          cursor: pointer;
          text-transform: lowercase;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .aj-maint-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          margin: auto;
          width: 200px;
          height: 200px;
          border-radius: inherit;
          scale: 0;
          z-index: -1;
          background-color: var(--color-primary, #315cfd);
          transition: all 0.5s cubic-bezier(0.23, 1, 0.320, 1);
        }

        .aj-maint-btn:hover::before {
          scale: 2.5;
        }

        .aj-maint-btn:hover {
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(var(--color-primary-rgb, 49, 92, 253), 0.3);
        }

        .aj-maint-btn:active {
          transform: translateY(0) scale(0.97);
        }

        .aj-maint-btn.confirm {
          background: #ef4444;
          color: #ffffff;
          border-color: #ef4444;
          animation: confirmPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .aj-maint-btn.confirm::before {
          background-color: #dc2626;
        }

        .aj-maint-desc {
          text-align: center;
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 8px;
        }

        /* ─── Action Row ─── */
        .aj-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          flex-shrink: 0;
        }

        .aj-btn-save {
          cursor: pointer;
          padding: 7px 18px;
          font-size: 0.85em;
          font-weight: 600;
          color: var(--color-primary, #315cfd);
          border: 2px solid var(--color-primary, #315cfd);
          border-radius: 45px;
          background: #ffffff;
          transition: all 0.3s ease;
        }

        .aj-btn-save:hover {
          background: var(--color-primary, #315cfd);
          color: #ffffff;
          font-size: 0.95em;
        }

        .aj-btn-save:active { transform: scale(0.97); }

        .aj-btn-reset {
          cursor: pointer;
          padding: 7px 18px;
          font-size: 0.85em;
          font-weight: 600;
          color: var(--color-primary, #315cfd);
          border: 2px solid var(--color-primary, #315cfd);
          border-radius: 45px;
          background: #ffffff;
          transition: all 0.3s ease;
        }

        .aj-btn-reset:hover {
          background: var(--color-primary, #315cfd);
          color: #ffffff;
          font-size: 0.95em;
        }

        .aj-btn-reset:active { transform: scale(0.97); }

        /* ─── Toast ─── */
        .aj-toast {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 28px;
          border-radius: 50px;
          background: #0f172a;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.4);
          animation: toastBounce 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 1000;
        }

        @media (max-width: 768px) {
          .aj-root { width: 100%; height: calc(100vh - 120px); }
          .aj-body { padding: 1.5rem 1.3rem; }
          .aj-grid-2, .aj-grid-apariencia { grid-template-columns: 1fr; gap: 1.5rem; }
          .aj-tab { font-size: 0.75rem; padding: 10px 4px; }
          .aj-tab-icon { font-size: 0.9rem; }
        }
      `}</style>

      {savedMessage && (
        <div className="aj-toast" key={savedMessage}>{savedMessage}</div>
      )}

      <div className="aj-root">
        <div className="aj-card">
          {/* ─── Tab Bar ─── */}
          <div className="aj-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`aj-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <span className="aj-tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
            <div
              className="aj-tab-indicator"
              style={{
                left: `${(activeTabIndex / TABS.length) * 100}%`,
                width: `${100 / TABS.length}%`,
              }}
            />
          </div>

          {/* ─── Tab Content ─── */}
          <div className="aj-body">

            {/* ── Cámara ── */}
            {activeTab === "camara" && (
              <div className={`aj-panel ${tabDirection === "right" ? "from-right" : "from-left"}`} key="camara">
                <div>
                  <div className="aj-label">
                    <span>Velocidad de Captura</span>
                    <span className="aj-badge">{captureSpeed} ms</span>
                  </div>
                  <input
                    type="range"
                    className="aj-slider"
                    min="20"
                    max="200"
                    value={captureSpeed}
                    onChange={(e) => setCaptureSpeed(parseInt(e.target.value, 10))}
                  />
                  <p className="aj-hint">Intervalo entre detecciones. Menor = más rápido, mayor = menos CPU. Por defecto: 60ms (~16fps)</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem 0", borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem", color: "#1e293b" }}>Efecto Espejo</p>
                    <p className="aj-hint" style={{ marginTop: 2 }}>Refleja horizontalmente la transmisión de la cámara</p>
                  </div>
                  <label className="aj-toggle-wrap">
                    <input
                      type="checkbox"
                      className="aj-toggle-input"
                      checked={isMirrored}
                      onChange={(e) => setIsMirrored(e.target.checked)}
                    />
                    <span className="aj-toggle-rail" />
                  </label>
                </div>
              </div>
            )}

            {/* ── Auto-Añadir ── */}
            {activeTab === "autoAdd" && (
              <div className={`aj-panel ${tabDirection === "right" ? "from-right" : "from-left"}`} key="autoAdd">
                <div>
                  <div className="aj-label">
                    <span>Confianza Mínima</span>
                    <span className="aj-badge">{autoAddConfidence}%</span>
                  </div>
                  <input
                    type="range"
                    className="aj-slider"
                    min="30"
                    max="95"
                    value={autoAddConfidence}
                    onChange={(e) => setAutoAddConfidence(parseInt(e.target.value, 10))}
                  />
                  <p className="aj-hint">Precisión requerida del modelo para registrar una seña. Por defecto: 55%</p>
                </div>

                <div>
                  <div className="aj-label">
                    <span>Fotogramas Estables</span>
                    <span className="aj-badge">{autoAddStableFrames}</span>
                  </div>
                  <input
                    type="range"
                    className="aj-slider"
                    min="2"
                    max="20"
                    value={autoAddStableFrames}
                    onChange={(e) => setAutoAddStableFrames(parseInt(e.target.value, 10))}
                  />
                  <p className="aj-hint">Frames consecutivos que la seña debe mantenerse para auto-añadirse. Por defecto: 6</p>
                </div>
              </div>
            )}

            {/* ── Voz (TTS) ── */}
            {activeTab === "tts" && (
              <div className={`aj-panel ${tabDirection === "right" ? "from-right" : "from-left"}`} key="tts">
                <div className="aj-grid-2">
                  <div>
                    <div className="aj-label">
                      <span>Velocidad</span>
                      <span className="aj-badge">{ttsRate}x</span>
                    </div>
                    <input
                      type="range"
                      className="aj-slider"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={ttsRate}
                      onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <div className="aj-label">
                      <span>Tono</span>
                      <span className="aj-badge">{ttsPitch}</span>
                    </div>
                    <input
                      type="range"
                      className="aj-slider"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={ttsPitch}
                      onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <div className="aj-label-center">Motor de Voz</div>
                  <div className="aj-segmented">
                    <div className={`aj-seg-glider ${ttsProvider}`} />
                    <button
                      type="button"
                      className={`aj-seg-option ${ttsProvider === "native" ? "active-text" : ""}`}
                      onClick={() => setTtsProvider("native")}
                    >
                      Navegador
                    </button>
                    <button
                      type="button"
                      className={`aj-seg-option ${ttsProvider === "elevenlabs" ? "active-text" : ""}`}
                      onClick={() => setTtsProvider("elevenlabs")}
                    >
                      ElevenLabs
                    </button>
                  </div>
                </div>

                {ttsProvider === "elevenlabs" && (
                  <div style={{ animation: "slideFromRight 0.3s ease" }}>
                    <div className="aj-label"><span>Voz ElevenLabs</span></div>
                    <div className="voice-list" style={{ borderRadius: "16px", maxHeight: "180px" }}>
                      {Object.entries(ELEVENLABS_VOICES).map(([id, name]) => (
                        <button
                          key={id}
                          type="button"
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
            )}

            {/* ── Apariencia ── */}
            {activeTab === "apariencia" && (
              <div className={`aj-panel ${tabDirection === "right" ? "from-right" : "from-left"}`} key="apariencia">
                <div className="aj-grid-apariencia" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div>
                    <div className="aj-label">
                      <span>Grosor del Borde</span>
                      <span className="aj-badge">{glassBorder}px</span>
                    </div>
                    <input
                      type="range"
                      className="aj-slider"
                      min="0"
                      max="10"
                      step="1"
                      value={glassBorder}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setGlassBorder(v);
                        localStorage.setItem("glassBorder", String(v));
                        document.documentElement.style.setProperty("--glass-border", v + "px solid rgba(255, 255, 255, 0.3)");
                        window.dispatchEvent(new Event("glassBorderChange"));
                      }}
                    />
                  </div>
                  <div>
                    <div className="aj-label">
                      <span>Tamaño de Fuente</span>
                      <span className="aj-badge">{Math.round(fontScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      className="aj-slider"
                      min="0.7"
                      max="1.5"
                      step="0.05"
                      value={fontScale}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setFontScale(v);
                        localStorage.setItem("fontScale", String(v));
                        window.dispatchEvent(new Event("fontScaleChange"));
                      }}
                    />
                  </div>

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem" }}>
                    <ColorsPanel ref={colorsPanelRef} inline onClose={() => {}} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Mantenimiento ── */}
            {activeTab === "mantenimiento" && (
              <div className={`aj-panel ${tabDirection === "right" ? "from-right" : "from-left"}`} key="mantenimiento">
                <div className="aj-grid-2">
                  <div>
                    <div className="aj-label-center">Vaciar Modelo</div>
                    {confirmAction === "resetLetters" ? (
                      <div style={{ display: "flex", gap: "8px", animation: "confirmPop 0.25s ease" }}>
                        <button type="button" onClick={() => setConfirmAction(null)} className="aj-maint-btn" style={{ fontSize: "0.9rem", padding: "0.8rem" }}>cancelar</button>
                        <button type="button" onClick={handleResetLetters} className="aj-maint-btn confirm" style={{ fontSize: "0.9rem", padding: "0.8rem" }}>confirmar</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmAction("resetLetters")} className="aj-maint-btn">vaciar</button>
                    )}
                    <p className="aj-maint-desc">Elimina todas las letras, palabras y señas registradas</p>
                  </div>

                  <div>
                    <div className="aj-label-center">Limpiar Caché</div>
                    {confirmAction === "clearCache" ? (
                      <div style={{ display: "flex", gap: "8px", animation: "confirmPop 0.25s ease" }}>
                        <button type="button" onClick={() => setConfirmAction(null)} className="aj-maint-btn" style={{ fontSize: "0.9rem", padding: "0.8rem" }}>cancelar</button>
                        <button type="button" onClick={handleClearCache} className="aj-maint-btn confirm" style={{ fontSize: "0.9rem", padding: "0.8rem" }}>confirmar</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmAction("clearCache")} className="aj-maint-btn">vaciar</button>
                    )}
                    <p className="aj-maint-desc">Borra todos los datos guardados y restablece ajustes</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="aj-actions">
          <button type="button" onClick={handleReset} className="aj-btn-reset">Restablecer</button>
          <button type="button" onClick={handleSave} className="aj-btn-save">Guardar Cambios</button>
        </div>
      </div>
    </>
  );
}
