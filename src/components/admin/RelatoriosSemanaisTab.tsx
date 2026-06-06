import { useEffect, useState } from "react";
import { Plus, Send, Trash2, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fmSupabase } from "@/lib/fm-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Row = Record<string, unknown>;
const BUCKET = "obra-arquivos";

function statusBadge(s: string) {
  if (s === "enviado") return { label: "Enviado", color: "#1A4D7A" };
  if (s === "visualizado") return { label: "Visualizado", color: "#06A77D" };
  return { label: "Rascunho", color: "#94a3b8" };
}

// Sexta a quinta da semana atual
function sextaQuinta(): { ini: string; fim: string } {
  const d = new Date();
  const day = d.getDay(); // 0 dom .. 6 sab; sexta=5
  // dias desde a última sexta
  const diff = (day - 5 + 7) % 7;
  const sexta = new Date(d); sexta.setDate(d.getDate() - diff);
  const quinta = new Date(sexta); quinta.setDate(sexta.getDate() + 6);
  return { ini: sexta.toISOString().slice(0, 10), fim: quinta.toISOString().slice(0, 10) };
}

export function RelatoriosSemanaisTab({ clienteId, cliente }: { clienteId: string; cliente: Row }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await fmSupabase
      .from("relatorios_semanais")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("semana_inicio", { ascending: false });
    if (error) toast.error("Erro: " + error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [clienteId]);

  const excluir = async (r: Row) => {
    if (!confirm("Excluir relatório?")) return;
    const { error } = await fmSupabase.from("relatorios_semanais").delete().eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Removido");
    setRows((arr) => arr.filter((x) => x.id !== r.id));
  };

  const enviar = async (r: Row) => {
    const { error } = await fmSupabase
      .from("relatorios_semanais")
      .update({ status: "enviado", enviado_em: new Date().toISOString() })
      .eq("id", r.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Status atualizado para enviado");
    setRows((arr) => arr.map((x) => (x.id === r.id ? { ...x, status: "enviado", enviado_em: new Date().toISOString() } : x)));

    // Abrir WhatsApp do cliente
    const fone = String(cliente.whatsapp ?? cliente.telefone ?? "").replace(/\D/g, "");
    if (!fone) return;
    const titulo = String(r.titulo ?? "");
    const nome = String(cliente.nome ?? "");
    const progTotal = String(r.progresso_total ?? "—");
    const profs = String(r.profissionais ?? "—");
    const servicos = Array.isArray(r.servicos_executados) ? (r.servicos_executados as string[]).join(", ") : String(r.servicos_executados ?? "—");
    const msg = `📊 *Relatório Semanal F&M — ${titulo}*\n\nOlá ${nome}! Seu relatório semanal está disponível.\n\n📈 Progresso total: ${progTotal}%\n👷 Profissionais: ${profs}\n✅ Executado: ${servicos}\n\nAcesse sua área para ver detalhes e fotos:\nhttps://www.fmsmartbuild.com.br/dashboard`;
    window.open(`https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Relatórios semanais</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Novo Relatório Semanal</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum relatório ainda.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const b = statusBadge(String(r.status ?? "rascunho"));
            return (
              <li key={String(r.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">{String(r.semana_inicio ?? "—")} → {String(r.semana_fim ?? "—")}</p>
                  <p className="font-semibold">{String(r.titulo ?? "—")}</p>
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: b.color }}>{b.label}</span>
                </div>
                <div className="flex gap-2">
                  {r.status !== "enviado" && r.status !== "visualizado" && (
                    <Button size="sm" onClick={() => enviar(r)} className="bg-emerald-600 hover:bg-emerald-700"><Send className="h-4 w-4" /> Enviar</Button>
                  )}
                  <button onClick={() => excluir(r)} className="rounded-md p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {open && (
        <NovoRelatorioModal
          clienteId={clienteId}
          onClose={() => setOpen(false)}
          onCreated={(r) => { setRows((arr) => [r, ...arr]); setOpen(false); }}
        />
      )}
    </div>
  );
}

function TagsInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...value, t]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" size="sm" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {value.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs">
              {t}
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="text-slate-500 hover:text-red-500"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function NovoRelatorioModal({ clienteId, onClose, onCreated }: { clienteId: string; onClose: () => void; onCreated: (r: Row) => void }) {
  const def = sextaQuinta();
  const [iniDate, setIniDate] = useState(def.ini);
  const [fimDate, setFimDate] = useState(def.fim);
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [progSemana, setProgSemana] = useState<number>(0);
  const [progTotal, setProgTotal] = useState<number>(0);
  const [profs, setProfs] = useState<number>(0);
  const [servicos, setServicos] = useState<string[]>([]);
  const [materiais, setMateriais] = useState<string[]>([]);
  const [pendencias, setPendencias] = useState<string[]>([]);
  const [proximos, setProximos] = useState<string[]>([]);
  const [valor, setValor] = useState<number>(0);
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${clienteId}/relatorios/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await fmSupabase.storage.from(BUCKET).upload(path, file);
      if (error) { toast.error("Upload falhou: " + error.message); continue; }
      const { data: pub } = fmSupabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(pub.publicUrl);
    }
    setUploading(false);
    setFotos((arr) => [...arr, ...urls]);
  };

  const salvar = async () => {
    if (!titulo.trim()) return toast.error("Título obrigatório");
    setSaving(true);
    const { data, error } = await fmSupabase
      .from("relatorios_semanais")
      .insert({
        cliente_id: clienteId,
        semana_inicio: iniDate,
        semana_fim: fimDate,
        titulo,
        resumo,
        progresso_semana: progSemana,
        progresso_total: progTotal,
        profissionais: profs,
        servicos_executados: servicos,
        materiais_utilizados: materiais,
        pendencias,
        proximos_passos: proximos,
        fotos,
        valor_medido: valor,
        status: "rascunho",
      })
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Relatório criado");
    onCreated(data as Row);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle>Novo Relatório Semanal</DialogTitle>
        <div className="space-y-3 pt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label className="text-xs">Semana início (sexta)</Label><Input type="date" value={iniDate} onChange={(e) => setIniDate(e.target.value)} /></div>
            <div><Label className="text-xs">Semana fim (quinta)</Label><Input type="date" value={fimDate} onChange={(e) => setFimDate(e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Semana 03 — Paredes IBPP" maxLength={120} /></div>
          <div><Label className="text-xs">Resumo executivo</Label><Textarea value={resumo} onChange={(e) => setResumo(e.target.value)} rows={3} maxLength={2000} /></div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div><Label className="text-xs">Progresso semana (%)</Label><Input type="number" value={progSemana} onChange={(e) => setProgSemana(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Progresso total (%)</Label><Input type="number" value={progTotal} onChange={(e) => setProgTotal(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Profissionais</Label><Input type="number" value={profs} onChange={(e) => setProfs(Number(e.target.value))} /></div>
          </div>
          <div><Label className="text-xs">Serviços executados</Label><TagsInput value={servicos} onChange={setServicos} placeholder="Adicione e pressione Enter" /></div>
          <div><Label className="text-xs">Materiais utilizados</Label><TagsInput value={materiais} onChange={setMateriais} placeholder="Adicione e pressione Enter" /></div>
          <div><Label className="text-xs">Pendências</Label><TagsInput value={pendencias} onChange={setPendencias} placeholder="Adicione e pressione Enter" /></div>
          <div><Label className="text-xs">Próximos passos</Label><TagsInput value={proximos} onChange={setProximos} placeholder="Adicione e pressione Enter" /></div>
          <div><Label className="text-xs">Valor medido na semana (R$)</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} /></div>
          <div>
            <Label className="text-xs">Fotos da semana</Label>
            <label className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
              <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Selecionar imagens"}
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upFiles(e.target.files)} disabled={uploading} />
            </label>
            {fotos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {fotos.map((u, i) => (
                  <div key={i} className="relative">
                    <img src={u} alt={`foto ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />
                    <button type="button" onClick={() => setFotos((a) => a.filter((_, k) => k !== i))} className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar rascunho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}