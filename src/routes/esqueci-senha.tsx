import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { fmSupabase } from "@/lib/fm-supabase";
import {
  countRecentAttempts,
  generateToken,
  buildResetUrl,
  logTentativa,
  RATE_LIMIT_MAX,
  TOKEN_TTL_HOURS,
} from "@/lib/fm-password";

const BRAND_BLUE = "#1A4D7A";
const BRAND_GREEN = "#06A77D";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha · F&M" }] }),
  component: EsqueciSenhaPage,
});

function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const mail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      setErro("Digite um email válido.");
      return;
    }
    setLoading(true);
    try {
      const attempts = await countRecentAttempts(mail);
      if (attempts >= RATE_LIMIT_MAX) {
        await logTentativa(
          "reset_rate_limit",
          `Bloqueado por excesso de tentativas: ${mail} (${attempts})`,
        );
        setErro("Muitas tentativas. Aguarde 1 hora e tente novamente.");
        return;
      }

      const { data: parc } = await fmSupabase
        .from("parceiros")
        .select("id, email, nome")
        .ilike("email", mail)
        .maybeSingle();

      // Resposta neutra (não vaza existência), mas se existir cria token
      if (parc?.id) {
        const token = generateToken();
        const expira = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000).toISOString();
        const { error: insErr } = await fmSupabase.from("password_reset_tokens").insert({
          parceiro_id: parc.id,
          token,
          email: mail,
          expira_em: expira,
          usado: false,
        });
        if (insErr) {
          console.error("[reset] insert", insErr);
          await logTentativa("reset_erro", `Erro ao criar token p/ ${mail}: ${insErr.message}`);
          setErro("Não foi possível gerar o link agora. Tente em instantes.");
          return;
        }
        await logTentativa(
          "reset_solicitado",
          `Link de reset gerado para ${mail} (parceiro ${parc.id}). URL: ${buildResetUrl(token)}`,
        );
      } else {
        await logTentativa("reset_email_inexistente", `Tentativa para ${mail}`);
      }

      setDone(true);
    } catch (err) {
      console.error(err);
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-2xl border">
        <h1 className="text-2xl font-bold text-center" style={{ color: BRAND_BLUE }}>
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm text-center text-muted-foreground">
          Informe o email cadastrado. Enviaremos um link para criar uma nova senha.
        </p>

        {done ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Se o email estiver cadastrado, um link de recuperação foi gerado e
              será enviado em instantes. Verifique sua caixa de entrada (e o spam).
            </div>
            <Link
              to="/parceiro/login"
              className="block text-center text-sm font-semibold hover:underline"
              style={{ color: BRAND_GREEN }}
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {erro && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {erro}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={120}
                required
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="seu@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
            <Link
              to="/parceiro/login"
              className="block text-center text-sm font-medium hover:underline"
              style={{ color: BRAND_GREEN }}
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}