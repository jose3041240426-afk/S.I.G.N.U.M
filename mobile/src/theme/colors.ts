export const Colors = {
  background: "#080816",
  primary: "#3b82f6",
  primaryDark: "#0f3a73",
  primaryLight: "#60a5fa",
  surface: "rgba(255, 255, 255, 0.08)",
  surfaceSolid: "#14161e",
  border: "rgba(255, 255, 255, 0.15)",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.6)",
  textDark: "#0f172a",
  textDarkMuted: "#64748b",
  card: "rgba(255, 255, 255, 0.35)",
  cardDark: "#1e293b",
  success: "#4ade80",
  error: "#ef4444",
  warning: "#fbbf24",
  info: "#60a5fa",
  purple: "#a855f7",
  orange: "#f97316",
} as const;

export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

export function contrastText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  return l > 0.5 ? "#000000" : "#ffffff";
}
