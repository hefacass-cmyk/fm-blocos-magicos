import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações WhatsApp · Admin F&M" }] }),
  component: AdminNotificacoesPage,
});

type Notif = {
  id: string;
  tipo?: string | null;
  destinatario?: string | null;
  telefone?: string | null;
  status?: string | null;
  created_at?: string | null;
  enviado_em?: string | null;
  erro?: string | null;
  tentativas?: number | null;
};

const STATUS_CLASSES: Record<string, string> = {
  enviado: "bg-emerald-100 text-emerald-800",
  pendente: "bg-amber-100 text-amber-800",
  erro: "bg-rose-100 text-rose-800",
};
const ADMIN_KEY = "fm_admin_auth";

function AdminNotificacoesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Notif[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await fmSupabase
        .from("notificacoes_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      setRows((data || []) as Notif[]);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") { navigate({ to: "/admin/login" }); return; }
    load();
  }, [navigate]);

  const tipos = useMemo(() => Array.from(new Set(rows.map((r) => r.tipo).filter(Boolean))) as string[], [rows]);
  const filtradas = rows.filter((r) =>
    (filtroTipo === "all" || r.tipo === filtroTipo) &&
    (filtroStatus === "all" || (r.status || "").toLowerCase() === filtroStatus)
  );

  const reenviar = async (id: string) => {
    try {
      const { error } = await fmSupabase
        .from("notificacoes_log")
        .update({ status: "pendente", erro: null })
        .eq("id", id);
      if (error) throw error;
      toast.success("Reenfileirado para envio");
      setRows((arr) => arr.map((r) => r.id === id ? { ...r, status: "pendente", erro: null } : r));
    } catch (e: any) {
      toast.error(e?.message || "Falha ao reenviar");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="text-slate-500 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-lg font-bold text-slate-900">Notificações WhatsApp</h1>
          </div>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tipo:</span>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="erro">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Destinatário</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Data envio</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">Sem registros.</td></tr>
                ) : filtradas.map((r) => {
                  const st = (r.status || "pendente").toLowerCase();
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3 font-medium text-slate-900">{r.tipo || "—"}</td>
                      <td className="p-3 text-slate-600">{r.destinatario || r.telefone || "—"}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASSES[st] || "bg-slate-100 text-slate-700"}`}>{st}</span>
                        {r.erro && <p className="mt-1 text-[10px] text-rose-600 truncate max-w-[260px]" title={r.erro}>{r.erro}</p>}
                      </td>
                      <td className="p-3 text-xs text-slate-500">{(r.enviado_em || r.created_at) ? new Date((r.enviado_em || r.created_at) as string).toLocaleString("pt-BR") : "—"}</td>
                      <td className="p-3 text-right">
                        {st === "erro" && <Button size="sm" variant="outline" onClick={() => reenviar(r.id)}><RefreshCw className="h-3 w-3 mr-1" /> Reenviar</Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
