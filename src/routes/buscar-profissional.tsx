import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, MapPin, Star, ArrowRight, ChevronLeft, ChevronRight, ArrowUpDown, X, SlidersHorizontal } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { normalize, trackAcesso } from "@/lib/fm-tracking";
import { ESPECIALIDADES } from "@/lib/fm-parceiro";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const PAGE_SIZE = 12;

type SortBy = "rating_desc" | "recent" | "name_asc" | "name_desc";

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
  const [sortBy, setSortBy] = useState<SortBy>("rating_desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (q.trim()) count++;
    if (cidade) count++;
    if (esp) count++;
    if (segmento) count++;
    return count;
  }, [q, cidade, esp, segmento]);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    let list = parceiros.filter((p) => {
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

    list = [...list].sort((a, b) => {
      const idA = String(a.id);
      const idB = String(b.id);
      const nomeA = String(pick<string>(a, ["nome", "Nome"], ""));
      const nomeB = String(pick<string>(b, ["nome", "Nome"], ""));
      const rA = ratings[idA]?.media ?? 0;
      const rB = ratings[idB]?.media ?? 0;
      const tA = ratings[idA]?.total ?? 0;
      const tB = ratings[idB]?.total ?? 0;
      const criadoA = String(a.criado_em ?? "");
      const criadoB = String(b.criado_em ?? "");

      switch (sortBy) {
        case "rating_desc":
          if (rB !== rA) return rB - rA;
          if (tB !== tA) return tB - tA;
          return nomeA.localeCompare(nomeB);
        case "recent":
          return criadoB.localeCompare(criadoA);
        case "name_asc":
          return nomeA.localeCompare(nomeB);
        case "name_desc":
          return nomeB.localeCompare(nomeA);
        default:
          return 0;
      }
    });

    return list;
  }, [parceiros, q, cidade, esp, segmento, sortBy, ratings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const sortLabel: Record<SortBy, string> = {
    rating_desc: "Melhor avaliado",
    recent: "Mais recente",
    name_asc: "Nome: A → Z",
    name_desc: "Nome: Z → A",
  };

  function clearFilters() {
    setQ("");
    setCidade("");
    setEsp("");
    setSegmento("");
    setPage(1);
  }

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
              className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-10 text-sm focus:border-[#1A4D7A] focus:outline-none"
            />
            {q && (
              <button
                onClick={() => { setQ(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: BRAND_BLUE }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }}
                className="appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-[#1A4D7A] focus:outline-none"
              >
                <option value="rating_desc">Melhor avaliado</option>
                <option value="recent">Mais recente</option>
                <option value="name_asc">Nome: A → Z</option>
                <option value="name_desc">Nome: Z → A</option>
              </select>
              <ArrowUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </button>
            )}
          </div>

          {showFilters && (
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
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_BLUE }} />
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum profissional encontrado.
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-2 block w-full text-sm font-semibold hover:underline" style={{ color: BRAND_BLUE }}>
                Limpar filtros
              </button>
            )}
          </p>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              </span>
              <span>
                Página {safePage} de {totalPages}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === safePage;
                    const show =
                      p === 1 ||
                      p === totalPages ||
                      (p >= safePage - 1 && p <= safePage + 1);
                    if (!show) {
                      if (p === safePage - 2 || p === safePage + 2) {
                        return (
                          <span key={p} className="inline-flex h-9 w-9 items-center justify-center text-xs text-slate-400">
                            …
                          </span>
                        );
                      }
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-2.5 text-sm font-bold transition ${
                          isActive
                            ? "text-white"
                            : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                        style={isActive ? { backgroundColor: BRAND_BLUE } : undefined}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  Mostrando {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filtered.length)} de {filtered.length}
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
