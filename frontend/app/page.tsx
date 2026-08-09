"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/services/auth.service";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        router.push("/app");
      }
    }).catch(console.error);
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        color: "var(--text-color, #ffffff)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
          <div
            style={{
              width: 96,
              height: 76,
              overflow: "hidden",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.75rem",
              filter: "drop-shadow(0 0 10px rgba(var(--color-primary-rgb, 59, 130, 246), 0.5))",
            }}
          >
          <img
            src="/Logo_Final.svg"
            alt="SIGNUM"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
        </div>
        <h1
          style={{
            fontSize: "4.5rem",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "2px",
          }}
        >
          SIGNUM
        </h1>
      </div>
      <p
        style={{
          fontSize: "1.15rem",
          opacity: 0.85,
          marginTop: "0.5rem",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Conecta con el mundo usando Lengua de Señas Mexicana.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        <button
          onClick={() => router.push("/login")}
          className="signum-btn signum-btn--full"
        >
          Iniciar sesión
        </button>

        <button
          onClick={() => router.push("/register")}
          className="signum-btn signum-btn--full"
        >
          Registrarse
        </button>

        <button
          onClick={() => router.push("/app")}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.95rem",
            fontWeight: 500,
            cursor: "pointer",
            padding: "8px",
            transition: "color 0.2s ease",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          Entrar como invitado
        </button>
      </div>
    </div>
  );
}
