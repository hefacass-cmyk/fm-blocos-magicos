import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Instagram,
  MapPin,
  Building2,
  Send,
} from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#25D366";

export const Route = createFileRoute("/fornecedor/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Fornecedor F&M | ${params.slug}` },
      {
        name: "description",
        content:
          "Fornecedor parceiro F&M Construções Inteligentes — solicite orçamento.",
      },
    ],
  }),
  component: FornecedorPublicoPage,
});

type Row = Record<string, unknown>;

function pick<T>(row: Row | null | undefined, keys: string[], fallback: T): T {
  if (!row) return fallback;
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return fallback;
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function FornecedorPublicoPage() {
  const { slug } = Route.useParams();
  const [fornecedor, setFornecedor] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        let row: Row | null = null;
        const bySlug = await fmSupabase
          .from("fornecedores_publico")
          .select("*")
          .eq("slug", slug)
          .limit(1)
          .maybeSingle();
        if (bySlug.data) row = bySlug.data as Row;
        if (!row) {
          const byId = await fmSupabase
            .from("fornecedores_publico")
            .select("*")
            .eq("id", slug)
            .limit(1)
            .maybeSingle();
          if (byId.data) row = byId.data as Row;
        }
        if (!active) return;
        if (!row) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setFornecedor(row);
      } catch (e) {
        console.error("[fornecedor/$slug]", e);
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_BLUE }} />
      </div>
    );
  }

  if (notFound || !fornecedor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>
          Fornecedor não encontrado
        </h1>
        <Link
          to="/"
          className="rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: BRAND_BLUE }}
        >
          Voltar ao site
        </Link>
      </div>
    );
  }

  const nome = String(
    pick<string>(fornecedor, ["Nome", "Empresa", "Nome_empresa", "nome"], "Fornecedor F&M"),
  );
  const categoria = String(pick<string>(fornecedor, ["Categoria", "categoria", "segmento"], ""));
  const descricao = String(pick<string>(fornecedor, ["Descricao", "descricao"], ""));
  const cidade = String(pick<string>(fornecedor, ["Cidade", "cidade"], ""));
  const estado = String(pick<string>(fornecedor, ["Estado", "UF", "estado"], ""));
  const whats = onlyDigits(
    String(pick<string>(fornecedor, ["Whatsapp", "WhatsApp", "whatsapp", "telefone"], "")),
  );
  const whatsFull =
    whats.length >= 11 && !whats.startsWith("55") ? `55${whats}` : whats;
  const instagram = String(pick<string>(fornecedor, ["Instagram", "instagram"], "")).replace(
    /^@/,
    "",
  );
  const logo = String(
    pick<string>(fornecedor, ["Logo", "logo", "foto", "avatar_url"], ""),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <section
        className="px-4 pt-12 pb-8"
        style={{ background: `linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)` }}
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div
            className="relative h-32 w-32 overflow-hidden rounded-full border-4 shadow-lg sm:h-40 sm:w-40"
            style={{ borderColor: BRAND_YELLOW }}
          >
            {logo ? (
              <img src={logo} alt={nome} className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-white"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {nome.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1
            className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: BRAND_BLUE }}
          >
            {nome}
          </h1>
          {categoria && (
            <p className="mt-1 inline-flex items-center gap-1 text-base font-semibold text-slate-700">
              <Building2 className="h-4 w-4" /> {categoria}
            </p>
          )}
          {(cidade || estado) && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {[cidade, estado].filter(Boolean).join(" / ")}
            </p>
          )}
          {descricao && (
            <p className="mt-4 max-w-xl text-sm text-slate-600">{descricao}</p>
          )}

          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {whatsFull && (
              <a
                href={`https://wa.me/${whatsFull}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                <MessageCircle className="h-5 w-5" /> WhatsApp
              </a>
            )}
            {instagram && (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <Instagram className="h-5 w-5" /> Instagram
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <LeadForm
            origem="fornecedor"
            destinatarioId={String(fornecedor.id ?? slug)}
            destinatarioNome={nome}
          />
        </div>
      </section>

      <footer
        className="px-4 py-10 text-center text-white"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        <div
          className="mx-auto inline-flex items-center rounded-md px-3 py-1.5 text-base font-extrabold"
          style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
        >
          F&amp;M
        </div>
        <p className="mt-3 text-sm font-semibold">
          Fornecedor parceiro F&amp;M Construções Inteligentes
        </p>
      </footer>
    </div>
  );
}

export function LeadForm({
  origem,
  destinatarioId,
  destinatarioNome,
}: {
  origem: "parceiro" | "fornecedor";
  destinatarioId: string;
  destinatarioNome: string;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-base font-bold text-emerald-800">
          ✅ Solicitação enviada com sucesso!
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          {destinatarioNome} entrará em contato em breve.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErr("Informe seu nome.");
      return;
    }
    if (!telefone.trim() && !email.trim()) {
      setErr("Informe telefone ou e-mail.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        origem,
        nome_cliente: nome.trim().slice(0, 120),
        email_cliente: email.trim().slice(0, 160) || null,
        telefone_cliente: telefone.trim().slice(0, 40) || null,
        mensagem: mensagem.trim().slice(0, 1000) || null,
      };
      if (origem === "parceiro") payload.parceiro_id = destinatarioId;
      else payload.fornecedor_id = destinatarioId;

      const { error } = await fmSupabase.from("leads_indicacao").insert(payload);
      if (error) throw error;
      setSent(true);
    } catch (e) {
      console.error(e);
      setErr("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-extrabold" style={{ color: BRAND_BLUE }}>
        Solicitar Orçamento
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Preencha os dados e {destinatarioNome} entrará em contato.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome *"
          maxLength={120}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#1A4D7A] focus:outline-none"
        />
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="Telefone/WhatsApp *"
          maxLength={40}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#1A4D7A] focus:outline-none"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          maxLength={160}
          type="email"
          className="sm:col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#1A4D7A] focus:outline-none"
        />
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="Descreva sua necessidade"
          className="sm:col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#1A4D7A] focus:outline-none"
        />
      </div>

      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-extrabold disabled:opacity-60"
        style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {loading ? "Enviando..." : "Enviar Solicitação"}
      </button>
    </form>
  );
}