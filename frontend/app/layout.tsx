import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles/signum-globals.css";
import "./styles/transitions.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Signum - LSM",
  description: "Reconocimiento de lenguaje de señas mexicano en tiempo real",
  icons: {
    icon: "/favicon.svg",
  },
};

import Script from "next/script";
import { FluidBackground } from "@/components/layout/FluidBackground";
import { PageTransition } from "@/components/layout/PageTransition";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-transparent text-gray-900">
        <ThemeProvider>
        <Script id="anti-devtools" strategy="beforeInteractive">
          {`
            document.addEventListener("contextmenu", e => e.preventDefault());
            document.addEventListener("keydown", e => {
              if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c" || e.key === "J" || e.key === "j")) || (e.ctrlKey && e.key === "U")) {
                e.preventDefault();
              }
            });
          `}
        </Script>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                function hexToRgb(h) {
                  h = h.replace("#", "");
                  return parseInt(h.substring(0, 2), 16) + ", " + parseInt(h.substring(2, 4), 16) + ", " + parseInt(h.substring(4, 6), 16);
                }
                function contrastText(h) {
                  h = h.replace("#", "");
                  var r = parseInt(h.substring(0, 2), 16) / 255;
                  var g = parseInt(h.substring(2, 4), 16) / 255;
                  var b = parseInt(h.substring(4, 6), 16) / 255;
                  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.5 ? "#000000" : "#ffffff";
                }
                var pc = localStorage.getItem("primaryColor") || "#3b82f6";
                var pts = localStorage.getItem("pointsColor") || "#3b82f6";
                var gt = localStorage.getItem("generalTextColor");
                var gtVal = gt === "auto" ? contrastText(pc) : (gt || "#ffffff");
                var ctVal = "#000000";
                var fs = parseFloat(localStorage.getItem("fontScale") || "1");
                var gb = localStorage.getItem("glassBorder");
                var rgb = hexToRgb(pc);
                var bg = "linear-gradient(135deg, color-mix(in srgb, rgb(" + rgb + ") 50%, #080816 50%) 0%, color-mix(in srgb, rgb(" + rgb + ") 75%, #080816 25%) 30%, rgb(" + rgb + ") 50%, color-mix(in srgb, rgb(" + rgb + ") 75%, #080816 25%) 70%, color-mix(in srgb, rgb(" + rgb + ") 50%, #080816 50%) 100%)";
                var css = ":root{" +
                  "--color-primary:" + pc + ";" +
                  "--color-primary-rgb:" + rgb + ";" +
                  "--color-primary-dark:" + pc + ";" +
                  "--color-primary-light:" + pc + "aa;" +
                  "--color-primary-text:" + contrastText(pc) + ";" +
                  "--color-points:" + pts + ";" +
                  "--color-points-rgb:" + hexToRgb(pts) + ";" +
                  "--color-points-text:" + contrastText(pts) + ";" +
                  "--general-text-color:" + gtVal + ";" +
                  "--container-text-color:" + ctVal + ";" +
                  "--text-color:" + gtVal + ";" +
                  "--menu-bg:" + (gtVal === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)") + ";" +
                  "--font-scale:" + fs + ";" +
                  (gb !== null ? "--glass-border:" + gb + "px solid rgba(255, 255, 255, 0.3);" : "") +
                  "} body{background:" + bg + ";}";
                var style = document.createElement("style");
                style.id = "theme-init-style";
                style.textContent = css;
                document.head.appendChild(style);
              } catch (e) {}
            })();
          `}
        </Script>
        <FluidBackground />
        <svg style={{ position: "fixed", width: 0, height: 0 }}>
          <filter id="glass-blur" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.003 0.007" numOctaves="1" result="turbulence" />
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="40" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <PageTransition>{children}</PageTransition>
        </ThemeProvider>
      </body>
    </html>
  );
}
