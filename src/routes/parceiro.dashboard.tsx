import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LogOut, Star, Phone, Mail, MapPin, Briefcase, Calendar } from "lucide-react";
import { fmSupabase, getParceiro, clearParceiro } from "@/lib/fm-parceiro";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const BRAND_DARK = "#2C3E50";

export const Route = createFileRoute("/parceiro/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard do Parceiro | F&M" }],
  }),
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
          fmSupabase.from("Mural_oportunidades").select("*"),
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
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parceiro?.id]);

  const ratings = avaliacoes
    .map((a) => Number(pick<number | string>(a, ["Rating", "rating", "estrelas"], 0)))
    .filter((n) => n > 0);
  const media = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;

  const especialidades = useMemo(() => {
    const s = new Set<string>();
    oportunidades.forEach((o) => {
      const e = pick<string>(o, ["Especialidade", "especialidade"], "");
      if (e) s.add(e);
    });
    return Array.from(s);
  }, [oportunidades]);

  const oportunidadesFiltradas = filtroEsp
    ? oportunidades.filter(
        (o) => pick<string>(o, ["Especialidade", "especialidade"], "") === filtroEsp,
      )
    : oportunidades;

  if (!parceiro) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 text-xl font-extrabold tracking-tight">
              <span style={{ color: BRAND_BLUE }}>F</span>
              <span style={{ color: BRAND_YELLOW }}>&</span>
              <span style={{ color: BRAND_GREEN }}>M</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm sm:text-base font-bold" style={{ color: BRAND_BLUE }}>
                {parceiro.Nome ?? "Parceiro"}
              </p>
              <p className="text-xs text-muted-foreground">
                {parceiro.Especialidade ?? "—"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              clearParceiro();
              navigate({ to: "/parceiro/login" });
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* PERFIL */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>
            Meu Perfil
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Nome" value={parceiro.Nome ?? "—"} />
            <InfoRow label="Especialidade" value={parceiro.Especialidade ?? "—"} />
            <InfoRow label="Cidade" value={parceiro.Cidade ?? "—"} />
            <InfoRow label="WhatsApp" value={parceiro.Whatsapp ?? "—"} />
          </div>
          <div className="mt-4">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase"
              style={{
                backgroundColor:
                  (parceiro.Status ?? "").toString().toLowerCase() === "ativo"
                    ? BRAND_GREEN
                    : "#94a3b8",
                color: "#fff",
              }}
            >
              {parceiro.Status ?? "—"}
            </span>
          </div>
        </section>

        {/* AVALIAÇÕES */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>
              Minhas Avaliações
            </h2>
            {ratings.length > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={media} size={18} />
                <span className="text-sm font-bold" style={{ color: BRAND_DARK }}>
                  {media.toFixed(1)}/5
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : avaliacoes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Você ainda não tem avaliações.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {avaliacoes.map((a, i) => {
                const rating = Number(pick<number | string>(a, ["Rating", "rating"], 0));
                const comentario = pick<string>(a, ["Comentario", "comentario"], "");
                const nome = pick<string>(a, ["Nome_avaliador", "Nome", "nome"], "Cliente");
                const tel = pick<string>(a, ["Telefone_avaliador", "Telefone", "telefone", "Whatsapp"], "");
                const email = pick<string>(a, ["Email_avaliador", "Email", "email"], "");
                const obra = pick<string>(a, ["Obra_nome", "Obra", "obra"], "");
                return (
                  <div key={i} className="rounded-xl border p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Stars rating={rating} />
                      {obra && (
                        <span className="text-xs text-muted-foreground">{obra}</span>
                      )}
                    </div>
                    {comentario && (
                      <p className="mt-2 text-sm font-medium text-foreground italic">
                        "{comentario}"
                      </p>
                    )}
                    <p className="mt-3 text-sm font-bold" style={{ color: BRAND_BLUE }}>
                      {nome}
                    </p>
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
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          className="inline-flex items-center gap-1 hover:underline"
                          style={{ color: BRAND_BLUE }}
                        >
                          <Mail className="h-3 w-3" /> {email}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MURAL */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>
              Mural de Oportunidades
            </h2>
            {especialidades.length > 0 && (
              <select
                value={filtroEsp}
                onChange={(e) => setFiltroEsp(e.target.value)}
                className="rounded-md border px-3 py-1.5 text-sm bg-background"
              >
                <option value="">Todas especialidades</option>
                {especialidades.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : oportunidadesFiltradas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma oportunidade disponível no momento.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {oportunidadesFiltradas.map((o, i) => {
                const titulo = pick<string>(o, ["Titulo", "titulo"], "Vaga");
                const esp = pick<string>(o, ["Especialidade", "especialidade"], "");
                const cidade = pick<string>(o, ["Cidade", "cidade"], "");
                const dataInicio = pick<string>(o, ["Data_inicio", "data_inicio", "Data"], "");
                const desc = pick<string>(o, ["Descricao", "descricao"], "");
                return (
                  <div key={i} className="rounded-xl border p-4 flex flex-col">
                    <h3 className="text-base font-bold" style={{ color: BRAND_BLUE }}>
                      {titulo}
                    </h3>
                    {esp && (
                      <span
                        className="mt-2 self-start inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
                      >
                        <Briefcase className="h-3 w-3" /> {esp}
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {cidade && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {cidade}
                        </span>
                      )}
                      {dataInicio && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {dataInicio}
                        </span>
                      )}
                    </div>
                    {desc && <p className="mt-3 text-sm text-foreground/80 flex-1">{desc}</p>}
                    <button
                      className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                      style={{ backgroundColor: BRAND_GREEN }}
                    >
                      Tenho Interesse
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground py-4">
          <Link to="/parceiros" className="hover:underline">
            Ver galeria pública de parceiros
          </Link>
        </p>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}