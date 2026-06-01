import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { logAdmin } from "@/lib/fm-tracking";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";

export function SolicitarAmpliacaoModal({
  open,
  onClose,
  parceiroId,
  parceiroNome,
}: {
  open: boolean;
  onClose: () => void;
  parceiroId: string | number;
  parceiroNome?: string;
}) {
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = async () => {
    if (!mensagem.trim()) {
      setError("Descreva seu pedido.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error: insErr } = await fmSupabase
        .from("solicitacoes_ampliacao")
        .insert({
          parceiro_id: parceiroId,
          mensagem: mensagem.trim(),
          status: "pendente",
        });
      if (insErr) throw insErr;
      await logAdmin(
        "solicitacao_ampliacao",
        `Parceiro ${parceiroNome ?? parceiroId} solicitou ampliação`,
        "parceiro",
      );
      setSent(true);
    } catch (e) {
      console.error(e);
      setError("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-extrabold" style={{ color: BRAND_BLUE }}>
            Solicitar Ampliação
          </h3>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-500 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold text-slate-700">
              ✅ Solicitação enviada! Aguarde resposta do administrador.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">
              Você atingiu o limite de obras. Conte para a F&M o que precisa
              para ampliar seu perfil.
            </p>
            <label className="text-xs font-bold uppercase text-slate-500">
              Qual é seu pedido?
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value.slice(0, 1000))}
              rows={5}
              className="mt-1 w-full rounded-md border border-slate-300 p-3 text-sm focus:border-[#1A4D7A] focus:outline-none"
              placeholder="Ex.: Preciso cadastrar mais 10 obras para meu portfólio…"
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold transition hover:brightness-95 disabled:opacity-60"
              style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar para administrador
            </button>
          </>
        )}
      </div>
    </div>
  );
}