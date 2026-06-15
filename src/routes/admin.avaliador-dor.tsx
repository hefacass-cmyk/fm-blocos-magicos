import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";

const BODY_REGIONS = [
  { id: "cabeca", label: "Cabeça", x: 50, y: 8 },
  { id: "pescoco", label: "Pescoço", x: 50, y: 16 },
  { id: "ombro_esq", label: "Ombro Esq.", x: 35, y: 22 },
  { id: "ombro_dir", label: "Ombro Dir.", x: 65, y: 22 },
  { id: "peito", label: "Peito", x: 50, y: 30 },
  { id: "abdomen", label: "Abdômen", x: 50, y: 42 },
  { id: "costas_sup", label: "Costas Sup.", x: 50, y: 27 },
  { id: "costas_inf", label: "Costas Inf.", x: 50, y: 40 },
  { id: "braco_esq", label: "Braço Esq.", x: 28, y: 35 },
  { id: "braco_dir", label: "Braço Dir.", x: 72, y: 35 },
  { id: "quadril", label: "Quadril", x: 50, y: 52 },
  { id: "coxa_esq", label: "Coxa Esq.", x: 40, y: 62 },
  { id: "coxa_dir", label: "Coxa Dir.", x: 60, y: 62 },
  { id: "joelho_esq", label: "Joelho Esq.", x: 40, y: 73 },
  { id: "joelho_dir", label: "Joelho Dir.", x: 60, y: 73 },
  { id: "perna_esq", label: "Perna Esq.", x: 40, y: 82 },
  { id: "perna_dir", label: "Perna Dir.", x: 60, y: 82 },
  { id: "pe_esq", label: "Pé Esq.", x: 38, y: 93 },
  { id: "pe_dir", label: "Pé Dir.", x: 62, y: 93 },
];

const PAIN_TYPES = [
  { id: "queimacao", label: "Queimação", icon: "🔥", desc: "Sensação de ardor, calor" },
  { id: "pontada", label: "Pontada", icon: "⚡", desc: "Fisgada, agulhada" },
  { id: "pressao", label: "Pressão", icon: "🪨", desc: "Peso, aperto, compressão" },
  { id: "latejamento", label: "Latejamento", icon: "💓", desc: "Pulsátil, batida" },
  { id: "formigamento", label: "Formigamento", icon: "⚙️", desc: "Agulhada, choque leve" },
  { id: "rigidez", label: "Rigidez", icon: "🔩", desc: "Travamento, endurecimento" },
  { id: "dormencia", label: "Dormência", icon: "🧊", desc: "Anestesia, perda de sensação" },
  { id: "cansaco", label: "Cansaço", icon: "🌊", desc: "Fadiga, fraqueza local" },
];

const FREQUENCY_OPTIONS = [
  { id: "constante", label: "Constante", desc: "O tempo todo, sem parar" },
  { id: "quase_sempre", label: "Quase sempre", desc: "Mais de 75% do tempo" },
  { id: "frequente", label: "Frequente", desc: "Todo dia, mas passa" },
  { id: "ocasional", label: "Ocasional", desc: "Alguns dias por semana" },
  { id: "raro", label: "Raro", desc: "Poucas vezes no mês" },
];

const DURATION_OPTIONS = [
  { id: "menos_1mes", label: "< 1 mês", type: "aguda" },
  { id: "1_3meses", label: "1–3 meses", type: "subaguda" },
  { id: "3_6meses", label: "3–6 meses", type: "cronica_inicial" },
  { id: "mais_6meses", label: "> 6 meses", type: "cronica" },
  { id: "mais_1ano", label: "> 1 ano", type: "cronica_severa" },
];

const IMPACT_AREAS = [
  { id: "sono", label: "Sono", icon: "😴" },
  { id: "trabalho", label: "Trabalho", icon: "💼" },
  { id: "humor", label: "Humor/Emoções", icon: "🧠" },
  { id: "movimento", label: "Movimento físico", icon: "🚶" },
  { id: "social", label: "Vida social", icon: "👥" },
  { id: "alimentacao", label: "Alimentação", icon: "🍽️" },
  { id: "concentracao", label: "Concentração", icon: "🎯" },
  { id: "autonomia", label: "Autonomia/Independência", icon: "🏠" },
];

const TRIGGER_OPTIONS = [
  "Movimento/esforço físico",
  "Stress/ansiedade",
  "Mudança de temperatura",
  "Postura prolongada",
  "Toque/pressão local",
  "Período noturno",
  "Alimentação",
  "Sem gatilho identificado",
];

