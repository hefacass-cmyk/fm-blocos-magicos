import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye, Loader2, ArrowLeft, Link2, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fmSupabase, STATUS_COLORS, STATUS_LABELS, brl, fmtData, gerarNumeroContrato, type ContratoStatus } from "@/lib/fm-contratos";
import { restoreAdminSession } from "@/lib/fm-admin-auth";

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
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;

    const init = async () => {
      const ok = sessionStorage.getItem(ADMIN_KEY) === "1" || await restoreAdminSession();
      if (!ok) {
        navigate({ to: "/admin/login" });
        return;
      }
      if (active) await load();
    };

    void init();

    return () => {
      active = false;
    };
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
    const base = t ? rows.filter((r) => {
      const cli = (r.clientes as { nome?: string } | null)?.nome ?? "";
      const prosp = String(r.prospect_nome ?? "");
      return [r.numero, cli, prosp, r.sistema_construtivo, r.tipo_servico, r.prospect_cidade, r.prospect_whatsapp]
        .map((v) => String(v ?? "").toLowerCase()).some((s) => s.includes(t));
    }) : rows;
    return base;
  }, [rows, q]);

  const buckets = useMemo(() => {
    const pendentes: Row[] = [], andamento: Row[] = [], assinados: Row[] = [], outros: Row[] = [];
    for (const r of filtered) {
      const s = (r.status as ContratoStatus) || "rascunho";
      if (s === "rascunho") pendentes.push(r);
      else if (
        s === "aguardando_cliente" || s === "aguardando_fm" ||
        s === "dados_cliente_enviados" || s === "aguardando_revisao" ||
        s === "em_revisao" || s === "assinado_cliente"
      ) andamento.push(r);
      else if (s === "assinado") assinados.push(r);
      else outros.push(r);
    }
    return { pendentes, andamento, assinados, outros };
  }, [filtered]);

  const onDelete = async () => {
    if (!delTarget) return;
    const { error } = await fmSupabase.from("contratos").delete().eq("id", delTarget.id as string);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Contrato excluído");
    setRows((arr) => arr.filter((x) => x.id !== delTarget.id));
    setDelOpen(false); setDelTarget(null);
  };

  const abrirModalLink = () => setLinkModalOpen(true);

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={abrirModalLink}
              title="Cria um contrato em branco e copia o link para o cliente preencher seus dados"
            >
              <Link2 className="mr-1 h-4 w-4" /> Novo Link Cliente
            </Button>
            <Button asChild>
              <Link to="/admin/contratos/$id" params={{ id: "novo" }}>
                <Plus className="mr-1 h-4 w-4" /> Novo Contrato
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por protocolo, cliente, cidade, sistema..." className="pl-9" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-lg border bg-white p-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <Tabs defaultValue="pendentes">
            <TabsList>
              <TabsTrigger value="pendentes">
                Pendentes
                {buckets.pendentes.length > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-slate-900" style={{ backgroundColor: "#F4B941" }}>
                    {buckets.pendentes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="andamento">Em Andamento ({buckets.andamento.length})</TabsTrigger>
              <TabsTrigger value="assinados">Assinados ({buckets.assinados.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pendentes"><Tabela rows={buckets.pendentes} onDelete={(r) => { setDelTarget(r); setDelOpen(true); }} /></TabsContent>
            <TabsContent value="andamento"><Tabela rows={buckets.andamento} onDelete={(r) => { setDelTarget(r); setDelOpen(true); }} /></TabsContent>
            <TabsContent value="assinados"><Tabela rows={buckets.assinados} onDelete={(r) => { setDelTarget(r); setDelOpen(true); }} /></TabsContent>
          </Tabs>
        )}
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
      <NovoLinkClienteModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        contratos={rows}
        onCreated={load}
      />
    </div>
  );
}

function Tabela({ rows, onDelete }: { rows: Row[]; onDelete: (r: Row) => void }) {
  if (rows.length === 0) {
    return <div className="rounded-lg border bg-white p-12 text-center text-sm text-slate-500">Nenhum contrato nesta aba.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Protocolo</th>
            <th className="p-3">Nome</th>
            <th className="p-3">WhatsApp</th>
            <th className="p-3">Cidade</th>
            <th className="p-3">Sistema</th>
            <th className="p-3">Serviço</th>
            <th className="p-3 text-right">Área</th>
            <th className="p-3 text-right">Valor</th>
            <th className="p-3">Status</th>
            <th className="p-3">Data</th>
            <th className="p-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = (r.status as ContratoStatus) || "rascunho";
            const cli = (r.clientes as { nome?: string } | null)?.nome ?? String(r.prospect_nome ?? "—");
            const cidade = [r.prospect_cidade, r.prospect_estado].filter(Boolean).join("/") || "—";
            const whatsapp = String(r.prospect_whatsapp ?? "—");
            const area = r.prospect_area_construir ? `${r.prospect_area_construir} m²` : "—";
            const valor = Number(r.valor_total || 0);
            return (
              <tr key={String(r.id)} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-mono text-xs">{String(r.numero || "—")}</td>
                <td className="p-3">{cli}</td>
                <td className="p-3 text-xs text-slate-600">{whatsapp}</td>
                <td className="p-3 text-xs text-slate-600">{cidade}</td>
                <td className="p-3">{String(r.sistema_construtivo || r.prospect_sistema_preferido || "—")}</td>
                <td className="p-3">{String(r.tipo_servico || r.prospect_servico_preferido || "—")}</td>
                <td className="p-3 text-right text-xs">{area}</td>
                <td className="p-3 text-right">{valor > 0 ? brl(valor) : <span className="text-xs text-slate-400">A definir</span>}</td>
                <td className="p-3">
                  <span className="inline-block rounded px-2 py-0.5 text-xs font-medium text-white" style={{ background: STATUS_COLORS[status] }}>
                    {STATUS_LABELS[status]}
                  </span>
                </td>
                <td className="p-3 text-xs text-slate-500">{fmtData(String(r.criado_em || ""))}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild size="icon" variant="ghost" title="Ver/Editar">
                      <Link
                        to="/admin/contratos/$id"
                        params={{ id: String(r.id) }}
                        onClick={() => console.log("[admin.contratos] Navegando para contrato id:", r.id, "tipo:", typeof r.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="icon" variant="ghost" title="Abrir contrato (abas Proposta F&M, Financeiro, Aditivos, Assinatura, Preview)">
                      <Link
                        to="/admin/contratos/$id"
                        params={{ id: String(r.id) }}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {r.token_cliente ? (
                      <Button asChild size="icon" variant="ghost" title="Abrir link público do cliente em nova aba">
                        <Link
                          to="/contrato/$token"
                          params={{ token: String(r.token_cliente) }}
                          target="_blank"
                        >
                          <Link2 className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button size="icon" variant="ghost" title="Excluir" onClick={() => onDelete(r)}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}