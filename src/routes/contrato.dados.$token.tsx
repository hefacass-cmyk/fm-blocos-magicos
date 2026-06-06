import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmSupabase } from "@/lib/fm-contratos";
import { maskCep, maskCpf, maskCpfCnpj, maskPhone, onlyDigits, viaCep, type TipoPessoa } from "@/lib/fm-clientes";

export const Route = createFileRoute("/contrato/dados/$token")({
  head: () => ({ meta: [{ title: "Enviar Dados · Contrato F&M" }] }),
  component: ContratoDadosPage,
});

type Form = {
  tipo_pessoa: TipoPessoa;
  nome: string; cpf_cnpj: string; rg: string;
  nacionalidade: string; estado_civil: string; profissao: string;
  nascimento: string; email: string; telefone: string; whatsapp: string;
  cep: string; rua: string; numero: string; bairro: string; cidade: string; estado: string;
  conjuge_nome: string; conjuge_cpf: string; conjuge_rg: string;
  conjuge_profissao: string; conjuge_nacionalidade: string;
  conjuge_email: string; conjuge_telefone: string;
  obra_mesmo_endereco: boolean;
  obra_cep: string; obra_rua: string; obra_numero: string;
  obra_bairro: string; obra_cidade: string; obra_estado: string;
  tamanho_terreno: string; tipo_terreno: string; area_construir: string;
  tipo_obra: string[];
  observacoes: string;
};

const VAZIO: Form = {
  tipo_pessoa: "PF",
  nome: "", cpf_cnpj: "", rg: "",
  nacionalidade: "Brasileiro(a)", estado_civil: "", profissao: "",
  nascimento: "", email: "", telefone: "", whatsapp: "",
  cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "",
  conjuge_nome: "", conjuge_cpf: "", conjuge_rg: "",
  conjuge_profissao: "", conjuge_nacionalidade: "Brasileiro(a)",
  conjuge_email: "", conjuge_telefone: "",
  obra_mesmo_endereco: false,
  obra_cep: "", obra_rua: "", obra_numero: "",
  obra_bairro: "", obra_cidade: "", obra_estado: "",
  tamanho_terreno: "", tipo_terreno: "", area_construir: "",
  tipo_obra: [],
  observacoes: "",
};

const TIPOS_OBRA = ["Construção", "Reforma", "Ampliação"];
const TERRENOS = ["Plano", "Declive", "Aclive", "Irregular", "Outro"];

