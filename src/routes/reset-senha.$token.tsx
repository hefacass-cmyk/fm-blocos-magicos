import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fmSupabase } from "@/lib/fm-supabase";
import { hashPassword, logTentativa, type ResetTokenRow } from "@/lib/fm-password";

const BRAND_BLUE = "#1A4D7A";
const BRAND_GREEN = "#06A77D";

export const Route = createFileRoute("/reset-senha/$token")({
  head: () => ({ meta: [{ title: "Definir nova senha · F&M" }] }),
  component: ResetSenhaPage,
});

type Status = "loading" | "ok" | "invalido" | "expirado" | "usado" | "salvo" | "erro";

function ResetSenhaPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [row, setRow] = useState<ResetTokenRow | null>(null);
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await fmSupabase
        .from("password_reset_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        await logTentativa("reset_token_invalido", `Token não encontrado: ${token.slice(0, 8)}…`);
        setStatus("invalido");
        return;
      }
      const r = data as ResetTokenRow;
      setRow(r);
      if (r.usado) {
        setStatus("usado");
        return;
      }
      if (new Date(r.expira_em).getTime() < Date.now()) {
        setStatus("expirado");
        return;
      }
      setStatus("ok");
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== senha2) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (!row) return;
    setSaving(true);
    try {
      const hash = await hashPassword(senha);
      const { error: upErr } = await fmSupabase
        .from("parceiros")
        .update({ senha_hash: hash })
        .eq("id", row.parceiro_id);
      if (upErr) {
        console.error(upErr);
        setErro("Não foi possível salvar a senha. Tente novamente.");
        await logTentativa("reset_erro", `Falha update senha parceiro ${row.parceiro_id}: ${upErr.message}`);
        return;
      }
      await fmSupabase
        .from("password_reset_tokens")
        .update({ usado: true, usado_em: new Date().toISOString() })
        .eq("id", row.id);
      await logTentativa(
        "reset_concluido",
        `Senha redefinida para parceiro ${row.parceiro_id} (${row.email})`,
      );
      setStatus("salvo");
      setTimeout(() => navigate({ to: "/parceiro/login" }), 2500);
    } catch (err) {
      console.error(err);
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-2xl border">
        <h1 className="text-2xl font-bold text-center" style={{ color: BRAND_BLUE }}>
          Definir nova senha
        </h1>

        {status === "loading" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">Validando link...</p>
        )}

        {(status === "invalido" || status === "expirado" || status === "usado") && (
          <div className="mt-6 space-y-4 text-center">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {status === "invalido" && "Link inválido."}
              {status === "expirado" && "Este link expirou. Solicite um novo."}
              {status === "usado" && "Este link já foi utilizado."}
            </div>
            <Link
              to="/esqueci-senha"
              className="inline-block text-sm font-semibold hover:underline"
              style={{ color: BRAND_GREEN }}
            >
              Solicitar novo link
            </Link>
          </div>
        )}

        {status === "salvo" && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
            Senha redefinida com sucesso! Redirecionando para o login...
          </div>
        )}

        {status === "ok" && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <p className="text-xs text-muted-foreground">
              Email: <strong>{row?.email}</strong>
            </p>
            {erro && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {erro}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold">Nova senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                maxLength={128}
                required
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Confirmar senha</label>
              <input
                type="password"
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
                minLength={8}
                maxLength={128}
                required
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              {saving ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}