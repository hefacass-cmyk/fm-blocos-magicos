import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Loader2, Plus, Trash2, ChevronDown, ChevronRight, Upload, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fmSupabase } from "@/lib/fm-clientes";

const ADMIN_KEY = "fm_admin_auth";
const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BUCKET = "obra-arquivos";

type Row = Record<string, unknown>;
type Tipo = "mo" | "material" | "extra";

const TIPO_LABEL: Record<Tipo, string> = {
  mo: "Mão de Obra",
  material: "Material",
  extra: "Extras",
};

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isFinite(v) ? v : 0);
}
function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return isFinite(n) ? n : 0;
}

export const Route = createFileRoute("/admin/obras/$clienteId")({
  head: () => ({ meta: [{ title: "Gestão da Obra · F&M" }] }),
  component: GestaoObraPage,
});

function GestaoObraPage() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<Row | null>(null);
  const [empresa, setEmpresa] = useState<Row | null>(null);
  const [contratos, setContratos] = useState<Row[]>([]);
  const [aditivos, setAditivos] = useState<Row[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") { navigate({ to: "/admin/login" }); return; }
    (async () => {
      const [{ data: c }, { data: emp }, { data: ctr }] = await Promise.all([
        fmSupabase.from("clientes").select("*").eq("id", clienteId).maybeSingle(),
        fmSupabase.from("empresa_config").select("*").limit(1).maybeSingle(),
        fmSupabase.from("contratos").select("*").eq("cliente_id", clienteId).order("criado_em", { ascending: false }),
      ]);
      setCliente(c as Row | null);
      setEmpresa(emp as Row | null);
      const ctrs = (ctr as Row[]) ?? [];
      setContratos(ctrs);
      if (ctrs.length) {
        const ids = ctrs.map((x) => x.id);
        const { data: ad } = await fmSupabase.from("contratos_aditivos").select("*").in("contrato_id", ids).order("criado_em", { ascending: false });
        setAditivos((ad as Row[]) ?? []);
      }
      setLoading(false);
    })();
  }, [clienteId, navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!cliente) {
    return (
      <div className="container mx-auto p-8">
        <Link to="/admin/dashboard" className="text-sm text-slate-600 hover:underline">← Voltar</Link>
        <p className="mt-4">Cliente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/admin/clientes/$id" params={{ id: clienteId }} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>
            <ArrowLeft className="h-4 w-4" /> Cliente
          </Link>
          <h1 className="text-base font-extrabold" style={{ color: BRAND_BLUE }}>
            Gestão da Obra · {String(cliente.nome ?? "—")}
          </h1>
          <span />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-4 px-4 py-6">
        <ProgressoSection cliente={cliente} onUpdated={(c) => setCliente(c)} />
        <OrcamentoSection cliente={cliente} onUpdated={(c) => setCliente(c)} />
        <PagamentosSection cliente={cliente} />
        <EtapasSection clienteId={clienteId} />
        <RelatoriosSemanaisSection clienteId={clienteId} />
        <DocumentosSection contratos={contratos} aditivos={aditivos} />
        <GerenteSection empresa={empresa} />
      </main>
    </div>
  );
}

/* ============================================================
 * 1) Progresso
 * ============================================================ */
function ProgressoSection({ cliente, onUpdated }: { cliente: Row; onUpdated: (c: Row) => void }) {
  const [progresso, setProgresso] = useState<number>(num(cliente.progresso));
  const [inicio, setInicio] = useState<string>(String(cliente.data_inicio ?? ""));
  const [termino, setTermino] = useState<string>(String(cliente.data_termino ?? ""));
  const [prof, setProf] = useState<number>(num(cliente.profissionais_canteiro));
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    setSaving(true);
    const payload = {
      progresso, data_inicio: inicio || null, data_termino: termino || null, profissionais_canteiro: prof,
      atualizado_em: new Date().toISOString(),
    };
    const { data, error } = await fmSupabase.from("clientes").update(payload).eq("id", cliente.id).select().maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    onUpdated(data as Row);
    toast.success("Progresso atualizado");
  };

  return (
    <Card title="1. Progresso">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label className="text-xs">Percentual (%)</Label>
          <Input type="number" min={0} max={100} value={progresso} onChange={(e) => setProgresso(Math.max(0, Math.min(100, Number(e.target.value))))} />
        </div>
        <div><Label className="text-xs">Data início</Label><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
        <div><Label className="text-xs">Prazo esperado</Label><Input type="date" value={termino} onChange={(e) => setTermino(e.target.value)} /></div>
        <div><Label className="text-xs">Profissionais na equipe</Label><Input type="number" min={0} value={prof} onChange={(e) => setProf(Math.max(0, Number(e.target.value)))} /></div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full" style={{ width: `${progresso}%`, backgroundColor: BRAND_YELLOW }} />
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={salvar} disabled={saving} style={{ backgroundColor: BRAND_BLUE }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </Card>
  );
}

