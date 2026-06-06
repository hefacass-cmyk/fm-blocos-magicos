import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fmSupabase } from "@/lib/fm-contratos";
import { maskCep, maskCpfCnpj, maskPhone, onlyDigits, viaCep, type TipoPessoa } from "@/lib/fm-clientes";
import SignaturePad, { type SignaturePadHandle } from "@/components/admin/SignaturePad";
import ContratoTexto from "@/components/admin/ContratoTexto";
import { carregarEmpresaConfig, EMPRESA_DEFAULT, type EmpresaConfig } from "@/lib/fm-empresa";

export const Route = createFileRoute("/contrato/$token")({
  head: () => ({ meta: [{ title: "Assinar Contrato · F&M" }] }),
  component: PublicContratoPage,
});

type Row = Record<string, unknown>;

function PublicContratoPage() {
  const { token } = useParams({ from: "/contrato/$token" });
  const [loading, setLoading] = useState(true);
  const [c, setC] = useState<Row | null>(null);
  const [loadErr, setLoadErr] = useState<{ message: string; code?: string; details?: string; hint?: string } | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaConfig>(EMPRESA_DEFAULT);
  const [tipo, setTipo] = useState<TipoPessoa>("PF");
  const [aceito, setAceito] = useState(false);
  const [saving, setSaving] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [token]);

  const load = async () => {
    setLoading(true);
    setLoadErr(null);
    console.log("[contrato.$token] token da URL:", token, "tipo:", typeof token);
    void carregarEmpresaConfig().then(setEmpresa);
    const { data, error } = await fmSupabase.rpc("get_contrato_publico", { p_token: token });
    console.log("[contrato.$token] RPC get_contrato_publico:", { data, error });
    if (error) {
      console.error("[contrato.$token] Erro detalhado:", error);
      console.error("Código:", error.code, "Mensagem:", error.message, "Detalhes:", error.details, "Hint:", error.hint);
      setLoadErr({ message: error.message, code: error.code, details: error.details ?? undefined, hint: error.hint ?? undefined });
      setLoading(false);
      return;
    }
    if (!data) {
      setLoadErr({ message: "Nenhum contrato retornado pela RPC (data=null)", code: "EMPTY" });
      setLoading(false);
      return;
    }
    setC(data as Row);
    if (((data as Row).cliente_cpf_cnpj as string)?.length > 14) setTipo("PJ");
    setLoading(false);
  };

  const upd = (patch: Row) => setC((cur) => (cur ? { ...cur, ...patch } : cur));

  const buscarCep = async (cep: string) => {
    const r = await viaCep(cep);
    if (r) upd({ cliente_rua: r.rua, cliente_bairro: r.bairro, cliente_cidade: r.cidade, cliente_estado: r.estado });
  };

  const assinar = async () => {
    if (!c) return;
    if (!aceito) { toast.error("Confirme que leu e concorda com os termos"); return; }
    const required = ["cliente_nome", "cliente_cpf_cnpj", "cliente_email", "cliente_telefone"];
    for (const k of required) { if (!c[k]) { toast.error("Preencha todos os dados pessoais"); return; } }
    const sig = padRef.current?.toDataURL();
    if (!sig) { toast.error("Desenhe sua assinatura"); return; }
    setSaving(true);
    const dados = {
      cliente_nome: c.cliente_nome, cliente_cpf_cnpj: c.cliente_cpf_cnpj, cliente_rg: c.cliente_rg,
      cliente_email: c.cliente_email, cliente_telefone: c.cliente_telefone,
      cliente_cep: c.cliente_cep, cliente_rua: c.cliente_rua, cliente_numero: c.cliente_numero,
      cliente_bairro: c.cliente_bairro, cliente_cidade: c.cliente_cidade, cliente_estado: c.cliente_estado,
    };
    const { error } = await fmSupabase.rpc("assinar_contrato_publico", {
      p_token: token, p_dados: dados, p_assinatura: sig,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Contrato assinado com sucesso!");
    const msg = encodeURIComponent(`✅ Cliente ${String(c.cliente_nome)} assinou o contrato ${String(c.numero)}. Acesse o painel para revisar.`);
    window.open(`https://wa.me/5571999454343?text=${msg}`, "_blank");
    void load();
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (!c) return (
    <div className="p-6 mx-auto max-w-2xl space-y-3">
      <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-semibold mb-2">Contrato não carregado</p>
        <p><strong>Token URL:</strong> {String(token)}</p>
        {loadErr ? (
          <>
            <p><strong>Mensagem:</strong> {loadErr.message}</p>
            <p><strong>Código:</strong> {loadErr.code ?? "—"}</p>
            <p><strong>Detalhes:</strong> {loadErr.details ?? "—"}</p>
            <p><strong>Hint:</strong> {loadErr.hint ?? "—"}</p>
          </>
        ) : <p>Sem erro retornado.</p>}
      </div>
    </div>
  );

  const jaAssinado = Boolean(c.assinatura_cliente);

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="mx-auto max-w-3xl space-y-6 rounded-lg bg-white p-6 shadow md:p-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Contrato F&M Smart Build</h1>
          <p className="text-sm text-slate-500">Nº {String(c.numero)}</p>
        </div>

        {!jaAssinado && (
          <section className="rounded-lg border-2 border-blue-300 bg-blue-50/50 p-5 space-y-4">
            <h2 className="text-lg font-semibold text-blue-900">📝 Preencha seus dados</h2>
            <div className="flex gap-3">
              <label className="flex items-center gap-1 text-sm"><input type="radio" checked={tipo === "PF"} onChange={() => setTipo("PF")} /> Pessoa Física</label>
              <label className="flex items-center gap-1 text-sm"><input type="radio" checked={tipo === "PJ"} onChange={() => setTipo("PJ")} /> Pessoa Jurídica</label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <F label={tipo === "PF" ? "Nome completo" : "Razão Social"}><Input value={(c.cliente_nome as string) || ""} onChange={(e) => upd({ cliente_nome: e.target.value })} /></F>
              <F label={tipo === "PF" ? "CPF" : "CNPJ"}><Input value={(c.cliente_cpf_cnpj as string) || ""} onChange={(e) => upd({ cliente_cpf_cnpj: maskCpfCnpj(e.target.value, tipo) })} /></F>
              <F label="RG / IE"><Input value={(c.cliente_rg as string) || ""} onChange={(e) => upd({ cliente_rg: e.target.value })} /></F>
              <F label="E-mail"><Input type="email" value={(c.cliente_email as string) || ""} onChange={(e) => upd({ cliente_email: e.target.value })} /></F>
              <F label="Telefone / WhatsApp"><Input value={(c.cliente_telefone as string) || ""} onChange={(e) => upd({ cliente_telefone: maskPhone(e.target.value) })} /></F>
              <F label="CEP"><Input value={(c.cliente_cep as string) || ""} onChange={(e) => { const v = maskCep(e.target.value); upd({ cliente_cep: v }); if (onlyDigits(v).length === 8) void buscarCep(v); }} /></F>
              <F label="Rua"><Input value={(c.cliente_rua as string) || ""} onChange={(e) => upd({ cliente_rua: e.target.value })} /></F>
              <F label="Número"><Input value={(c.cliente_numero as string) || ""} onChange={(e) => upd({ cliente_numero: e.target.value })} /></F>
              <F label="Bairro"><Input value={(c.cliente_bairro as string) || ""} onChange={(e) => upd({ cliente_bairro: e.target.value })} /></F>
              <F label="Cidade"><Input value={(c.cliente_cidade as string) || ""} onChange={(e) => upd({ cliente_cidade: e.target.value })} /></F>
              <F label="Estado"><Input value={(c.cliente_estado as string) || ""} maxLength={2} onChange={(e) => upd({ cliente_estado: e.target.value.toUpperCase() })} /></F>
            </div>
          </section>
        )}

        <section className="rounded-lg border bg-white p-5">
          <ContratoTexto c={c} empresa={empresa} />
        </section>

        {jaAssinado ? (
          <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-5 text-center space-y-3">
            <h3 className="text-lg font-semibold text-emerald-900">✅ Contrato assinado</h3>
            <img src={c.assinatura_cliente as string} alt="" className="mx-auto h-24" />
            <p className="text-sm text-emerald-800">Sua assinatura foi registrada. A F&M Smart Build irá assinar em breve.</p>
          </div>
        ) : (
          <section className="rounded-lg border-2 border-blue-300 bg-blue-50/50 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-blue-900">Assinatura do Contratante</h3>
            <SignaturePad ref={padRef} />
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={aceito} onCheckedChange={(v) => setAceito(Boolean(v))} />
              <span>Li e concordo com todos os termos do contrato.</span>
            </label>
            <Button onClick={assinar} disabled={saving} className="w-full bg-emerald-600 text-base hover:bg-emerald-700" size="lg">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-5 w-5" />}
              ASSINAR CONTRATO
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-slate-700">{label}</Label>{children}</div>;
}