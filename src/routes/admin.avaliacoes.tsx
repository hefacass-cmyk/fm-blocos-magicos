import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { fmSupabase } from "@/lib/fm-supabase";
import { Button } from "@/components/ui/button";

const ADMIN_KEY = "fm_admin_auth";
const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações · Admin F&M" }] }),
  component: AdminAvaliacoesPage,
});

type Row = Record<string, unknown>;
type Filtro = "pendentes" | "aprovadas" | "rejeitadas";

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="h-4 w-4" style={{ color: BRAND_YELLOW, fill: i <= n ? BRAND_YELLOW : "transparent" }} />
      ))}
    </span>
  );
}

function AdminAvaliacoesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [parceirosMap, setParceirosMap] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<Filtro>("pendentes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") { navigate({ to: "/admin/login" }); return; }
    Promise.all([
      fmSupabase.from("avaliacoes").select("*").order("criado_em", { ascending: false }),
      fmSupabase.from("parceiros").select("id, nome, empresa"),
    ]).then(([a, p]) => {
      if (a.error) toast.error("Erro: " + a.error.message);
      setRows((a.data as Row[]) ?? []);
      const map: Record<string, string> = {};
      ((p.data as Row[]) ?? []).forEach((x) => {
        map[String(x.id)] = String(x.nome ?? x.empresa ?? "—");
      });
      setParceirosMap(map);
      setLoading(false);
    });
  }, [navigate]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const ap = r.aprovado;
      if (filtro === "pendentes") return ap === false || ap === null || ap === undefined;
      if (filtro === "aprovadas") return ap === true;
      return ap === "rejeitado" || r.rejeitado === true;
    });
  }, [rows, filtro]);

  const aprovar = async (r: Row) => {
    const { error } = await fmSupabase.from("avaliacoes").update({ aprovado: true, rejeitado: false }).eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Avaliação aprovada");
    setRows((arr) => arr.map((x) => (x.id === r.id ? { ...x, aprovado: true, rejeitado: false } : x)));
  };

  const rejeitar = async (r: Row) => {
    const { error } = await fmSupabase.from("avaliacoes").update({ aprovado: false, rejeitado: true }).eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Avaliação rejeitada");
    setRows((arr) => arr.map((x) => (x.id === r.id ? { ...x, aprovado: false, rejeitado: true } : x)));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>
            <ArrowLeft className="h-4 w-4" /> Painel
          </Link>
          <h1 className="text-base font-extrabold" style={{ color: BRAND_BLUE }}>Avaliações de Parceiros</h1>
          <span />
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex gap-2">
          {(["pendentes", "aprovadas", "rejeitadas"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filtro === f ? "text-white" : "bg-white text-slate-700"}`}
              style={filtro === f ? { backgroundColor: BRAND_BLUE, borderColor: BRAND_BLUE } : undefined}>
              {f === "pendentes" ? "Pendentes" : f === "aprovadas" ? "Aprovadas" : "Rejeitadas"}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma avaliação nesta categoria.</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => {
              const pid = String(r.parceiro_id ?? "");
              const pendente = !r.aprovado && !r.rejeitado;
              return (
                <li key={String(r.id)} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">{String(r.criado_em ?? "").slice(0, 10)}</p>
                      <p className="font-bold" style={{ color: BRAND_BLUE }}>{parceirosMap[pid] ?? "(parceiro)"}</p>
                      <p className="text-sm">por <strong>{String(r.nome_avaliador ?? "—")}</strong> {r.servico ? (<>· <em>{String(r.servico)}</em></>) : null}</p>
                      <div className="mt-1"><Stars n={Number(r.nota ?? 0)} /></div>
                      {r.comentario && <p className="mt-2 text-sm italic text-slate-700">"{String(r.comentario)}"</p>}
                    </div>
                    {pendente && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => aprovar(r)} className="bg-emerald-600 hover:bg-emerald-700"><Check className="h-4 w-4" /> Aprovar</Button>
                        <Button size="sm" variant="outline" onClick={() => rejeitar(r)} className="text-red-600 hover:bg-red-50"><X className="h-4 w-4" /> Rejeitar</Button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}