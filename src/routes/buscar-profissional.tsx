import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, MapPin, Star, ArrowRight } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { normalize, trackAcesso } from "@/lib/fm-tracking";
import { ESPECIALIDADES } from "@/lib/fm-parceiro";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const PAGE_SIZE = 12;

export const Route = createFileRoute("/buscar-profissional")({
  head: () => ({
    meta: [
      { title: "Buscar Profissional | F&M Construções Inteligentes" },
      {
        name: "description",
        content:
          "Encontre o profissional ideal entre parceiros e fornecedores certificados F&M.",
      },
    ],
  }),
  component: BuscarProfissionalPage,
});

type Row = Record<string, unknown>;

function pick<T>(row: Row, keys: string[], fallback: T): T {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return fallback;
}

function BuscarProfissionalPage() {
  const [parceiros, setParceiros] = useState<Row[]>([]);
  const [ratings, setRatings] = useState<Record<string, { media: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cidade, setCidade] = useState("");
  const [esp, setEsp] = useState("");
  const [segmento, setSegmento] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    trackAcesso("/buscar-profissional");
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await fmSupabase
          .from("parceiros")
          .select("*")
          .order("criado_em", { ascending: false });
        if (!active) return;
        const rows = (data as Row[]) ?? [];
        setParceiros(rows);

        // calcula ratings agregados
        const ids = rows.map((r) => String(r.id));
        if (ids.length) {
          const { data: avs } = await fmSupabase
            .from("avaliacoes")
            .select("parceiro_id, nota")
            .in("parceiro_id", ids);
          const agg: Record<string, { soma: number; total: number }> = {};
          for (const a of (avs as Row[]) ?? []) {
            const pid = String(a.parceiro_id);
            const nota = Number(a.nota) || 0;
            agg[pid] = agg[pid] ?? { soma: 0, total: 0 };
            agg[pid].soma += nota;
            agg[pid].total += 1;
          }
          const out: Record<string, { media: number; total: number }> = {};
          for (const pid of Object.keys(agg)) {
            out[pid] = {
              media: agg[pid].total ? agg[pid].soma / agg[pid].total : 0,
              total: agg[pid].total,
            };
          }
          if (active) setRatings(out);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const cidades = useMemo(() => {
    const set = new Set<string>();
    for (const p of parceiros) {
      const c = String(pick<string>(p, ["cidade", "Cidade"], ""));
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [parceiros]);

  const segmentos = useMemo(() => {
    const set = new Set<string>();
    for (const p of parceiros) {
      const s = String(pick<string>(p, ["segmento", "Segmento"], ""));
      if (s) set.add(s);
    }
    return Array.from(set).sort();
  }, [parceiros]);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    return parceiros.filter((p) => {
      const nome = normalize(String(pick<string>(p, ["nome", "Nome"], "")));
      const empresa = normalize(String(pick<string>(p, ["empresa", "Empresa"], "")));
      const especialidade = String(pick<string>(p, ["especialidade", "Especialidade"], ""));
      const seg = String(pick<string>(p, ["segmento", "Segmento"], ""));
      const cid = String(pick<string>(p, ["cidade", "Cidade"], ""));
      if (nq && !nome.includes(nq) && !empresa.includes(nq) && !normalize(especialidade).includes(nq) && !normalize(cid).includes(nq))
        return false;
      if (cidade && cid !== cidade) return false;
      if (esp && especialidade !== esp) return false;
      if (segmento && seg !== segmento) return false;
      return true;
    });
  }, [parceiros, q, cidade, esp, segmento]);

  const visible = filtered.slice(0, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            ← Voltar ao site
          </Link>
          <div className="flex items-center gap-0.5 text-lg font-extrabold tracking-tight">
            <span style={{ color: BRAND_BLUE }}>F</span>
            <span style={{ color: BRAND_YELLOW }}>&</span>
            <span style={{ color: BRAND_GREEN }}>M</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold sm:text-4xl" style={{ color: BRAND_BLUE }}>
          Encontre o Profissional Ideal
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Procure um parceiro ou fornecedor certificado F&M.
        </p>

        <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Procure um parceiro ou fornecedor (nome, empresa, especialidade, cidade)"
              className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-[#1A4D7A] focus:outline-none"
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={cidade}
              onChange={(e) => { setCidade(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Todas cidades</option>
              {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={esp}
              onChange={(e) => { setEsp(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Todas especialidades</option>
              {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <select
              value={segmento}
              onChange={(e) => { setSegmento(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Todos segmentos</option>
              {segmentos.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_BLUE }} />
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum profissional encontrado.
          </p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => {
                const id = String(p.id);
                const slug = String(pick<string>(p, ["slug", "Slug"], "")) || id;
                const nome = String(pick<string>(p, ["nome", "Nome"], "Parceiro"));
                const empresa = String(pick<string>(p, ["empresa", "Empresa"], ""));
                const especialidade = String(pick<string>(p, ["especialidade", "Especialidade"], ""));
                const cid = String(pick<string>(p, ["cidade", "Cidade"], ""));
                const est = String(pick<string>(p, ["estado", "Estado", "UF"], ""));
                const foto = String(pick<string>(p, ["foto_perfil", "Foto_url", "foto"], ""));
                const r = ratings[id];
                return (
                  <div key={id} className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3 p-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: BRAND_YELLOW }}>
                        {foto ? (
                          <img src={foto} alt={nome} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-white" style={{ backgroundColor: BRAND_BLUE }}>
                            {nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold" style={{ color: BRAND_BLUE }}>{nome}</p>
                        {empresa && <p className="truncate text-xs text-slate-600">{empresa}</p>}
                        <div className="mt-1 inline-flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3" style={{ color: BRAND_YELLOW, fill: BRAND_YELLOW }} />
                          <span className="font-bold text-slate-700">
                            {r ? r.media.toFixed(1) : "—"}
                          </span>
                          <span className="text-slate-500">({r?.total ?? 0})</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 px-4 pb-3 text-xs">
                      {especialidade && (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: BRAND_GREEN }}>
                          {especialidade}
                        </span>
                      )}
                      {(cid || est) && (
                        <p className="mt-1 inline-flex items-center gap-1 text-slate-500">
                          <MapPin className="h-3 w-3" /> {[cid, est].filter(Boolean).join(" / ")}
                        </p>
                      )}
                    </div>
                    <Link
                      to="/parceiro/$slug"
                      params={{ slug }}
                      className="flex items-center justify-center gap-1 border-t px-4 py-3 text-sm font-bold transition hover:brightness-95"
                      style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
                    >
                      Ver Perfil <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
            {visible.length < filtered.length && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}