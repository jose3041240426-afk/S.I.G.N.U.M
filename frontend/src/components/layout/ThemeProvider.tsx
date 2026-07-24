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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const primaryColor = localStorage.getItem("primaryColor") || "#3b82f6";
    const pointsColor = localStorage.getItem("pointsColor") || "#3b82f6";
    const glassOpacity = parseFloat(localStorage.getItem("glassOpacity") || "0.05");
    const fontScale = parseFloat(localStorage.getItem("fontScale") || "1");

    document.documentElement.style.setProperty("--color-primary", primaryColor);
    document.documentElement.style.setProperty("--color-primary-rgb", hexToRgb(primaryColor));
    document.documentElement.style.setProperty("--color-primary-dark", primaryColor);
    document.documentElement.style.setProperty("--color-primary-light", primaryColor + "aa");
    document.documentElement.style.setProperty("--color-primary-text", contrastText(primaryColor));
    document.documentElement.style.setProperty("--color-points", pointsColor);
    document.documentElement.style.setProperty("--color-points-rgb", hexToRgb(pointsColor));
    document.documentElement.style.setProperty("--color-points-text", contrastText(pointsColor));
    document.documentElement.style.setProperty("--glass-opacity", String(glassOpacity));

    const textColor = (glassOpacity < 0.4 && contrastText(primaryColor) === "#ffffff") ? "#ffffff" : "#000000";
    document.documentElement.style.setProperty("--text-color", textColor);
    document.documentElement.style.setProperty("--text-shadow", textColor === "#ffffff" ? "0 1px 3px rgba(0,0,0,0.6)" : "none");
    document.documentElement.style.setProperty("--menu-bg", textColor === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)");
    document.documentElement.style.setProperty("--font-scale", String(fontScale));

    document.body.style.background = `linear-gradient(135deg, color-mix(in srgb, rgb(${hexToRgb(primaryColor)}) 15%, #000 85%) 0%, color-mix(in srgb, rgb(${hexToRgb(primaryColor)}) 35%, #000 65%) 25%, rgb(${hexToRgb(primaryColor)}) 50%, color-mix(in srgb, rgb(${hexToRgb(primaryColor)}) 35%, #000 65%) 75%, color-mix(in srgb, rgb(${hexToRgb(primaryColor)}) 15%, #000 85%) 100%)`;

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
        const go = parseFloat(localStorage.getItem("glassOpacity") || "0.05");
        const tc = (go < 0.4 && contrastText(pc) === "#ffffff") ? "#ffffff" : "#000000";
        document.documentElement.style.setProperty("--text-color", tc);
        document.documentElement.style.setProperty("--text-shadow", tc === "#ffffff" ? "0 1px 3px rgba(0,0,0,0.6)" : "none");
        document.documentElement.style.setProperty("--menu-bg", tc === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)");
        document.body.style.background = `linear-gradient(135deg, color-mix(in srgb, rgb(${hexToRgb(pc)}) 15%, #000 85%) 0%, color-mix(in srgb, rgb(${hexToRgb(pc)}) 35%, #000 65%) 25%, rgb(${hexToRgb(pc)}) 50%, color-mix(in srgb, rgb(${hexToRgb(pc)}) 35%, #000 65%) 75%, color-mix(in srgb, rgb(${hexToRgb(pc)}) 15%, #000 85%) 100%)`;
      }
    };

    window.addEventListener("primaryColorChange", handle);
    window.addEventListener("fontScaleChange", handle);
    window.addEventListener("glassOpacityChange", handle);
    window.addEventListener("glassBorderChange", handle);
    window.addEventListener("storage", handle);

    return () => {
      window.removeEventListener("primaryColorChange", handle);
      window.removeEventListener("fontScaleChange", handle);
      window.removeEventListener("glassOpacityChange", handle);
      window.removeEventListener("glassBorderChange", handle);
      window.removeEventListener("storage", handle);
    };
  }, []);

  return <>{children}</>;
}
