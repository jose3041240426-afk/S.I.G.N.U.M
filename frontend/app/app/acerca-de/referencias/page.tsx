"use client";
import { LiquidGlass } from "@/components/ui/LiquidGlass";

interface RefItem {
  title: string;
  authors?: string;
  source?: string;
  year?: string;
  url: string;
}

const estadoArte: RefItem[] = [
  {
    title: "Aikyam: A video conferencing utility for deaf and dumb",
    authors: "Deshpande, K., Mashalkar, V., Mhaisekar, K., Naikwadi, A., & Ghotkar, A.",
    source: "9th International Conference on Smart Computing and Communications (ICSCC). IEEE Xplore",
    year: "2023",
    url: "http://ieeexplore.ieee.org/xpl/conhome/10334953/proceeding",
  },
  {
    title: "A comprehensive survey on recent advances and challenges in sign language recognition systems",
    authors: "Melanshia Violet, I. M., & Leena Sri, R.",
    source: "Discover Artificial Intelligence, 5(419)",
    year: "2025",
    url: "https://link.springer.com/article/10.1007/s44163-025-00629-7",
  },
  {
    title: "Speech-to-sign gesture translation for Kazakh: Dataset and sign gesture translation system",
    authors: "Mnuarbek, A., Bekarystankyzy, A., Turdalyuly, M., Oralbekova, D., & Dyussemkhanov, A.",
    source: "Computers, 15(3). MDPI",
    year: "2026",
    url: "https://www.mdpi.com/2073-431X/15/3/188",
  },
  {
    title: "Sign language interpretation using machine learning and artificial intelligence",
    authors: "Najib, F. M.",
    source: "Neural Computing and Applications, 37(2)",
    year: "2024",
    url: "https://link.springer.com/article/10.1007/s00521-024-10395-9",
  },
];

const datasets: RefItem[] = [
  {
    title: "Corpus del alfabeto dactilológico de la Lengua de Señas Mexicana (LSM) en entornos estáticos y dinámicos",
    authors:"CICESE",
    source: "Centro de Investigación Científica y de Educación Superior de Ensenada",
    year: "2026",
    url: "https://cicese.repositorioinstitucional.mx",
  },
  {
    title: "Dataset para el reconocimiento dinámico de Lengua de Señas Mexicana mediante secuencias de landmarks esqueléticos",
    authors: "ICKMejia",
    source: "MDPI Data Repository",
    year: "2025",
    url: "https://www.mdpi.com/journal/applsci",
  },
  {
    title: "MSL-150: Landmark dataset for 150 Mexican Sign Language isolated signs in healthcare and emergency contexts",
    authors: "MSL-150",
    source: "Zenodo",
    year: "2025",
    url: "https://zenodo.org/records/17783312",
  },
];

const marcoLegal: RefItem[] = [
  {
    title: "Code of Ethics and Professional Conduct",
    authors: "ACM & IEEE Computer Society",
    source: "Association for Computing Machinery",
    year: "2018",
    url: "https://www.acm.org/code-of-ethics",
  },
  {
    title: "Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)",
    authors: "Congreso de la Unión",
    source: "Diario Oficial de la Federación",
    year: "2010",
    url: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf",
  },
  {
    title: "Ley Federal del Derecho de Autor (LFDA)",
    authors: "Congreso de la Unión",
    source: "Diario Oficial de la Federación",
    year: "1996",
    url: "",
  },
  {
    title: "Norma Mexicana NMX-I-153/03-NYCE-2008: Tecnologías de la información - Accesibilidad para software (Basada en WCAG 2.1)",
    authors: "Secretaría de Economía / NYCE",
    source: "Estados Unidos Mexicanos",
    year: "2008",
    url: "https://www.w3.org/TR/WCAG21/",
  },
];

const instrumentos: RefItem[] = [
  {
    title: "SUS: A 'quick and dirty' usability scale",
    authors: "Brooke, J.",
    source: "Usability Evaluation in Industry, 189(194), 4–7",
    year: "1996",
    url: "",
  },
  {
    title: "The Quebec User Evaluation of Satisfaction with Assistive Technology (QUEST 2.0)",
    authors: "Demers, L., Weiss-Lambrou, R., & Ska, B.",
    source: "Assistive Technology, 14(2), 101–116",
    year: "2002",
    url: "",
  },
];

function RefCard({ item }: { item: RefItem }) {
  return (
    <div style={{
      padding: "1rem 1.25rem",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: "0.92rem",
      lineHeight: 1.6,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--color-primary-light, #60a5fa)", textDecoration: "none" }}
          >
            {item.title}
          </a>
        ) : (
          <span style={{ color: "var(--container-text-color, #ffffff)" }}>{item.title}</span>
        )}
      </div>
      {item.authors && (
        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>{item.authors}</div>
      )}
      {item.source && (
        <div style={{ fontSize: "0.8rem", opacity: 0.6, fontStyle: "italic" }}>{item.source}{item.year ? ` (${item.year})` : ""}</div>
      )}
    </div>
  );
}

const separator = "1px solid rgba(255,255,255,0.08)";

export default function ReferenciasPage() {
  return (
    <div className="stagger" style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
      <LiquidGlass style={{ padding: "2.5rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, color: "var(--container-text-color, #ffffff)" }}>
          Referencias
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--container-text-color, rgba(255,255,255,0.8))", opacity: 0.7, marginTop: "4px" }}>
          Fuentes documentales, datasets, normatividad y metodologías consultadas
        </p>

        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <section>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--container-text-color, #93c5fd)", opacity: 0.9 }}>
              Estado del Arte e Investigaciones
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {estadoArte.map((r, i) => <RefCard key={i} item={r} />)}
            </div>
          </section>

          <div style={{ borderTop: separator }} />

          <section>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--container-text-color, #93c5fd)", opacity: 0.9 }}>
              Datasets Secundarios (Fuentes de Entrenamiento)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {datasets.map((r, i) => <RefCard key={i} item={r} />)}
            </div>
          </section>

          <div style={{ borderTop: separator }} />

          <section>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--container-text-color, #93c5fd)", opacity: 0.9 }}>
              Marco Legal, Normatividad y Estándares Éticos
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {marcoLegal.map((r, i) => <RefCard key={i} item={r} />)}
            </div>
          </section>

          <div style={{ borderTop: separator }} />

          <section>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--container-text-color, #93c5fd)", opacity: 0.9 }}>
              Instrumentos y Metodología de Evaluación
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {instrumentos.map((r, i) => <RefCard key={i} item={r} />)}
            </div>
          </section>
        </div>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <a href="/app/acerca-de" className="signum-btn signum-btn--sm">
            ← Volver a Acerca de
          </a>
        </div>
      </LiquidGlass>
    </div>
  );
}
