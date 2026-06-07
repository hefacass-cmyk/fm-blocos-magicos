import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fmSupabase } from "@/lib/fm-supabase";

const FM_WA = "5571999454343";
const YELLOW = "#F4B941";

export const Route = createFileRoute("/contato-rapido")({
  head: () => ({
    meta: [
      { title: "Contato rápido · F&M Smart Build" },
      { name: "description", content: "Conte sobre sua obra. Em até 24h nossa equipe entra em contato." },
    ],
  }),
  component: ContatoRapidoPage,
});

const TIPOS = [
  "Casa residencial",
  "Sobrado / Duplex",
  "Prédio / Edifício",
  "Galpão / Comercial",
  "Village / Condomínio",
  "Reforma / Ampliação",
  "Outro",
] as const;

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(200),
  telefone: z.string().trim().min(8, "Telefone obrigatório").max(30),
  whatsapp: z.string().trim().max(30).optional(),
  cidade: z.string().trim().min(2, "Informe a cidade").max(120),
  terreno: z.string().trim().max(20).optional(),
  tipos: z.array(z.string()).min(1, "Selecione ao menos um tipo de construção"),
});

function ContatoRapidoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [terreno, setTerreno] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  const toggleTipo = (t: string) =>
    setTipos((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ nome, email, telefone, whatsapp, cidade, terreno, tipos });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setEnviando(true);
    try {
      const waFinal = whatsapp.trim() || telefone.trim();
      const tiposStr = tipos.join(", ");
      const obs = [
        terreno ? `Tamanho terreno: ${terreno} m²` : null,
        `Tipos: ${tiposStr}`,
      ].filter(Boolean).join("\n");

      const payload: Record<string, unknown> = {
        origem: "site",
        convertido: false,
        nome, email, telefone, whatsapp: waFinal,
        cidade,
        tipo_imovel: tipos[0] ?? null,
        tipo_obra: tipos,
        observacoes: obs,
        nome_cliente: nome,
        email_cliente: email,
        telefone_cliente: telefone,
        mensagem: obs,
      };
      const { error } = await fmSupabase.from("leads_indicacao").insert(payload);
      if (error) throw error;

      const waText = encodeURIComponent(
        `📱 Novo contato recebido!\n` +
        `Nome: ${nome}\n` +
        `Tel: ${telefone}\n` +
        `Local: ${cidade}\n` +
        `Tipo: ${tiposStr}`
      );
      window.open(`https://wa.me/${FM_WA}?text=${waText}`, "_blank");

      setOk(true);
    } catch (err) {
      toast.error("Erro ao enviar: " + (err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (ok) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">✅ Recebemos seu contato!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Em até 24h nossa equipe entrará em contato.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm text-slate-500 hover:text-slate-900">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-2xl flex items-center justify-between p-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-base font-bold text-slate-900">Fale com a F&M</h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">Vamos construir juntos</h2>
          <p className="mt-1 text-sm text-slate-600">Preencha e em até 24h entramos em contato.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 bg-white border rounded-2xl p-6 shadow-sm">
          <div>
            <Label>Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} required maxLength={30} placeholder="(71) 99999-9999" />
            </div>
          </div>
          <div>
            <Label>WhatsApp (se diferente do telefone)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={30} placeholder="(71) 99999-9999" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Local da construção / Cidade *</Label>
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} required maxLength={120} />
            </div>
            <div>
              <Label>Tamanho do terreno (m²)</Label>
              <Input value={terreno} onChange={(e) => setTerreno(e.target.value)} maxLength={20} inputMode="numeric" />
            </div>
          </div>
          <div>
            <Label>Tipo de construção (marque uma ou mais) *</Label>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {TIPOS.map((t) => (
                <label key={t} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-slate-50">
                  <Checkbox checked={tipos.includes(t)} onCheckedChange={() => toggleTipo(t)} />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            disabled={enviando}
            className="w-full text-slate-900 font-bold hover:brightness-95"
            style={{ backgroundColor: YELLOW }}
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> ENVIAR</>}
          </Button>
        </form>
      </main>
    </div>
  );
}