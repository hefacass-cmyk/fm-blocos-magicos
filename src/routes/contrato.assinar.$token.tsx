import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fmSupabase, brl, fmtData } from "@/lib/fm-contratos";
import SignaturePad, { type SignaturePadHandle } from "@/components/admin/SignaturePad";
import { carregarEmpresaConfig } from "@/lib/fm-empresa";

export const Route = createFileRoute("/contrato/assinar/$token")({
  head: () => ({ meta: [{ title: "Assinar Contrato · F&M" }] }),
  component: ContratoAssinarPage,
});

type Row = Record<string, unknown>;

function ContratoAssinarPage() {
  const { token } = useParams({ from: "/contrato/assinar/$token" });
  const padRef = useRef<SignaturePadHandle>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [c, setC] = useState<Row | null>(null);
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [finalizado, setFinalizado] = useState<{ codigo?: string } | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error } = await fmSupabase
        .from("contratos")
        .select("*, clientes(codigo_cliente, codigo)")
        .eq("token_cliente", token)
        .maybeSingle();
      if (error || !data) setErro(error?.message ?? "Contrato não encontrado.");
      else setC(data as Row);
      setLoading(false);
    })();
  }, [token]);

  const assinar = async () => {
    if (!c) return;
    if (!aceito) { toast.error("Confirme que leu e concorda com os termos"); return; }
    const sig = padRef.current?.toDataURL();
    if (!sig) { toast.error("Desenhe sua assinatura"); return; }
    setEnviando(true);
    const agora = new Date().toISOString();

    // Etapa 4: assinatura do cliente
    const { error: e1 } = await fmSupabase
      .from("contratos")
      .update({
        assinatura_cliente: sig,
        assinatura_cliente_data: agora,
        status: "assinado_cliente",
        atualizado_em: agora,
      })
      .eq("token_cliente", token);
    if (e1) { setEnviando(false); toast.error("Erro ao assinar: " + e1.message); return; }

    // Etapa 5: assinatura automática F&M com assinatura padrão
    const empresa = await carregarEmpresaConfig();
    let codigoCliente: string | undefined;
    if (empresa.assinatura_fm_default) {
      const { error: e2 } = await fmSupabase
        .from("contratos")
        .update({
          assinatura_fm: empresa.assinatura_fm_default,
          assinatura_fm_data: new Date().toISOString(),
          status: "assinado",
          atualizado_em: new Date().toISOString(),
        })
        .eq("token_cliente", token);
      if (e2) console.warn("[assinar] Falha na assinatura automática F&M:", e2);
    } else {
      console.warn("[assinar] Nenhuma assinatura padrão F&M cadastrada em empresa_config.");
    }

    // Buscar código do cliente recém-criado
    const { data: refreshed } = await fmSupabase
      .from("contratos")
      .select("*, clientes(codigo_cliente, codigo)")
      .eq("token_cliente", token)
      .maybeSingle();
    const cli = (refreshed as Row | null)?.clientes as { codigo_cliente?: string; codigo?: string } | null;
    codigoCliente = cli?.codigo_cliente ?? cli?.codigo;

    setEnviando(false);
    setFinalizado({ codigo: codigoCliente });
    toast.success("🎉 Contrato assinado!");

    // Notifica F&M
    const msgFM = encodeURIComponent(`✅ ${String(c.cliente_nome ?? c.prospect_nome ?? "Cliente")} assinou o contrato ${String(c.numero ?? "")}.`);
    window.open(`https://wa.me/5571999454343?text=${msgFM}`, "_blank");
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (erro || !c) return <div className="mx-auto max-w-xl p-6"><div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">{erro ?? "Contrato não encontrado."}</div></div>;

  if (finalizado) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-6 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
          <h1 className="text-2xl font-bold text-emerald-900">🎉 Contrato assinado!</h1>
          <p className="text-sm text-emerald-800">Bem-vindo(a) à F&M Smart Build. Acesse sua área para acompanhar a obra:</p>
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <a href="/dashboard">Acessar meu painel</a>
          </Button>
          {finalizado.codigo && <p className="text-xs text-emerald-700">Seu código de cliente: <strong>{finalizado.codigo}</strong></p>}
        </div>
      </div>
    );
  }

  const nome = String(c.cliente_nome ?? c.prospect_nome ?? "—");
  const valor = Number(c.valor_total ?? 0);

  return (
    <div className="min-h-screen bg-slate-100 py-6">
      <div className="mx-auto max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow md:p-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Assinatura Digital</h1>
          <p className="text-sm text-slate-500">Contrato Nº {String(c.numero ?? "—")}</p>
        </header>

        <section className="rounded-lg border bg-slate-50 p-4 text-sm space-y-1">
          <p><strong>Contratante:</strong> {nome}</p>
          <p><strong>Sistema:</strong> {String(c.sistema_construtivo ?? "—")} — {String(c.tipo_servico ?? "—")}</p>
          <p><strong>Valor total:</strong> {valor > 0 ? brl(valor) : "—"}</p>
          <p><strong>Início:</strong> {fmtData(c.data_inicio as string)} • <strong>Prazo:</strong> {String(c.prazo_dias ?? "—")} dias</p>
        </section>

        <section className="space-y-3">
          <p className="text-sm text-slate-700">Assine abaixo com o dedo ou mouse:</p>
          <SignaturePad ref={padRef} height={200} />
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={aceito} onCheckedChange={(v) => setAceito(Boolean(v))} />
            <span>Li e concordo com todos os termos do contrato.</span>
          </label>
          <Button onClick={assinar} disabled={enviando} size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-base h-14">
            {enviando ? <Loader2 className="mr-1 h-5 w-5 animate-spin" /> : <Check className="mr-1 h-5 w-5" />}
            ASSINAR CONTRATO
          </Button>
        </section>
      </div>
    </div>
  );
}