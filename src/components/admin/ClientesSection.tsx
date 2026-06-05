import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, Pencil, Trash2, Loader2, Eye, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ClienteFormModal from "./ClienteFormModal";
import { fmSupabase, gerarCodigoCliente, STATUS_COLORS, STATUS_LABELS, type ObraStatus } from "@/lib/fm-clientes";
import { logAdmin } from "@/lib/fm-tracking";

type Row = Record<string, unknown>;

export default function ClientesSection() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [parceiros, setParceiros] = useState<{ id: string; nome: string }[]>([]);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: cs, error }, { data: ps }] = await Promise.all([
      fmSupabase.from("clientes").select("*").order("criado_em", { ascending: false }),
      fmSupabase.from("parceiros").select("id, nome").order("nome"),
    ]);
    if (error) toast.error("Erro ao carregar clientes: " + error.message);
    setRows((cs as Row[]) ?? []);
    setParceiros(((ps as Row[]) ?? []).map((p) => ({ id: String(p.id), nome: String(p.nome ?? "—") })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.nome, r.codigo_cliente, r.cpf_cnpj, r.obra_nome, r.cidade]
        .map((v) => String(v ?? "").toLowerCase())
        .some((s) => s.includes(term)),
    );
  }, [rows, q]);

  const onSaved = (row: Row) => {
    setRows((arr) => {
      const idx = arr.findIndex((x) => x.id === row.id);
      if (idx >= 0) { const c = [...arr]; c[idx] = { ...c[idx], ...row }; return c; }
      return [row, ...arr];
    });
    logAdmin(editing ? "cliente_editado" : "cliente_criado", `Cliente ${String(row.nome ?? row.id)}`, "admin");
  };

  const confirmDel = async () => {
    if (!delTarget) return;
    const { error } = await fmSupabase.from("clientes").delete().eq("id", delTarget.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setRows((arr) => arr.filter((x) => x.id !== delTarget.id));
    toast.success("Cliente excluído");
    await logAdmin("cliente_excluido", `Cliente ${String(delTarget.nome ?? delTarget.id)}`, "admin");
    setDelOpen(false);
    setDelTarget(null);
  };

  const regenerateAccess = async (row: Row) => {
    const codigo = gerarCodigoCliente(String(row.nome ?? "CLIENTE"));
    const { data, error } = await fmSupabase
      .from("clientes")
      .update({ codigo, codigo_cliente: codigo })
      .eq("id", row.id)
      .select()
      .maybeSingle();

    if (error) {
      toast.error("Erro ao gerar novo acesso: " + error.message);
      return;
    }

    const next = (data as Row) ?? { ...row, codigo, codigo_cliente: codigo };
    setRows((arr) => arr.map((x) => (x.id === row.id ? { ...x, ...next } : x)));

    try {
      await navigator.clipboard.writeText(codigo);
      toast.success("Novo acesso gerado e copiado", { description: codigo });
    } catch {
      toast.success("Novo acesso gerado", { description: codigo });
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold" style={{ color: "#1A4D7A" }}>👥 Clientes</h2>
        <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, código, CPF/CNPJ"
              className="pl-8"
            />
          </div>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }} style={{ backgroundColor: "#1A4D7A" }}>
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          {rows.length === 0 ? "Nenhum cliente cadastrado." : "Nenhum resultado."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-2">Código</th>
                <th className="p-2">Nome</th>
                <th className="p-2">Obra</th>
                <th className="p-2">Cidade</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Progresso</th>
                <th className="p-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const status = (r.obra_status as ObraStatus) ?? "orcamento";
                return (
                  <tr key={String(r.id)} className="border-t">
                    <td className="p-2 font-mono text-xs">{String(r.codigo_cliente ?? "—")}</td>
                    <td className="p-2">
                      <Link to="/admin/clientes/$id" params={{ id: String(r.id) }} className="font-semibold text-[#1A4D7A] hover:underline">
                        {String(r.nome ?? "—")}
                      </Link>
                    </td>
                    <td className="p-2 text-slate-600">{String(r.obra_nome ?? "—")}</td>
                    <td className="p-2 text-slate-600">{r.cidade ? `${r.cidade}/${r.estado ?? ""}` : "—"}</td>
                    <td className="p-2 text-center">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                        style={{ backgroundColor: STATUS_COLORS[status] }}>
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="p-2 text-center">{Number(r.progresso ?? 0)}%</td>
                    <td className="p-2">
                      <div className="flex justify-center gap-1">
                        <Link to="/admin/clientes/$id" params={{ id: String(r.id) }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-slate-50" title="Detalhes">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => { setEditing(r); setModalOpen(true); }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-slate-50" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => regenerateAccess(r)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-slate-50"
                          title="Gerar novo acesso"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDelTarget(r); setDelOpen(true); }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white hover:opacity-90"
                          style={{ backgroundColor: "#ef4444" }} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ClienteFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        cliente={editing}
        parceiros={parceiros}
        onSaved={onSaved}
      />

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{String(delTarget?.nome ?? "")}</strong>? Esta ação não pode ser desfeita e remove também todas as atualizações, etapas, fotos e documentos da obra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDel} className="text-white" style={{ backgroundColor: "#ef4444" }}>
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}