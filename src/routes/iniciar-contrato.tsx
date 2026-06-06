import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmSupabase, PLANOS_CAMERA } from "@/lib/fm-contratos";
import { maskCep, maskCpf, maskCpfCnpj, maskPhone, onlyDigits, viaCep, type TipoPessoa } from "@/lib/fm-clientes";

export const Route = createFileRoute("/iniciar-contrato")({
  head: () => ({
    meta: [
      { title: "Quero Construir · F&M Smart Build" },
      { name: "description", content: "Solicite seu contrato F&M Smart Build em 3 passos. Construção rápida, econômica e com gestão profissional." },
    ],
  }),
  component: IniciarContratoPage,
});

const COR_AZUL = "#1A4D7A";
const COR_AMARELO = "#F4B941";

type Form = {
  tipo_pessoa: TipoPessoa;
  nome: string; cpf_cnpj: string; rg: string;
  nacionalidade: string; estado_civil: string; profissao: string;
  email: string; telefone: string; whatsapp: string;
  cep: string; rua: string; numero: string; bairro: string; cidade: string; estado: string;
  conjuge_nome: string; conjuge_cpf: string; conjuge_rg: string;
  conjuge_email: string; conjuge_telefone: string;
  conjuge_profissao: string; conjuge_nacionalidade: string;
  obra_mesmo_endereco: boolean;
  obra_cep: string; obra_rua: string; obra_numero: string;
  obra_bairro: string; obra_cidade: string; obra_estado: string;
  tamanho_terreno: string; tipo_terreno: string; area_construir: string;
  tipo_obra: string[];
  sistema: string; servico: string; plano_camera: string;
  prazo_desejado: string; observacoes: string;
  ja_possui_projeto: boolean; quer_projeto: boolean;
};

const VAZIO: Form = {
  tipo_pessoa: "PF",
  nome: "", cpf_cnpj: "", rg: "",
  nacionalidade: "Brasileiro", estado_civil: "", profissao: "",
  email: "", telefone: "", whatsapp: "",
  cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "",
  conjuge_nome: "", conjuge_cpf: "", conjuge_rg: "",
  conjuge_email: "", conjuge_telefone: "",
  conjuge_profissao: "", conjuge_nacionalidade: "Brasileiro",
  obra_mesmo_endereco: false,
  obra_cep: "", obra_rua: "", obra_numero: "",
  obra_bairro: "", obra_cidade: "", obra_estado: "",
  tamanho_terreno: "", tipo_terreno: "", area_construir: "",
  tipo_obra: [],
  sistema: "", servico: "", plano_camera: "sem_camera",
  prazo_desejado: "", observacoes: "",
  ja_possui_projeto: false, quer_projeto: false,
};

