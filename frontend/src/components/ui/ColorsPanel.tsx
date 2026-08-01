"use client";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Modal } from "@/components/ui/modal";

interface ColorsModalProps {
  open?: boolean;
  onClose: () => void;
  inline?: boolean;
}

export interface ColorsPanelHandle {
  save: () => void;
}

const ColorsPanel = forwardRef<ColorsPanelHandle, ColorsModalProps>(function ColorsPanel(
  { open = false, onClose, inline = false },
  ref
) {
  const [primaryColor, setPrimaryColorState] = useState("#3b82f6");
  const [pointsColor, setPointsColorState] = useState("#3b82f6");
  const [generalText, setGeneralText] = useState("auto");
  const [containerText, setContainerText] = useState("auto");
  const [savedMessage, setSavedMessage] = useState("");

  const isActive = inline || open;

  useEffect(() => {
    if (!isActive) return;
    setPrimaryColorState(localStorage.getItem("primaryColor") || "#3b82f6");
    setPointsColorState(localStorage.getItem("pointsColor") || "#3b82f6");
    const gt = localStorage.getItem("generalTextColor");
    setGeneralText(gt === "#000000" ? "negro" : gt === "#ffffff" ? "blanco" : "auto");
    const ct = localStorage.getItem("containerTextColor");
    setContainerText(ct === "#000000" ? "negro" : ct === "#ffffff" ? "blanco" : "auto");
  }, [isActive]);

  const handleSave = () => {
    localStorage.setItem("primaryColor", primaryColor);
    localStorage.setItem("pointsColor", pointsColor);
    if (generalText === "auto") localStorage.removeItem("generalTextColor");
    else if (generalText === "blanco") localStorage.setItem("generalTextColor", "#ffffff");
    else localStorage.setItem("generalTextColor", "#000000");
    if (containerText === "auto") localStorage.removeItem("containerTextColor");
    else if (containerText === "blanco") localStorage.setItem("containerTextColor", "#ffffff");
    else localStorage.setItem("containerTextColor", "#000000");
    window.dispatchEvent(new Event("primaryColorChange"));
    window.dispatchEvent(new Event("generalTextColorChange"));
    window.dispatchEvent(new Event("containerTextColorChange"));
    setSavedMessage("¡Colores guardados correctamente!");
    setTimeout(() => {
      setSavedMessage("");
      if (!inline) onClose();
    }, 1200);
  };

  useImperativeHandle(ref, () => ({ save: handleSave }), [primaryColor, pointsColor, generalText, containerText, inline, onClose]);

  const content = (
    <>
      <p style={{ fontSize: "0.9rem", opacity: 0.7, marginTop: 0, marginBottom: "1.2rem" }}>
        Personaliza los colores de la interfaz
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div className="color-section">
          <div className="color-section-label">Color principal</div>
          <div className="color-picker-row">
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColorState(e.target.value)} />
            <span className="color-hex-label">{primaryColor}</span>
          </div>
          <div className="color-desc">Color de acento de la aplicación.</div>
        </div>

        <div className="color-section">
          <div className="color-section-label">Color de puntos</div>
          <div className="color-picker-row">
            <input type="color" value={pointsColor} onChange={(e) => setPointsColorState(e.target.value)} />
            <span className="color-hex-label">{pointsColor}</span>
          </div>
          <div className="color-desc">Color de los puntos de referencia de la mano en la cámara.</div>
        </div>

        <div className="color-section">
          <div className="color-section-label">Color de texto general (fuera de contenedores)</div>
          <div className="color-btn-row">
            {["auto", "blanco", "negro"].map((opt) => (
              <button
                key={opt}
                onClick={() => setGeneralText(opt)}
                className="color-option-btn"
                data-selected={generalText === opt}
              >
                {opt === "auto" ? "Auto" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
          <div className="color-desc">Títulos, subtítulos, textos fuera de los paneles.</div>
        </div>

        <div className="color-section">
          <div className="color-section-label">Color de texto en contenedores</div>
          <div className="color-btn-row">
            {["auto", "blanco", "negro"].map((opt) => (
              <button
                key={opt}
                onClick={() => setContainerText(opt)}
                className="color-option-btn"
                data-selected={containerText === opt}
              >
                {opt === "auto" ? "Auto" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
          <div className="color-desc">Textos dentro de los paneles de vidrio, modales de estadísticas y ajustes.</div>
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
            }}
          >
            {savedMessage}
          </div>
        )}

        {!inline && (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button
              onClick={onClose}
              className="signum-btn signum-btn--sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="signum-btn signum-btn--sm"
            >
              Guardar Colores
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (inline) {
    return <div style={{ color: "#1e293b" }}>{content}</div>;
  }

  return (
    <Modal open={open} onClose={onClose} title="Colores">
      {content}
    </Modal>
  );
});

export default ColorsPanel;
