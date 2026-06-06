import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fmSupabase, STATUS_COLORS, STATUS_LABELS, brl, type ContratoStatus } from "@/lib/fm-contratos";

export const Route = createFileRoute("/admin/contratos")({
  head: () => ({ meta: [{ title: "Contratos · F&M" }] }),
  component: AdminContratosPage,
});

const ADMIN_KEY = "fm_admin_auth";
type Row = Record<string, unknown>;

function AdminContratosPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [delOpen, setDelOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<Row | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") { navigate({ to: "/admin/login" }); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await fmSupabase
      .from("contratos")
      .select("*, clientes(nome, codigo_cliente)")
      .order("criado_em", { ascending: false });
    if (error) toast.error("Erro ao carregar: " + error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => {
      const cli = (r.clientes as { nome?: string } | null)?.nome ?? "";
      return [r.numero, cli, r.sistema_construtivo, r.tipo_servico]
        .map((v) => String(v ?? "").toLowerCase()).some((s) => s.includes(t));
    });
  }, [rows, q]);

  const onDelete = async () => {
    if (!delTarget) return;
    const { error } = await fmSupabase.from("contratos").delete().eq("id", delTarget.id as string);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Contrato excluído");
    setRows((arr) => arr.filter((x) => x.id !== delTarget.id));
    setDelOpen(false); setDelTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Contratos</h1>
          </div>
          <Button asChild>
            <Link to="/admin/contratos/$id" params={{ id: "novo" }}>
              <Plus className="mr-1 h-4 w-4" /> Novo Contrato
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número, cliente, sistema..." className="pl-9" />
        </div>

        <div className="rounded-lg border bg-white">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">Nenhum contrato encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Número</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Sistema</th>
                  <th className="p-3">Serviço</th>
                  <th className="p-3 text-right">Valor Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const status = (r.status as ContratoStatus) || "rascunho";
                  const cli = (r.clientes as { nome?: string } | null)?.nome ?? "—";
                  return (
                    <tr key={String(r.id)} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{String(r.numero || "—")}</td>
                      <td className="p-3">{cli}</td>
                      <td className="p-3">{String(r.sistema_construtivo || "—")}</td>
                      <td className="p-3">{String(r.tipo_servico || "—")}</td>
                      <td className="p-3 text-right">{brl(Number(r.valor_total || 0))}</td>
                      <td className="p-3">
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-medium text-white" style={{ background: STATUS_COLORS[status] }}>
                          {STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" title="Ver/Editar">
                            <Link to="/admin/contratos/$id" params={{ id: String(r.id) }}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                          {r.token_cliente ? (
                            <Button asChild size="icon" variant="ghost" title="Ver link do cliente">
                              <Link to="/contrato/$token" params={{ token: String(r.token_cliente) }} target="_blank"><Eye className="h-4 w-4" /></Link>
                            </Button>
                          ) : null}
                          <Button size="icon" variant="ghost" title="Excluir" onClick={() => { setDelTarget(r); setDelOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Aditivos e medições vinculadas serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}