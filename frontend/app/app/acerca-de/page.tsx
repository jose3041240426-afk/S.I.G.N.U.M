"use client";
import { LiquidGlass } from "@/components/ui/LiquidGlass";

export default function AcercaDePage() {
  return (
    <>
    <div className="stagger" style={{ maxWidth: "750px", width: "100%", margin: "0 auto" }}>
      <LiquidGlass style={{ padding: "3rem" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--container-text-color, #ffffff)" }}>
            Acerca de Signum
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--container-text-color, rgba(255,255,255,0.8))", opacity: 0.85, marginTop: "4px" }}>
            Traductor de Lengua de Señas Mexicana impulsado por inteligencia artificial
          </p>
        </div>

        <div style={{ marginTop: "2rem", lineHeight: 1.8, fontSize: "1.05rem", opacity: 0.9, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p>
            Signum es un proyecto escolar desarrollado como parte del programa académico de la 
            <strong style={{ color: "var(--container-text-color, #60a5fa)" }}> Universidad Tecnológica de Durango</strong>. 
            Su propósito es crear una herramienta accesible y funcional que permita la traducción 
            de la Lengua de Señas Mexicana (LSM) a texto y voz, utilizando visión por computadora 
            y modelos de inteligencia artificial ejecutados directamente en el navegador.
          </p>

          <p>
            El sistema utiliza <strong style={{ color: "var(--container-text-color, #60a5fa)" }}>MediaPipe Hands</strong> para la detección 
            y seguimiento de manos en tiempo real, y un clasificador 
            <strong style={{ color: "var(--container-text-color, #60a5fa)" }}> Random Forest</strong> entrenado en el navegador para 
            reconocer letras, palabras y señas dinámicas del abecedario mexicano. Todo el procesamiento 
            se realiza localmente en el dispositivo del usuario, garantizando privacidad y respuesta 
            inmediata sin necesidad de conexión a internet para la traducción.
          </p>

          <p>
            Este proyecto fue desarrollado con tecnologías web modernas como 
            <strong style={{ color: "var(--container-text-color, #60a5fa)" }}> Next.js</strong>, 
            <strong style={{ color: "var(--container-text-color, #60a5fa)" }}> React</strong>, 
            <strong style={{ color: "var(--container-text-color, #60a5fa)" }}> TypeScript</strong>, 
            <strong style={{ color: "var(--container-text-color, #60a5fa)" }}> Supabase</strong> para la gestión de usuarios y 
            almacenamiento de datos, y la plataforma de inferencia 
            <strong style={{ color: "var(--container-text-color, #60a5fa)" }}> Groq</strong> para el completado de oraciones con IA. 
            La síntesis de voz se realiza a través de la API de 
            <strong style={{ color: "var(--container-text-color, #60a5fa)" }}> ElevenLabs</strong> y la Web Speech API del navegador.
          </p>

          <p>
            Signum representa un esfuerzo por aplicar la inteligencia artificial y el desarrollo 
            web para derribar barreras de comunicación y promover la inclusión de la comunidad 
            sorda en México.
          </p>
        </div>

        <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0, color: "var(--container-text-color, #93c5fd)", opacity: 0.9 }}>
            Desarrolladores
          </h3>
          <p style={{ fontSize: "0.9rem", opacity: 0.6, marginTop: "4px" }}>
            Universidad Tecnológica de Durango
          </p>
          <ul style={{ marginTop: "1rem", listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "1.05rem" }}>
            <li>✦ José Manuel Guerrero Simental</li>
            <li>✦ Josué Joan Hernández Tavizón</li>
            <li>✦ Humberto Castillo Díaz</li>
            <li>✦ Manuel Alejandro Mathey Ortiz</li>
          </ul>

          <div style={{ marginTop: "2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <a
              href="/diccionario-senas-mx.pdf"
              className="signum-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Descargar diccionario LSM (PDF)
            </a>
            <a
              href="/app/acerca-de/evaluar"
              className="signum-btn"
            >
              Evaluar proyecto
            </a>
            <a
              href="/app/acerca-de/referencias"
              className="signum-btn"
            >
              Referencias
            </a>
            <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "8px" }}>
              Tu opinión nos ayuda a mejorar
            </p>
          </div>
        </div>
      </LiquidGlass>
    </div>
    </>
  );
}
