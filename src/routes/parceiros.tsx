import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, Phone, Mail, MapPin, ArrowLeft } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const BRAND_DARK = "#2C3E50";

export const Route = createFileRoute("/parceiros")({
  head: () => ({
    meta: [
      { title: "Nossos Parceiros | F&M Construções Inteligentes" },
      { name: "description", content: "Conheça os profissionais parceiros da F&M em Camaçari/BA." },
    ],
  }),
  component: ParceirosPublicPage,
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

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
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

function initials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function ParceirosPublicPage() {
  const [parceiros, setParceiros] = useState<Row[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Row[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const [p, a] = await Promise.all([
        fmSupabase.from("Parceiros").select("*").eq("Status", "ativo"),
        fmSupabase.from("Avaliacoes").select("*"),
      ]);
      console.log("[parceiros] parceiros:", p);
      console.log("[parceiros] avaliacoes:", a);
      if (!active) return;
      setParceiros((p.data as Row[]) ?? []);
      setAvaliacoes((a.data as Row[]) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const especialidades = useMemo(() => {
    const s = new Set<string>();
    parceiros.forEach((p) => {
      const e = pick<string>(p, ["Especialidade", "especialidade"], "");
      if (e) s.add(e);
    });
    return Array.from(s);
  }, [parceiros]);

  const parceirosFiltrados = filtro
    ? parceiros.filter(
        (p) => pick<string>(p, ["Especialidade", "especialidade"], "") === filtro,
      )
    : parceiros;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex items-center gap-0.5 text-xl font-extrabold tracking-tight">
            <span style={{ color: BRAND_BLUE }}>F</span>
            <span style={{ color: BRAND_YELLOW }}>&</span>
            <span style={{ color: BRAND_GREEN }}>M</span>
          </div>
          <Link
            to="/parceiro/login"
            className="rounded-md px-3 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            Sou Parceiro
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: BRAND_BLUE }}>
            Nossos Parceiros
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Profissionais que constroem com a F&M.
          </p>
        </div>

        {especialidades.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setFiltro("")}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filtro === "" ? "text-white" : "bg-white text-foreground"
              }`}
              style={filtro === "" ? { backgroundColor: BRAND_BLUE, borderColor: BRAND_BLUE } : {}}
            >
              Todas
            </button>
            {especialidades.map((e) => (
              <button
                key={e}
                onClick={() => setFiltro(e)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  filtro === e ? "text-white" : "bg-white text-foreground"
                }`}
                style={filtro === e ? { backgroundColor: BRAND_BLUE, borderColor: BRAND_BLUE } : {}}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : parceirosFiltrados.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Nenhum parceiro disponível.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {parceirosFiltrados.map((p) => {
              const id = p.id ?? p.Id;
              const nome = pick<string>(p, ["Nome", "nome"], "Parceiro");
              const esp = pick<string>(p, ["Especialidade", "especialidade"], "");
              const cidade = pick<string>(p, ["Cidade", "cidade"], "");
              const foto = pick<string>(p, ["Foto_url", "foto_url", "Foto"], "");
              const avs = avaliacoes.filter(
                (a) =>
                  String(pick<string | number>(a, ["Parceiro_id", "parceiro_id"], "")) === String(id),
              );
              const ratings = avs
                .map((a) => Number(pick<number | string>(a, ["Rating", "rating"], 0)))
                .filter((n) => n > 0);
              const media = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
              const ultimas = avs.slice(0, 2);
              return (
                <article key={String(id)} className="rounded-2xl bg-white border shadow-sm p-5 flex flex-col">
                  <div className="flex items-center gap-3">
                    {foto ? (
                      <img src={foto} alt={nome} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div
                        className="h-14 w-14 rounded-full grid place-items-center text-white font-bold"
                        style={{ backgroundColor: BRAND_BLUE }}
                      >
                        {initials(nome)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold truncate" style={{ color: BRAND_DARK }}>{nome}</h3>
                      <p className="text-xs text-muted-foreground truncate">{esp}</p>
                      {cidade && (
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {cidade}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Stars rating={media} />
                    <span className="text-xs font-bold" style={{ color: BRAND_DARK }}>
                      {ratings.length ? `${media.toFixed(1)}/5` : "Sem avaliações"}
                    </span>
                  </div>

                  {ultimas.length > 0 && (
                    <div className="mt-3 space-y-2 flex-1">
                      {ultimas.map((a, i) => {
                        const comentario = pick<string>(a, ["Comentario", "comentario"], "");
                        const nomeAv = pick<string>(a, ["Nome_avaliador", "Nome", "nome"], "Cliente");
                        const tel = pick<string>(a, ["Telefone_avaliador", "Telefone", "telefone"], "");
                        const email = pick<string>(a, ["Email_avaliador", "Email", "email"], "");
                        return (
                          <div key={i} className="rounded-lg bg-muted/40 p-3 text-xs">
                            {comentario && (
                              <p className="italic text-foreground/80">"{comentario}"</p>
                            )}
                            <p className="mt-1 font-bold" style={{ color: BRAND_BLUE }}>{nomeAv}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
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
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}