function IniciarContratoPage() {
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [f, setF] = useState<Form>(VAZIO);
  const [confirmou, setConfirmou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [parceiroSlug, setParceiroSlug] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ numero: string; token: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const ref = sp.get("ref");
    if (ref) setParceiroSlug(ref);
    const leadId = sp.get("lead");
    if (leadId) {
      fmSupabase
        .from("referral_leads")
        .select("nome_cliente, telefone_cliente, email_cliente, parceiro_id")
        .eq("id", leadId)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          setF((c) => ({
            ...c,
            nome: (data.nome_cliente as string) || c.nome,
            telefone: (data.telefone_cliente as string) || c.telefone,
            email: (data.email_cliente as string) || c.email,
          }));
          if (data.parceiro_id && !ref) setParceiroSlug(String(data.parceiro_id));
          toast.success("Dados do lead pré-preenchidos");
        });
    }
  }, []);

  const set = (patch: Partial<Form>) => setF((c) => ({ ...c, ...patch }));

  const buscarCepResidencial = async (cep: string) => {
    const r = await viaCep(cep);
    if (r) set({ rua: r.rua, bairro: r.bairro, cidade: r.cidade, estado: r.estado });
  };
  const buscarCepObra = async (cep: string) => {
    const r = await viaCep(cep);
    if (r) set({ obra_rua: r.rua, obra_bairro: r.bairro, obra_cidade: r.cidade, obra_estado: r.estado });
  };

  const temConjuge = f.estado_civil === "Casado" || f.estado_civil === "União Estável";

  const validarEtapa1 = (): string | null => {
    if (!f.nome.trim()) return "Informe o nome completo";
    if (!f.cpf_cnpj.trim()) return f.tipo_pessoa === "PF" ? "Informe o CPF" : "Informe o CNPJ";
    if (!f.email.trim()) return "Informe o e-mail";
    if (!f.telefone.trim()) return "Informe o telefone";
    if (!f.estado_civil) return "Informe o estado civil";
    return null;
  };
  const validarEtapa2 = (): string | null => {
    if (!f.area_construir) return "Informe a área a construir/reformar";
    if (!f.sistema) return "Escolha o sistema construtivo";
    if (!f.servico) return "Escolha o tipo de serviço";
    if (f.tipo_obra.length === 0) return "Selecione ao menos um tipo de obra";
    return null;
  };

  const avancar = () => {
    const erro = etapa === 1 ? validarEtapa1() : etapa === 2 ? validarEtapa2() : null;
    if (erro) { toast.error(erro); return; }
    if (f.obra_mesmo_endereco && etapa === 1) {
      set({
        obra_cep: f.cep, obra_rua: f.rua, obra_numero: f.numero,
        obra_bairro: f.bairro, obra_cidade: f.cidade, obra_estado: f.estado,
      });
    }
    setEtapa((s) => (s === 3 ? 3 : ((s + 1) as 1 | 2 | 3)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const voltar = () => {
    setEtapa((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enviar = async () => {
    if (!confirmou) { toast.error("Confirme a veracidade das informações"); return; }
    setEnviando(true);
    // MAPEAMENTO CANÔNICO: somente colunas que existem em public.contratos
    const payload = {
      prospect_tipo_pessoa: f.tipo_pessoa,
      prospect_nome: f.nome,
      prospect_cpf_cnpj: f.cpf_cnpj,
      prospect_rg: f.rg,
      prospect_nacionalidade: f.nacionalidade,
      prospect_estado_civil: f.estado_civil,
      prospect_profissao: f.profissao,
      prospect_email: f.email,
      prospect_telefone: f.telefone,
      prospect_whatsapp: f.whatsapp || f.telefone,
      prospect_cep: f.cep,
      prospect_rua: f.rua,
      prospect_numero: f.numero,
      prospect_bairro: f.bairro,
      prospect_cidade: f.cidade,
      prospect_estado: f.estado,
      prospect_conjuge_nome: f.conjuge_nome,
      prospect_conjuge_cpf: f.conjuge_cpf,
      prospect_conjuge_rg: f.conjuge_rg,
      prospect_conjuge_email: f.conjuge_email,
      prospect_conjuge_telefone: f.conjuge_telefone,
      prospect_conjuge_profissao: f.conjuge_profissao,
      prospect_conjuge_nacionalidade: f.conjuge_nacionalidade,
      prospect_obra_cep: f.obra_cep,
      prospect_obra_rua: f.obra_rua,
      prospect_obra_numero: f.obra_numero,
      prospect_obra_bairro: f.obra_bairro,
      prospect_obra_cidade: f.obra_cidade,
      prospect_obra_estado: f.obra_estado,
      prospect_tamanho_terreno: f.tamanho_terreno || null,
      prospect_tipo_terreno: f.tipo_terreno,
      prospect_area_construir: f.area_construir || null,
      prospect_tipo_obra: f.tipo_obra,
      prospect_sistema_preferido: f.sistema,
      prospect_servico_preferido: f.servico,
      prospect_camera_preferida: f.plano_camera,
      prospect_prazo_desejado: f.prazo_desejado,
      prospect_observacoes: f.observacoes,
      prospect_ja_possui_projeto: f.ja_possui_projeto,
      prospect_quer_projeto: f.quer_projeto,
    };
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const parceiroIndicadorId =
      parceiroSlug && UUID_RE.test(parceiroSlug.trim()) ? parceiroSlug.trim() : null;
    const parceiroSlugLimpo =
      parceiroSlug && parceiroSlug.trim() !== "" && !UUID_RE.test(parceiroSlug.trim())
        ? parceiroSlug.trim()
        : null;
    const dados = {
      ...payload,
      parceiro_indicador_id: parceiroIndicadorId,
    };
    const { data, error } = await fmSupabase.rpc("criar_contrato_publico", {
      dados,
      p_dados: dados,
      p_parceiro_slug: parceiroSlugLimpo,
    });
    setEnviando(false);
    if (error || !data) { toast.error("Erro ao enviar: " + (error?.message || "tente novamente")); return; }
    const d = data as { numero: string; token: string };
    toast.success("Solicitação enviada com sucesso!");
    setSucesso({ numero: d.numero, token: d.token });
  };

  if (sucesso) return <TelaSucesso numero={sucesso.numero} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold" style={{ color: COR_AZUL }}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
          <h1 className="text-lg font-bold" style={{ color: COR_AZUL }}>Quero Construir</h1>
          <span className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <Stepper etapa={etapa} />

        {etapa === 1 && (
          <Etapa1 f={f} set={set} temConjuge={temConjuge} buscarCep={buscarCepResidencial} />
        )}
        {etapa === 2 && (
          <Etapa2 f={f} set={set} buscarCep={buscarCepObra} preencherDoResid={() => set({
            obra_mesmo_endereco: !f.obra_mesmo_endereco,
            obra_cep: !f.obra_mesmo_endereco ? f.cep : f.obra_cep,
            obra_rua: !f.obra_mesmo_endereco ? f.rua : f.obra_rua,
            obra_numero: !f.obra_mesmo_endereco ? f.numero : f.obra_numero,
            obra_bairro: !f.obra_mesmo_endereco ? f.bairro : f.obra_bairro,
            obra_cidade: !f.obra_mesmo_endereco ? f.cidade : f.obra_cidade,
            obra_estado: !f.obra_mesmo_endereco ? f.estado : f.obra_estado,
          })} />
        )}
        {etapa === 3 && (
          <Etapa3 f={f} confirmou={confirmou} setConfirmou={setConfirmou} />
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {etapa > 1 ? (
            <Button variant="outline" onClick={voltar}><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Button>
          ) : <span />}
          {etapa < 3 ? (
            <Button onClick={avancar} style={{ backgroundColor: COR_AZUL }} className="text-white">
              Próximo <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={enviar} disabled={enviando} style={{ backgroundColor: COR_AZUL }} className="text-white" size="lg">
              {enviando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              ENVIAR SOLICITAÇÃO
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Stepper({ etapa }: { etapa: 1 | 2 | 3 }) {
  const passos = [
    { n: 1, t: "Dados Pessoais" },
    { n: 2, t: "Dados da Obra" },
    { n: 3, t: "Confirmação" },
  ];
  return (
    <ol className="flex items-center justify-between gap-2">
      {passos.map((p, i) => {
        const ativo = etapa === p.n;
        const feito = etapa > p.n;
        const cor = feito ? "#06A77D" : ativo ? COR_AZUL : "#cbd5e1";
        return (
          <li key={p.n} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: cor }}
              >
                {feito ? <Check className="h-4 w-4" /> : p.n}
              </span>
              <span className="hidden text-sm font-semibold sm:inline" style={{ color: ativo || feito ? COR_AZUL : "#94a3b8" }}>
                {p.t}
              </span>
            </div>
            {i < passos.length - 1 && <div className="h-0.5 flex-1" style={{ backgroundColor: cor }} />}
          </li>
        );
      })}
    </ol>
  );
}

function Etapa1({
  f, set, temConjuge, buscarCep,
}: {
  f: Form; set: (p: Partial<Form>) => void; temConjuge: boolean; buscarCep: (cep: string) => void;
}) {
  return (
    <Card titulo="Etapa 1 — Dados Pessoais">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={f.tipo_pessoa === "PF"} onChange={() => set({ tipo_pessoa: "PF" })} />
          Pessoa Física
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={f.tipo_pessoa === "PJ"} onChange={() => set({ tipo_pessoa: "PJ" })} />
          Pessoa Jurídica
        </label>
      </div>

      <Grid>
        <Field label={f.tipo_pessoa === "PF" ? "Nome completo *" : "Razão Social *"}>
          <Input value={f.nome} onChange={(e) => set({ nome: e.target.value })} />
        </Field>
        <Field label={f.tipo_pessoa === "PF" ? "CPF *" : "CNPJ *"}>
          <Input value={f.cpf_cnpj} onChange={(e) => set({ cpf_cnpj: maskCpfCnpj(e.target.value, f.tipo_pessoa) })} />
        </Field>
        {f.tipo_pessoa === "PF" && (
          <Field label="RG"><Input value={f.rg} onChange={(e) => set({ rg: e.target.value })} /></Field>
        )}
        <Field label="Nacionalidade">
          <Input value={f.nacionalidade} onChange={(e) => set({ nacionalidade: e.target.value })} />
        </Field>
        <Field label="Estado civil *">
          <Select value={f.estado_civil} onValueChange={(v) => set({ estado_civil: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {["Solteiro", "Casado", "Divorciado", "Viúvo", "União Estável"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Profissão"><Input value={f.profissao} onChange={(e) => set({ profissao: e.target.value })} /></Field>
        <Field label="E-mail *"><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Telefone *"><Input value={f.telefone} onChange={(e) => set({ telefone: maskPhone(e.target.value) })} /></Field>
        <Field label="WhatsApp"><Input value={f.whatsapp} onChange={(e) => set({ whatsapp: maskPhone(e.target.value) })} placeholder="Se diferente do telefone" /></Field>
      </Grid>

      <h3 className="mt-4 text-sm font-semibold text-slate-700">Endereço residencial</h3>
      <Grid>
        <Field label="CEP">
          <Input value={f.cep} onChange={(e) => {
            const v = maskCep(e.target.value); set({ cep: v });
            if (onlyDigits(v).length === 8) buscarCep(v);
          }} />
        </Field>
        <Field label="Rua"><Input value={f.rua} onChange={(e) => set({ rua: e.target.value })} /></Field>
        <Field label="Número"><Input value={f.numero} onChange={(e) => set({ numero: e.target.value })} /></Field>
        <Field label="Bairro"><Input value={f.bairro} onChange={(e) => set({ bairro: e.target.value })} /></Field>
        <Field label="Cidade"><Input value={f.cidade} onChange={(e) => set({ cidade: e.target.value })} /></Field>
        <Field label="Estado"><Input maxLength={2} value={f.estado} onChange={(e) => set({ estado: e.target.value.toUpperCase() })} /></Field>
      </Grid>

      {temConjuge && (
        <div className="mt-6 rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-900">Dados do(a) cônjuge / companheiro(a)</h3>
          <Grid>
            <Field label="Nome completo"><Input value={f.conjuge_nome} onChange={(e) => set({ conjuge_nome: e.target.value })} /></Field>
            <Field label="CPF"><Input value={f.conjuge_cpf} onChange={(e) => set({ conjuge_cpf: maskCpf(e.target.value) })} /></Field>
            <Field label="RG"><Input value={f.conjuge_rg} onChange={(e) => set({ conjuge_rg: e.target.value })} /></Field>
            <Field label="E-mail"><Input type="email" value={f.conjuge_email} onChange={(e) => set({ conjuge_email: e.target.value })} /></Field>
            <Field label="Telefone"><Input value={f.conjuge_telefone} onChange={(e) => set({ conjuge_telefone: maskPhone(e.target.value) })} /></Field>
            <Field label="Profissão"><Input value={f.conjuge_profissao} onChange={(e) => set({ conjuge_profissao: e.target.value })} /></Field>
            <Field label="Nacionalidade"><Input value={f.conjuge_nacionalidade} onChange={(e) => set({ conjuge_nacionalidade: e.target.value })} /></Field>
          </Grid>
        </div>
      )}
    </Card>
  );
}

const SISTEMAS = [
  { v: "IBPP", t: "Inova Blocos IBPP", d: "46% mais rápido, 20% mais econômico" },
  { v: "Alvenaria", t: "Alvenaria Convencional", d: "Tijolo cerâmico tradicional" },
  { v: "ICF", t: "ICF — Concreto com EPS", d: "Alta performance térmica e acústica" },
  { v: "Não sei", t: "Não sei ainda", d: "Quero orientação da F&M" },
];
const SERVICOS = [
  { v: "F&M TOTAL", t: "F&M TOTAL", d: "Material + mão de obra — F&M cuida de tudo" },
  { v: "F&M GESTÃO", t: "F&M GESTÃO", d: "Você deposita, F&M compra e gerencia" },
  { v: "F&M ESSENCIAL", t: "F&M ESSENCIAL", d: "Você compra material, F&M executa" },
  { v: "Só Gestão", t: "Só Gestão", d: "F&M apenas gerencia sua obra" },
];
const TERRENOS = ["Plano", "Declive", "Aclive", "Irregular", "Outro"];

function Etapa2({
  f, set, buscarCep, preencherDoResid,
}: {
  f: Form; set: (p: Partial<Form>) => void; buscarCep: (cep: string) => void; preencherDoResid: () => void;
}) {
  const toggleTipo = (t: string) => {
    const arr = f.tipo_obra.includes(t) ? f.tipo_obra.filter((x) => x !== t) : [...f.tipo_obra, t];
    set({ tipo_obra: arr });
  };
  return (
    <Card titulo="Etapa 2 — Dados da Obra">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={f.obra_mesmo_endereco} onCheckedChange={() => preencherDoResid()} />
        Mesmo endereço residencial
      </label>

      <Grid>
        <Field label="CEP da obra">
          <Input value={f.obra_cep} onChange={(e) => {
            const v = maskCep(e.target.value); set({ obra_cep: v });
            if (onlyDigits(v).length === 8) buscarCep(v);
          }} />
        </Field>
        <Field label="Rua"><Input value={f.obra_rua} onChange={(e) => set({ obra_rua: e.target.value })} /></Field>
        <Field label="Número"><Input value={f.obra_numero} onChange={(e) => set({ obra_numero: e.target.value })} /></Field>
        <Field label="Bairro"><Input value={f.obra_bairro} onChange={(e) => set({ obra_bairro: e.target.value })} /></Field>
        <Field label="Cidade"><Input value={f.obra_cidade} onChange={(e) => set({ obra_cidade: e.target.value })} /></Field>
        <Field label="Estado"><Input maxLength={2} value={f.obra_estado} onChange={(e) => set({ obra_estado: e.target.value.toUpperCase() })} /></Field>
      </Grid>

      <Grid>
        <Field label="Tamanho do terreno (m²)">
          <Input type="number" value={f.tamanho_terreno} onChange={(e) => set({ tamanho_terreno: e.target.value })} />
        </Field>
        <Field label="Área a construir/reformar (m²) *">
          <Input type="number" value={f.area_construir} onChange={(e) => set({ area_construir: e.target.value })} />
        </Field>
      </Grid>

      <Field label="Tipo de terreno">
        <RadioGroup value={f.tipo_terreno} onValueChange={(v) => set({ tipo_terreno: v })} className="flex flex-wrap gap-3">
          {TERRENOS.map((t) => (
            <label key={t} className="flex items-center gap-1 text-sm"><RadioGroupItem value={t} /> {t}</label>
          ))}
        </RadioGroup>
      </Field>

      <Field label="Tipo de obra *">
        <div className="flex flex-wrap gap-4">
          {["Construção", "Reforma", "Ampliação", "Casa", "Galpão", "Prédio", "Village", "Outro"].map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <Checkbox checked={f.tipo_obra.includes(t)} onCheckedChange={() => toggleTipo(t)} />
              {t}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Sistema construtivo *">
        <div className="grid gap-2 md:grid-cols-2">
          {SISTEMAS.map((s) => (
            <label key={s.v} className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${f.sistema === s.v ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
              <input type="radio" checked={f.sistema === s.v} onChange={() => set({ sistema: s.v })} />
              <div><div className="font-semibold">{s.t}</div><div className="text-xs text-slate-500">{s.d}</div></div>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Tipo de serviço *">
        <div className="grid gap-2 md:grid-cols-2">
          {SERVICOS.map((s) => (
            <label key={s.v} className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${f.servico === s.v ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
              <input type="radio" checked={f.servico === s.v} onChange={() => set({ servico: s.v })} />
              <div>
                <div className="font-semibold">{s.t}</div>
                <div className="text-xs text-slate-500">{s.d}</div>
              </div>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Câmera ao vivo">
        <RadioGroup value={f.plano_camera} onValueChange={(v) => set({ plano_camera: v })} className="space-y-2">
          {(Object.keys(PLANOS_CAMERA) as (keyof typeof PLANOS_CAMERA)[]).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm"><RadioGroupItem value={k} /> {PLANOS_CAMERA[k].label}</label>
          ))}
        </RadioGroup>
      </Field>

      <Grid>
        <Field label="Prazo desejado para início"><Input value={f.prazo_desejado} onChange={(e) => set({ prazo_desejado: e.target.value })} placeholder="Ex: em 30 dias" /></Field>
      </Grid>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={f.ja_possui_projeto} onCheckedChange={(v) => set({ ja_possui_projeto: Boolean(v) })} />
          Já possui projeto arquitetônico
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={f.quer_projeto} onCheckedChange={(v) => set({ quer_projeto: Boolean(v) })} />
          Quero que a F&M elabore o projeto
        </label>
      </div>
      <Field label="Observações adicionais">
        <Textarea value={f.observacoes} onChange={(e) => set({ observacoes: e.target.value })} rows={3} />
      </Field>
    </Card>
  );
}

function Etapa3({
  f, confirmou, setConfirmou,
}: { f: Form; confirmou: boolean; setConfirmou: (v: boolean) => void }) {
  const tipos = f.tipo_obra.join(", ") || "—";

  return (
    <Card titulo="Etapa 3 — Confirmação">
      <Resumo titulo="Dados Pessoais">
        <Linha k="Tipo" v={f.tipo_pessoa === "PF" ? "Pessoa Física" : "Pessoa Jurídica"} />
        <Linha k={f.tipo_pessoa === "PF" ? "Nome" : "Razão Social"} v={f.nome} />
        <Linha k={f.tipo_pessoa === "PF" ? "CPF" : "CNPJ"} v={f.cpf_cnpj} />
        <Linha k="E-mail" v={f.email} />
        <Linha k="Telefone" v={f.telefone} />
        <Linha k="WhatsApp" v={f.whatsapp || f.telefone} />
        <Linha k="Estado civil" v={f.estado_civil} />
        <Linha k="Endereço" v={`${f.rua}, ${f.numero} — ${f.bairro}, ${f.cidade}/${f.estado}`} />
      </Resumo>
      {(f.conjuge_nome || f.conjuge_cpf) && (
        <Resumo titulo="Cônjuge">
          <Linha k="Nome" v={f.conjuge_nome} />
          <Linha k="CPF" v={f.conjuge_cpf} />
        </Resumo>
      )}
      <Resumo titulo="Dados da Obra">
        <Linha k="Endereço" v={`${f.obra_rua}, ${f.obra_numero} — ${f.obra_bairro}, ${f.obra_cidade}/${f.obra_estado}`} />
        <Linha k="Tamanho terreno" v={f.tamanho_terreno ? `${f.tamanho_terreno} m²` : "—"} />
        <Linha k="Tipo terreno" v={f.tipo_terreno || "—"} />
        <Linha k="Área a construir" v={`${f.area_construir} m²`} />
        <Linha k="Tipo de obra" v={tipos} />
        <Linha k="Sistema" v={f.sistema} />
        <Linha k="Serviço" v={f.servico} />
        <Linha k="Câmera" v={PLANOS_CAMERA[f.plano_camera as keyof typeof PLANOS_CAMERA]?.label || "—"} />
        {f.prazo_desejado && <Linha k="Prazo desejado" v={f.prazo_desejado} />}
        {f.observacoes && <Linha k="Observações" v={f.observacoes} />}
      </Resumo>

      <label className="mt-4 flex items-start gap-2 rounded-md border p-3 text-sm">
        <Checkbox checked={confirmou} onCheckedChange={(v) => setConfirmou(Boolean(v))} />
        <span>Confirmo que as informações são verdadeiras e autorizo a F&M Smart Build a entrar em contato.</span>
      </label>
    </Card>
  );
}

function TelaSucesso({ numero }: { numero: string }) {
  const copiar = async () => {
    try { await navigator.clipboard.writeText(numero); toast.success("Protocolo copiado"); }
    catch { /* noop */ }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md space-y-5 rounded-2xl bg-white p-8 text-center shadow-lg">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="text-2xl font-bold" style={{ color: COR_AZUL }}>Solicitação enviada!</h1>
        <p className="text-slate-600">Em até 24h a equipe F&M entrará em contato para validar os dados e gerar seu contrato.</p>
        <div className="rounded-md border-2 border-dashed p-4">
          <div className="text-xs uppercase text-slate-500">Protocolo</div>
          <div className="mt-1 text-2xl font-bold tracking-wide" style={{ color: COR_AZUL }}>{numero}</div>
          <Button variant="outline" size="sm" className="mt-2" onClick={copiar}>
            <Copy className="mr-1 h-3 w-3" /> Copiar
          </Button>
        </div>
        <Link to="/" className="inline-block text-sm font-semibold" style={{ color: COR_AZUL }}>Voltar ao site</Link>
      </div>
    </div>
  );
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-lg font-bold" style={{ color: COR_AZUL }}>{titulo}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-slate-700">{label}</Label>{children}</div>;
}
function Resumo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-slate-50 p-4">
      <h3 className="mb-2 text-sm font-bold" style={{ color: COR_AZUL }}>{titulo}</h3>
      <dl className="space-y-1 text-sm">{children}</dl>
    </div>
  );
}
function Linha({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 py-1 last:border-0">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-slate-800">{v || "—"}</dd>
    </div>
  );
}