const RELIEF_OPTIONS = [
  "Medicamento",
  "Repouso/descanso",
  "Calor local",
  "Frio local",
  "Massagem",
  "Movimento suave",
  "Nada alivia",
  "Distração/relaxamento",
];

const STEPS = [
  { title: "Localização da Dor", subtitle: "Onde você sente dor?" },
  { title: "Intensidade", subtitle: "Qual a intensidade máxima?" },
  { title: "Tipo de Dor", subtitle: "Como você descreveria?" },
  { title: "Frequência", subtitle: "Com que frequência ocorre?" },
  { title: "Duração do Problema", subtitle: "Há quanto tempo sente isso?" },
  { title: "Impacto na Vida", subtitle: "O que a dor afeta?" },
  { title: "Gatilhos", subtitle: "O que piora sua dor?" },
  { title: "Alívio", subtitle: "O que melhora sua dor?" },
  { title: "Relatório", subtitle: "Seu perfil de dor completo" },
];

function getPainColor(l: number) {
  if (l <= 2) return "#22c55e";
  if (l <= 4) return "#84cc16";
  if (l <= 6) return "#eab308";
  if (l <= 8) return "#f97316";
  return "#ef4444";
}

function getPainLabel(l: number) {
  if (l === 0) return "Sem dor";
  if (l <= 2) return "Leve";
  if (l <= 4) return "Moderada";
  if (l <= 6) return "Intensa";
  if (l <= 8) return "Muito Intensa";
  return "Insuportável";
}

function getRisk(data: DataState) {
  let s = 0;
  if (data.intensidade >= 7) s += 3;
  else if (data.intensidade >= 5) s += 2;
  else s += 1;
  const dt = (DURATION_OPTIONS.find((d) => d.id === data.duracao) || {}).type || "";
  if (dt === "cronica_severa") s += 3;
  else if (dt === "cronica") s += 2;
  else if (dt === "cronica_inicial") s += 1;
  if (data.frequencia === "constante") s += 3;
  else if (data.frequencia === "quase_sempre") s += 2;
  if (data.impacto.length >= 5) s += 2;
  else if (data.impacto.length >= 3) s += 1;
  if (s >= 9) return { level: "Alto", color: "#ef4444", desc: "Requer avaliação médica urgente" };
  if (s >= 6) return { level: "Moderado-Alto", color: "#f97316", desc: "Consulta prioritária recomendada" };
  if (s >= 4) return { level: "Moderado", color: "#eab308", desc: "Avaliação especializada indicada" };
  return { level: "Baixo-Moderado", color: "#22c55e", desc: "Acompanhamento recomendado" };
}

interface DataState {
  locais: string[];
  intensidade: number;
  tipos: string[];
  frequencia: string;
  duracao: string;
  impacto: string[];
  gatilhos: string[];
  alivio: string[];
}

function ReportCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 5,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: 14,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.5,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/avaliador-dor")({
  head: () => ({
    meta: [
      { title: "Avaliador de Dor — Perfil Clínico" },
      { name: "description", content: "Avalie sua dor gratuitamente com nosso avaliador clínico interativo." },
      { property: "og:title", content: "Avaliador de Dor — Perfil Clínico" },
      { property: "og:description", content: "Avalie sua dor gratuitamente com nosso avaliador clínico interativo." },
    ],
  }),
  component: AvaliadorDorPage,
});

