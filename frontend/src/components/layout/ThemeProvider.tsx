"use client";
import { useEffect } from "react";

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

function contrastText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  return l > 0.5 ? "#000000" : "#ffffff";
}

const SOFT_BG = `linear-gradient(135deg, color-mix(in srgb, rgb(%primary%) 50%, #080816 50%) 0%, color-mix(in srgb, rgb(%primary%) 75%, #080816 25%) 30%, rgb(%primary%) 50%, color-mix(in srgb, rgb(%primary%) 75%, #080816 25%) 70%, color-mix(in srgb, rgb(%primary%) 50%, #080816 50%) 100%)`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const primaryColor = localStorage.getItem("primaryColor") || "#3b82f6";
    const pointsColor = localStorage.getItem("pointsColor") || "#3b82f6";
    const fontScale = parseFloat(localStorage.getItem("fontScale") || "1");
    const generalTextColor = localStorage.getItem("generalTextColor");
    const containerTextColor = localStorage.getItem("containerTextColor");

    document.documentElement.style.setProperty("--color-primary", primaryColor);
    document.documentElement.style.setProperty("--color-primary-rgb", hexToRgb(primaryColor));
    document.documentElement.style.setProperty("--color-primary-dark", primaryColor);
    document.documentElement.style.setProperty("--color-primary-light", primaryColor + "aa");
    document.documentElement.style.setProperty("--color-primary-text", contrastText(primaryColor));
    document.documentElement.style.setProperty("--color-points", pointsColor);
    document.documentElement.style.setProperty("--color-points-rgb", hexToRgb(pointsColor));
    document.documentElement.style.setProperty("--color-points-text", contrastText(pointsColor));

    const generalText = generalTextColor || "#ffffff";
    const containerText = containerTextColor || "#000000";
    document.documentElement.style.setProperty("--general-text-color", generalText);
    document.documentElement.style.setProperty("--container-text-color", containerText);
    document.documentElement.style.setProperty("--text-color", generalText);
    document.documentElement.style.setProperty("--menu-bg", generalText === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)");
    document.documentElement.style.setProperty("--font-scale", String(fontScale));

    document.body.style.setProperty("background", SOFT_BG.replace(/%primary%/g, hexToRgb(primaryColor)), "important");

    if (fontScale !== 1) {
      document.body.style.fontSize = `calc(100% * ${fontScale})`;
    }

    const handle = () => {
      const pc = localStorage.getItem("primaryColor");
      if (pc) {
        document.documentElement.style.setProperty("--color-primary", pc);
        document.documentElement.style.setProperty("--color-primary-rgb", hexToRgb(pc));
        document.documentElement.style.setProperty("--color-primary-dark", pc);
        document.documentElement.style.setProperty("--color-primary-light", pc + "aa");
        document.documentElement.style.setProperty("--color-primary-text", contrastText(pc));

        const gt = localStorage.getItem("generalTextColor") || "#ffffff";
        const ct = localStorage.getItem("containerTextColor") || "#000000";
        document.documentElement.style.setProperty("--general-text-color", gt);
        document.documentElement.style.setProperty("--container-text-color", ct);
        document.documentElement.style.setProperty("--text-color", gt);
        document.documentElement.style.setProperty("--menu-bg", gt === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)");
        document.body.style.setProperty("background", SOFT_BG.replace(/%primary%/g, hexToRgb(pc)), "important");
      }
    };

    window.addEventListener("primaryColorChange", handle);
    window.addEventListener("fontScaleChange", handle);
    window.addEventListener("generalTextColorChange", handle);
    window.addEventListener("containerTextColorChange", handle);
    window.addEventListener("storage", handle);

    return () => {
      window.removeEventListener("primaryColorChange", handle);
      window.removeEventListener("fontScaleChange", handle);
      window.removeEventListener("generalTextColorChange", handle);
      window.removeEventListener("containerTextColorChange", handle);
      window.removeEventListener("storage", handle);
    };
  }, []);

  return <>{children}</>;
}
