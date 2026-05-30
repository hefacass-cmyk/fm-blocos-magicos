import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { fmSupabase, saveCliente } from "@/lib/fm-supabase";

interface ClientLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function ClientLoginModal({ open, onClose }: ClientLoginModalProps) {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [erros, setErros] = useState<{ codigo?: string; cpfCnpj?: string }>({});
  const [loading, setLoading] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  if (!open) return null;

  const cleanInput = (v: string) => v.replace(/[.\-\s/]/g, "");

  const validate = () => {
    const nextErros: { codigo?: string; cpfCnpj?: string } = {};
    if (!codigo.trim()) nextErros.codigo = "Informe o código do cliente";
    if (!cpfCnpj.trim()) nextErros.cpfCnpj = "Informe o CPF ou CNPJ";
    else if (!/^\d{11,14}$/.test(cpfCnpj.replace(/\D/g, ""))) {
      nextErros.cpfCnpj = "CPF ou CNPJ inválido";
    }
    setErros(nextErros);
    return Object.keys(nextErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const codigoLimpo = cleanInput(codigo);
      const cpfLimpo = cleanInput(cpfCnpj);

      console.log("[login] enviando para Supabase:", {
        tabela: "Clientes",
        Cos_cliente: codigoLimpo,
        Cpf_cnpj: cpfLimpo,
        tipos: { Cos_cliente: typeof codigoLimpo, Cpf_cnpj: typeof cpfLimpo },
      });

      // Diagnóstico: busca 1 linha qualquer pra inspecionar nomes/tipos das colunas
      const amostra = await fmSupabase.from("Clientes").select("*").limit(1);
      console.log("[login] amostra da tabela Clientes:", {
        error: amostra.error,
        primeiraLinha: amostra.data?.[0],
        colunas: amostra.data?.[0] ? Object.keys(amostra.data[0]) : null,
      });

      const { data, error } = await fmSupabase
        .from("Clientes")
        .select("*")
        .eq("Cos_cliente", codigoLimpo)
        .eq("Cpf_cnpj", cpfLimpo)
        .limit(1)
        .maybeSingle();

      console.log("[login] resposta Supabase:", { data, error });

      if (error) {
        console.error("[login] erro supabase:", error);
        setErroGeral("Não foi possível validar agora. Tente novamente.");
        return;
      }

      if (!data) {
        setErroGeral("Código ou CPF incorreto");
        return;
      }

      saveCliente(data as never);
      onClose();
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("[login] exceção:", err);
      setErroGeral("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const onlyDigits = (value: string) => value.replace(/\D/g, "").slice(0, 14);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-3xl font-extrabold tracking-tight">
            <span style={{ color: "#1A4D7A" }}>F</span>
            <span style={{ color: "#F4B941" }}>&</span>
            <span style={{ color: "#06A77D" }}>M</span>
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Construções Inteligentes
          </div>
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold" style={{ color: "#1A4D7A" }}>Acesso à Sua Obra</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite seu código e CPF para acompanhar o progresso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {erroGeral && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {erroGeral}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-foreground">
              Código Cliente
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="FM-JOÃO-20260529"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {erros.codigo && (
              <p className="mt-1 text-xs text-destructive">{erros.codigo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              CPF ou CNPJ
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(onlyDigits(e.target.value))}
              placeholder="Somente números: 12345678900"
              maxLength={14}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {erros.cpfCnpj && (
              <p className="mt-1 text-xs text-destructive">{erros.cpfCnpj}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            style={{ backgroundColor: "#1A4D7A" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#143a5e")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#1A4D7A")
            }
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm font-medium hover:underline transition"
            style={{ color: "#06A77D" }}
          >
            Não tem código?
          </button>
        </div>
      </div>
    </div>
  );
}
