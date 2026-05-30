import { useState } from "react";
import { X } from "lucide-react";

interface ClientLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function ClientLoginModal({ open, onClose }: ClientLoginModalProps) {
  const [codigo, setCodigo] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [erros, setErros] = useState<{ codigo?: string; cpfCnpj?: string }>({});
  const [loading, setLoading] = useState(false);

  if (!open) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Login simulado com sucesso!");
    }, 1200);
  };

  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

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
      <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-2xl">
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
          <h2 className="text-xl font-bold text-primary">Acesso à Sua Obra</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o progresso em tempo real
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
              placeholder="123.456.789-00"
              maxLength={18}
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
            Precisa de ajuda?
          </button>
        </div>
      </div>
    </div>
  );
}
