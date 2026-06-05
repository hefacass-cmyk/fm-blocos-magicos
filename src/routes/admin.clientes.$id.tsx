import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { fmSupabase, DOC_TIPOS, STATUS_COLORS, STATUS_LABELS, type ObraStatus, type EtapaStatus, type DocTipo, maskCpfCnpj } from "@/lib/fm-clientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ADMIN_KEY = "fm_admin_auth";
const BRAND_BLUE = "#1A4D7A";
const BUCKET = "obra-arquivos";

type Row = Record<string, unknown>;

export const Route = createFileRoute("/admin/clientes/$id")({
  head: () => ({ meta: [{ title: "Detalhe Cliente · F&M" }] }),
  component: DetalhePage,
});

function DetalhePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"atualizacoes" | "etapas" | "fotos" | "documentos">("atualizacoes");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") { navigate({ to: "/admin/login" }); return; }
    fmSupabase.from("clientes").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error) toast.error("Erro: " + error.message);
      setCliente(data as Row | null);
      setLoading(false);
    });
  }, [id, navigate]);

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

  const status = (cliente.obra_status as ObraStatus) ?? "orcamento";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>
            <ArrowLeft className="h-4 w-4" /> Painel
          </Link>
          <h1 className="text-base font-extrabold" style={{ color: BRAND_BLUE }}>{String(cliente.nome ?? "—")}</h1>
          <span />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-4 px-4 py-6">
        {/* Dados resumo */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-slate-500">{String(cliente.codigo_cliente ?? "—")}</p>
              <h2 className="text-xl font-extrabold" style={{ color: BRAND_BLUE }}>{String(cliente.obra_nome ?? "—")}</h2>
              <p className="text-xs text-slate-500">
                {String(cliente.obra_tipo ?? "—")} · {cliente.area_m2 ? `${cliente.area_m2} m²` : "—"} · {cliente.cidade ? `${cliente.cidade}/${cliente.estado ?? ""}` : "—"}
              </p>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white" style={{ backgroundColor: STATUS_COLORS[status] }}>
              {STATUS_LABELS[status]} · {Number(cliente.progresso ?? 0)}%
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <Info label="Tipo">{cliente.tipo_pessoa === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</Info>
            <Info label="CPF/CNPJ">{maskCpfCnpj(String(cliente.cpf_cnpj ?? ""), (cliente.tipo_pessoa as "PF"|"PJ") ?? "PF")}</Info>
            <Info label="Telefone">{String(cliente.telefone ?? "—")}</Info>
            <Info label="WhatsApp">{String(cliente.whatsapp ?? "—")}</Info>
            <Info label="Email">{String(cliente.email ?? "—")}</Info>
            <Info label="Início">{String(cliente.data_inicio ?? "—")}</Info>
            <Info label="Previsão">{String(cliente.data_termino ?? "—")}</Info>
            <Info label="Profissionais">{String(cliente.profissionais_canteiro ?? 0)}</Info>
            <Info label="Gerente">{String(cliente.gerente_nome ?? "—")}</Info>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b bg-white px-2 pt-2">
          {(["atualizacoes","etapas","fotos","documentos"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-t-md border-b-2 px-3 py-2 text-sm font-semibold ${tab===t ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {t === "atualizacoes" ? "Atualizações do Dia"
               : t === "etapas" ? "Etapas / Cronograma"
               : t === "fotos" ? "Fotos da Semana"
               : "Documentos"}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          {tab === "atualizacoes" && <AtualizacoesTab clienteId={id} />}
          {tab === "etapas" && <EtapasTab clienteId={id} />}
          {tab === "fotos" && <FotosTab clienteId={id} />}
          {tab === "documentos" && <DocumentosTab clienteId={id} />}
        </div>
      </main>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-[10px] uppercase text-slate-400">{label}</p><p className="text-sm text-slate-800">{children}</p></div>;
}

// ============================================================ Atualizações
function AtualizacoesTab({ clienteId }: { clienteId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prof, setProf] = useState(0);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await fmSupabase.from("obra_atualizacoes").select("*").eq("cliente_id", clienteId).order("data", { ascending: false });
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [clienteId]);

  const adicionar = async () => {
    if (!titulo.trim()) return toast.error("Título obrigatório");
    setSaving(true);
    const { data: ins, error } = await fmSupabase.from("obra_atualizacoes").insert({
      cliente_id: clienteId, titulo, descricao, profissionais_canteiro: prof, data,
    }).select().maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Atualização adicionada");
    setRows((arr) => [(ins as Row), ...arr]);
    setTitulo(""); setDescricao(""); setProf(0);
  };

  const excluir = async (r: Row) => {
    if (!confirm("Excluir esta atualização?")) return;
    const { error } = await fmSupabase.from("obra_atualizacoes").delete().eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    setRows((arr) => arr.filter((x) => x.id !== r.id));
    toast.success("Removido");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border bg-slate-50 p-4">
        <h3 className="text-sm font-bold">Nova atualização</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div><Label className="text-xs">Título</Label><Input value={titulo} onChange={(e)=>setTitulo(e.target.value)} /></div>
          <div><Label className="text-xs">Data</Label><Input type="date" value={data} onChange={(e)=>setData(e.target.value)} /></div>
          <div><Label className="text-xs">Profissionais</Label><Input type="number" value={prof} onChange={(e)=>setProf(Number(e.target.value))} /></div>
        </div>
        <div><Label className="text-xs">Descrição</Label><Textarea value={descricao} onChange={(e)=>setDescricao(e.target.value)} /></div>
        <Button onClick={adicionar} disabled={saving}><Plus className="h-4 w-4" /> Adicionar</Button>
      </div>
      <ul className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-slate-500">Nenhuma atualização.</p>}
        {rows.map((r) => (
          <li key={String(r.id)} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500">{String(r.data ?? "")} · {Number(r.profissionais_canteiro ?? 0)} profissionais</p>
              <p className="font-semibold">{String(r.titulo ?? "")}</p>
              <p className="text-sm text-slate-700">{String(r.descricao ?? "")}</p>
            </div>
            <button onClick={() => excluir(r)} className="rounded-md p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================ Etapas
const ETAPA_STATUS: { value: EtapaStatus; label: string; color: string }[] = [
  { value: "pendente", label: "Pendente", color: "#94a3b8" },
  { value: "em_andamento", label: "Em andamento", color: "#3B82F6" },
  { value: "concluida", label: "Concluída", color: "#06A77D" },
];
function EtapasTab({ clienteId }: { clienteId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [nome, setNome] = useState("");
  const [di, setDi] = useState("");
  const [df, setDf] = useState("");

  const load = async () => {
    const { data } = await fmSupabase.from("obra_etapas").select("*").eq("cliente_id", clienteId).order("ordem");
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [clienteId]);

  const adicionar = async () => {
    if (!nome.trim()) return toast.error("Nome obrigatório");
    const ordem = rows.length;
    const { data: ins, error } = await fmSupabase.from("obra_etapas").insert({
      cliente_id: clienteId, nome, data_inicio: di || null, data_fim: df || null, status: "pendente", ordem,
    }).select().maybeSingle();
    if (error) return toast.error("Erro: " + error.message);
    setRows((arr) => [...arr, ins as Row]);
    toast.success("Etapa adicionada");
    setNome(""); setDi(""); setDf("");
  };

  const setStatus = async (r: Row, status: EtapaStatus) => {
    const { error } = await fmSupabase.from("obra_etapas").update({ status }).eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    setRows((arr) => arr.map((x) => x.id === r.id ? { ...x, status } : x));
  };

  const mover = async (r: Row, dir: -1 | 1) => {
    const idx = rows.findIndex((x) => x.id === r.id);
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    const a = rows[idx], b = rows[target];
    await fmSupabase.from("obra_etapas").update({ ordem: Number(b.ordem) }).eq("id", a.id);
    await fmSupabase.from("obra_etapas").update({ ordem: Number(a.ordem) }).eq("id", b.id);
    const next = [...rows];
    next[idx] = { ...b, ordem: a.ordem }; next[target] = { ...a, ordem: b.ordem };
    next.sort((x, y) => Number(x.ordem) - Number(y.ordem));
    setRows(next);
  };

  const excluir = async (r: Row) => {
    if (!confirm("Excluir etapa?")) return;
    const { error } = await fmSupabase.from("obra_etapas").delete().eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    setRows((arr) => arr.filter((x) => x.id !== r.id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border bg-slate-50 p-4">
        <h3 className="text-sm font-bold">Nova etapa</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div><Label className="text-xs">Nome</Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
          <div><Label className="text-xs">Início</Label><Input type="date" value={di} onChange={(e)=>setDi(e.target.value)} /></div>
          <div><Label className="text-xs">Fim</Label><Input type="date" value={df} onChange={(e)=>setDf(e.target.value)} /></div>
        </div>
        <Button onClick={adicionar}><Plus className="h-4 w-4" /> Adicionar</Button>
      </div>
      <ul className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-slate-500">Nenhuma etapa.</p>}
        {rows.map((r, i) => {
          const st = (r.status as EtapaStatus) ?? "pendente";
          const meta = ETAPA_STATUS.find((s) => s.value === st)!;
          return (
            <li key={String(r.id)} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <div className="flex flex-col">
                <button disabled={i===0} onClick={() => mover(r, -1)} className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                <button disabled={i===rows.length-1} onClick={() => mover(r, 1)} className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="font-semibold">{String(r.nome ?? "—")}</p>
                <p className="text-xs text-slate-500">{String(r.data_inicio ?? "—")} → {String(r.data_fim ?? "—")}</p>
              </div>
              <select value={st} onChange={(e) => setStatus(r, e.target.value as EtapaStatus)}
                className="rounded border px-2 py-1 text-xs" style={{ color: meta.color, fontWeight: 600 }}>
                {ETAPA_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button onClick={() => excluir(r)} className="rounded-md p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============================================================ Fotos
function FotosTab({ clienteId }: { clienteId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [legenda, setLegenda] = useState("");
  const [semana, setSemana] = useState<number>(1);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await fmSupabase.from("obra_fotos").select("*").eq("cliente_id", clienteId).order("criado_em", { ascending: false });
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [clienteId]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const created: Row[] = [];
    for (const file of Array.from(files)) {
      const path = `${clienteId}/fotos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await fmSupabase.storage.from(BUCKET).upload(path, file);
      if (upErr) { toast.error("Upload falhou: " + upErr.message); continue; }
      const { data: pub } = fmSupabase.storage.from(BUCKET).getPublicUrl(path);
      const { data: ins, error } = await fmSupabase.from("obra_fotos").insert({
        cliente_id: clienteId, foto_url: pub.publicUrl, legenda, semana,
      }).select().maybeSingle();
      if (error) { toast.error("Erro: " + error.message); continue; }
      created.push(ins as Row);
    }
    setUploading(false);
    if (created.length) { setRows((arr) => [...created, ...arr]); toast.success(`${created.length} foto(s) enviada(s)`); setLegenda(""); }
  };

  const excluir = async (r: Row) => {
    if (!confirm("Excluir foto?")) return;
    const { error } = await fmSupabase.from("obra_fotos").delete().eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    setRows((arr) => arr.filter((x) => x.id !== r.id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border bg-slate-50 p-4">
        <h3 className="text-sm font-bold">Enviar fotos</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div><Label className="text-xs">Legenda</Label><Input value={legenda} onChange={(e)=>setLegenda(e.target.value)} /></div>
          <div><Label className="text-xs">Semana</Label><Input type="number" value={semana} onChange={(e)=>setSemana(Number(e.target.value))} /></div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
          <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Selecionar imagens"}
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} disabled={uploading} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {rows.length === 0 && <p className="text-sm text-slate-500 col-span-full">Nenhuma foto.</p>}
        {rows.map((r) => (
          <div key={String(r.id)} className="group relative overflow-hidden rounded-lg border">
            <img src={String(r.foto_url)} alt={String(r.legenda ?? "")} className="aspect-square w-full object-cover" />
            <div className="p-2">
              <p className="text-xs font-semibold">Semana {String(r.semana ?? "—")}</p>
              <p className="truncate text-xs text-slate-500">{String(r.legenda ?? "")}</p>
            </div>
            <button onClick={() => excluir(r)} className="absolute right-1 top-1 rounded-md bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================ Documentos
function DocumentosTab({ clienteId }: { clienteId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<DocTipo>("contrato");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await fmSupabase.from("obra_documentos").select("*").eq("cliente_id", clienteId).order("criado_em", { ascending: false });
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [clienteId]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!nome.trim()) return toast.error("Informe o nome do documento");
    setUploading(true);
    const file = files[0];
    const path = `${clienteId}/docs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await fmSupabase.storage.from(BUCKET).upload(path, file);
    if (upErr) { setUploading(false); return toast.error("Upload falhou: " + upErr.message); }
    const { data: pub } = fmSupabase.storage.from(BUCKET).getPublicUrl(path);
    const { data: ins, error } = await fmSupabase.from("obra_documentos").insert({
      cliente_id: clienteId, doc_url: pub.publicUrl, nome, tipo,
    }).select().maybeSingle();
    setUploading(false);
    if (error) return toast.error("Erro: " + error.message);
    setRows((arr) => [ins as Row, ...arr]);
    toast.success("Documento enviado");
    setNome("");
  };

  const excluir = async (r: Row) => {
    if (!confirm("Excluir documento?")) return;
    const { error } = await fmSupabase.from("obra_documentos").delete().eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    setRows((arr) => arr.filter((x) => x.id !== r.id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border bg-slate-50 p-4">
        <h3 className="text-sm font-bold">Enviar documento</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div><Label className="text-xs">Nome</Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as DocTipo)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              {DOC_TIPOS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
          <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Selecionar PDF"}
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => upload(e.target.files)} disabled={uploading} />
        </label>
      </div>
      <ul className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-slate-500">Nenhum documento.</p>}
        {rows.map((r) => (
          <li key={String(r.id)} className="flex items-center justify-between gap-2 rounded-lg border p-3">
            <div className="flex-1">
              <p className="font-semibold">{String(r.nome ?? "—")}</p>
              <p className="text-xs text-slate-500 uppercase">{String(r.tipo ?? "outro")}</p>
            </div>
            <a href={String(r.doc_url)} target="_blank" rel="noopener noreferrer" className="rounded-md border px-3 py-1 text-xs font-semibold hover:bg-slate-50">Abrir</a>
            <button onClick={() => excluir(r)} className="rounded-md p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}