import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Send, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { fmSupabase } from "@/lib/fm-supabase";
import { FM_WHATSAPP } from "@/lib/fm-parceiro";

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

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(200),
  telefone: z.string().trim().min(8, "Telefone inválido").max(30),
  whatsapp: z.string().trim().min(8, "WhatsApp inválido").max(30),
  endereco: z.string().trim().min(3, "Informe o endereço da obra").max(300),
  tipos_obra: z.array(z.string()).min(1, "Selecione ao menos um tipo de obra"),
  area: z.string().trim().min(1, "Informe a área a construir").max(20),
  possui_projeto: z.enum(["sim", "nao"]),
  quer_projeto: z.boolean().optional(),
  observacoes: z.string().max(800).optional(),
});

function VamosConstruirPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);
  const [area, setArea] = useState("");
  const [possuiProjeto, setPossuiProjeto] = useState<"sim" | "nao">("nao");
  const [querProjeto, setQuerProjeto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  const toggleTipo = (t: string) =>
    setTipos((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      nome, email, telefone, whatsapp, endereco,
      tipos_obra: tipos, area, possui_projeto: possuiProjeto,
      quer_projeto: possuiProjeto === "nao" ? querProjeto : undefined,
      observacoes: obs,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setEnviando(true);
    try {
      let projeto_url: string | null = null;
      if (possuiProjeto === "sim" && arquivo) {
        const path = `vamos-construir/${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const up = await fmSupabase.storage.from("documentos").upload(path, arquivo, { upsert: false });
        if (!up.error) {
          const pub = fmSupabase.storage.from("documentos").getPublicUrl(path);
          projeto_url = pub.data.publicUrl;
        }
      }
      const mensagem = JSON.stringify({
        origem: "vamos-construir",
        endereco, tipos_obra: tipos, area_m2: area,
        possui_projeto: possuiProjeto,
        quer_orcar_projeto: possuiProjeto === "nao" ? querProjeto : null,
        projeto_url,
        whatsapp,
        observacoes: obs,
      });
      const { error } = await fmSupabase.from("leads_indicacao").insert({
        origem: "parceiro",
        nome_cliente: nome,
        email_cliente: email,
        telefone_cliente: telefone,
        mensagem,
      });
      if (error) throw error;
      setOk(true);
      toast.success("Recebemos seu pedido! Entraremos em contato.");
    } catch (err) {
      toast.error("Erro ao enviar: " + (err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const waMsg = encodeURIComponent(
    `Olá F&M! Sou ${nome || "[seu nome]"} e quero falar sobre construir ${tipos.join(", ") || "[tipo de obra]"} em ${endereco || "[endereço]"}.`,
  );

  if (ok) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Pedido enviado!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Nossa equipe vai analisar e entrar em contato em breve.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={`https://wa.me/${FM_WHATSAPP}?text=${waMsg}`}
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl flex items-center justify-between p-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <a
            href={`https://wa.me/${FM_WHATSAPP}`}
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
            <Field label="Nome completo *">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
            </Field>
            <Field label="E-mail *">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
            </Field>
            <Field label="Telefone *">
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} required maxLength={30} placeholder="(00) 0000-0000" />
            </Field>
            <Field label="WhatsApp *">
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required maxLength={30} placeholder="(00) 00000-0000" />
            </Field>
          </div>

          <Field label="Endereço da obra *">
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} required maxLength={300} placeholder="Rua, número, bairro, cidade/UF" />
          </Field>

          <div>
            <Label className="text-sm font-semibold">Tipo de obra * (selecione um ou mais)</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIPOS_OBRA.map((t) => (
                <label key={t} className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 cursor-pointer hover:bg-slate-100">
                  <Checkbox checked={tipos.includes(t)} onCheckedChange={() => toggleTipo(t)} />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <Field label="Área a ser construída (m²) *">
            <Input value={area} onChange={(e) => setArea(e.target.value)} required maxLength={20} placeholder="Ex: 180" />
          </Field>

          <div>
            <Label className="text-sm font-semibold">Já possui projeto arquitetônico? *</Label>
            <RadioGroup value={possuiProjeto} onValueChange={(v) => setPossuiProjeto(v as "sim" | "nao")} className="mt-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="sim" id="proj-sim" /> <span className="text-sm">Sim</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="nao" id="proj-nao" /> <span className="text-sm">Não</span>
              </label>
            </RadioGroup>

            {possuiProjeto === "sim" && (
              <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                <Label className="text-sm">Envie o projeto (PDF, DWG, imagem)</Label>
                <Input
                  type="file"
                  accept=".pdf,.dwg,.png,.jpg,.jpeg,.zip"
                  onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-slate-500">Opcional — você também pode enviar depois pelo WhatsApp.</p>
              </div>
            )}

            {possuiProjeto === "nao" && (
              <label className="mt-3 flex items-start gap-2 rounded-md border bg-amber-50 border-amber-200 p-3 cursor-pointer">
                <Checkbox checked={querProjeto} onCheckedChange={(v) => setQuerProjeto(Boolean(v))} className="mt-0.5" />
                <span className="text-sm text-slate-700">
                  Quero também orçar a <strong>elaboração do projeto</strong> com a F&M.
                </span>
              </label>
            )}
          </div>

          <Field label="Observações (opcional)">
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} maxLength={800} rows={3} placeholder="Algo importante que devemos saber?" />
          </Field>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/${FM_WHATSAPP}?text=${waMsg}`}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}