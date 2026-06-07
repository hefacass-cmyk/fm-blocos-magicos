import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Save, Eraser } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmSupabase } from "@/lib/fm-supabase";
import SignaturePad, { type SignaturePadHandle } from "@/components/admin/SignaturePad";
import { carregarEmpresaConfig, EMPRESA_DEFAULT, type EmpresaConfig } from "@/lib/fm-empresa";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações da Empresa · F&M" }] }),
  component: AdminConfiguracoesPage,
});

const ADMIN_KEY = "fm_admin_auth";

function AdminConfiguracoesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmpresaConfig & { id?: string }>(EMPRESA_DEFAULT);
  const padRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") { navigate({ to: "/admin/login" }); return; }
    void (async () => {
      const { data } = await fmSupabase.from("empresa_config").select("*").limit(1).maybeSingle();
      if (data) setForm({ ...EMPRESA_DEFAULT, ...(data as EmpresaConfig & { id: string }) });
      else setForm(await carregarEmpresaConfig());
      setLoading(false);
    })();
  }, [navigate]);

  const set = (patch: Partial<EmpresaConfig>) => setForm((f) => ({ ...f, ...patch }));

  const capturarAssinatura = () => {
    const dataUrl = padRef.current?.toDataURL();
    if (!dataUrl) { toast.error("Desenhe a assinatura primeiro"); return; }
    set({ assinatura_fm_default: dataUrl });
    toast.success("Assinatura capturada — clique em Salvar.");
  };

  const removerAssinatura = () => {
    set({ assinatura_fm_default: null });
    padRef.current?.clear();
  };

  const salvar = async () => {
    setSaving(true);
    const clean = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
    const base: Record<string, unknown> = {
      razao_social: clean(form.razao_social),
      cnpj: clean(form.cnpj),
      endereco: clean(form.endereco),
      representante_nome: clean(form.representante_nome),
      representante_cpf: clean(form.representante_cpf),
      representante_rg: clean(form.representante_rg),
      representante_estado_civil: clean(form.representante_estado_civil),
      representante_profissao: clean(form.representante_profissao),
      representante_nascimento: clean(form.representante_nascimento),
      representante_endereco: clean(form.representante_endereco),
      responsavel_tecnico: clean(form.responsavel_tecnico),
      crea: clean(form.crea),
      pix_chave: clean(form.pix_chave),
      logo_url: clean(form.logo_url),
      assinatura_fm_default: clean(form.assinatura_fm_default),
      atualizado_em: new Date().toISOString(),
    };
    const tryWrite = async (payload: Record<string, unknown>) => {
      if (form.id) return await fmSupabase.from("empresa_config").update(payload).eq("id", form.id).select().single();
      return await fmSupabase.from("empresa_config").insert(payload).select().single();
    };
    let res = await tryWrite(base);
    let attempts = 0;
    while (res.error && attempts < 8) {
      const msg = res.error.message || "";
      const m = /Could not find the ['"]?(\w+)['"]? column/i.exec(msg)
        || /column ['"]?(\w+)['"]? .*(?:does not exist|schema cache)/i.exec(msg);
      const col = m?.[1];
      if (!col || !(col in base)) break;
      delete base[col];
      res = await tryWrite(base);
      attempts++;
    }
    setSaving(false);
    if (res.error) { toast.error("Erro: " + res.error.message); return; }
    toast.success(form.assinatura_fm_default ? "✅ Assinatura salva com sucesso!" : "✅ Configurações salvas");
    setForm({ ...EMPRESA_DEFAULT, ...(res.data as EmpresaConfig & { id: string }) });
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="text-slate-500 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-lg font-bold text-slate-900">Configurações da Empresa</h1>
          </div>
          <Button onClick={salvar} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Salvar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4">
        <Section title="Dados da Empresa">
          <Field label="Razão Social"><Input value={form.razao_social || ""} onChange={(e) => set({ razao_social: e.target.value })} /></Field>
          <Field label="CNPJ"><Input value={form.cnpj || ""} onChange={(e) => set({ cnpj: e.target.value })} /></Field>
          <Field label="Endereço"><Input value={form.endereco || ""} onChange={(e) => set({ endereco: e.target.value })} /></Field>
          <Field label="Chave PIX"><Input value={form.pix_chave || ""} onChange={(e) => set({ pix_chave: e.target.value })} /></Field>
          <Field label="URL do Logo (opcional)"><Input value={form.logo_url || ""} onChange={(e) => set({ logo_url: e.target.value })} placeholder="https://..." /></Field>
        </Section>

        <Section title="Representante Legal">
          <Field label="Nome"><Input value={form.representante_nome || ""} onChange={(e) => set({ representante_nome: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CPF"><Input value={form.representante_cpf || ""} onChange={(e) => set({ representante_cpf: e.target.value })} /></Field>
            <Field label="RG"><Input value={form.representante_rg || ""} onChange={(e) => set({ representante_rg: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado civil"><Input value={form.representante_estado_civil || ""} onChange={(e) => set({ representante_estado_civil: e.target.value })} /></Field>
            <Field label="Profissão"><Input value={form.representante_profissao || ""} onChange={(e) => set({ representante_profissao: e.target.value })} /></Field>
          </div>
          <Field label="Nascimento"><Input type="date" value={form.representante_nascimento || ""} onChange={(e) => set({ representante_nascimento: e.target.value })} /></Field>
          <Field label="Endereço"><Input value={form.representante_endereco || ""} onChange={(e) => set({ representante_endereco: e.target.value })} /></Field>
        </Section>

        <Section title="Responsável Técnico">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome (opcional)"><Input value={form.responsavel_tecnico || ""} onChange={(e) => set({ responsavel_tecnico: e.target.value })} /></Field>
            <Field label="CREA (opcional)"><Input value={form.crea || ""} onChange={(e) => set({ crea: e.target.value })} /></Field>
          </div>
        </Section>

        <Section title="Assinatura padrão da F&M">
          <p className="text-sm text-slate-600">Cadastre sua assinatura uma vez. Ela ficará disponível para uso em todos os contratos via o botão “Usar assinatura padrão”.</p>
          {form.assinatura_fm_default ? (
            <div className="space-y-2">
              <Label>Assinatura cadastrada</Label>
              <img src={form.assinatura_fm_default} alt="assinatura padrão" className="h-32 rounded border bg-white" />
              <Button variant="outline" size="sm" onClick={removerAssinatura}><Eraser className="mr-1 h-4 w-4" /> Remover</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Desenhe sua assinatura</Label>
              <SignaturePad ref={padRef} />
              <Button size="sm" onClick={capturarAssinatura}>Capturar assinatura</Button>
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border bg-white p-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-slate-600">{label}</Label>{children}</div>;
}