/* ============================================================
 * 2) Orçamento
 * ============================================================ */
function OrcamentoSection({ cliente, onUpdated }: { cliente: Row; onUpdated: (c: Row) => void }) {
  const [mo, setMo] = useState<number>(num(cliente.orcado_mo));
  const [mat, setMat] = useState<number>(num(cliente.orcado_material));
  const [ex, setEx] = useState<number>(num(cliente.orcado_extras));
  const [saving, setSaving] = useState(false);
  const total = mo + mat + ex;

  const salvar = async () => {
    setSaving(true);
    const { data, error } = await fmSupabase.from("clientes").update({
      orcado_mo: mo, orcado_material: mat, orcado_extras: ex,
      atualizado_em: new Date().toISOString(),
    }).eq("id", cliente.id).select().maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    onUpdated(data as Row);
    toast.success("Orçamento atualizado");
  };

  return (
    <Card title="2. Financeiro — Orçamento">
      <div className="grid gap-3 sm:grid-cols-3">
        <MoneyInput label="Mão de Obra" value={mo} onChange={setMo} />
        <MoneyInput label="Material" value={mat} onChange={setMat} />
        <MoneyInput label="Extras" value={ex} onChange={setEx} />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: BRAND_YELLOW + "33" }}>
        <span className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>Total Orçado</span>
        <span className="text-lg font-extrabold" style={{ color: BRAND_BLUE }}>{brl(total)}</span>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={salvar} disabled={saving} style={{ backgroundColor: BRAND_BLUE }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar orçamento"}
        </Button>
      </div>
    </Card>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={0} step="0.01" value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} />
      <p className="mt-1 text-[11px] text-slate-500">{brl(value)}</p>
    </div>
  );
}

/* ============================================================
 * 3) Pagamentos realizados
 * ============================================================ */
function PagamentosSection({ cliente }: { cliente: Row }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await fmSupabase.from("obra_financeiro")
      .select("*").eq("cliente_id", cliente.id)
      .in("tipo", ["mo", "material", "extra"])
      .order("data", { ascending: false });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [cliente.id]);

  const pagoMo = rows.filter((r) => r.tipo === "mo").reduce((s, r) => s + num(r.valor), 0);
  const pagoMat = rows.filter((r) => r.tipo === "material").reduce((s, r) => s + num(r.valor), 0);
  const pagoEx = rows.filter((r) => r.tipo === "extra").reduce((s, r) => s + num(r.valor), 0);
  const orcMo = num(cliente.orcado_mo), orcMat = num(cliente.orcado_material), orcEx = num(cliente.orcado_extras);
  const totalOrc = orcMo + orcMat + orcEx;
  const totalPago = pagoMo + pagoMat + pagoEx;

  return (
    <Card title="3. Financeiro — Pagamentos realizados">
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="space-y-3">
          <PagamentoGrupo
            tipo="mo" cliente={cliente}
            rows={rows.filter((r) => r.tipo === "mo")}
            pago={pagoMo} orcado={orcMo}
            onChanged={load}
          />
          <PagamentoGrupo
            tipo="material" cliente={cliente}
            rows={rows.filter((r) => r.tipo === "material")}
            pago={pagoMat} orcado={orcMat}
            onChanged={load}
          />
          <PagamentoGrupo
            tipo="extra" cliente={cliente}
            rows={rows.filter((r) => r.tipo === "extra")}
            pago={pagoEx} orcado={orcEx}
            onChanged={load}
          />

          <div className="mt-4 grid gap-2 rounded-xl border-2 p-4 sm:grid-cols-3" style={{ borderColor: BRAND_BLUE }}>
            <Resumo label="Total orçado" value={brl(totalOrc)} />
            <Resumo label="Total pago" value={brl(totalPago)} />
            <Resumo label="Saldo restante" value={brl(totalOrc - totalPago)} highlight />
          </div>
        </div>
      )}
    </Card>
  );
}

