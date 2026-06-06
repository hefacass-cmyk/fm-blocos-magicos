import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Check, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fmSupabase } from "@/lib/fm-contratos";
import ContratoTexto from "@/components/admin/ContratoTexto";
import { carregarEmpresaConfig, EMPRESA_DEFAULT, type EmpresaConfig } from "@/lib/fm-empresa";

export const Route = createFileRoute("/contrato/revisar/$token")({
  head: () => ({ meta: [{ title: "Revisar Contrato · F&M" }] }),
  component: ContratoRevisarPage,
});

type Row = Record<string, unknown>;

function ContratoRevisarPage() {
  const { token } = useParams({ from: "/contrato/revisar/$token" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [c, setC] = useState<Row | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaConfig>(EMPRESA_DEFAULT);
  const [modoAlteracao, setModoAlteracao] = useState(false);
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void carregarEmpresaConfig().then(setEmpresa);
    void (async () => {
      const { data, error } = await fmSupabase.from("contratos").select("*").eq("token_cliente", token).maybeSingle();
      if (error || !data) {
        setErro(error?.message ?? "Contrato não encontrado.");
      } else {
        setC(data as Row);
      }
      setLoading(false);
    })();
  }, [token]);

  const enviarAlteracao = async () => {
    if (!obs.trim()) { toast.error("Descreva a alteração desejada"); return; }
    if (!c) return;
    setEnviando(true);
    const { error } = await fmSupabase
      .from("contratos")
      .update({ observacoes_cliente: obs, status: "em_revisao", atualizado_em: new Date().toISOString() })
      .eq("token_cliente", token);
    setEnviando(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Solicitação enviada à F&M.");
    const msg = encodeURIComponent(`⚠️ ${String(c.cliente_nome ?? c.prospect_nome ?? "Cliente")} solicitou alteração no contrato ${String(c.numero ?? "")}. Observação: ${obs}`);
    window.open(`https://wa.me/5571999454343?text=${msg}`, "_blank");
    setModoAlteracao(false);
    setObs("");
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (erro || !c) {
    return <div className="mx-auto max-w-xl p-6"><div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">{erro ?? "Contrato não encontrado."}</div></div>;
  }

  const status = String(c.status ?? "");
  const jaAssinado = Boolean(c.assinatura_cliente);

  return (
    <div className="min-h-screen bg-slate-100 py-6">
      <div className="mx-auto max-w-3xl space-y-6 rounded-lg bg-white p-6 shadow md:p-10">
        <header className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Revisão do Contrato</h1>
          <p className="text-sm text-slate-500">Nº {String(c.numero ?? "—")}</p>
        </header>

        {status === "em_revisao" && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            <p className="font-semibold">Alteração solicitada</p>
            <p>Aguardando a F&M revisar suas observações: <em>{String(c.observacoes_cliente ?? "—")}</em></p>
          </div>
        )}

        <section className="rounded-lg border bg-white p-5">
          <ContratoTexto c={c} empresa={empresa} />
        </section>

        {jaAssinado ? (
          <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-5 text-center">
            <h3 className="text-lg font-semibold text-emerald-900">✅ Contrato já assinado</h3>
            <p className="text-sm text-emerald-800 mt-1">Acesse sua área no dashboard.</p>
          </div>
        ) : modoAlteracao ? (
          <section className="rounded-lg border-2 border-yellow-300 bg-yellow-50/50 p-5 space-y-3">
            <h3 className="text-lg font-semibold text-yellow-900">Solicitar alteração</h3>
            <p className="text-sm text-yellow-800">Descreva qual cláusula está divergente e o que você gostaria de alterar:</p>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={5} placeholder="Ex.: A cláusula 5ª — gostaria de parcelar o adiantamento em 2 vezes..." />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModoAlteracao(false)}>Cancelar</Button>
              <Button onClick={enviarAlteracao} disabled={enviando} className="bg-yellow-600 hover:bg-yellow-700">
                {enviando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <MessageSquareWarning className="mr-1 h-4 w-4" />}
                ENVIAR SOLICITAÇÃO
              </Button>
            </div>
          </section>
        ) : (
          <section className="grid gap-3 md:grid-cols-2">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base h-14" onClick={() => navigate({ to: "/contrato/assinar/$token", params: { token } })}>
              <Check className="mr-2 h-5 w-5" /> CONCORDO — ASSINAR
            </Button>
            <Button size="lg" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 text-base h-14" onClick={() => setModoAlteracao(true)}>
              <MessageSquareWarning className="mr-2 h-5 w-5" /> SOLICITAR ALTERAÇÃO
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}