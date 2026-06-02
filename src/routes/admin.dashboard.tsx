import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Building2, MessageSquare, Star, Activity, Eye, LogOut, Check, X, Loader2, KeyRound, Mail } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { logAdmin } from "@/lib/fm-tracking";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const ADMIN_KEY = "fm_admin_auth";
const AMPLIACAO_INCREMENTO = 15;

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Painel Admin · F&M" }] }),
  component: AdminDashboardPage,
});

type Row = Record<string, unknown>;

function startOfDay(): string { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
function startOfWeek(): string { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString(); }

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    acessosTotal: 0, acessosHoje: 0, acessosSemana: 0,
    parceirosTotal: 0, parceirosSemana: 0, parceirosPendentes: 0,
    obrasTotal: 0, fotosTotal: 0, parceirosNoLimite: 0,
    avaliacoesTotal: 0, mediaGeral: 0,
    topParceiroNome: "—", topParceiroNota: 0,
  });
  const [solicitacoes, setSolicitacoes] = useState<Row[]>([]);
  const [feedbacks, setFeedbacks] = useState<Row[]>([]);
  const [logs, setLogs] = useState<Row[]>([]);
  const [parceiros, setParceiros] = useState<Row[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") {
      navigate({ to: "/admin/login" });
      return;
    }
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const dayIso = startOfDay();
        const weekIso = startOfWeek();
        const [
          acessosAll, acessosHj, acessosSe,
          parceirosAll, parceirosSe, parceirosPend,
          obras, fotos,
          avaliacoes,
          solics, fbs, logsRes,
        ] = await Promise.all([
          fmSupabase.from("acessos_site").select("id", { count: "exact", head: true }),
          fmSupabase.from("acessos_site").select("id", { count: "exact", head: true }).gte("criado_em", dayIso),
          fmSupabase.from("acessos_site").select("id", { count: "exact", head: true }).gte("criado_em", weekIso),
          fmSupabase.from("parceiros").select("id, nome, empresa, limite_obras, ativo, criado_em"),
          fmSupabase.from("parceiros").select("id", { count: "exact", head: true }).gte("criado_em", weekIso),
          fmSupabase.from("parceiros").select("id", { count: "exact", head: true }).eq("ativo", false),
          fmSupabase.from("obras_parceiro").select("id, parceiro_id"),
          fmSupabase.from("fotos_obra").select("id", { count: "exact", head: true }),
          fmSupabase.from("avaliacoes").select("parceiro_id, nota"),
          fmSupabase.from("solicitacoes_ampliacao").select("*").order("criado_em", { ascending: false }),
          fmSupabase.from("feedbacks_parceiro").select("*").order("created_at", { ascending: false }).limit(20),
          fmSupabase.from("logs_admin").select("*").order("criado_em", { ascending: false }).limit(50),
        ]);
        if (!active) return;

        const parceirosRows = (parceirosAll.data as Row[]) ?? [];
        const obrasRows = (obras.data as Row[]) ?? [];
        const avRows = (avaliacoes.data as Row[]) ?? [];

        // obras por parceiro
        const obrasPorParceiro: Record<string, number> = {};
        for (const o of obrasRows) {
          const pid = String(o.parceiro_id);
          obrasPorParceiro[pid] = (obrasPorParceiro[pid] ?? 0) + 1;
        }
        let noLimite = 0;
        for (const p of parceirosRows) {
          const lim = Number(p.limite_obras ?? 4) || 4;
          if ((obrasPorParceiro[String(p.id)] ?? 0) >= lim) noLimite++;
        }

        // ratings agregados
        const agg: Record<string, { soma: number; total: number }> = {};
        let somaGeral = 0; let totalGeral = 0;
        for (const a of avRows) {
          const pid = String(a.parceiro_id);
          const nota = Number(a.nota) || 0;
          if (!nota) continue;
          agg[pid] = agg[pid] ?? { soma: 0, total: 0 };
          agg[pid].soma += nota; agg[pid].total += 1;
          somaGeral += nota; totalGeral += 1;
        }
        let topId = ""; let topMedia = 0;
        for (const pid of Object.keys(agg)) {
          const m = agg[pid].soma / agg[pid].total;
          if (m > topMedia) { topMedia = m; topId = pid; }
        }
        const topParc = parceirosRows.find((p) => String(p.id) === topId);

        setStats({
          acessosTotal: acessosAll.count ?? 0,
          acessosHoje: acessosHj.count ?? 0,
          acessosSemana: acessosSe.count ?? 0,
          parceirosTotal: parceirosRows.length,
          parceirosSemana: parceirosSe.count ?? 0,
          parceirosPendentes: parceirosPend.count ?? 0,
          obrasTotal: obrasRows.length,
          fotosTotal: fotos.count ?? 0,
          parceirosNoLimite: noLimite,
          avaliacoesTotal: totalGeral,
          mediaGeral: totalGeral ? somaGeral / totalGeral : 0,
          topParceiroNome: topParc ? String(topParc.nome ?? topParc.empresa ?? "—") : "—",
          topParceiroNota: topMedia,
        });
        setSolicitacoes((solics.data as Row[]) ?? []);
        setFeedbacks((fbs.data as Row[]) ?? []);
        setLogs((logsRes.data as Row[]) ?? []);
        setParceiros(parceirosRows);
      } catch (e) {
        console.error("[admin] load", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [navigate]);

  const aprovar = async (s: Row) => {
    try {
      const pid = s.parceiro_id;
      const { data: pdata } = await fmSupabase.from("parceiros").select("limite_obras, nome").eq("id", pid).maybeSingle();
      const atual = Number((pdata as Row | null)?.limite_obras ?? 4) || 4;
      const novo = atual + AMPLIACAO_INCREMENTO;
      await fmSupabase.from("parceiros").update({ limite_obras: novo }).eq("id", pid);
      await fmSupabase.from("solicitacoes_ampliacao").update({ status: "aprovado" }).eq("id", s.id);
      await logAdmin("ampliacao_aprovada", `Ampliação aprovada (+${AMPLIACAO_INCREMENTO}) p/ ${String((pdata as Row | null)?.nome ?? pid)}`, "admin");
      setSolicitacoes((arr) => arr.map((x) => x.id === s.id ? { ...x, status: "aprovado" } : x));
    } catch (e) { console.error(e); alert("Erro ao aprovar"); }
  };

  const rejeitar = async (s: Row) => {
    try {
      await fmSupabase.from("solicitacoes_ampliacao").update({ status: "rejeitado" }).eq("id", s.id);
      await logAdmin("ampliacao_rejeitada", `Solicitação ${s.id} rejeitada`, "admin");
      setSolicitacoes((arr) => arr.map((x) => x.id === s.id ? { ...x, status: "rejeitado" } : x));
    } catch (e) { console.error(e); }
  };

  const sair = () => { sessionStorage.removeItem(ADMIN_KEY); navigate({ to: "/admin/login" }); };

  const toggleVerificado = async (p: Row) => {
    const novo = !p.verificado;
    const prev = parceiros;
    setParceiros((arr) => arr.map((x) => x.id === p.id ? { ...x, verificado: novo } : x));
    const { error } = await fmSupabase.from("parceiros").update({ verificado: novo }).eq("id", p.id);
    if (error) {
      console.error("[admin] toggleVerificado", error);
      alert("Erro ao atualizar verificação: " + error.message);
      setParceiros(prev);
      return;
    }
    await logAdmin(
      novo ? "parceiro_verificado" : "parceiro_desverificado",
      `${String(p.nome ?? p.empresa ?? p.id)} ${novo ? "marcado como verificado" : "desmarcado"}`,
      "admin",
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_BLUE }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-extrabold" style={{ color: BRAND_BLUE }}>
            🔑 Chave Mestra · Painel F&M
          </h1>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/senhas"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <KeyRound className="h-4 w-4" /> Senhas
            </Link>
            <Link
              to="/admin/auditoria-emails"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <Mail className="h-4 w-4" /> Auditoria de emails
            </Link>
            <button onClick={sair} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Kpi icon={Eye} label="Acessos (total)" value={stats.acessosTotal} sub={`Hoje: ${stats.acessosHoje} · 7d: ${stats.acessosSemana}`} />
          <Kpi icon={Users} label="Parceiros" value={stats.parceirosTotal} sub={`Novos 7d: ${stats.parceirosSemana} · Pendentes: ${stats.parceirosPendentes}`} />
          <Kpi icon={Building2} label="Obras" value={stats.obrasTotal} sub={`Fotos: ${stats.fotosTotal} · No limite: ${stats.parceirosNoLimite}`} />
          <Kpi icon={Star} label="Avaliações" value={stats.avaliacoesTotal} sub={`Média geral: ${stats.mediaGeral.toFixed(1)} ⭐`} />
        </div>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-bold" style={{ color: BRAND_BLUE }}>🏆 Parceiro melhor avaliado</h2>
          <p className="text-sm">
            <strong>{stats.topParceiroNome}</strong>{" "}
            <span className="text-slate-600">— {stats.topParceiroNota.toFixed(1)} ⭐</span>
          </p>
        </section>

        {/* Solicitações */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 inline-flex items-center gap-2 text-base font-bold" style={{ color: BRAND_BLUE }}>
            <MessageSquare className="h-4 w-4" /> Solicitações de Ampliação
          </h2>
          {solicitacoes.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma solicitação.</p>
          ) : (
            <div className="space-y-2">
              {solicitacoes.map((s) => (
                <div key={String(s.id)} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Parceiro: {String(s.parceiro_id)} · {String(s.criado_em ?? "").slice(0,16).replace("T"," ")}</p>
                    <p className="text-sm text-slate-800">{String(s.mensagem ?? "")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                      style={{ backgroundColor:
                        s.status === "aprovado" ? BRAND_GREEN :
                        s.status === "rejeitado" ? "#ef4444" : "#94a3b8" }}
                    >{String(s.status ?? "pendente")}</span>
                    {s.status !== "aprovado" && s.status !== "rejeitado" && (
                      <>
                        <button onClick={() => aprovar(s)} className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: BRAND_GREEN }}>
                          <Check className="inline h-3 w-3" /> Aprovar (+{AMPLIACAO_INCREMENTO})
                        </button>
                        <button onClick={() => rejeitar(s)} className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: "#ef4444" }}>
                          <X className="inline h-3 w-3" /> Rejeitar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Feedbacks */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-bold" style={{ color: BRAND_BLUE }}>💬 Feedbacks recentes de clientes</h2>
          {feedbacks.length === 0 ? (
            <p className="text-sm text-slate-500">Sem feedbacks.</p>
          ) : (
            <ul className="space-y-2">
              {feedbacks.map((f, i) => (
                <li key={i} className="rounded-lg border p-3 text-sm">
                  <p className="text-xs text-slate-500">{String(f.nome_cliente ?? f.nome ?? "Cliente")}</p>
                  <p>{String(f.depoimento ?? f.comentario ?? "")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Logs */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 inline-flex items-center gap-2 text-base font-bold" style={{ color: BRAND_BLUE }}>
            <Activity className="h-4 w-4" /> Logs (últimos 50)
          </h2>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">Sem logs.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-left">
                  <tr>
                    <th className="p-2">Quando</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 text-slate-500">{String(l.criado_em ?? "").slice(0,16).replace("T"," ")}</td>
                      <td className="p-2"><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">{String(l.tipo ?? "")}</span></td>
                      <td className="p-2">{String(l.descricao ?? "")}</td>
                      <td className="p-2 text-slate-500">{String(l.origem ?? "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: BRAND_YELLOW }}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-extrabold" style={{ color: BRAND_BLUE }}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}