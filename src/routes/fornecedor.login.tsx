import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { fmSupabase } from "@/lib/fm-supabase";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";

const STORAGE_KEY = "fm_fornecedor_logado";

export const Route = createFileRoute("/fornecedor/login")({
  head: () => ({
    meta: [
      { title: "Área do Fornecedor F&M | F&M Construções Inteligentes" },
      { name: "description", content: "Acesso exclusivo para fornecedores F&M." },
    ],
  }),
  component: FornecedorLoginPage,
});

type TipoPessoa = "PF" | "PJ";

function FornecedorLoginPage() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoPessoa>("PJ");
  const [doc, setDoc] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const max = tipo === "PF" ? 11 : 14;
  const maskLen = tipo === "PF" ? 14 : 18;
  const formatDoc = (digits: string) => {
    const d = digits.replace(/\D/g, "").slice(0, max);
    if (tipo === "PF") {
      return d
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }
    return d
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };
  const handleDocChange = (v: string) => setDoc(formatDoc(v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const limpo = doc.replace(/\D/g, "");
    if ((tipo === "PF" && limpo.length !== 11) || (tipo === "PJ" && limpo.length !== 14)) {
      setErro(tipo === "PF" ? "Digite um CPF com 11 dígitos." : "Digite um CNPJ com 14 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const col = tipo === "PF" ? "cpf" : "cnpj";
      const { data, error } = await fmSupabase
        .from("fornecedores")
        .select("*")
        .eq(col, limpo)
        .limit(1)
        .maybeSingle();

      if (error) {
        setErro("Não foi possível validar agora. Tente novamente.");
        return;
      }
      if (!data) {
        setErro("CPF/CNPJ não cadastrado");
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...(data as object), tipo }));
      } catch {
        /* ignore */
      }
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-2xl border">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-3xl font-extrabold tracking-tight">
            <span style={{ color: BRAND_BLUE }}>F</span>
            <span style={{ color: BRAND_YELLOW }}>&</span>
            <span style={{ color: BRAND_GREEN }}>M</span>
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Construções Inteligentes
          </div>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>
            Área do Fornecedor F&M
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite seu CPF ou CNPJ para acessar
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          {(["PF", "PJ"] as TipoPessoa[]).map((t) => {
            const active = tipo === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => { setTipo(t); setDoc(""); setErro(null); }}
                className="rounded-md px-3 py-2 text-xs sm:text-sm font-bold transition"
                style={{
                  backgroundColor: active ? BRAND_BLUE : "transparent",
                  color: active ? "#fff" : "#475569",
                }}
              >
                {t === "PF" ? "Pessoa Física · CPF" : "Pessoa Jurídica · CNPJ"}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {erro && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {erro}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-foreground">
              {tipo === "PF" ? "CPF" : "CNPJ"}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={doc}
              onChange={(e) => handleDocChange(e.target.value)}
              placeholder={tipo === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
              maxLength={maskLen}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm font-medium hover:underline" style={{ color: BRAND_GREEN }}>
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}