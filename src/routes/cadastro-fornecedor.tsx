import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";

export const Route = createFileRoute("/cadastro-fornecedor")({
  head: () => ({
    meta: [
      { title: "Seja um Fornecedor F&M | F&M Construções Inteligentes" },
      {
        name: "description",
        content:
          "Cadastre sua empresa como fornecedora oficial da F&M Construções Inteligentes.",
      },
    ],
  }),
  component: CadastroFornecedorPage,
});

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

type FormState = {
  nome: string;
  empresa: string;
  segmento: string;
  email: string;
  telefone: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  ramo: string;
  descricao: string;
};

const INITIAL: FormState = {
  nome: "",
  empresa: "",
  segmento: "",
  email: "",
  telefone: "",
  whatsapp: "",
  cidade: "",
  estado: "",
  ramo: "",
  descricao: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-[#1A4D7A] focus:outline-none focus:ring-2 focus:ring-[#1A4D7A]/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function CadastroFornecedorPage() {
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
      !form.segmento.trim() ||
      !form.email.trim() ||
      !form.telefone.trim() ||
      !form.cidade.trim() ||
      !form.estado.trim() ||
      !form.ramo.trim()
    ) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        empresa: form.empresa.trim(),
        segmento: form.segmento.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.trim(),
        whatsapp: form.whatsapp.trim() || form.telefone.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
        ramo: form.ramo.trim(),
        descricao: form.descricao.trim() || null,
        status: "pendente",
        created_at: new Date().toISOString(),
      };
      const { error: errIns } = await fmSupabase
        .from("fornecedores")
        .insert(payload);
      if (errIns) throw errIns;
      setSuccess(true);
      setForm(INITIAL);
    } catch (err) {
      console.error("[cadastro-fornecedor] erro:", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Não foi possível enviar o cadastro agora.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-4 py-5 text-white shadow-md"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a
            href="https://www.fmsmartbuild.com.br"
            className="inline-flex items-center gap-2 text-sm font-medium opacity-90 hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </a>
          <div
            className="rounded-md px-3 py-1.5 text-base font-extrabold tracking-tight"
            style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
          >
            F&amp;M
          </div>
        </div>
      </header>

      <section className="px-4 pt-10 pb-6 text-center">
        <h1
          className="text-3xl font-extrabold tracking-tight sm:text-4xl"
          style={{ color: BRAND_BLUE }}
        >
          Seja um Fornecedor F&amp;M
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
          Cadastre sua empresa e entraremos em contato em até 48 horas.
        </p>
        <div
          className="mx-auto mt-4 h-1 w-20 rounded-full"
          style={{ backgroundColor: BRAND_YELLOW }}
        />
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {success ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <h2 className="text-xl font-bold text-green-700">
                Cadastro enviado com sucesso!
              </h2>
              <p className="max-w-md text-sm text-green-700/90">
                Recebemos seus dados. Nossa equipe entrará em contato em breve.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-2 inline-block rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                Enviar outro cadastro
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nome do responsável *">
                <input
                  required
                  type="text"
                  maxLength={100}
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
                  maxLength={120}
                  value={form.empresa}
                  onChange={(e) => update("empresa", e.target.value)}
                  className={inputClass}
                  placeholder="Razão social ou nome fantasia"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Segmento *">
                  <input
                    required
                    type="text"
                    maxLength={80}
                    value={form.segmento}
                    onChange={(e) => update("segmento", e.target.value)}
                    className={inputClass}
                    placeholder="Ex.: Materiais, Equipamentos"
                  />
                </Field>
                <Field label="Ramo *">
                  <input
                    required
                    type="text"
                    maxLength={80}
                    value={form.ramo}
                    onChange={(e) => update("ramo", e.target.value)}
                    className={inputClass}
                    placeholder="Ex.: Hidráulica, Elétrica"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="E-mail *">
                  <input
                    required
                    type="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={inputClass}
                    placeholder="empresa@dominio.com"
                  />
                </Field>
                <Field label="Telefone *">
                  <input
                    required
                    type="tel"
                    maxLength={20}
                    value={form.telefone}
                    onChange={(e) => update("telefone", e.target.value)}
                    className={inputClass}
                    placeholder="(11) 3000-0000"
                  />
                </Field>
              </div>

              <Field label="WhatsApp">
                <input
                  type="tel"
                  maxLength={20}
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  className={inputClass}
                  placeholder="(11) 99999-9999"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
                <Field label="Cidade *">
                  <input
                    required
                    type="text"
                    maxLength={80}
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

              <Field label="Descrição">
                <textarea
                  value={form.descricao}
                  maxLength={1000}
                  onChange={(e) => update("descricao", e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Conte um pouco sobre a empresa e os produtos/serviços."
                />
              </Field>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  "Enviar cadastro"
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}