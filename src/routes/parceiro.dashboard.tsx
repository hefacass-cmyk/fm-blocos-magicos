import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  Star,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  MessageCircle,
  Share2,
  Copy,
  Check,
  Instagram,
} from "lucide-react";
import {
  fmSupabase,
  getParceiro,
  clearParceiro,
  parseEspecialidades,
  maskCpf,
  maskCnpj,
  ESPECIALIDADES,
  FM_WHATSAPP,
} from "@/lib/fm-parceiro";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const BRAND_DARK = "#2C3E50";

export const Route = createFileRoute("/parceiro/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard do Parceiro | F&M" }] }),
  component: ParceiroDashboardPage,
});

type Row = Record<string, unknown>;

function pick<T>(row: Row | null | undefined, keys: string[], fallback: T): T {
  if (!row) return fallback;
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return fallback;
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const r = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          style={{ color: BRAND_YELLOW, fill: i <= r ? BRAND_YELLOW : "transparent" }}
        />
      ))}
    </div>
  );
}

function ParceiroDashboardPage() {
  const navigate = useNavigate();
  const parceiro = typeof window !== "undefined" ? getParceiro() : null;

  const [avaliacoes, setAvaliacoes] = useState<Row[]>([]);
  const [oportunidades, setOportunidades] = useState<Row[]>([]);
  const [filtroEsp, setFiltroEsp] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parceiro) {
      navigate({ to: "/parceiro/login" });
      return;
    }
    let active = true;
    async function load() {
      try {
        const [av, op] = await Promise.all([
          fmSupabase
            .from("Avaliacoes")
            .select("*")
            .eq("Parceiro_id", parceiro!.id as string | number),
          fmSupabase
            .from("Mural_oportunidades")
            .select("*")
            .eq("status", "aberta"),
        ]);
        console.log("[parceiro/dashboard] avaliacoes:", av);
        console.log("[parceiro/dashboard] oportunidades:", op);
        if (!active) return;
        setAvaliacoes((av.data as Row[]) ?? []);
        setOportunidades((op.data as Row[]) ?? []);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parceiro?.id]);

  const ratings = avaliacoes
    .map((a) => Number(pick<number | string>(a, ["Rating", "rating", "Estrelas", "estrelas"], 0)))
    .filter((n) => n > 0);
  const media = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;

  const oportunidadesFiltradas = filtroEsp
    ? oportunidades.filter(
        (o) => pick<string>(o, ["Especialidade", "especialidade"], "") === filtroEsp,
      )
    : oportunidades;

  if (!parceiro) return null;

  const tipo = (parceiro.Tipo as "PF" | "PJ" | undefined) ?? (parceiro.CNPJ ? "PJ" : "PF");
  const especialidadesParceiro = parseEspecialidades(
    parceiro.Especialidade ?? (parceiro as Row).Especialidades ?? (parceiro as Row).especialidades,
  );
  const nomeExibido =
    tipo === "PJ"
      ? pick<string>(parceiro as Row, ["Nome_fantasia", "Razao_social", "Nome"], "Parceiro")
      : (parceiro.Nome ?? "Parceiro");
  const anos = pick<string | number>(parceiro as Row, ["Anos_experiencia", "anos_experiencia", "Experiencia"], "");
  const cidade = pick<string>(parceiro as Row, ["Cidade", "cidade"], "");
  const estado = pick<string>(parceiro as Row, ["Estado", "UF", "estado"], "");
  const email = pick<string>(parceiro as Row, ["Email", "email"], "");
  const whats = pick<string>(parceiro as Row, ["Whatsapp", "WhatsApp", "whatsapp"], "");

  const slug = String(
    pick<string>(parceiro as Row, ["slug", "Slug"], "") ||
      (parceiro.id !== undefined ? String(parceiro.id) : ""),
  );
  const shareUrl = slug
    ? `https://www.fmsmartbuild.com.br/parceiro/${slug}`
    : "";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-0.5 text-xl font-extrabold tracking-tight shrink-0">
              <span style={{ color: BRAND_BLUE }}>F</span>
              <span style={{ color: BRAND_YELLOW }}>&</span>
              <span style={{ color: BRAND_GREEN }}>M</span>
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm sm:text-base font-bold truncate" style={{ color: BRAND_BLUE }}>
                {nomeExibido}
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {especialidadesParceiro.length > 0 ? (
                  especialidadesParceiro.slice(0, 3).map((e) => (
                    <span
                      key={e}
                      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
                    >
                      {e}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => { clearParceiro(); navigate({ to: "/parceiro/login" }); }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <section
          className="rounded-2xl p-6 shadow-sm border text-white"
          style={{ background: `linear-gradient(135deg, ${BRAND_BLUE}, #2a6aa0)` }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold">Meu Perfil</h2>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase"
              style={{
                backgroundColor:
                  String(parceiro.Status ?? "").toLowerCase() === "ativo" ? BRAND_GREEN : "#94a3b8",
                color: "#fff",
              }}
            >
              {parceiro.Status ?? "—"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {tipo === "PF" ? (
              <>
                <InfoRow label="Nome" value={parceiro.Nome ?? "—"} />
                <InfoRow label="CPF" value={parceiro.CPF ? maskCpf(String(parceiro.CPF)) : "—"} />
                <InfoRow label="RG" value={pick<string>(parceiro as Row, ["RG", "rg"], "—")} />
                <InfoRow label="WhatsApp" value={whats || "—"} />
                <InfoRow label="Email" value={email || "—"} />
                <InfoRow label="Cidade / Estado" value={[cidade, estado].filter(Boolean).join(" / ") || "—"} />
              </>
            ) : (
              <>
                <InfoRow label="Razão Social" value={pick<string>(parceiro as Row, ["Razao_social", "Razao_Social"], "—")} />
                <InfoRow label="Nome Fantasia" value={pick<string>(parceiro as Row, ["Nome_fantasia", "Nome"], "—")} />
                <InfoRow label="CNPJ" value={parceiro.CNPJ ? maskCnpj(String(parceiro.CNPJ)) : "—"} />
                <InfoRow label="Responsável" value={pick<string>(parceiro as Row, ["Responsavel", "responsavel"], "—")} />
                <InfoRow label="WhatsApp" value={whats || "—"} />
                <InfoRow label="Email" value={email || "—"} />
                <InfoRow label="Cidade / Estado" value={[cidade, estado].filter(Boolean).join(" / ") || "—"} />
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {especialidadesParceiro.map((e) => (
              <span
                key={e}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
              >
                {e}
              </span>
            ))}
            {anos !== "" && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-white/15 border border-white/30">
                {anos} ano(s) de experiência
              </span>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>Minhas Avaliações</h2>
          </div>
        </section>
        {shareUrl && <ShareCardSection shareUrl={shareUrl} nome={nomeExibido} />}
        <section className="rounded-2xl bg-white p-6 shadow-sm border hidden">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>Minhas Avaliações (legacy)</h2>
            {ratings.length > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={media} size={26} />
                <span className="text-xl font-extrabold" style={{ color: BRAND_DARK }}>
                  {media.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">({ratings.length})</span>
              </div>
            )}
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : avaliacoes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Você ainda não tem avaliações.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {avaliacoes.map((a, i) => {
                const rating = Number(pick<number | string>(a, ["Rating", "rating", "Estrelas"], 0));
                const comentario = pick<string>(a, ["Comentario", "comentario"], "");
                const nome = pick<string>(a, ["Nome_avaliador", "Nome", "nome"], "Cliente");
                const tel = pick<string>(a, ["Telefone_avaliador", "Telefone", "telefone", "Whatsapp"], "");
                const emailAv = pick<string>(a, ["Email_avaliador", "Email", "email"], "");
                const obra = pick<string>(a, ["Obra_nome", "Obra", "obra"], "");
                const data = pick<string>(a, ["Data", "data", "created_at"], "");
                const origem = String(pick<string>(a, ["Origem", "origem", "Tipo"], "Cliente"));
                const isFM = /f.?m/i.test(origem);
                return (
                  <div key={i} className="rounded-xl border p-4 bg-muted/20 flex flex-col">
                    <div className="flex items-center justify-between">
                      <Stars rating={rating} size={18} />
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: isFM ? BRAND_BLUE : BRAND_GREEN }}
                      >
                        {isFM ? "F&M" : "Cliente"}
                      </span>
                    </div>
                    {comentario && (
                      <p className="mt-2 text-sm font-medium text-foreground italic">"{comentario}"</p>
                    )}
                    <p className="mt-3 text-sm font-bold" style={{ color: BRAND_BLUE }}>{nome}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs">
                      {tel && (
                        <a
                          href={`tel:${tel.replace(/\D/g, "")}`}
                          className="inline-flex items-center gap-1 hover:underline"
                          style={{ color: BRAND_GREEN }}
                        >
                          <Phone className="h-3 w-3" /> {tel}
                        </a>
                      )}
                      {emailAv && (
                        <a
                          href={`mailto:${emailAv}`}
                          className="inline-flex items-center gap-1 hover:underline"
                          style={{ color: BRAND_BLUE }}
                        >
                          <Mail className="h-3 w-3" /> {emailAv}
                        </a>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {obra && <span>Obra: {obra}</span>}
                      {data && <span>{String(data).slice(0, 10)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>Mural de Oportunidades</h2>
            <select
              value={filtroEsp}
              onChange={(e) => setFiltroEsp(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm bg-background"
            >
              <option value="">Todas especialidades</option>
              {ESPECIALIDADES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : oportunidadesFiltradas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma oportunidade disponível no momento.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {oportunidadesFiltradas.map((o, i) => {
                const titulo = pick<string>(o, ["Titulo", "titulo"], "Vaga");
                const esp = pick<string>(o, ["Especialidade", "especialidade"], "");
                const cidadeO = pick<string>(o, ["Cidade", "cidade"], "");
                const dataInicio = pick<string>(o, ["Data_inicio", "data_inicio", "Data"], "");
                const desc = pick<string>(o, ["Descricao", "descricao"], "");
                const msg = encodeURIComponent(`Olá! Tenho interesse na oportunidade "${titulo}" do Mural F&M.`);
                return (
                  <div key={i} className="rounded-xl border p-4 flex flex-col">
                    <h3 className="text-base font-bold" style={{ color: BRAND_BLUE }}>{titulo}</h3>
                    {esp && (
                      <span
                        className="mt-2 self-start inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
                      >
                        <Briefcase className="h-3 w-3" /> {esp}
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {cidadeO && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {cidadeO}
                        </span>
                      )}
                      {dataInicio && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {String(dataInicio).slice(0, 10)}
                        </span>
                      )}
                    </div>
                    {desc && <p className="mt-3 text-sm text-foreground/80 flex-1">{desc}</p>}
                    <a
                      href={`https://wa.me/${FM_WHATSAPP}?text=${msg}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                      style={{ backgroundColor: BRAND_GREEN }}
                    >
                      <MessageCircle className="h-4 w-4" /> Tenho Interesse
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground py-4">
          <Link to="/parceiros" className="hover:underline">Ver galeria pública de parceiros</Link>
        </p>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}