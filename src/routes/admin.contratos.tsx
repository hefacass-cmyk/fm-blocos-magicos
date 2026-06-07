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
            const coalesce = (...vals: unknown[]) => {
              for (const v of vals) {
                if (v !== null && v !== undefined && String(v).trim() !== "") return String(v);
              }
              return "—";
            };
            const cli = (r.clientes as { nome?: string } | null)?.nome
              ?? coalesce(r.prospect_nome, r.cliente_nome);
            const whatsapp = coalesce(r.prospect_whatsapp, r.cliente_whatsapp);
            const cidadeRaw = coalesce(r.prospect_cidade, r.obra_cidade, r.cidade);
            const estadoRaw = coalesce(r.prospect_estado, r.obra_estado, r.estado);
            const cidade = cidadeRaw !== "—" || estadoRaw !== "—"
              ? [cidadeRaw, estadoRaw].filter((v) => v && v !== "—").join("/") || "—"
              : "—";
            const sistema = coalesce(r.sistema_construtivo, r.prospect_sistema_preferido);
            const servico = coalesce(r.tipo_servico, r.prospect_servico_preferido);
            const areaVal = coalesce(r.prospect_area_construir, r.area_m2, r.obra_area_construir);
            const area = areaVal !== "—" ? `${areaVal} m²` : "—";
            const valor = Number(r.valor_total || 0);
            return (
              <tr key={String(r.id)} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-mono text-xs">{String(r.numero || "—")}</td>
                <td className="p-3">{cli}</td>
                <td className="p-3 text-xs text-slate-600">{whatsapp}</td>
                <td className="p-3 text-xs text-slate-600">{cidade}</td>
                <td className="p-3">{sistema}</td>
                <td className="p-3">{servico}</td>
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

function NovoLinkClienteModal({
  open, onClose, contratos, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  contratos: Row[];
  onCreated: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Row | null>(null);
  const [gerando, setGerando] = useState(false);
  const [novoToken, setNovoToken] = useState<{ token: string; numero: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setBusca(""); setSelecionado(null); setNovoToken(null); setGerando(false);
    }
  }, [open]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return contratos.slice(0, 8);
    return contratos.filter((c) => {
      const cli = (c.clientes as { nome?: string } | null)?.nome ?? String(c.prospect_nome ?? c.cliente_nome ?? "");
      return String(c.numero ?? "").toLowerCase().includes(t) || cli.toLowerCase().includes(t);
    }).slice(0, 12);
  }, [busca, contratos]);

  const tokenAtual = novoToken?.token ?? (selecionado?.token_cliente as string | undefined);
  const numeroAtual = novoToken?.numero ?? (selecionado?.numero as string | undefined);
  const url = tokenAtual ? `https://www.fmsmartbuild.com.br/iniciar-contrato?token=${tokenAtual}` : "";

  const copiar = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      window.prompt("Copie e envie ao cliente:", url);
    }
  };

  const gerarNovo = async () => {
    setGerando(true);
    try {
      const numero = await gerarNumeroContrato();
      const { data, error } = await fmSupabase
        .from("contratos")
        .insert({ numero, status: "rascunho" })
        .select("token_cliente, numero")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Falha ao criar contrato");
      const d = data as { token_cliente: string; numero: string };
      setNovoToken({ token: d.token_cliente, numero: d.numero });
      setSelecionado(null);
      toast.success(`Contrato ${d.numero} criado`);
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Link Cliente</DialogTitle>
          <DialogDescription>
            Selecione um contrato existente ou gere um novo. O cliente preenche os dados pelo link.
          </DialogDescription>
        </DialogHeader>

        {tokenAtual ? (
          <div className="space-y-3">
            <div className="rounded-md border bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Contrato {numeroAtual}</p>
              <p className="mt-1 break-all text-xs font-mono text-slate-800">{url}</p>
            </div>
            <Button onClick={copiar} className="w-full">
              <Copy className="mr-2 h-4 w-4" /> COPIAR LINK
            </Button>
            <p className="text-xs text-slate-600 text-center">
              Envie este link ao cliente para que ele preencha seus dados pessoais e da obra.
            </p>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSelecionado(null); setNovoToken(null); }}>
              <X className="mr-1 h-3 w-3" /> Escolher outro
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por protocolo ou nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-60 overflow-y-auto rounded-md border divide-y">
              {filtrados.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-500">Nenhum contrato encontrado.</p>
              ) : filtrados.map((c) => {
                const cli = (c.clientes as { nome?: string } | null)?.nome
                  ?? String(c.prospect_nome ?? c.cliente_nome ?? "—");
                return (
                  <button
                    key={String(c.id)}
                    type="button"
                    onClick={() => setSelecionado(c)}
                    disabled={!c.token_cliente}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-mono text-xs text-slate-500">{String(c.numero ?? "—")}</span>
                    <span className="ml-2">{cli}</span>
                    {!c.token_cliente && <span className="ml-2 text-[10px] text-rose-500">(sem token)</span>}
                  </button>
                );
              })}
            </div>
            <div className="border-t pt-3">
              <Button onClick={gerarNovo} disabled={gerando} className="w-full" variant="outline">
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> GERAR NOVO LINK</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}