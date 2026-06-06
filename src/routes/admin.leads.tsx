import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, MapPin, MessageSquare, UserPlus, Loader2 } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Leads · Admin F&M" }] }),
  component: AdminLeadsPage,
});

type Parc = {
  parceiro_id: string;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  total_leads: number;
  convertidos: number;
  pendentes: number;
  ultimo_lead?: string | null;
};

type Lead = {
  id: string;
  nome_cliente?: string | null;
  telefone_cliente?: string | null;
  email_cliente?: string | null;
  origem?: string | null;
  status?: string | null;
  created_at?: string | null;
  parceiro_id?: string | null;
  mensagem?: string | null;
};

const ADMIN_KEY = "fm_admin_auth";

function AdminLeadsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [parceiros, setParceiros] = useState<Parc[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [leadsPorParc, setLeadsPorParc] = useState<Record<string, Lead[]>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") { navigate({ to: "/admin/login" }); return; }
    (async () => {
      try {
        const { data, error } = await fmSupabase.from("leads_por_parceiro").select("*");
        if (error) throw error;
        setParceiros((data || []) as Parc[]);
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar leads");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const carregarLeads = async (parceiroId: string) => {
    if (leadsPorParc[parceiroId]) return;
    try {
      const { data } = await fmSupabase
        .from("referral_leads")
        .select("*")
        .eq("parceiro_id", parceiroId)
        .order("created_at", { ascending: false });
      setLeadsPorParc((m) => ({ ...m, [parceiroId]: (data || []) as Lead[] }));
    } catch { /* ignore */ }
  };

  const toggle = async (id: string) => {
    if (expandido === id) { setExpandido(null); return; }
    setExpandido(id);
    await carregarLeads(id);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="text-slate-500 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-lg font-bold text-slate-900">Leads de Parceiros</h1>
          </div>
          <Link to="/admin/contratos" className="text-xs font-semibold text-slate-600 hover:text-slate-900">Contratos</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : parceiros.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center text-sm text-slate-500">Nenhum lead de parceiro até o momento.</div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Parceiro</th>
                  <th className="p-3">Cidade/UF</th>
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 text-center">Convertidos</th>
                  <th className="p-3 text-center">Pendentes</th>
                  <th className="p-3">Último Lead</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {parceiros.map((p) => (
                  <>
                    <tr key={p.parceiro_id} onClick={() => toggle(p.parceiro_id)} className="border-b cursor-pointer hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{p.nome}</td>
                      <td className="p-3 text-slate-600"><MapPin className="inline h-3 w-3 mr-1" />{p.cidade || "—"}/{p.estado || "—"}</td>
                      <td className="p-3 text-center font-bold">{p.total_leads}</td>
                      <td className="p-3 text-center text-emerald-700 font-bold">{p.convertidos}</td>
                      <td className="p-3 text-center text-amber-700 font-bold">{p.pendentes}</td>
                      <td className="p-3 text-xs text-slate-500">{p.ultimo_lead ? new Date(p.ultimo_lead).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="p-3 text-right"><ChevronRight className={`h-4 w-4 transition ${expandido === p.parceiro_id ? "rotate-90" : ""}`} /></td>
                    </tr>
                    {expandido === p.parceiro_id && (
                      <tr key={`${p.parceiro_id}-x`}>
                        <td colSpan={7} className="bg-slate-50 p-4">
                          {!leadsPorParc[p.parceiro_id] ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : leadsPorParc[p.parceiro_id].length === 0 ? (
                            <p className="text-xs text-slate-500">Sem leads detalhados.</p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {leadsPorParc[p.parceiro_id].map((l) => (
                                <div key={l.id} className="rounded-md border bg-white p-3 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-900">{l.nome_cliente || "—"}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.status === "convertido" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                      {l.status || "pendente"}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-slate-600"><MessageSquare className="inline h-3 w-3 mr-1" />{l.telefone_cliente || l.email_cliente || "—"}</p>
                                  <p className="text-slate-500">Origem: {l.origem || "—"} · {l.created_at ? new Date(l.created_at).toLocaleDateString("pt-BR") : ""}</p>
                                  {l.status !== "convertido" && (
                                    <Link to="/iniciar-contrato" search={{ lead: l.id } as any} className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-slate-900" style={{ backgroundColor: "#F4B941" }}>
                                      <UserPlus className="h-3 w-3" /> Converter em Contrato
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate({ to: "/admin/dashboard" })}>Voltar ao dashboard</Button>
        </div>
      </main>
    </div>
  );
}