function ContratoDadosPage() {
  const { token } = useParams({ from: "/contrato/dados/$token" });
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [contratoId, setContratoId] = useState<string | null>(null);
  const [numero, setNumero] = useState<string>("");
  const [statusAtual, setStatusAtual] = useState<string>("rascunho");
  const [enviado, setEnviado] = useState(false);
  const [f, setF] = useState<Form>(VAZIO);

  useEffect(() => {
    void (async () => {
      const { data, error } = await fmSupabase
        .from("contratos")
        .select("*")
        .eq("token_cliente", token)
        .maybeSingle();
      if (error || !data) {
        setErro(error?.message ?? "Contrato não encontrado para este link.");
        setLoading(false);
        return;
      }
      const c = data as Record<string, unknown>;
      setContratoId(String(c.id));
      setNumero(String(c.numero ?? ""));
      setStatusAtual(String(c.status ?? "rascunho"));
      setF((prev) => ({
        ...prev,
        tipo_pessoa: (c.prospect_tipo_pessoa as TipoPessoa) || "PF",
        nome: (c.prospect_nome as string) || "",
        cpf_cnpj: (c.prospect_cpf_cnpj as string) || "",
        rg: (c.prospect_rg as string) || "",
        nacionalidade: (c.prospect_nacionalidade as string) || prev.nacionalidade,
        estado_civil: (c.prospect_estado_civil as string) || "",
        profissao: (c.prospect_profissao as string) || "",
        email: (c.prospect_email as string) || "",
        telefone: (c.prospect_telefone as string) || "",
        whatsapp: (c.prospect_whatsapp as string) || "",
        cep: (c.prospect_cep as string) || "",
        rua: (c.prospect_rua as string) || "",
        numero: (c.prospect_numero as string) || "",
        bairro: (c.prospect_bairro as string) || "",
        cidade: (c.prospect_cidade as string) || "",
        estado: (c.prospect_estado as string) || "",
        conjuge_nome: (c.prospect_conjuge_nome as string) || "",
        conjuge_cpf: (c.prospect_conjuge_cpf as string) || "",
        conjuge_rg: (c.prospect_conjuge_rg as string) || "",
        conjuge_email: (c.prospect_conjuge_email as string) || "",
        conjuge_telefone: (c.prospect_conjuge_telefone as string) || "",
        conjuge_profissao: (c.prospect_conjuge_profissao as string) || "",
        conjuge_nacionalidade: (c.prospect_conjuge_nacionalidade as string) || prev.conjuge_nacionalidade,
        obra_cep: (c.prospect_obra_cep as string) || "",
        obra_rua: (c.prospect_obra_rua as string) || "",
        obra_numero: (c.prospect_obra_numero as string) || "",
        obra_bairro: (c.prospect_obra_bairro as string) || "",
        obra_cidade: (c.prospect_obra_cidade as string) || "",
        obra_estado: (c.prospect_obra_estado as string) || "",
        tamanho_terreno: c.prospect_tamanho_terreno ? String(c.prospect_tamanho_terreno) : "",
        tipo_terreno: (c.prospect_tipo_terreno as string) || "",
        area_construir: c.prospect_area_construir ? String(c.prospect_area_construir) : "",
        tipo_obra: Array.isArray(c.prospect_tipo_obra) ? (c.prospect_tipo_obra as string[]) : [],
        observacoes: (c.prospect_observacoes as string) || "",
      }));
      setLoading(false);
    })();
  }, [token]);

  const set = (patch: Partial<Form>) => setF((c) => ({ ...c, ...patch }));
  const temConjuge = f.estado_civil === "Casado" || f.estado_civil === "União Estável";

  const buscarCep = async (cep: string, alvo: "resid" | "obra") => {
    const r = await viaCep(cep);
    if (!r) return;
    if (alvo === "resid") set({ rua: r.rua, bairro: r.bairro, cidade: r.cidade, estado: r.estado });
    else set({ obra_rua: r.rua, obra_bairro: r.bairro, obra_cidade: r.cidade, obra_estado: r.estado });
  };

  const toggleTipoObra = (t: string) => {
    set({ tipo_obra: f.tipo_obra.includes(t) ? f.tipo_obra.filter((x) => x !== t) : [...f.tipo_obra, t] });
  };

  const enviar = async () => {
    if (!contratoId) return;
    const obrig: [string, string][] = [
      ["nome", "Nome completo"], ["cpf_cnpj", "CPF/CNPJ"], ["email", "E-mail"],
      ["telefone", "Telefone"], ["estado_civil", "Estado civil"], ["area_construir", "Área a construir"],
    ];
    for (const [k, label] of obrig) {
      if (!String((f as Record<string, unknown>)[k] ?? "").trim()) {
        toast.error(`Preencha: ${label}`); return;
      }
    }
    if (f.tipo_obra.length === 0) { toast.error("Selecione ao menos um tipo de obra"); return; }
    setEnviando(true);
    const obra = f.obra_mesmo_endereco
      ? { obra_cep: f.cep, obra_rua: f.rua, obra_numero: f.numero, obra_bairro: f.bairro, obra_cidade: f.cidade, obra_estado: f.estado }
      : { obra_cep: f.obra_cep, obra_rua: f.obra_rua, obra_numero: f.obra_numero, obra_bairro: f.obra_bairro, obra_cidade: f.obra_cidade, obra_estado: f.obra_estado };
    const payload: Record<string, unknown> = {
      prospect_tipo_pessoa: f.tipo_pessoa,
      prospect_nome: f.nome, prospect_cpf_cnpj: f.cpf_cnpj, prospect_rg: f.rg,
      prospect_nacionalidade: f.nacionalidade, prospect_estado_civil: f.estado_civil,
      prospect_profissao: f.profissao, prospect_email: f.email,
      prospect_telefone: f.telefone, prospect_whatsapp: f.whatsapp || f.telefone,
      prospect_cep: f.cep, prospect_rua: f.rua, prospect_numero: f.numero,
      prospect_bairro: f.bairro, prospect_cidade: f.cidade, prospect_estado: f.estado,
      prospect_conjuge_nome: f.conjuge_nome, prospect_conjuge_cpf: f.conjuge_cpf,
      prospect_conjuge_rg: f.conjuge_rg, prospect_conjuge_email: f.conjuge_email,
      prospect_conjuge_telefone: f.conjuge_telefone,
      prospect_conjuge_profissao: f.conjuge_profissao,
      prospect_conjuge_nacionalidade: f.conjuge_nacionalidade,
      prospect_obra_cep: obra.obra_cep, prospect_obra_rua: obra.obra_rua,
      prospect_obra_numero: obra.obra_numero, prospect_obra_bairro: obra.obra_bairro,
      prospect_obra_cidade: obra.obra_cidade, prospect_obra_estado: obra.obra_estado,
      prospect_tamanho_terreno: f.tamanho_terreno || null,
      prospect_tipo_terreno: f.tipo_terreno,
      prospect_area_construir: f.area_construir || null,
      prospect_tipo_obra: f.tipo_obra,
      prospect_observacoes: f.observacoes,
      cliente_nome: f.nome, cliente_cpf_cnpj: f.cpf_cnpj, cliente_rg: f.rg,
      cliente_email: f.email, cliente_telefone: f.telefone,
      cliente_cep: f.cep, cliente_rua: f.rua, cliente_numero: f.numero,
      cliente_bairro: f.bairro, cliente_cidade: f.cidade, cliente_estado: f.estado,
      status: "dados_cliente_enviados",
      atualizado_em: new Date().toISOString(),
    };
    const { error } = await fmSupabase.from("contratos").update(payload).eq("id", contratoId);
    setEnviando(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setEnviado(true);
    const msg = encodeURIComponent(`📋 ${f.nome} preencheu os dados do contrato ${numero}. Acesse o admin para elaborar a proposta.`);
    window.open(`https://wa.me/5571999454343?text=${msg}`, "_blank");
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (erro) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Link inválido</p>
          <p>{erro}</p>
        </div>
      </div>
    );
  }
  if (enviado || (statusAtual !== "rascunho" && statusAtual !== "aguardando_cliente" && statusAtual !== "dados_cliente_enviados")) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-6 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="text-xl font-bold text-emerald-900">Dados enviados!</h1>
          <p className="text-sm text-emerald-800">A F&M Smart Build recebeu seus dados e vai elaborar sua proposta. Em breve você receberá o contrato para revisão.</p>
        </div>
      </div>
    );
  }
  if (enviado) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-3xl space-y-6 rounded-lg bg-white p-6 shadow md:p-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Etapa 1 — Seus Dados</h1>
          <p className="text-sm text-slate-600">Contrato {numero}. Preencha seus dados para que a F&M elabore a proposta.</p>
        </header>

        <Section title="Dados Pessoais">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={f.tipo_pessoa === "PF"} onChange={() => set({ tipo_pessoa: "PF" })} /> Pessoa Física</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={f.tipo_pessoa === "PJ"} onChange={() => set({ tipo_pessoa: "PJ" })} /> Pessoa Jurídica</label>
          </div>
          <Grid>
            <Field label={f.tipo_pessoa === "PF" ? "Nome completo *" : "Razão Social *"}><Input value={f.nome} onChange={(e) => set({ nome: e.target.value })} /></Field>
            <Field label={f.tipo_pessoa === "PF" ? "CPF *" : "CNPJ *"}><Input value={f.cpf_cnpj} onChange={(e) => set({ cpf_cnpj: maskCpfCnpj(e.target.value, f.tipo_pessoa) })} /></Field>
            <Field label="RG"><Input value={f.rg} onChange={(e) => set({ rg: e.target.value })} /></Field>
            <Field label="Nacionalidade"><Input value={f.nacionalidade} onChange={(e) => set({ nacionalidade: e.target.value })} /></Field>
            <Field label="Estado civil *">
              <Select value={f.estado_civil} onValueChange={(v) => set({ estado_civil: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {["Solteiro", "Casado", "Divorciado", "Viúvo", "União Estável"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Profissão"><Input value={f.profissao} onChange={(e) => set({ profissao: e.target.value })} /></Field>
            <Field label="Data de nascimento"><Input type="date" value={f.nascimento} onChange={(e) => set({ nascimento: e.target.value })} /></Field>
            <Field label="E-mail *"><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="Telefone *"><Input value={f.telefone} onChange={(e) => set({ telefone: maskPhone(e.target.value) })} /></Field>
            <Field label="WhatsApp"><Input value={f.whatsapp} onChange={(e) => set({ whatsapp: maskPhone(e.target.value) })} placeholder="Se diferente do telefone" /></Field>
          </Grid>
        </Section>

        <Section title="Endereço residencial">
          <Grid>
            <Field label="CEP"><Input value={f.cep} onChange={(e) => { const v = maskCep(e.target.value); set({ cep: v }); if (onlyDigits(v).length === 8) void buscarCep(v, "resid"); }} /></Field>
            <Field label="Rua"><Input value={f.rua} onChange={(e) => set({ rua: e.target.value })} /></Field>
            <Field label="Número"><Input value={f.numero} onChange={(e) => set({ numero: e.target.value })} /></Field>
            <Field label="Bairro"><Input value={f.bairro} onChange={(e) => set({ bairro: e.target.value })} /></Field>
            <Field label="Cidade"><Input value={f.cidade} onChange={(e) => set({ cidade: e.target.value })} /></Field>
            <Field label="Estado"><Input maxLength={2} value={f.estado} onChange={(e) => set({ estado: e.target.value.toUpperCase() })} /></Field>
          </Grid>
        </Section>

        {temConjuge && (
          <Section title="Dados do(a) cônjuge / companheiro(a)" highlight>
            <Grid>
              <Field label="Nome completo"><Input value={f.conjuge_nome} onChange={(e) => set({ conjuge_nome: e.target.value })} /></Field>
              <Field label="CPF"><Input value={f.conjuge_cpf} onChange={(e) => set({ conjuge_cpf: maskCpf(e.target.value) })} /></Field>
              <Field label="RG"><Input value={f.conjuge_rg} onChange={(e) => set({ conjuge_rg: e.target.value })} /></Field>
              <Field label="Profissão"><Input value={f.conjuge_profissao} onChange={(e) => set({ conjuge_profissao: e.target.value })} /></Field>
              <Field label="Nacionalidade"><Input value={f.conjuge_nacionalidade} onChange={(e) => set({ conjuge_nacionalidade: e.target.value })} /></Field>
              <Field label="E-mail"><Input type="email" value={f.conjuge_email} onChange={(e) => set({ conjuge_email: e.target.value })} /></Field>
              <Field label="Telefone"><Input value={f.conjuge_telefone} onChange={(e) => set({ conjuge_telefone: maskPhone(e.target.value) })} /></Field>
            </Grid>
          </Section>
        )}

        <Section title="Dados da Obra">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={f.obra_mesmo_endereco} onCheckedChange={(v) => set({ obra_mesmo_endereco: Boolean(v) })} />
            A obra é no mesmo endereço residencial
          </label>
          {!f.obra_mesmo_endereco && (
            <Grid>
              <Field label="CEP da obra"><Input value={f.obra_cep} onChange={(e) => { const v = maskCep(e.target.value); set({ obra_cep: v }); if (onlyDigits(v).length === 8) void buscarCep(v, "obra"); }} /></Field>
              <Field label="Rua"><Input value={f.obra_rua} onChange={(e) => set({ obra_rua: e.target.value })} /></Field>
              <Field label="Número"><Input value={f.obra_numero} onChange={(e) => set({ obra_numero: e.target.value })} /></Field>
              <Field label="Bairro"><Input value={f.obra_bairro} onChange={(e) => set({ obra_bairro: e.target.value })} /></Field>
              <Field label="Cidade"><Input value={f.obra_cidade} onChange={(e) => set({ obra_cidade: e.target.value })} /></Field>
              <Field label="Estado"><Input maxLength={2} value={f.obra_estado} onChange={(e) => set({ obra_estado: e.target.value.toUpperCase() })} /></Field>
            </Grid>
          )}
          <Grid>
            <Field label="Tamanho do terreno (m²)"><Input value={f.tamanho_terreno} onChange={(e) => set({ tamanho_terreno: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Tipo de terreno">
              <Select value={f.tipo_terreno} onValueChange={(v) => set({ tipo_terreno: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{TERRENOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Área a construir (m²) *"><Input value={f.area_construir} onChange={(e) => set({ area_construir: e.target.value.replace(/\D/g, "") })} /></Field>
          </Grid>
          <div>
            <Label className="text-xs text-slate-600">Tipo de obra *</Label>
            <div className="mt-1 flex flex-wrap gap-3">
              {TIPOS_OBRA.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.tipo_obra.includes(t)} onCheckedChange={() => toggleTipoObra(t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <Field label="Observações"><Textarea value={f.observacoes} onChange={(e) => set({ observacoes: e.target.value })} rows={3} /></Field>
        </Section>

        <div className="flex justify-end">
          <Button onClick={enviar} disabled={enviando} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            {enviando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
            ENVIAR MEUS DADOS
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section className={`space-y-3 rounded-lg border p-4 ${highlight ? "border-blue-300 bg-blue-50/50" : "bg-white"}`}>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-slate-600">{label}</Label>{children}</div>;
}