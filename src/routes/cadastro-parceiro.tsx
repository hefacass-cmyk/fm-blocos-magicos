import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  X,
  ImagePlus,
  Quote,
  Building2,
} from "lucide-react";
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

const MAX_FOTOS_POR_OBRA = 4;
const FOTOS_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";
const FOTOS_BUCKET = "fotos-obras";
const MAX_WIDTH = 1280;
const TARGET_BYTES = 300 * 1024; // 300KB
const QUALITY_PRIMARY = 0.75;
const QUALITY_FALLBACK = 0.6;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", quality);
  });
}

async function compressImage(file: File): Promise<File> {
  try {
    const img = await loadImage(file);
    const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    let blob = await canvasToBlob(canvas, QUALITY_PRIMARY);
    if (blob && blob.size > TARGET_BYTES) {
      const fallback = await canvasToBlob(canvas, QUALITY_FALLBACK);
      if (fallback) blob = fallback;
    }
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (e) {
    console.error("[cadastro-parceiro] falha ao comprimir imagem:", e);
    return file;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type ObraDraft = {
  key: string;
  descricao: string;
  fotos: File[];
};

type FeedbackDraft = {
  key: string;
  depoimento: string;
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente: string;
};

const newObra = (): ObraDraft => ({
  key: crypto.randomUUID(),
  descricao: "",
  fotos: [],
});

const newFeedback = (): FeedbackDraft => ({
  key: crypto.randomUUID(),
  depoimento: "",
  nomeCliente: "",
  emailCliente: "",
  telefoneCliente: "",
});

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

function CadastroParceiroPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [obras, setObras] = useState<ObraDraft[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ----- Obras helpers -----
  const addObra = () => setObras((arr) => [...arr, newObra()]);
  const removeObra = (key: string) =>
    setObras((arr) => arr.filter((o) => o.key !== key));
  const updateObra = (key: string, patch: Partial<ObraDraft>) =>
    setObras((arr) => arr.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  const addFotos = async (key: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const current = obras.find((o) => o.key === key);
    if (!current) return;
    const remaining = MAX_FOTOS_POR_OBRA - current.fotos.length;
    if (remaining <= 0) return;
    const accepted = Array.from(files)
      .filter((f) => /image\/(jpe?g|png|webp)/i.test(f.type))
      .slice(0, remaining);
    if (accepted.length === 0) return;

    const compressed = await Promise.all(accepted.map((f) => compressImage(f)));
    setObras((arr) =>
      arr.map((o) =>
        o.key === key
          ? {
              ...o,
              fotos: [...o.fotos, ...compressed].slice(0, MAX_FOTOS_POR_OBRA),
            }
          : o,
      ),
    );
  };
  const removeFoto = (key: string, idx: number) =>
    setObras((arr) =>
      arr.map((o) =>
        o.key === key ? { ...o, fotos: o.fotos.filter((_, i) => i !== idx) } : o,
      ),
    );

  // ----- Feedbacks helpers -----
  const addFeedback = () => setFeedbacks((arr) => [...arr, newFeedback()]);
  const removeFeedback = (key: string) =>
    setFeedbacks((arr) => arr.filter((f) => f.key !== key));
  const updateFeedback = (key: string, patch: Partial<FeedbackDraft>) =>
    setFeedbacks((arr) =>
      arr.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    );

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

    for (const fb of feedbacks) {
      if (!fb.depoimento.trim() || !fb.nomeCliente.trim()) {
        setError("Em cada depoimento, preencha o texto e o nome do cliente.");
        return;
      }
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

    try {
      // 1) Parceiro
      const { data: parceiroRow, error: errParceiro } = await fmSupabase
        .from("parceiros")
        .insert(payload)
        .select("id")
        .single();
      if (errParceiro || !parceiroRow) throw errParceiro ?? new Error("Falha ao salvar parceiro.");
      const parceiroId = (parceiroRow as { id: string | number }).id;

      // 2) Obras + fotos
      for (const obra of obras) {
        const { data: obraRow, error: errObra } = await fmSupabase
          .from("obras_parceiro")
          .insert({
            parceiro_id: parceiroId,
            descricao: obra.descricao.trim() || null,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (errObra || !obraRow) throw errObra ?? new Error("Falha ao salvar obra.");
        const obraId = (obraRow as { id: string | number }).id;

        for (const file of obra.fotos) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
          const path = `${parceiroId}/${obraId}/${Date.now()}-${slugify(
            file.name.replace(/\.[^.]+$/, ""),
          )}.${ext}`;
          const { error: errUp } = await fmSupabase.storage
            .from(FOTOS_BUCKET)
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || "image/webp",
            });
          if (errUp) throw errUp;
          const { data: pub } = fmSupabase.storage
            .from(FOTOS_BUCKET)
            .getPublicUrl(path);
          const { error: errFoto } = await fmSupabase
            .from("fotos_obra")
            .insert({
              obra_id: obraId,
              parceiro_id: parceiroId,
              url: pub.publicUrl,
              path,
              created_at: new Date().toISOString(),
            });
          if (errFoto) throw errFoto;
        }
      }

      // 3) Feedbacks
      if (feedbacks.length > 0) {
        const rows = feedbacks.map((f) => ({
          parceiro_id: parceiroId,
          depoimento: f.depoimento.trim(),
          nome_cliente: f.nomeCliente.trim(),
          email_cliente: f.emailCliente.trim() || null,
          telefone_cliente: f.telefoneCliente.trim() || null,
          created_at: new Date().toISOString(),
        }));
        const { error: errFb } = await fmSupabase
          .from("feedbacks_parceiro")
          .insert(rows);
        if (errFb) throw errFb;
      }

      setSuccess(true);
      setForm(INITIAL);
      setObras([]);
      setFeedbacks([]);
    } catch (err) {
      console.error("[cadastro-parceiro] erro:", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Não foi possível enviar seu cadastro agora. Tente novamente em instantes.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

              {/* ===== Seção Obras ===== */}
              <SectionDivider icon={<Building2 className="h-5 w-5" />} title="Suas Obras" />
              <div className="space-y-3">
                {obras.map((obra, idx) => (
                  <ObraBlock
                    key={obra.key}
                    index={idx + 1}
                    obra={obra}
                    onChangeDescricao={(v) => updateObra(obra.key, { descricao: v })}
                    onAddFotos={(files) => addFotos(obra.key, files)}
                    onRemoveFoto={(i) => removeFoto(obra.key, i)}
                    onRemove={() => removeObra(obra.key)}
                  />
                ))}
                <button
                  type="button"
                  onClick={addObra}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-semibold transition hover:bg-slate-50"
                  style={{ borderColor: BRAND_YELLOW, color: BRAND_BLUE }}
                >
                  <Plus className="h-4 w-4" /> Adicionar Obra
                </button>
              </div>

              {/* ===== Seção Depoimentos ===== */}
              <SectionDivider icon={<Quote className="h-5 w-5" />} title="Depoimentos de Clientes" />
              <div className="space-y-3">
                {feedbacks.map((fb, idx) => (
                  <FeedbackBlock
                    key={fb.key}
                    index={idx + 1}
                    feedback={fb}
                    onChange={(patch) => updateFeedback(fb.key, patch)}
                    onRemove={() => removeFeedback(fb.key)}
                  />
                ))}
                <button
                  type="button"
                  onClick={addFeedback}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-semibold transition hover:bg-slate-50"
                  style={{ borderColor: BRAND_YELLOW, color: BRAND_BLUE }}
                >
                  <Plus className="h-4 w-4" /> Adicionar Depoimento
                </button>
              </div>

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

function SectionDivider({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="pt-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: BRAND_BLUE }}
        >
          {icon}
        </span>
        <h3 className="text-base font-bold" style={{ color: BRAND_BLUE }}>
          {title}
        </h3>
      </div>
      <div className="h-px w-full bg-slate-200" />
    </div>
  );
}

function ObraBlock({
  index,
  obra,
  onChangeDescricao,
  onAddFotos,
  onRemoveFoto,
  onRemove,
}: {
  index: number;
  obra: ObraDraft;
  onChangeDescricao: (v: string) => void;
  onAddFotos: (files: FileList | null) => void;
  onRemoveFoto: (i: number) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const restante = MAX_FOTOS_POR_OBRA - obra.fotos.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-sm font-bold"
          style={{ color: BRAND_BLUE }}
        >
          Obra #{index}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remover obra
        </button>
      </div>

      <Field label="Descrição da obra">
        <textarea
          rows={2}
          value={obra.descricao}
          onChange={(e) => onChangeDescricao(e.target.value)}
          className={inputClass}
          placeholder="Ex.: Reforma comercial 120m², acabamento premium..."
        />
      </Field>

      <div className="mt-3">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Fotos (até {MAX_FOTOS_POR_OBRA}) — {obra.fotos.length}/{MAX_FOTOS_POR_OBRA}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={FOTOS_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            onAddFotos(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={restante <= 0}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
          {restante <= 0 ? "Limite atingido" : "Selecionar fotos"}
        </button>

        {obra.fotos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {obra.fotos.map((file, i) => (
              <FotoPreview
                key={`${file.name}-${i}`}
                file={file}
                onRemove={() => onRemoveFoto(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FotoPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string>(() => URL.createObjectURL(file));
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div className="flex flex-col gap-1">
      <div className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white">
        {url && (
          <img src={url} alt={file.name} className="h-full w-full object-cover" />
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-90 transition hover:bg-black"
          aria-label="Remover foto"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <span className="text-center text-[11px] font-medium text-slate-500">
        {formatBytes(file.size)}
      </span>
    </div>
  );
}

function FeedbackBlock({
  index,
  feedback,
  onChange,
  onRemove,
}: {
  index: number;
  feedback: FeedbackDraft;
  onChange: (patch: Partial<FeedbackDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: BRAND_BLUE }}>
          Depoimento #{index}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remover
        </button>
      </div>

      <Field label="Depoimento do cliente *">
        <textarea
          required
          rows={3}
          value={feedback.depoimento}
          onChange={(e) => onChange({ depoimento: e.target.value })}
          className={inputClass}
          placeholder="O que o cliente disse sobre o seu trabalho..."
        />
      </Field>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome do cliente *">
          <input
            required
            type="text"
            value={feedback.nomeCliente}
            onChange={(e) => onChange({ nomeCliente: e.target.value })}
            className={inputClass}
            placeholder="Nome"
          />
        </Field>
        <Field label="E-mail do cliente">
          <input
            type="email"
            value={feedback.emailCliente}
            onChange={(e) => onChange({ emailCliente: e.target.value })}
            className={inputClass}
            placeholder="cliente@email.com"
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Telefone do cliente">
          <input
            type="tel"
            value={feedback.telefoneCliente}
            onChange={(e) => onChange({ telefoneCliente: e.target.value })}
            className={inputClass}
            placeholder="(11) 99999-9999"
          />
        </Field>
      </div>
    </div>
  );
}