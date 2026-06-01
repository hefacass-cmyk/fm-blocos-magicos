import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";

export const Route = createFileRoute("/cadastro-parceiro")({
  head: () => ({
    meta: [
      { title: "Seja um Parceiro F&M | F&M Construções Inteligentes" },
      {
        name: "description",
        content:
          "Cadastre-se como fornecedor, parceiro ou representante da F&M Construções Inteligentes.",
      },
    ],
  }),
  component: CadastroParceiroPage,
});

type FormState = {
  nome: string;
  empresa: string;
  segmento: "Fornecedor" | "Parceiro" | "Representante" | "";
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  mensagem: string;
};

const INITIAL: FormState = {
  nome: "",
  empresa: "",
  segmento: "",
  telefone: "",
  email: "",
  cidade: "",
  estado: "",
  mensagem: "",
};

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function CadastroParceiroPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.nome.trim() ||
      !form.empresa.trim() ||
      !form.segmento ||
      !form.telefone.trim() ||
      !form.email.trim() ||
      !form.cidade.trim() ||
      !form.estado.trim()
    ) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    const payload = {
      nome: form.nome.trim(),
      empresa: form.empresa.trim(),
      segmento: form.segmento,
      telefone: form.telefone.trim(),
      whatsapp: form.telefone.trim(),
      email: form.email.trim().toLowerCase(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase(),
      mensagem: form.mensagem.trim() || null,
      status: "pendente",
      created_at: new Date().toISOString(),
    };

    const { error: err } = await fmSupabase.from("parceiros").insert(payload);
    setLoading(false);

    if (err) {
      console.error("[cadastro-parceiro] erro:", err);
      setError(
        "Não foi possível enviar seu cadastro agora. Tente novamente em instantes.",
      );
      return;
    }

    setSuccess(true);
    setForm(INITIAL);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="px-4 py-5 text-white shadow-md"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium opacity-90 hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
          <div
            className="rounded-md px-3 py-1.5 text-base font-extrabold tracking-tight"
            style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
          >
            F&amp;M
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-10 pb-6 text-center">
        <h1
          className="text-3xl font-extrabold tracking-tight sm:text-4xl"
          style={{ color: BRAND_BLUE }}
        >
          Seja um Parceiro F&amp;M
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
          Preencha o formulário e nossa equipe entrará em contato em até 48 horas.
        </p>
        <div
          className="mx-auto mt-4 h-1 w-20 rounded-full"
          style={{ backgroundColor: BRAND_YELLOW }}
        />
      </section>

      {/* Form */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {success ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <h2 className="text-xl font-bold text-green-700">
                Cadastro enviado com sucesso!
              </h2>
              <p className="max-w-md text-sm text-green-700/90">
                Recebemos seus dados. Nossa equipe entrará em contato em até 48
                horas pelo WhatsApp ou e-mail informado.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                Enviar outro cadastro
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nome completo *">
                <input
                  required
                  type="text"
                  value={form.nome}
                  onChange={(e) => update("nome", e.target.value)}
                  className={inputClass}
                  placeholder="Seu nome"
                />
              </Field>

              <Field label="Empresa *">
                <input
                  required
                  type="text"
                  value={form.empresa}
                  onChange={(e) => update("empresa", e.target.value)}
                  className={inputClass}
                  placeholder="Razão social ou nome fantasia"
                />
              </Field>

              <Field label="Segmento *">
                <select
                  required
                  value={form.segmento}
                  onChange={(e) =>
                    update("segmento", e.target.value as FormState["segmento"])
                  }
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  <option value="Fornecedor">Fornecedor</option>
                  <option value="Parceiro">Parceiro</option>
                  <option value="Representante">Representante</option>
                </select>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Telefone / WhatsApp *">
                  <input
                    required
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => update("telefone", e.target.value)}
                    className={inputClass}
                    placeholder="(11) 99999-9999"
                  />
                </Field>
                <Field label="E-mail *">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={inputClass}
                    placeholder="voce@empresa.com"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
                <Field label="Cidade *">
                  <input
                    required
                    type="text"
                    value={form.cidade}
                    onChange={(e) => update("cidade", e.target.value)}
                    className={inputClass}
                    placeholder="Sua cidade"
                  />
                </Field>
                <Field label="Estado *">
                  <select
                    required
                    value={form.estado}
                    onChange={(e) => update("estado", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">UF</option>
                    {ESTADOS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Mensagem ou apresentação">
                <textarea
                  value={form.mensagem}
                  onChange={(e) => update("mensagem", e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Conte um pouco sobre sua empresa, produtos ou serviços..."
                />
              </Field>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Enviando...
                  </>
                ) : (
                  "Enviar Cadastro"
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                Ao enviar, você autoriza o contato da equipe F&amp;M Construções.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1A4D7A] focus:ring-2 focus:ring-[#1A4D7A]/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}