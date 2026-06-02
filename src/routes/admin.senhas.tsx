import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Copy, RefreshCw, ArrowLeft, Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { fmSupabase } from "@/lib/fm-supabase";
import { sendResetEmail } from "@/lib/email-reset.functions";
import {
  generateToken,
  buildResetUrl,
  logTentativa,
  TOKEN_TTL_HOURS,
  type ResetTokenRow,
} from "@/lib/fm-password";

const BRAND_BLUE = "#1A4D7A";
const ADMIN_KEY = "fm_admin_auth";

export const Route = createFileRoute("/admin/senhas")({
  head: () => ({ meta: [{ title: "Senhas dos parceiros · Admin F&M" }] }),
  component: AdminSenhasPage,
});

interface Parceiro {
  id: string;
  nome: string | null;
  email: string | null;
  senha_hash: string | null;
}

function AdminSenhasPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [tokens, setTokens] = useState<ResetTokenRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [linkRecemGerado, setLinkRecemGerado] = useState<{
    parceiroId: string;
    url: string;
    enviado: boolean;
    erroEnvio?: string;
  } | null>(null);
  const enviarEmail = useServerFn(sendResetEmail);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") {
      navigate({ to: "/admin/login" });
      return;
    }
    void load();
  }, [navigate]);

  async function load() {
    setLoading(true);
    try {
      const [{ data: p }, { data: t }] = await Promise.all([
        fmSupabase
          .from("parceiros")
          .select("id, nome, email, senha_hash")
          .order("nome", { ascending: true }),
        fmSupabase
          .from("password_reset_tokens")
          .select("*")
          .order("criado_em", { ascending: false })
          .limit(50),
      ]);
      setParceiros((p ?? []) as Parceiro[]);
      setTokens((t ?? []) as ResetTokenRow[]);
    } finally {
      setLoading(false);
    }
  }

  async function gerarLink(p: Parceiro) {
    if (!p.email) {
      alert("Parceiro sem email cadastrado.");
      return;
    }
    setBusy(p.id);
    try {
      const token = generateToken();
      const expira = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000).toISOString();
      const { error } = await fmSupabase.from("password_reset_tokens").insert({
        parceiro_id: p.id,
        token,
        email: p.email.toLowerCase(),
        expira_em: expira,
        usado: false,
      });
      if (error) {
        alert("Erro: " + error.message);
        return;
      }
      const url = buildResetUrl(token);
      const envio = await enviarEmail({
        data: { to: p.email, nome: p.nome ?? undefined, resetUrl: url },
      });
      setLinkRecemGerado({
        parceiroId: p.id,
        url,
        enviado: envio.ok,
        erroEnvio: envio.ok ? undefined : envio.error,
      });
      await logTentativa(
        "reset_admin",
        envio.ok
          ? `Admin gerou e ENVIOU link de reset p/ ${p.email} (${p.id}): ${url}`
          : `Admin gerou link p/ ${p.email} (${p.id}) mas FALHA no envio (${envio.error}): ${url}`,
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function invalidarSenha(p: Parceiro) {
    if (!confirm(`Remover a senha de ${p.nome ?? p.email}? Ele precisará criar uma nova.`))
      return;
    setBusy(p.id);
    try {
      const { error } = await fmSupabase
        .from("parceiros")
        .update({ senha_hash: null })
        .eq("id", p.id);
      if (error) {
        alert("Erro: " + error.message);
        return;
      }
      await logTentativa("senha_removida", `Admin removeu senha de ${p.email} (${p.id})`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  function copiar(url: string) {
    navigator.clipboard.writeText(url).then(
      () => alert("Link copiado!"),
      () => alert("Não foi possível copiar."),
    );
  }

  const filtroLow = filtro.trim().toLowerCase();
  const lista = filtroLow
    ? parceiros.filter(
        (p) =>
          (p.nome ?? "").toLowerCase().includes(filtroLow) ||
          (p.email ?? "").toLowerCase().includes(filtroLow),
      )
    : parceiros;

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao painel
            </Link>
            <h1 className="mt-2 text-2xl font-bold" style={{ color: BRAND_BLUE }}>
              Gerenciar senhas dos parceiros
            </h1>
            <p className="text-sm text-muted-foreground">
              Gere links de reset (válidos por {TOKEN_TTL_HOURS}h) e envie ao parceiro por WhatsApp/email.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" /> Recarregar
          </button>
        </div>

        {linkRecemGerado && (
          <div
            className={`rounded-xl border p-4 ${
              linkRecemGerado.enviado
                ? "border-green-300 bg-green-50"
                : "border-yellow-300 bg-yellow-50"
            }`}
          >
            <div className="text-sm font-semibold">
              {linkRecemGerado.enviado ? (
                <span className="inline-flex items-center gap-1 text-green-900">
                  <Mail className="h-4 w-4" /> Email enviado com o link de reset.
                </span>
              ) : (
                <span className="text-yellow-900">
                  Link gerado, mas falha no envio do email
                  {linkRecemGerado.erroEnvio ? `: ${linkRecemGerado.erroEnvio}` : ""}. Copie e envie manualmente:
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 truncate rounded bg-white px-3 py-2 text-xs">
                {linkRecemGerado.url}
              </code>
              <button
                onClick={() => copiar(linkRecemGerado.url)}
                className="inline-flex items-center gap-1 rounded-md bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800"
              >
                <Copy className="h-3 w-3" /> Copiar
              </button>
            </div>
          </div>
        )}

        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full rounded-lg border border-input bg-white px-4 py-2.5 text-sm"
        />

        <div className="rounded-xl border bg-white">
          <div className="border-b px-4 py-3 text-sm font-bold" style={{ color: BRAND_BLUE }}>
            Parceiros ({lista.length})
          </div>
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y">
              {lista.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.nome ?? "(sem nome)"}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.email ?? "—"}</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.senha_hash
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {p.senha_hash ? "Com senha" : "Sem senha"}
                  </span>
                  <button
                    onClick={() => gerarLink(p)}
                    disabled={busy === p.id || !p.email}
                    className="rounded-md px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50"
                    style={{ backgroundColor: BRAND_BLUE }}
                  >
                    Gerar link de reset
                  </button>
                  {p.senha_hash && (
                    <button
                      onClick={() => invalidarSenha(p)}
                      disabled={busy === p.id}
                      className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Remover senha
                    </button>
                  )}
                </div>
              ))}
              {lista.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum parceiro encontrado.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white">
          <div className="border-b px-4 py-3 text-sm font-bold" style={{ color: BRAND_BLUE }}>
            Últimos tokens gerados ({tokens.length})
          </div>
          <div className="divide-y text-xs">
            {tokens.map((t) => {
              const expirado = new Date(t.expira_em).getTime() < Date.now();
              const url = buildResetUrl(t.token);
              return (
                <div key={t.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{t.email}</div>
                    <div className="text-muted-foreground">
                      Criado: {new Date(t.criado_em).toLocaleString("pt-BR")} · Expira:{" "}
                      {new Date(t.expira_em).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      t.usado
                        ? "bg-gray-200 text-gray-700"
                        : expirado
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {t.usado ? "Usado" : expirado ? "Expirado" : "Ativo"}
                  </span>
                  {!t.usado && !expirado && (
                    <button
                      onClick={() => copiar(url)}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" /> Copiar link
                    </button>
                  )}
                </div>
              );
            })}
            {tokens.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                Nenhum token gerado ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}