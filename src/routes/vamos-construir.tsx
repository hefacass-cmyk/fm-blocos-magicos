import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Send, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmSupabase } from "@/lib/fm-supabase";

const FM_WHATSAPP_NOTIFY = "5571999454343";

export const Route = createFileRoute("/vamos-construir")({
  head: () => ({
    meta: [
      { title: "Vamos Construir · F&M Construções Inteligentes" },
      { name: "description", content: "Conte sobre seu projeto e receba uma proposta personalizada da F&M." },
    ],
  }),
  component: VamosConstruirPage,
});

const TIPOS_OBRA = ["Casa", "Galpão", "Prédio", "Vilage / Condomínio", "Reforma / Ampliação", "Outro"] as const;
const TIPOS_IMOVEL = ["Residencial", "Comercial", "Industrial", "Misto", "Rural"] as const;
const SISTEMAS = ["Steel Frame", "Wood Frame", "Alvenaria Convencional", "Pré-moldado / Concreto", "Container", "Ainda não sei"] as const;

const phoneRegex = /^(\(?\d{2}\)?\s?)?(\d{4,5}-\d{4}|\d{8,9})$/;
const whatsappRegex = /^(\+?55\s?)?(\(?\d{2}\)?\s?)?9?\d{8,9}$/;

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(200),
  telefone: z.string().trim().min(8, "Telefone é obrigatório").max(30)
    .refine((v) => phoneRegex.test(v), { message: "Formato inválido. Ex: (71) 99999-9999" }),
  whatsapp: z.string().trim().min(8, "WhatsApp é obrigatório").max(30)
    .refine((v) => whatsappRegex.test(v), { message: "Formato inválido. Ex: (71) 99999-9999" }),
  rua: z.string().trim().min(3, "Informe a rua / logradouro").max(200),
  cidade: z.string().trim().min(2, "Informe a cidade").max(120),
  estado: z.string().trim().length(2, "Informe a UF com 2 letras"),
  tipo_imovel: z.string().min(1, "Selecione o tipo de imóvel"),
  tipo_obra: z.array(z.string()).min(1, "Selecione ao menos um tipo de obra"),
  area_m2: z.string().trim().min(1, "Informe a área a ser construída").max(20),
  projeto_arquitetonico: z.boolean(),
  sistema_interesse: z.string().min(1, "Selecione um sistema construtivo"),
  observacoes: z.string().max(800).optional(),
});

function VamosConstruirPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rua, setRua] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [tipoImovel, setTipoImovel] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);
  const [area, setArea] = useState("");
  const [projetoArq, setProjetoArq] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [sistema, setSistema] = useState("");
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;
    (async () => {
      const { data } = await fmSupabase.from("parceiros").select("id").eq("slug", ref).maybeSingle();
      if (data?.id) setParceiroId(String(data.id));
    })();
  }, []);

  const toggleTipo = (t: string) =>
    setTipos((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));

  const clearError = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      nome, email, telefone, whatsapp,
      rua, cidade, estado: estado.toUpperCase(),
      tipo_imovel: tipoImovel, tipo_obra: tipos, area_m2: area,
      projeto_arquitetonico: projetoArq,
      sistema_interesse: sistema,
      observacoes: obs,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      const firstMsg = parsed.error.issues[0]?.message ?? "Corrija os campos destacados";
      toast.error(firstMsg);
      return;
    }
    setErrors({});
    setEnviando(true);
    try {
      let projeto_url: string | null = null;
      if (projetoArq && arquivo) {
        const path = `vamos-construir/${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const up = await fmSupabase.storage.from("documentos").upload(path, arquivo, { upsert: false });
        if (!up.error) {
          const pub = fmSupabase.storage.from("documentos").getPublicUrl(path);
          projeto_url = pub.data.publicUrl;
        }
      }
      const areaNum = Number(String(area).replace(",", ".").replace(/[^\d.]/g, "")) || null;
      const payload: Record<string, unknown> = {
        origem: "site",
        convertido: false,
        nome, email, telefone, whatsapp,
        rua, cidade, estado: estado.toUpperCase(),
        tipo_imovel: tipoImovel,
        tipo_obra: tipos,
        area_m2: areaNum,
        projeto_arquitetonico: projetoArq,
        sistema_interesse: sistema,
        observacoes: [obs, projeto_url ? `Projeto: ${projeto_url}` : null].filter(Boolean).join("\n"),
        // compat com colunas antigas
        nome_cliente: nome,
        email_cliente: email,
        telefone_cliente: telefone,
        mensagem: obs || null,
      };
      if (parceiroId) payload.parceiro_id = parceiroId;
      const { error } = await fmSupabase.from("leads_indicacao").insert(payload);
      if (error) throw error;

      const waText = encodeURIComponent(
        `📋 *Novo pedido de construção!*\n\n` +
        `👤 ${nome}\n` +
        `📱 ${whatsapp}\n` +
        `🏠 ${tipoImovel} — ${area}m²\n` +
        `⚙️ Sistema: ${sistema}\n` +
        `📍 ${cidade}/${estado.toUpperCase()}`
      );
      window.open(`https://wa.me/${FM_WHATSAPP_NOTIFY}?text=${waText}`, "_blank");

      setOk(true);
      toast.success("✅ Pedido enviado! Em até 24h entraremos em contato.");
    } catch (err) {
      toast.error("Erro ao enviar: " + (err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const waMsg = encodeURIComponent(
    `Olá F&M! Sou ${nome || "[seu nome]"} e quero falar sobre construir ${tipos.join(", ") || "[tipo de obra]"} em ${cidade || "[cidade]"}.`,
  );

  if (ok) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">✅ Pedido enviado!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Em até 24h entraremos em contato.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={`https://wa.me/${FM_WHATSAPP_NOTIFY}?text=${waMsg}`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition"
            >
              <MessageCircle className="h-4 w-4" /> Falar agora no WhatsApp
            </a>
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">Voltar ao início</Link>
          </div>
        </div>
      </div>
    );
  }

  const inputError = (field: string) =>
    errors[field] ? "border-red-500 focus-visible:ring-red-500" : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl flex items-center justify-between p-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <a
            href={`https://wa.me/${FM_WHATSAPP_NOTIFY}`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp F&M
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Vamos Construir</h1>
          <p className="mt-2 text-sm text-slate-600">
            Conte um pouco sobre seu projeto. Vamos analisar e retornar com uma proposta.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 bg-white border rounded-2xl p-6 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome completo *" error={errors.nome}>
              <Input value={nome} onChange={(e) => { setNome(e.target.value); clearError("nome"); }} required maxLength={120} className={inputError("nome")} />
            </Field>
            <Field label="E-mail *" error={errors.email}>
              <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} required maxLength={200} className={inputError("email")} />
            </Field>
            <Field label="Telefone *" error={errors.telefone}>
              <Input value={telefone} onChange={(e) => { setTelefone(e.target.value); clearError("telefone"); }} required maxLength={30} placeholder="(00) 0000-0000" className={inputError("telefone")} />
            </Field>
            <Field label="WhatsApp *" error={errors.whatsapp}>
              <Input value={whatsapp} onChange={(e) => { setWhatsapp(e.target.value); clearError("whatsapp"); }} required maxLength={30} placeholder="(00) 00000-0000" className={inputError("whatsapp")} />
            </Field>
          </div>

          <Field label="Rua / Logradouro *" error={errors.rua}>
            <Input value={rua} onChange={(e) => { setRua(e.target.value); clearError("rua"); }} required maxLength={200} placeholder="Rua, número, bairro" className={inputError("rua")} />
          </Field>
          <div className="grid sm:grid-cols-[1fr_120px] gap-4">
            <Field label="Cidade *" error={errors.cidade}>
              <Input value={cidade} onChange={(e) => { setCidade(e.target.value); clearError("cidade"); }} required maxLength={120} className={inputError("cidade")} />
            </Field>
            <Field label="Estado (UF) *" error={errors.estado}>
              <Input value={estado} onChange={(e) => { setEstado(e.target.value.toUpperCase().slice(0, 2)); clearError("estado"); }} required maxLength={2} placeholder="BA" className={inputError("estado")} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tipo de imóvel *" error={errors.tipo_imovel}>
              <Select value={tipoImovel} onValueChange={(v) => { setTipoImovel(v); clearError("tipo_imovel"); }}>
                <SelectTrigger className={inputError("tipo_imovel")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_IMOVEL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sistema construtivo de interesse *" error={errors.sistema_interesse}>
              <Select value={sistema} onValueChange={(v) => { setSistema(v); clearError("sistema_interesse"); }}>
                <SelectTrigger className={inputError("sistema_interesse")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {SISTEMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div>
            <Label className="text-sm font-semibold">Tipo de obra * (selecione um ou mais)</Label>
            <div className={`mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 ${errors.tipo_obra ? "border border-red-500 rounded-md p-1" : ""}`}>
              {TIPOS_OBRA.map((t) => (
                <label key={t} className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 cursor-pointer hover:bg-slate-100">
                  <Checkbox checked={tipos.includes(t)} onCheckedChange={() => { toggleTipo(t); clearError("tipo_obra"); }} />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </div>
            {errors.tipo_obra && <p className="mt-1 text-xs text-red-600">{errors.tipo_obra}</p>}
          </div>

          <Field label="Área a ser construída (m²) *" error={errors.area_m2}>
            <Input value={area} onChange={(e) => { setArea(e.target.value); clearError("area_m2"); }} required maxLength={20} placeholder="Ex: 180" className={inputError("area_m2")} />
          </Field>

          <div>
            <label className="flex items-start gap-2 rounded-md border bg-slate-50 p-3 cursor-pointer">
              <Checkbox checked={projetoArq} onCheckedChange={(v) => setProjetoArq(Boolean(v))} className="mt-0.5" />
              <span className="text-sm text-slate-700">Já possuo projeto arquitetônico</span>
            </label>
            {projetoArq && (
              <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                <Label className="text-sm">Envie o projeto (PDF, DWG, imagem) — opcional</Label>
                <Input
                  type="file"
                  accept=".pdf,.dwg,.png,.jpg,.jpeg,.zip"
                  onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          <Field label="Observações (opcional)">
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} maxLength={800} rows={3} placeholder="Algo importante que devemos saber?" />
          </Field>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/${FM_WHATSAPP_NOTIFY}?text=${waMsg}`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500 px-4 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
            <Button type="submit" disabled={enviando} className="flex-1">
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Enviar pedido</>}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