function Resumo({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-lg font-extrabold ${highlight ? "" : "text-slate-800"}`} style={highlight ? { color: BRAND_BLUE } : undefined}>{value}</p>
    </div>
  );
}

function PagamentoGrupo({
  tipo, cliente, rows, pago, orcado, onChanged,
}: {
  tipo: Tipo; cliente: Row; rows: Row[]; pago: number; orcado: number; onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState<number>(0);
  const [data, setData] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState("");
  const [loja, setLoja] = useState("");
  const [saving, setSaving] = useState(false);

  const adicionar = async () => {
    if (valor <= 0) return toast.error("Informe o valor");
    if (tipo === "material" && !descricao.trim()) return toast.error("Informe o nome do material");
    if (tipo === "extra" && !descricao.trim()) return toast.error("Descreva o objeto/serviço");
    setSaving(true);
    const { error } = await fmSupabase.from("obra_financeiro").insert({
      cliente_id: cliente.id, tipo, valor, data, descricao: descricao || null, loja: loja || null, status: "pago",
    });
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    setValor(0); setDescricao(""); setLoja("");
    onChanged();
    toast.success("Pagamento adicionado");
  };

  const excluir = async (r: Row) => {
    if (!confirm("Remover este pagamento?")) return;
    const { error } = await fmSupabase.from("obra_financeiro").delete().eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    onChanged();
  };

  const saldo = orcado - pago;

  return (
    <div className="rounded-lg border bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-slate-50">
        <span className="flex items-center gap-2 font-semibold" style={{ color: BRAND_BLUE }}>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {TIPO_LABEL[tipo]} pago
        </span>
        <span className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span>Orçado: <b className="text-slate-800">{brl(orcado)}</b></span>
          <span>Pago: <b className="text-slate-800">{brl(pago)}</b></span>
          <span>Saldo: <b style={{ color: saldo < 0 ? "#dc2626" : BRAND_BLUE }}>{brl(saldo)}</b></span>
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t p-3">
          <div className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-5">
            <div><Label className="text-xs">Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
            <div><Label className="text-xs">Valor</Label><Input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(Math.max(0, Number(e.target.value)))} /></div>
            {tipo === "material" && (
              <>
                <div className="sm:col-span-1"><Label className="text-xs">Material</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
                <div className="sm:col-span-1"><Label className="text-xs">Loja / Fornecedor</Label><Input value={loja} onChange={(e) => setLoja(e.target.value)} /></div>
              </>
            )}
            {tipo === "extra" && (
              <div className="sm:col-span-2"><Label className="text-xs">Descrição do objeto/serviço</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
            )}
            {tipo === "mo" && (
              <div className="sm:col-span-2"><Label className="text-xs">Observação (opcional)</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
            )}
            <div className="flex items-end">
              <Button onClick={adicionar} disabled={saving} className="w-full" style={{ backgroundColor: BRAND_BLUE }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Adicionar</>}
              </Button>
            </div>
          </div>

          <ul className="divide-y rounded-md border">
            {rows.length === 0 && <li className="p-3 text-sm text-slate-500">Nenhum pagamento registrado.</li>}
            {rows.map((r) => (
              <li key={String(r.id)} className="flex items-start justify-between gap-2 p-3">
                <div className="text-sm">
                  <p className="font-semibold">{brl(num(r.valor))} <span className="ml-2 text-xs font-normal text-slate-500">{String(r.data ?? "")}</span></p>
                  {r.descricao ? <p className="text-slate-700">{String(r.descricao)}</p> : null}
                  {r.loja ? <p className="text-xs text-slate-500">Loja: {String(r.loja)}</p> : null}
                </div>
                <button onClick={() => excluir(r)} className="rounded-md p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * 4) Etapas
 * ============================================================ */
function statusEtapa(di?: string | null, df?: string | null): "pendente" | "em_andamento" | "concluida" {
  const hoje = new Date().toISOString().slice(0, 10);
  if (df && df <= hoje) return "concluida";
  if (di && di <= hoje) return "em_andamento";
  return "pendente";
}
const STATUS_COLORS_ETAPA: Record<string, string> = { pendente: "#94a3b8", em_andamento: "#3B82F6", concluida: "#06A77D" };
const STATUS_LABEL_ETAPA: Record<string, string> = { pendente: "Pendente", em_andamento: "Em andamento", concluida: "Concluída" };

function EtapasSection({ clienteId }: { clienteId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [nome, setNome] = useState("");
  const [di, setDi] = useState("");
  const [df, setDf] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await fmSupabase.from("obra_etapas").select("*").eq("cliente_id", clienteId).order("ordem");
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [clienteId]);

  const adicionar = async () => {
    if (!nome.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    const ordem = rows.length;
    const status = statusEtapa(di, df);
    const { error } = await fmSupabase.from("obra_etapas").insert({
      cliente_id: clienteId, nome, data_inicio: di || null, data_fim: df || null, descricao: descricao || null, status, ordem,
    });
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    setNome(""); setDi(""); setDf(""); setDescricao("");
    load();
  };

  const excluir = async (r: Row) => {
    if (!confirm("Excluir etapa?")) return;
    const { error } = await fmSupabase.from("obra_etapas").delete().eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    load();
  };

  const atualizar = async (r: Row, patch: Record<string, unknown>) => {
    const next = { ...r, ...patch };
    next.status = statusEtapa(String(next.data_inicio ?? "") || null, String(next.data_fim ?? "") || null);
    const { error } = await fmSupabase.from("obra_etapas").update(next).eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    setRows((arr) => arr.map((x) => x.id === r.id ? next : x));
  };

  return (
    <Card title="4. Etapas da Obra">
      <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
        <h3 className="text-sm font-bold">Nova etapa</h3>
        <div className="grid gap-2 sm:grid-cols-4">
          <div><Label className="text-xs">Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><Label className="text-xs">Início</Label><Input type="date" value={di} onChange={(e) => setDi(e.target.value)} /></div>
          <div><Label className="text-xs">Fim</Label><Input type="date" value={df} onChange={(e) => setDf(e.target.value)} /></div>
          <div className="flex items-end">
            <Button onClick={adicionar} disabled={saving} className="w-full" style={{ backgroundColor: BRAND_BLUE }}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>
        <div><Label className="text-xs">Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      </div>

      <ul className="mt-3 space-y-2">
        {rows.length === 0 && <p className="text-sm text-slate-500">Nenhuma etapa cadastrada.</p>}
        {rows.map((r) => {
          const s = String(r.status ?? statusEtapa(r.data_inicio as string, r.data_fim as string));
          return (
            <li key={String(r.id)} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white" style={{ backgroundColor: STATUS_COLORS_ETAPA[s] }}>
                    {STATUS_LABEL_ETAPA[s]}
                  </span>
                  <Input value={String(r.nome ?? "")} onChange={(e) => atualizar(r, { nome: e.target.value })} className="w-64 font-semibold" />
                </div>
                <button onClick={() => excluir(r)} className="rounded-md p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div><Label className="text-xs">Início</Label><Input type="date" value={String(r.data_inicio ?? "")} onChange={(e) => atualizar(r, { data_inicio: e.target.value || null })} /></div>
                <div><Label className="text-xs">Fim</Label><Input type="date" value={String(r.data_fim ?? "")} onChange={(e) => atualizar(r, { data_fim: e.target.value || null })} /></div>
              </div>
              <div className="mt-2"><Label className="text-xs">Descrição</Label>
                <Textarea value={String(r.descricao ?? "")} onChange={(e) => atualizar(r, { descricao: e.target.value })} />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ============================================================
 * 5) Relatórios Semanais (fotos + descrição + data)
 * ============================================================ */
function RelatoriosSemanaisSection({ clienteId }: { clienteId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [legenda, setLegenda] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await fmSupabase.from("obra_fotos").select("*").eq("cliente_id", clienteId).order("criado_em", { ascending: false });
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [clienteId]);

  const onUpload = async () => {
    if (!file) return toast.error("Selecione um arquivo");
    setUploading(true);
    const path = `relatorios/${clienteId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await fmSupabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (upErr) { setUploading(false); return toast.error("Upload: " + upErr.message); }
    const { data: pub } = fmSupabase.storage.from(BUCKET).getPublicUrl(path);
    const { error } = await fmSupabase.from("obra_fotos").insert({
      cliente_id: clienteId, url: pub.publicUrl, foto_url: pub.publicUrl, legenda, descricao: legenda, data,
    });
    setUploading(false);
    if (error) return toast.error("Erro: " + error.message);
    setLegenda("");
    setFile(null);
    load();
    toast.success("Foto enviada");
  };

  const excluir = async (r: Row) => {
    if (!confirm("Excluir foto?")) return;
    const { error } = await fmSupabase.from("obra_fotos").delete().eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    load();
  };

  return (
    <Card title="5. Relatórios Semanais">
      <div className="grid gap-2 rounded-lg border bg-slate-50 p-3 sm:grid-cols-4">
        <div><Label className="text-xs">Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label className="text-xs">Descrição</Label><Input value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="O que esta foto registra" /></div>
        <div className="sm:col-span-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label className="text-xs">Arquivo</Label>
            <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="mt-1 text-xs text-slate-500">Selecionado: {file.name}</p>}
          </div>
          <button
            type="button"
            onClick={onUpload}
            disabled={!file || uploading}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Enviando..." : "Enviar foto"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {rows.length === 0 && <p className="text-sm text-slate-500">Nenhuma foto enviada.</p>}
        {rows.map((r) => (
          <div key={String(r.id)} className="overflow-hidden rounded-lg border bg-white">
            <img src={String(r.foto_url ?? "")} alt={String(r.legenda ?? "")} className="aspect-square w-full object-cover" loading="lazy" />
            <div className="space-y-1 p-2">
              <p className="text-xs text-slate-500">{String(r.data ?? new Date(String(r.criado_em ?? "")).toLocaleDateString("pt-BR"))}</p>
              <p className="text-sm text-slate-700">{String(r.descricao ?? r.legenda ?? "")}</p>
              <button onClick={() => excluir(r)} className="text-xs text-red-500 hover:underline">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
 * 6) Documentos (contratos + aditivos, visualização)
 * ============================================================ */
function DocumentosSection({ contratos, aditivos }: { contratos: Row[]; aditivos: Row[] }) {
  const aditivosByContrato = useMemo(() => {
    const m: Record<string, Row[]> = {};
    aditivos.forEach((a) => {
      const k = String(a.contrato_id ?? "");
      (m[k] ??= []).push(a);
    });
    return m;
  }, [aditivos]);

  return (
    <Card title="6. Documentos">
      {contratos.length === 0 && <p className="text-sm text-slate-500">Nenhum contrato vinculado a este cliente.</p>}
      <ul className="space-y-3">
        {contratos.map((c) => {
          const ads = aditivosByContrato[String(c.id)] ?? [];
          return (
            <li key={String(c.id)} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                  <p className="font-semibold" style={{ color: BRAND_BLUE }}>
                    Contrato {String(c.numero ?? "—")}
                  </p>
                  <span className="text-xs text-slate-500">{String(c.status ?? "")}</span>
                </div>
                <Link to="/admin/contratos_/$id" params={{ id: String(c.id) }} className="text-xs font-semibold hover:underline" style={{ color: BRAND_BLUE }}>
                  Abrir
                </Link>
              </div>
              {ads.length > 0 && (
                <ul className="mt-2 space-y-1 border-l-2 pl-3" style={{ borderColor: BRAND_YELLOW }}>
                  {ads.map((a) => (
                    <li key={String(a.id)} className="text-sm text-slate-700">
                      <span className="font-semibold">Aditivo:</span> {String(a.titulo ?? a.descricao ?? "—")}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ============================================================
 * 7) Gerente da Obra
 * ============================================================ */
function GerenteSection({ empresa }: { empresa: Row | null }) {
  const nome = String(empresa?.gerente_nome ?? empresa?.representante_nome ?? "Hélder Souza");
  const whats = String(empresa?.gerente_whatsapp ?? "71999454343");
  const tel = String(empresa?.gerente_telefone ?? empresa?.gerente_whatsapp ?? "71999454343");
  return (
    <Card title="7. Gerente da Obra">
      <div className="grid gap-2 sm:grid-cols-3">
        <Info label="Nome">{nome}</Info>
        <Info label="WhatsApp">{whats}</Info>
        <Info label="Telefone">{tel}</Info>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Dados puxados de <code>empresa_config</code>. Edite em /admin/configuracoes.</p>
    </Card>
  );
}

/* ============================================================
 * Utilities
 * ============================================================ */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-extrabold" style={{ color: BRAND_BLUE }}>{title}</h2>
      {children}
    </section>
  );
}
function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-[10px] uppercase text-slate-400">{label}</p><p className="text-sm text-slate-800">{children}</p></div>;
}