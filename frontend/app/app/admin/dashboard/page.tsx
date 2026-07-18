"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getUserRoles, getAllEvaluaciones } from "@/services/auth.service";
import { LiquidGlass } from "@/components/ui/LiquidGlass";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser();
        if (!user) { router.push("/login"); return; }

        const roles = await getUserRoles(user.id);
        const admin = roles.some((r: any) => r.roles?.nombre_rol === "Administrador");
        if (!admin) { router.push("/app"); return; }

        setIsAdmin(true);
        const evals = await getAllEvaluaciones();
        setEvaluaciones(evals);
      } catch (err: any) {
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // Los hooks deben ir antes de cualquier early return
  const total = evaluaciones.length;

  const avgLikert = (field: string): string => {
    const vals = evaluaciones.filter((e) => e[field] != null).map((e) => e[field]);
    if (vals.length === 0) return "0";
    return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1);
  };

  const count = (field: string, value: string) => evaluaciones.filter((e) => e[field] === value).length;
  const pct = (field: string, value: string) => total > 0 ? ((count(field, value) / total) * 100).toFixed(0) : "0";

  const exportPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Título
    doc.setFontSize(18);
    doc.text("Dashboard Administrativo - Signum", 14, 20);
    doc.setFontSize(11);
    doc.text(`Total: ${total} evaluaciones recibidas`, 14, 28);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, 14, 34);

    // Resumen de promedios
    doc.setFontSize(13);
    doc.text("Promedios de satisfacci\u00f3n (1-5)", 14, 44);
    const likertData = [
      ["Uso frecuente", avgLikert("p4_uso_frecuente")],
      ["Complicado de usar", avgLikert("p5_complicado")],
      ["F\u00e1cil de interactuar", avgLikert("p6_facil_interactuar")],
      ["Necesita ayuda t\u00e9cnica", avgLikert("p7_necesita_ayuda")],
      ["Traducci\u00f3n natural", avgLikert("p8_traduccion_natural")],
      ["Experiencia general", avgLikert("experiencia_general")],
      ["F\u00e1cil de aprender", avgLikert("facil_aprender")],
      ["Utilidad educativa", avgLikert("util_educativo")],
      ["Satisfacci\u00f3n con voz", avgLikert("voz_satisfaccion")],
    ];
    autoTable(doc, {
      startY: 48,
      head: [["Pregunta", "Promedio"]],
      body: likertData,
      theme: "striped",
      headStyles: { fillColor: [15, 58, 115] },
    });

    // Distribuciones categóricas
    const distY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.text("Distribuciones", 14, distY);

    const addDistTable = (label: string, options: string[], field: string, startY: number) => {
      doc.setFontSize(10);
      doc.text(label, 14, startY);
      const rows = options.map((o) => [o, count(field, o).toString(), `${pct(field, o)}%`]);
      autoTable(doc, {
        startY: startY + 3,
        head: [["Opci\u00f3n", "Conteo", "%"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [15, 58, 115] },
      });
      return (doc as any).lastAutoTable.finalY;
    };

    let ty = distY + 5;
    ty = addDistTable("Resoluci\u00f3n de c\u00e1mara", ["Alta resoluci\u00f3n (HD/Full HD)", "Resoluci\u00f3n est\u00e1ndar", "No estoy seguro/a"], "resolucion", ty);
    ty += 6;
    ty = addDistTable("Iluminaci\u00f3n", ["Buena y constante", "Un poco oscura o con luz variable"], "iluminacion", ty);
    ty += 6;
    ty = addDistTable("Distancia", ["Muy cerca (menos de 50 cm)", "A una distancia c\u00f3moda (50 cm a 1 metro)", "Lejos (m\u00e1s de 1 metro)"], "distancia", ty);
    ty += 6;
    addDistTable("Esfuerzo mental", [
      "Fue muy f\u00e1cil, no requiri\u00f3 esfuerzo.",
      "Requirió un poco de atenci\u00f3n, pero fue fluido.",
      "Tuve que concentrarme mucho y hacer mucho esfuerzo mental.",
    ], "esfuerzo_mental", ty);

    // Respuestas individuales
    const indivY = ty + 10;
    doc.setFontSize(13);
    doc.text("Respuestas individuales", 14, indivY);

    const indivRows = evaluaciones.map((e) => [
      e.fecha ? new Date(e.fecha).toLocaleDateString("es-MX") : "-",
      e.usuarios ? `${e.usuarios.nombre} ${e.usuarios.apellido_paterno}` : "An\u00f3nimo",
      e.dispositivo || "-",
      e.navegador || "-",
      e.experiencia_general?.toString() || "-",
      e.recomendaria || "-",
    ]);
    autoTable(doc, {
      startY: indivY + 3,
      head: [["Fecha", "Usuario", "Dispositivo", "Navegador", "Exp.", "Recomienda"]],
      body: indivRows,
      theme: "striped",
      headStyles: { fillColor: [15, 58, 115] },
      styles: { fontSize: 8 },
    });

    doc.save("evaluaciones-signum.pdf");
  }, [evaluaciones, total]);

  const exportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    const indivRows = evaluaciones.map((e) => ({
      Fecha: e.fecha ? new Date(e.fecha).toLocaleDateString("es-MX") : "-",
      Usuario: e.usuarios ? `${e.usuarios.nombre} ${e.usuarios.apellido_paterno}` : "Anónimo",
      Dispositivo: e.dispositivo || "-",
      Navegador: e.navegador || "-",
      "Resolución": e.resolucion || "-",
      Iluminación: e.iluminacion || "-",
      Distancia: e.distancia || "-",
      "Uso frecuente (1-5)": e.p4_uso_frecuente ?? "-",
      "Complicado de usar (1-5)": e.p5_complicado ?? "-",
      "Fácil de interactuar (1-5)": e.p6_facil_interactuar ?? "-",
      "Necesita ayuda técnica (1-5)": e.p7_necesita_ayuda ?? "-",
      "Traducción natural (1-5)": e.p8_traduccion_natural ?? "-",
      "Satisfacción voz (1-5)": e.voz_satisfaccion ?? "-",
      "Esfuerzo mental": e.esfuerzo_mental || "-",
      "Exp. General (1-5)": e.experiencia_general ?? "-",
      Recomienda: e.recomendaria || "-",
      "Fácil de aprender (1-5)": e.facil_aprender ?? "-",
      "Utilidad educativa (1-5)": e.util_educativo ?? "-",
      "Experiencia previa": e.experiencia_previa || "-",
      Problemas: e.problemas || "-",
      Sugerencias: e.sugerencias || "-",
      "Función más útil": e.funcion_mas_util || "-",
      "Señas difíciles": e.senas_dificiles || "-",
    }));
    const ws1 = XLSX.utils.json_to_sheet(indivRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Respuestas individuales");

    const likertRows = [
      ["Pregunta", "Promedio"],
      ["Uso frecuente", avgLikert("p4_uso_frecuente")],
      ["Complicado de usar", avgLikert("p5_complicado")],
      ["Fácil de interactuar", avgLikert("p6_facil_interactuar")],
      ["Necesita ayuda técnica", avgLikert("p7_necesita_ayuda")],
      ["Traducción natural", avgLikert("p8_traduccion_natural")],
      ["Experiencia general", avgLikert("experiencia_general")],
      ["Fácil de aprender", avgLikert("facil_aprender")],
      ["Utilidad educativa", avgLikert("util_educativo")],
      ["Satisfacción con voz", avgLikert("voz_satisfaccion")],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(likertRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Promedios");

    const addDistSheet = (label: string, options: string[], field: string) => {
      const rows = [["Opción", "Conteo", "%"]];
      options.forEach((o) => rows.push([o, count(field, o).toString(), `${pct(field, o)}%`]));
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, label);
    };
    addDistSheet("Resolución", ["Alta resolución (HD/Full HD)", "Resolución estándar", "No estoy seguro/a"], "resolucion");
    addDistSheet("Iluminación", ["Buena y constante", "Un poco oscura o con luz variable"], "iluminacion");
    addDistSheet("Distancia", ["Muy cerca (menos de 50 cm)", "A una distancia cómoda (50 cm a 1 metro)", "Lejos (más de 1 metro)"], "distancia");
    addDistSheet("Esfuerzo mental", [
      "Fue muy fácil, no requirió esfuerzo.",
      "Requirió un poco de atención, pero fue fluido.",
      "Tuve que concentrarme mucho y hacer mucho esfuerzo mental.",
    ], "esfuerzo_mental");

    XLSX.writeFile(wb, "evaluaciones-signum.xlsx");
  }, [evaluaciones, total]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <span className="ai-loader"><span className="bar"/><span className="bar"/><span className="bar"/></span>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem", textAlign: "center", color: "#fca5a5" }}>{error}</div>
  );

  return (
    <div style={{ maxWidth: "1100px", width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.25rem", color: "#ffffff" }}>
            Dashboard Administrativo
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>{total} evaluaciones recibidas</p>
        </div>
        <button onClick={exportPDF} disabled={total === 0} style={{
          padding: "10px 20px",
          borderRadius: "50px",
          border: "none",
          background: total === 0 ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #0f3a73, #1e60b5)",
          color: "#fff",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: total === 0 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Exportar PDF
        </button>
        <button onClick={exportExcel} disabled={total === 0} style={{
          padding: "10px 20px",
          borderRadius: "50px",
          border: "none",
          background: total === 0 ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #166534, #22c55e)",
          color: "#fff",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: total === 0 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
            <polyline points="9 9 10 9 11 9"/>
          </svg>
          Exportar Excel
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <LiquidGlass style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>{total}</div>
          <div style={{ fontSize: "0.85rem", color: "#ffffff" }}>Evaluaciones totales</div>
        </LiquidGlass>
        <LiquidGlass style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#ffffff" }}>{avgLikert("experiencia_general")}</div>
          <div style={{ fontSize: "0.85rem", color: "#ffffff" }}>Experiencia general (prom)</div>
        </LiquidGlass>
        <LiquidGlass style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#ffffff" }}>{avgLikert("util_educativo")}</div>
          <div style={{ fontSize: "0.85rem", color: "#ffffff" }}>Utilidad educativa (prom)</div>
        </LiquidGlass>
        <LiquidGlass style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#ffffff" }}>{count("recomendaria", "Sí")}</div>
          <div style={{ fontSize: "0.85rem", color: "#ffffff" }}>Lo recomendarían</div>
        </LiquidGlass>
      </div>

      {/* Grid principal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Promedios Likert */}
        <LiquidGlass style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem" }}>Promedios de satisfacción (1-5)</h3>
          {[
            { field: "p4_uso_frecuente", label: "Uso frecuente" },
            { field: "p5_complicado", label: "Complicado de usar" },
            { field: "p6_facil_interactuar", label: "Fácil de interactuar" },
            { field: "p7_necesita_ayuda", label: "Necesita ayuda técnica" },
            { field: "p8_traduccion_natural", label: "Traducción natural" },
            { field: "experiencia_general", label: "Experiencia general" },
            { field: "facil_aprender", label: "Fácil de aprender" },
            { field: "util_educativo", label: "Utilidad educativa" },
            { field: "voz_satisfaccion", label: "Satisfacción con voz" },
          ].map((q) => {
            const val = parseFloat(avgLikert(q.field));
            return (
              <div key={q.field} style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                  <span>{q.label}</span>
                  <span style={{ fontWeight: 700, color: val >= 4 ? "#34d399" : val >= 3 ? "#fbbf24" : "#f87171" }}>{val}</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${(val / 5) * 100}%`, height: "100%", borderRadius: "4px", background: val >= 4 ? "linear-gradient(to right, #34d399, #10b981)" : val >= 3 ? "linear-gradient(to right, #fbbf24, #f59e0b)" : "linear-gradient(to right, #f87171, #ef4444)", transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
        </LiquidGlass>

        {/* Distribuciones categóricas */}
        <LiquidGlass style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem" }}>Distribución de respuestas</h3>

          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "6px" }}>Resolución de cámara</p>
            {["Alta resolución (HD/Full HD)", "Resolución estándar", "No estoy seguro/a"].map((o) => (
              <div key={o} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "0.85rem" }}>
                <span style={{ flex: 1, opacity: 0.8 }}>{o.replace("Alta resolución (HD/Full HD)", "HD/Full HD").replace("Resolución estándar", "Estándar").replace("No estoy seguro/a", "No seguro")}</span>
                <div style={{ flex: 2, height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${pct("resolucion", o)}%`, height: "100%", background: "#3b82f6", borderRadius: "4px" }} />
                </div>
                <span style={{ fontWeight: 700, minWidth: "30px", textAlign: "right" }}>{count("resolucion", o)}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "6px" }}>Iluminación</p>
            {["Buena y constante", "Un poco oscura o con luz variable"].map((o) => (
              <div key={o} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "0.85rem" }}>
                <span style={{ flex: 1, opacity: 0.8 }}>{o}</span>
                <div style={{ flex: 2, height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${pct("iluminacion", o)}%`, height: "100%", background: "#f59e0b", borderRadius: "4px" }} />
                </div>
                <span style={{ fontWeight: 700, minWidth: "30px", textAlign: "right" }}>{count("iluminacion", o)}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "6px" }}>Distancia</p>
            {["Muy cerca (menos de 50 cm)", "A una distancia cómoda (50 cm a 1 metro)", "Lejos (más de 1 metro)"].map((o) => (
              <div key={o} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "0.85rem" }}>
                <span style={{ flex: 1, opacity: 0.8 }}>{o}</span>
                <div style={{ flex: 2, height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${pct("distancia", o)}%`, height: "100%", background: "#8b5cf6", borderRadius: "4px" }} />
                </div>
                <span style={{ fontWeight: 700, minWidth: "30px", textAlign: "right" }}>{count("distancia", o)}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "6px" }}>Dispositivo</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["Laptop", "PC de escritorio", "Tablet", "Celular"].map((o) => {
                const c = count("dispositivo", o);
                return c > 0 && (
                  <span key={o} style={{ padding: "4px 10px", borderRadius: "20px", background: "rgba(59,130,246,0.2)", fontSize: "0.85rem" }}>{o}: {c}</span>
                );
              })}
            </div>
          </div>

          <div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "6px" }}>Esfuerzo mental</p>
            {["Fue muy fácil, no requirió esfuerzo.", "Requirió un poco de atención, pero fue fluido.", "Tuve que concentrarme mucho y hacer mucho esfuerzo mental."].map((o) => (
              <div key={o} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "0.85rem" }}>
                <span style={{ flex: 1, opacity: 0.8 }}>{o.replace("Fue muy fácil, no requirió esfuerzo.", "Fácil").replace("Requirió un poco de atención, pero fue fluido.", "Atención media").replace("Tuve que concentrarme mucho y hacer mucho esfuerzo mental.", "Mucho esfuerzo")}</span>
                <div style={{ flex: 2, height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${pct("esfuerzo_mental", o)}%`, height: "100%", background: "#ec4899", borderRadius: "4px" }} />
                </div>
                <span style={{ fontWeight: 700, minWidth: "30px", textAlign: "right" }}>{count("esfuerzo_mental", o)}</span>
              </div>
            ))}
          </div>
        </LiquidGlass>
      </div>

      {/* Tabla de respuestas individuales */}
      <LiquidGlass style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem" }}>Respuestas individuales</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", opacity: 0.7 }}>
                <th style={{ padding: "8px", textAlign: "left" }}>Fecha</th>
                <th style={{ padding: "8px", textAlign: "left" }}>Usuario</th>
                <th style={{ padding: "8px", textAlign: "left" }}>Dispositivo</th>
                <th style={{ padding: "8px", textAlign: "left" }}>Navegador</th>
                <th style={{ padding: "8px", textAlign: "left" }}>Exp. General</th>
                <th style={{ padding: "8px", textAlign: "left" }}>Recomienda</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.map((e) => (
                <tr key={e.id_evaluacion} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "8px" }}>{e.fecha ? new Date(e.fecha).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "8px", opacity: 0.8 }}>
                    {e.usuarios ? `${e.usuarios.nombre} ${e.usuarios.apellido_paterno}` : "Anónimo"}
                  </td>
                  <td style={{ padding: "8px" }}>{e.dispositivo || "-"}</td>
                  <td style={{ padding: "8px" }}>{e.navegador || "-"}</td>
                  <td style={{ padding: "8px", fontWeight: 600 }}>{e.experiencia_general || "-"}</td>
                  <td style={{ padding: "8px" }}>{e.recomendaria || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LiquidGlass>
    </div>
  );
}