function AvaliadorDorPage() {
  const [step, setStep] = useState(0);
  const [animating, setAnim] = useState(false);
  const [data, setData] = useState<DataState>({
    locais: [],
    intensidade: 5,
    tipos: [],
    frequencia: "",
    duracao: "",
    impacto: [],
    gatilhos: [],
    alivio: [],
  });
  const topRef = useRef<HTMLDivElement>(null);

  const go = (dir: number) => {
    setAnim(true);
    setTimeout(() => {
      setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + dir)));
      setAnim(false);
      topRef.current && topRef.current.scrollIntoView({ behavior: "smooth" });
    }, 180);
  };

  const toggle = (field: keyof DataState, id: string) =>
    setData((d) => {
      const arr = d[field] as string[];
      return {
        ...d,
        [field]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
      };
    });

  const canProceed = () => {
    if (step === 0) return data.locais.length > 0;
    if (step === 2) return data.tipos.length > 0;
    if (step === 3) return data.frequencia !== "";
    if (step === 4) return data.duracao !== "";
    if (step === 5) return data.impacto.length > 0;
    return true;
  };

  const risk =
    data.locais.length > 0 && data.frequencia && data.duracao && data.impacto.length > 0 ? getRisk(data) : null;

  const pct = (step / (STEPS.length - 1)) * 100;
  const pc = getPainColor(data.intensidade);

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 20,
    padding: "28px 24px",
    backdropFilter: "blur(10px)",
    opacity: animating ? 0 : 1,
    transform: animating ? "translateY(8px)" : "translateY(0)",
    transition: "opacity 0.18s, transform 0.18s",
    width: "100%",
    maxWidth: 660,
  };

  const btnSel = (sel: boolean): React.CSSProperties => ({
    background: sel ? "rgba(224,92,82,0.2)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${sel ? "#e05c52" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10,
    padding: "13px 16px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "Arial, sans-serif",
    fontSize: 14,
    color: sel ? "#fff" : "rgba(255,255,255,0.65)",
    transition: "all 0.15s",
    width: "100%",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0a0e1a,#0d1525,#0a1020)",
        color: "#e8e4dc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 16px 50px",
      }}
    >
      <div ref={topRef} style={{ width: "100%", maxWidth: 660, marginBottom: 24 }}>
        {/* Logo / header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#b5342a,#e05c52)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 0 20px rgba(181,52,42,0.4)",
            }}
          >
            🩺
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 3,
                color: "#e05c52",
                textTransform: "uppercase",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Avaliação Clínica
            </div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#f5f0e8" }}>Perfil de Dor</div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg,#b5342a,#e05c52)",
              borderRadius: 4,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            fontFamily: "Arial, sans-serif",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <span>{STEPS[step].title}</span>
          <span>
            {step + 1} / {STEPS.length}
          </span>
        </div>
      </div>

      {/* Card principal */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: "bold", color: "#f5f0e8" }}>
          {STEPS[step].title}
        </h2>
        <p style={{ margin: "0 0 22px", fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "Arial, sans-serif" }}>
          {STEPS[step].subtitle}
        </p>

        {/* ── STEP 0 — LOCALIZAÇÃO ── */}
        {step === 0 && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 160, flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" width="160" height="400" style={{ display: "block" }}>
                <ellipse cx="50" cy="9" rx="10" ry="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                <rect x="45" y="18" width="10" height="5" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                <path
                  d="M32 23 Q50 20 68 23 L70 55 Q50 58 30 55 Z"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.8"
                />
                <path
                  d="M32 23 L22 50 Q21 52 23 53 L30 55"
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.8"
                />
                <path
                  d="M68 23 L78 50 Q79 52 77 53 L70 55"
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.8"
                />
                <path
                  d="M30 55 Q50 60 70 55 L67 65 Q50 68 33 65 Z"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.8"
                />
                <path
                  d="M33 65 L38 95 Q40 97 43 96 L45 65"
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.8"
                />
                <path
                  d="M67 65 L62 95 Q60 97 57 96 L55 65"
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.8"
                />
                {BODY_REGIONS.map((r) => {
                  const sel = data.locais.includes(r.id);
                  return (
                    <g key={r.id} onClick={() => toggle("locais", r.id)} style={{ cursor: "pointer" }}>
                      <circle
                        cx={r.x}
                        cy={r.y}
                        r="4.5"
                        fill={sel ? "#e05c52" : "rgba(255,255,255,0.15)"}
                        stroke={sel ? "#ef4444" : "rgba(255,255,255,0.3)"}
                        strokeWidth="0.8"
                        style={{ transition: "all 0.2s" }}
                      />
                      {sel && (
                        <circle
                          cx={r.x}
                          cy={r.y}
                          r="7"
                          fill="none"
                          stroke="#e05c52"
                          strokeWidth="0.5"
                          opacity="0.5"
                        >
                          <animate attributeName="r" from="5" to="10" dur="1s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "Arial, sans-serif" }}>
                Toque no boneco ou selecione:
              </p>
              {BODY_REGIONS.map((r) => {
                const sel = data.locais.includes(r.id);
                return (
                  <button key={r.id} onClick={() => toggle("locais", r.id)} style={btnSel(sel)}>
                    {sel ? "✓ " : ""}
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 1 — INTENSIDADE ── */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 80,
                  fontWeight: "bold",
                  color: pc,
                  lineHeight: 1,
                  textShadow: `0 0 40px ${pc}60`,
                  transition: "color 0.3s",
                }}
              >
                {data.intensidade}
              </div>
              <div
                style={{
                  fontSize: 18,
                  marginTop: 8,
                  color: pc,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: "bold",
                  transition: "color 0.3s",
                }}
              >
                {getPainLabel(data.intensidade)}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={data.intensidade}
              onChange={(e) => setData((d) => ({ ...d, intensidade: +e.target.value }))}
              style={{ width: "100%", accentColor: pc }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontFamily: "Arial, sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              <span>0 — Sem dor</span>
              <span>10 — Insuportável</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 22 }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <div
                  key={n}
                  onClick={() => setData((d) => ({ ...d, intensidade: n }))}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 4,
                    cursor: "pointer",
                    background: n <= data.intensidade ? getPainColor(n) : "rgba(255,255,255,0.08)",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: n <= data.intensidade ? "#fff" : "rgba(255,255,255,0.3)",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 18,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "Arial, sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              <strong style={{ color: "rgba(255,255,255,0.65)" }}>Escala EVA</strong> — Escala Visual Analógica validada clinicamente para mensuração da dor.
            </div>
          </div>
        )}

        {/* ── STEP 2 — TIPO ── */}
        {step === 2 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {PAIN_TYPES.map((t) => {
              const sel = data.tipos.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggle("tipos", t.id)}
                  style={{ ...btnSel(sel), borderRadius: 12, padding: "14px 16px" }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                  <div
                    style={{
                      fontFamily: "Arial, sans-serif",
                      fontWeight: "bold",
                      fontSize: 13,
                      color: sel ? "#fff" : "rgba(255,255,255,0.8)",
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "Arial, sans-serif",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 3,
                    }}
                  >
                    {t.desc}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 3 — FREQUÊNCIA ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FREQUENCY_OPTIONS.map((f) => {
              const sel = data.frequencia === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setData((d) => ({ ...d, frequencia: f.id }))}
                  style={{ ...btnSel(sel), borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${sel ? "#e05c52" : "rgba(255,255,255,0.3)"}`,
                      background: sel ? "#e05c52" : "transparent",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "bold",
                        fontSize: 14,
                        color: sel ? "#fff" : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {f.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        marginTop: 2,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 4 — DURAÇÃO ── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DURATION_OPTIONS.map((d) => {
              const sel = data.duracao === d.id;
              const cronic = d.type.includes("cronica");
              return (
                <button
                  key={d.id}
                  onClick={() => setData((prev) => ({ ...prev, duracao: d.id }))}
                  style={{
                    ...btnSel(sel),
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${sel ? "#e05c52" : "rgba(255,255,255,0.3)"}`,
                        background: sel ? "#e05c52" : "transparent",
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "bold",
                        fontSize: 14,
                        color: sel ? "#fff" : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {d.label}
                    </span>
                  </div>
                  {cronic && (
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "Arial, sans-serif",
                        background: "rgba(239,68,68,0.2)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 6,
                        padding: "3px 8px",
                      }}
                    >
                      Dor Crônica
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 5 — IMPACTO ── */}
        {step === 5 && (
          <div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Arial, sans-serif" }}>
              Selecione todas que se aplicam:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {IMPACT_AREAS.map((a) => {
                const sel = data.impacto.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggle("impacto", a.id)}
                    style={{ ...btnSel(sel), borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: 20 }}>{a.icon}</span>
                    <span
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontSize: 13,
                        color: sel ? "#fff" : "rgba(255,255,255,0.7)",
                        fontWeight: sel ? "bold" : "normal",
                      }}
                    >
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 6 — GATILHOS ── */}
        {step === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TRIGGER_OPTIONS.map((t) => {
              const sel = data.gatilhos.includes(t);
              return (
                <button key={t} onClick={() => toggle("gatilhos", t)} style={btnSel(sel)}>
                  <span style={{ marginRight: 10 }}>{sel ? "✓" : "○"}</span>
                  {t}
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 7 — ALÍVIO ── */}
        {step === 7 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RELIEF_OPTIONS.map((r) => {
              const sel = data.alivio.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => toggle("alivio", r)}
                  style={{
                    background: sel ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${sel ? "#22c55e" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10,
                    padding: "13px 16px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "Arial, sans-serif",
                    fontSize: 14,
                    color: sel ? "#bbf7d0" : "rgba(255,255,255,0.65)",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                >
                  <span style={{ marginRight: 10 }}>{sel ? "✓" : "○"}</span>
                  {r}
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 8 — RELATÓRIO ── */}
        {step === 8 && (
          <div>
            {risk && (
              <div
                style={{
                  padding: "18px 22px",
                  background:
                    risk.level === "Alto"
                      ? "rgba(239,68,68,0.12)"
                      : risk.level === "Moderado-Alto"
                        ? "rgba(249,115,22,0.12)"
                        : "rgba(234,179,8,0.12)",
                  border: `1px solid ${risk.color}40`,
                  borderRadius: 14,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: `${risk.color}25`,
                    border: `2px solid ${risk.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {risk.level === "Alto" ? "⚠️" : risk.level === "Moderado-Alto" ? "🔶" : "📋"}
                </div>
                <div>
                  <div style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold", fontSize: 15, color: risk.color }}>
                    Nível de Atenção: {risk.level}
                  </div>
                  <div style={{ fontFamily: "Arial, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                    {risk.desc}
                  </div>
                </div>
              </div>
            )}

            <ReportCard
              title="📍 Localização"
              value={
                data.locais.map((id) => BODY_REGIONS.find((r) => r.id === id)?.label).join(", ") || "—"
              }
            />
            <ReportCard
              title="📊 Intensidade (EVA)"
              value={
                <span>
                  <span style={{ color: pc, fontWeight: "bold", fontSize: 17 }}>{data.intensidade}/10</span> — {getPainLabel(data.intensidade)}
                </span>
              }
            />
            <ReportCard
              title="🔍 Tipo de Dor"
              value={
                data.tipos.map((id) => PAIN_TYPES.find((t) => t.id === id)?.label).join(", ") || "—"
              }
            />
            <ReportCard
              title="🔁 Frequência"
              value={(FREQUENCY_OPTIONS.find((f) => f.id === data.frequencia) || {}).label || "—"}
            />
            <ReportCard
              title="⏱️ Duração do problema"
              value={(DURATION_OPTIONS.find((d) => d.id === data.duracao) || {}).label || "—"}
            />
            <ReportCard
              title="🎯 Impacto na vida"
              value={
                data.impacto.map((id) => IMPACT_AREAS.find((a) => a.id === id)?.label).join(", ") || "—"
              }
            />
            {data.gatilhos.length > 0 && <ReportCard title="⚡ Gatilhos" value={data.gatilhos.join(", ")} />}
            {data.alivio.length > 0 && <ReportCard title="💊 O que alivia" value={data.alivio.join(", ")} />}

            <div
              style={{
                marginTop: 20,
                padding: "16px 20px",
                background: "rgba(181,52,42,0.12)",
                border: "1px solid rgba(181,52,42,0.3)",
                borderRadius: 12,
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#f5c4c1", display: "block", marginBottom: 6 }}>
                📋 Este relatório foi gerado para facilitar sua consulta médica.
              </strong>
              Leve este resumo ao seu especialista em dor. As informações coletadas seguem as escalas clínicas EVA, DN4 e os critérios internacionais de classificação da dor crônica.
            </div>

            <button
              className="no-print"
              onClick={() => window.print()}
              style={{
                marginTop: 16,
                width: "100%",
                background: "linear-gradient(135deg,#b5342a,#e05c52)",
                border: "none",
                borderRadius: 12,
                padding: "16px 20px",
                color: "#fff",
                fontFamily: "Arial, sans-serif",
                fontWeight: "bold",
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(181,52,42,0.4)",
              }}
            >
              🖨️ Imprimir / Salvar PDF
            </button>
          </div>
        )}
      </div>

      {/* ── NAVEGAÇÃO ── */}
      {step < STEPS.length - 1 && (
        <div className="no-print" style={{ width: "100%", maxWidth: 660, display: "flex", gap: 12, marginTop: 18 }}>
          {step > 0 && (
            <button
              onClick={() => go(-1)}
              style={{
                padding: "14px 24px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "rgba(255,255,255,0.6)",
                fontFamily: "Arial, sans-serif",
                fontSize: 15,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={() => go(1)}
            disabled={!canProceed()}
            style={{
              flex: 1,
              padding: "14px 24px",
              background: canProceed() ? "linear-gradient(135deg,#b5342a,#e05c52)" : "rgba(255,255,255,0.06)",
              border: canProceed() ? "none" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: canProceed() ? "#fff" : "rgba(255,255,255,0.3)",
              fontFamily: "Arial, sans-serif",
              fontWeight: "bold",
              fontSize: 15,
              cursor: canProceed() ? "pointer" : "not-allowed",
              boxShadow: canProceed() ? "0 4px 20px rgba(181,52,42,0.35)" : "none",
              transition: "all 0.2s",
            }}
          >
            {step === STEPS.length - 2 ? "Ver Relatório →" : "Continuar →"}
          </button>
        </div>
      )}

      {/* ── DOTS ── */}
      <div className="no-print" style={{ display: "flex", gap: 6, marginTop: 18 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 6,
              height: 6,
              borderRadius: 3,
              background: i <= step ? "#e05c52" : "rgba(255,255,255,0.15)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
