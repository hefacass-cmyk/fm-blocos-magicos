import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Loader2, Send, Plus, Trash2, Check, FileDown, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  fmSupabase, gerarNumeroContrato, precoM2, calcularValores, calcularDataFim,
  proximaSegunda, brl, fmtData, STATUS_COLORS, STATUS_LABELS, FIN_COLORS, FIN_LABELS,
  statusFinanceiro, PLANOS_CAMERA, type ContratoStatus,
} from "@/lib/fm-contratos";
import SignaturePad, { type SignaturePadHandle } from "@/components/admin/SignaturePad";
import ContratoTexto from "@/components/admin/ContratoTexto";
import { MarcarPagoModal } from "@/components/admin/MarcarPagoModal";
import { carregarEmpresaConfig, EMPRESA_DEFAULT, type EmpresaConfig } from "@/lib/fm-empresa";
import fmLogoUrl from "@/assets/fm-logo.png";

async function loadImageAsDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

export const Route = createFileRoute("/admin/contratos/$id")({
  head: () => ({ meta: [{ title: "Contrato · F&M" }] }),
  component: AdminContratoDetalhePage,
});

const ADMIN_KEY = "fm_admin_auth";
type Row = Record<string, unknown>;

function AdminContratoDetalhePage() {
  const { id } = useParams({ from: "/admin/contratos/$id" });
  const isNew = id === "novo";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contrato, setContrato] = useState<Row>({});
  const [clientes, setClientes] = useState<{ id: string; nome: string; codigo: string }[]>([]);
  const [aditivos, setAditivos] = useState<Row[]>([]);
  const [medicoes, setMedicoes] = useState<Row[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaConfig>(EMPRESA_DEFAULT);
  const fmPadRef = useRef<SignaturePadHandle>(null);
  const [linkModal, setLinkModal] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") { navigate({ to: "/admin/login" }); return; }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const init = async () => {
    setLoading(true);
    console.log("[admin.contratos.$id] ID recebido na URL:", id);
    console.log("[admin.contratos.$id] Tipo do ID:", typeof id);
    void carregarEmpresaConfig().then(setEmpresa);
    const { data: cs } = await fmSupabase.from("clientes").select("id, nome, codigo_cliente, codigo").order("nome");
    setClientes(((cs as Row[]) ?? []).map((c) => ({
      id: String(c.id), nome: String(c.nome ?? "—"),
      codigo: String(c.codigo_cliente ?? c.codigo ?? ""),
    })));
    if (isNew) {
      const numero = await gerarNumeroContrato();
      setContrato({
        numero, status: "rascunho",
        plano_camera: "sem_camera", databook_eletronico: false,
        gerente_nome: "Hélder Souza", gerente_cargo: "Engenheiro responsável", gerente_whatsapp: "71999454343",
        responsavel_tecnico: "Eng. Francisco A. P. Jr.", crea: "38.135-D/BA",
      });
    } else {
      // DEBUG: listar primeiros contratos para conferir ids reais
      const probe = await fmSupabase
        .from("contratos")
        .select("id, prospect_nome, status")
        .limit(5);
      console.log("[admin.contratos.$id] Todos contratos (probe):", probe.data, probe.error);

      const [{ data: c, error: cErr }, { data: ad }, { data: me }] = await Promise.all([
        fmSupabase.from("contratos").select("*").eq("id", id).single(),
        fmSupabase.from("contratos_aditivos").select("*").eq("contrato_id", id).order("criado_em"),
        fmSupabase.from("obra_financeiro").select("*").eq("contrato_id", id).order("data_vencimento"),
      ]);
      console.log("[admin.contratos.$id] Query por id resultado:", { data: c, error: cErr });
      if (cErr) {
        console.error("[admin.contratos] Erro detalhado:", cErr);
        console.error("[admin.contratos] Código:", cErr.code);
        console.error("[admin.contratos] Mensagem:", cErr.message);
        console.error("[admin.contratos] Detalhes:", cErr.details);
        console.error("[admin.contratos] Hint:", cErr.hint);
        toast.error(`Erro ${cErr.code ?? ""}: ${cErr.message}`);
        setContrato({ __error: cErr.message, __code: cErr.code, __details: cErr.details, __hint: cErr.hint } as Row);
        setLoading(false);
        return;
      }
      if (!c) {
        setContrato({ __error: "Nenhum registro retornado", __code: "EMPTY" } as Row);
        setLoading(false);
        return;
      }
      setContrato(c as Row);
      setAditivos((ad as Row[]) ?? []);
      setMedicoes((me as Row[]) ?? []);
    }
    setLoading(false);
  };

  const setC = (patch: Partial<Row>) => setContrato((c) => {
    const next = { ...c, ...patch };
    const vals = calcularValores(next);
    const dataFim = calcularDataFim(next.data_inicio as string | null, next.prazo_dias as number | null);
    return { ...next, ...vals, data_previsao_fim: dataFim };
  });

  const onSistemaServicoChange = (sistema: string | null, servico: string | null) => {
    const v = precoM2(sistema, servico);
    setC({ sistema_construtivo: sistema, tipo_servico: servico, valor_m2: v || (contrato.valor_m2 as number) || 0 });
  };

  const save = async (statusOverride?: ContratoStatus): Promise<Row | null> => {
    if (!contrato.cliente_id) { toast.error("Selecione um cliente"); return null; }
    if (!contrato.numero) { toast.error("Número obrigatório"); return null; }
    setSaving(true);
    const payload: Row = { ...contrato, atualizado_em: new Date().toISOString() };
    if (statusOverride) payload.status = statusOverride;
    delete payload.clientes;
    let res;
    if (isNew) {
      res = await fmSupabase.from("contratos").insert(payload as Row).select().single();
    } else {
      res = await fmSupabase.from("contratos").update(payload as Row).eq("id", id).select().single();
    }
    setSaving(false);
    if (res.error) { toast.error("Erro ao salvar: " + res.error.message); return null; }
    toast.success("Contrato salvo");
    if (isNew && res.data) {
      navigate({ to: "/admin/contratos/$id", params: { id: String((res.data as Row).id) } });
      return res.data as Row;
    }
    setContrato(res.data as Row);
    return res.data as Row;
  };

  const enviarParaCliente = async () => {
    const saved = await save("aguardando_revisao");
    if (!saved) return;
    const token = saved.token_cliente as string;
    const url = `https://www.fmsmartbuild.com.br/contrato/revisar/${token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* noop */ }
    toast.success("Link copiado! Envie ao cliente para revisão.");
  };

  const assinarFM = async () => {
    const dataUrl = fmPadRef.current?.toDataURL();
    if (!dataUrl) { toast.error("Desenhe a assinatura primeiro"); return; }
    setSaving(true);
    const { error } = await fmSupabase.from("contratos").update({
      assinatura_fm: dataUrl, assinatura_fm_data: new Date().toISOString(), status: "assinado",
    }).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Contrato assinado pela F&M");
    setContrato((c) => ({ ...c, assinatura_fm: dataUrl, status: "assinado" }));
  };

  const usarAssinaturaPadrao = async () => {
    const dataUrl = empresa.assinatura_fm_default;
    if (!dataUrl) {
      toast.error("Nenhuma assinatura padrão cadastrada. Cadastre em /admin/configuracoes.");
      return;
    }
    setSaving(true);
    const { error } = await fmSupabase.from("contratos").update({
      assinatura_fm: dataUrl, assinatura_fm_data: new Date().toISOString(), status: "assinado",
    }).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Contrato assinado com a assinatura padrão");
    setContrato((c) => ({ ...c, assinatura_fm: dataUrl, status: "assinado" }));
  };

  const salvarEAssinarFM = async () => {
    const dataUrl = empresa.assinatura_fm_default;
    if (!dataUrl) {
      toast.error("Cadastre sua assinatura padrão em /admin/configuracoes antes.");
      return;
    }
    const saved = await save();
    if (!saved) return;
    setSaving(true);
    const { error } = await fmSupabase.from("contratos").update({
      assinatura_fm: dataUrl,
      assinatura_fm_data: new Date().toISOString(),
      status: "aguardando_revisao",
      atualizado_em: new Date().toISOString(),
    }).eq("id", saved.id as string);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    const token = saved.token_cliente as string;
    const url = `https://www.fmsmartbuild.com.br/contrato/revisar/${token}`;
    setContrato((c) => ({ ...c, assinatura_fm: dataUrl, assinatura_fm_data: new Date().toISOString(), status: "aguardando_revisao" }));
    setLinkModal(url);
    toast.success("Contrato assinado pela F&M! Envie o link ao cliente.");
  };

  const baixarPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;
    const el = document.getElementById("contrato-preview");
    if (!el) return;
    toast.info("Gerando PDF...");
    const logoSrc = empresa.logo_url || fmLogoUrl;
    const logoDataUrl = await loadImageAsDataURL(logoSrc);
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const headerH = 24;
    const footerH = 14;
    const marginX = 12;
    const contentW = pageW - marginX * 2;
    const contentH = pageH - headerH - footerH;
    const pageCanvasPx = (canvas.width * contentH) / contentW;
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageCanvasPx));

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();
      const sourceY = p * pageCanvasPx;
      const sliceH = Math.min(pageCanvasPx, canvas.height - sourceY);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      }
      const imgH = (sliceH * contentW) / canvas.width;
      pdf.addImage(slice.toDataURL("image/png"), "PNG", marginX, headerH, contentW, imgH);
    }

    const pageCount = pdf.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      pdf.setPage(p);
      // header
      if (logoDataUrl) {
        try { pdf.addImage(logoDataUrl, "PNG", marginX, 6, 16, 16); } catch { /* noop */ }
      }
      pdf.setTextColor(26, 77, 122);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(empresa.razao_social || "F&M Construções Inteligentes", marginX + 20, 12);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`CNPJ: ${empresa.cnpj || ""}`, marginX + 20, 17);
      pdf.text(empresa.endereco || "", marginX + 20, 21);
      pdf.setDrawColor(200);
      pdf.line(marginX, headerH - 2, pageW - marginX, headerH - 2);

      // footer
      pdf.setDrawColor(200);
      pdf.line(marginX, pageH - footerH + 2, pageW - marginX, pageH - footerH + 2);
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      const left = `Contrato ${String(contrato.numero || "")}`;
      pdf.text(left, marginX, pageH - 5);
      const mid = `Página ${p} de ${pageCount}`;
      pdf.text(mid, (pageW - pdf.getTextWidth(mid)) / 2, pageH - 5);
      const right = "www.fmsmartbuild.com.br";
      pdf.text(right, pageW - marginX - pdf.getTextWidth(right), pageH - 5);
    }

    const nomeSlug = String(contrato.prospect_nome || contrato.cliente_nome || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const filename = `Contrato_FM_${String(contrato.numero || "contrato")}${nomeSlug ? "_" + nomeSlug : ""}.pdf`;
    pdf.save(filename);
  };

  // Aditivos
  const addAditivo = async () => {
    if (isNew) { toast.error("Salve o contrato primeiro"); return; }
    const novo = { contrato_id: id, descricao: "Novo aditivo", area_m2: 0, valor_m2: 0, valor_total: 0, prazo_adicional_dias: 0 };
    const { data, error } = await fmSupabase.from("contratos_aditivos").insert(novo).select().single();
    if (error) { toast.error(error.message); return; }
    setAditivos((arr) => [...arr, data as Row]);
  };
  const updAditivo = async (idA: string, patch: Row) => {
    const { error } = await fmSupabase.from("contratos_aditivos").update(patch).eq("id", idA);
    if (error) toast.error(error.message);
    setAditivos((arr) => arr.map((a) => a.id === idA ? { ...a, ...patch } : a));
  };
  const delAditivo = async (idA: string) => {
    if (!confirm("Excluir aditivo?")) return;
    const { error } = await fmSupabase.from("contratos_aditivos").delete().eq("id", idA);
    if (error) { toast.error(error.message); return; }
    setAditivos((arr) => arr.filter((a) => a.id !== idA));
    toast.success("Aditivo excluído");
  };

  // Medições
  const addMedicao = async () => {
    if (isNew) { toast.error("Salve o contrato primeiro"); return; }
    const venc = proximaSegunda();
    const novo = {
      contrato_id: id, cliente_id: contrato.cliente_id,
      semana_referencia: new Date().toISOString().slice(0, 10),
      descricao: "Medição semanal", valor: 0, data_vencimento: venc, status: "pendente",
    };
    const { data, error } = await fmSupabase.from("obra_financeiro").insert(novo).select().single();
    if (error) { toast.error(error.message); return; }
    setMedicoes((arr) => [...arr, data as Row]);
  };
  const updMedicao = async (idM: string, patch: Row) => {
    const { error } = await fmSupabase.from("obra_financeiro").update(patch).eq("id", idM);
    if (error) toast.error(error.message);
    setMedicoes((arr) => arr.map((m) => m.id === idM ? { ...m, ...patch } : m));
  };
  const marcarPago = async (idM: string) => {
    await updMedicao(idM, { status: "pago", data_pagamento: new Date().toISOString().slice(0, 10) });
    toast.success("Marcado como pago");
  };
  const [pagModal, setPagModal] = useState<string | null>(null);
  const verComprovante = async (url: string) => {
    try {
      if (url.startsWith("http")) { window.open(url, "_blank"); return; }
      const { data, error } = await fmSupabase.storage.from("comprovantes-pagamento").createSignedUrl(url, 600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao abrir comprovante");
    }
  };
  const delMedicao = async (idM: string) => {
    if (!confirm("Excluir medição?")) return;
    const { error } = await fmSupabase.from("obra_financeiro").delete().eq("id", idM);
    if (error) { toast.error(error.message); return; }
    setMedicoes((arr) => arr.filter((m) => m.id !== idM));
  };

  const totaisFin = useMemo(() => {
    const orcado = Number(contrato.valor_total || 0);
    const pago = medicoes.filter((m) => m.status === "pago").reduce((s, m) => s + Number(m.valor || 0), 0);
    const saldo = orcado - pago;
    const pct = orcado > 0 ? (pago / orcado) * 100 : 0;
    return { orcado, pago, saldo, pct };
  }, [contrato.valor_total, medicoes]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  const status = (contrato.status as ContratoStatus) || "rascunho";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-yellow-200 px-4 py-2 text-xs font-mono text-slate-900">
        DEBUG — ID da URL: {String(id)} (tipo: {typeof id})
        {contrato.__error ? (
          <div className="mt-1 text-red-700">
            Erro: {String(contrato.__error)} | Código: {String(contrato.__code ?? "")} | Detalhes: {String(contrato.__details ?? "")} | Hint: {String(contrato.__hint ?? "")}
          </div>
        ) : null}
      </div>
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/contratos" className="text-slate-500 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{isNew ? "Novo Contrato" : String(contrato.numero || "Contrato")}</h1>
              <span className="inline-block rounded px-2 py-0.5 text-xs font-medium text-white" style={{ background: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Salvar
            </Button>
            {!isNew && (status === "rascunho" || status === "aguardando_cliente") && (
              <Button variant="outline" onClick={enviarParaCliente}>
                <Send className="mr-1 h-4 w-4" /> Gerar Contrato p/ Revisão
              </Button>
            )}
            {!isNew && (status === "dados_cliente_enviados" || status === "em_revisao" || status === "aguardando_revisao") && (
              <Button variant="outline" onClick={enviarParaCliente}>
                <Send className="mr-1 h-4 w-4" /> Reenviar p/ Revisão
              </Button>
            )}
            {!isNew && <Button variant="outline" onClick={baixarPDF}><FileDown className="mr-1 h-4 w-4" /> PDF</Button>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados da Obra</TabsTrigger>
            <TabsTrigger value="financeiro" disabled={isNew}>Financeiro</TabsTrigger>
            <TabsTrigger value="aditivos" disabled={isNew}>Aditivos</TabsTrigger>
            <TabsTrigger value="assinatura" disabled={isNew}>Assinatura F&M</TabsTrigger>
            <TabsTrigger value="preview" disabled={isNew}>Preview do Contrato</TabsTrigger>
          </TabsList>

          {/* DADOS */}
          <TabsContent value="dados" className="space-y-6">
            {contrato.observacoes_cliente ? (
              <section className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4 space-y-1">
                <h3 className="text-sm font-bold text-yellow-900">⚠️ Cliente solicitou alteração</h3>
                <p className="text-sm text-yellow-900 whitespace-pre-wrap">{String(contrato.observacoes_cliente)}</p>
                <p className="text-xs text-yellow-700">Faça as correções na proposta abaixo e clique em &quot;Reenviar p/ Revisão&quot; no topo.</p>
              </section>
            ) : null}
            {(contrato.prospect_nome || contrato.prospect_email) ? (
              <section className="rounded-lg border-2 border-blue-300 bg-blue-50/60 p-5 space-y-2">
                <h3 className="text-sm font-bold text-blue-900">📋 Dados recebidos do solicitante (apenas leitura)</h3>
                <div className="grid gap-x-6 gap-y-1 text-sm md:grid-cols-2">
                  <ProspectLinha k="Tipo" v={String(contrato.prospect_tipo_pessoa ?? "")} />
                  <ProspectLinha k="Nome" v={String(contrato.prospect_nome ?? "")} />
                  <ProspectLinha k="CPF/CNPJ" v={String(contrato.prospect_cpf_cnpj ?? "")} />
                  <ProspectLinha k="RG" v={String(contrato.prospect_rg ?? "")} />
                  <ProspectLinha k="Estado civil" v={String(contrato.prospect_estado_civil ?? "")} />
                  <ProspectLinha k="Profissão" v={String(contrato.prospect_profissao ?? "")} />
                  <ProspectLinha k="E-mail" v={String(contrato.prospect_email ?? "")} />
                  <ProspectLinha k="WhatsApp" v={String(contrato.prospect_whatsapp ?? contrato.prospect_telefone ?? "")} />
                  <ProspectLinha k="Endereço residencial" v={`${contrato.prospect_endereco ?? ""} — ${contrato.prospect_cidade ?? ""}/${contrato.prospect_estado ?? ""} CEP ${contrato.prospect_cep ?? ""}`} />
                  <ProspectLinha k="Endereço da obra" v={String(contrato.prospect_endereco_obra ?? "—")} />
                  <ProspectLinha k="Terreno" v={`${contrato.prospect_tamanho_terreno ?? "—"} m² (${contrato.prospect_tipo_terreno ?? "—"})`} />
                  <ProspectLinha k="Área a construir" v={`${contrato.prospect_area_construir ?? "—"} m²`} />
                  <ProspectLinha k="Pavimentos" v={String(contrato.prospect_pavimentos ?? "—")} />
                  <ProspectLinha k="Sistema desejado" v={String(contrato.prospect_sistema_preferido ?? "")} />
                  <ProspectLinha k="Serviço desejado" v={String(contrato.prospect_servico_preferido ?? "")} />
                  <ProspectLinha k="Plano câmera" v={String(contrato.prospect_camera_preferida ?? "")} />
                  <ProspectLinha k="Prazo desejado" v={String(contrato.prospect_prazo_desejado ?? "")} />
                  <ProspectLinha k="Já possui projeto?" v={contrato.prospect_ja_possui_projeto ? "Sim" : "Não"} />
                  <ProspectLinha k="Quer projeto pela F&M?" v={contrato.prospect_quer_projeto ? "Sim" : "Não"} />
                  {contrato.prospect_conjuge_nome ? (
                    <>
                      <ProspectLinha k="Cônjuge — Nome" v={String(contrato.prospect_conjuge_nome)} />
                      <ProspectLinha k="Cônjuge — CPF" v={String(contrato.prospect_conjuge_cpf ?? "—")} />
                      <ProspectLinha k="Cônjuge — RG" v={String(contrato.prospect_conjuge_rg ?? "—")} />
                      <ProspectLinha k="Cônjuge — Profissão" v={String(contrato.prospect_conjuge_profissao ?? "—")} />
                    </>
                  ) : null}
                  {contrato.prospect_observacoes ? (
                    <ProspectLinha k="Observações" v={String(contrato.prospect_observacoes)} />
                  ) : null}
                </div>
              </section>
            ) : null}

            <Section title="Cliente e Numeração">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Cliente">
                  <Select value={(contrato.cliente_id as string) || ""} onValueChange={(v) => setC({ cliente_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome} ({c.codigo})</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Número do Contrato"><Input value={(contrato.numero as string) || ""} onChange={(e) => setC({ numero: e.target.value })} /></Field>
              </div>
            </Section>

            <Section title="Modalidade">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  ["modalidade_empreitada_mista", "Empreitada Mista"],
                  ["modalidade_empreitada_mo", "Empreitada MO"],
                  ["modalidade_gerenciamento", "Gerenciamento"],
                  ["modalidade_ambos", "Ambos"],
                ].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={Boolean(contrato[k])} onCheckedChange={(v) => setC({ [k]: Boolean(v) })} /> {l}
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Tipo de Obra">
              <div className="grid grid-cols-3 gap-2">
                {[["tipo_construcao", "Construção"], ["tipo_reforma", "Reforma"], ["tipo_ampliacao", "Ampliação"]].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={Boolean(contrato[k])} onCheckedChange={(v) => setC({ [k]: Boolean(v) })} /> {l}
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Sistema e Serviço">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Sistema Construtivo">
                  <RadioGroup value={(contrato.sistema_construtivo as string) || ""} onValueChange={(v) => onSistemaServicoChange(v, contrato.tipo_servico as string)}>
                    {["IBPP", "Alvenaria", "ICF"].map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm"><RadioGroupItem value={s} /> {s}</label>
                    ))}
                  </RadioGroup>
                </Field>
                <Field label="Tipo de Serviço">
                  <RadioGroup value={(contrato.tipo_servico as string) || ""} onValueChange={(v) => onSistemaServicoChange(contrato.sistema_construtivo as string, v)}>
                    {["F&M TOTAL", "F&M GESTÃO", "F&M ESSENCIAL", "Só Gestão"].map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm"><RadioGroupItem value={s} /> {s}</label>
                    ))}
                  </RadioGroup>
                </Field>
              </div>
            </Section>

            <Section title="Área, Câmera e Databook">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Área (m²)"><Input type="number" value={String(contrato.area_m2 ?? "")} onChange={(e) => setC({ area_m2: Number(e.target.value) })} /></Field>
                <Field label="Valor m² (R$)"><Input type="number" value={String(contrato.valor_m2 ?? "")} onChange={(e) => setC({ valor_m2: Number(e.target.value) })} /></Field>
                <Field label="Databook Eletrônico (3%)">
                  <div className="flex items-center gap-2"><Switch checked={Boolean(contrato.databook_eletronico)} onCheckedChange={(v) => setC({ databook_eletronico: v })} /> <span className="text-sm">{contrato.databook_eletronico ? "Sim" : "Não"}</span></div>
                </Field>
              </div>
              <Field label="Plano de Câmera">
                <RadioGroup value={(contrato.plano_camera as string) || "sem_camera"} onValueChange={(v) => setC({ plano_camera: v })}>
                  {(Object.keys(PLANOS_CAMERA) as (keyof typeof PLANOS_CAMERA)[]).map((k) => (
                    <label key={k} className="flex items-center gap-2 text-sm"><RadioGroupItem value={k} /> {PLANOS_CAMERA[k].label}</label>
                  ))}
                </RadioGroup>
              </Field>
            </Section>

            <Section title="Prazo">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Data de Início"><Input type="date" value={(contrato.data_inicio as string) || ""} onChange={(e) => setC({ data_inicio: e.target.value })} /></Field>
                <Field label="Prazo (dias)"><Input type="number" value={String(contrato.prazo_dias ?? "")} onChange={(e) => setC({ prazo_dias: Number(e.target.value) })} /></Field>
                <Field label="Previsão de Fim"><Input value={fmtData(contrato.data_previsao_fim as string)} disabled /></Field>
              </div>
            </Section>

            <Section title="Valores (calculado automaticamente)">
              <div className="grid gap-2 rounded-md border bg-slate-50 p-4 text-sm md:grid-cols-2">
                <div>Valor serviço: <strong>{brl(Number(contrato.valor_servico || 0))}</strong></div>
                <div>Valor câmera: <strong>{brl(Number(contrato.valor_camera || 0))}</strong></div>
                <div>Valor databook: <strong>{brl(Number(contrato.valor_databook || 0))}</strong></div>
                <div className="text-base">TOTAL: <strong className="text-emerald-700">{brl(Number(contrato.valor_total || 0))}</strong></div>
                <div>Adiantamento 15%: <strong>{brl(Number(contrato.valor_adiantamento || 0))}</strong></div>
              </div>
              <Field label="Observações"><Textarea rows={3} value={(contrato.observacoes as string) || ""} onChange={(e) => setC({ observacoes: e.target.value })} /></Field>
            </Section>

            <Section title="Equipe F&M">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Gerente"><Input value={(contrato.gerente_nome as string) || ""} onChange={(e) => setC({ gerente_nome: e.target.value })} /></Field>
                <Field label="Cargo"><Input value={(contrato.gerente_cargo as string) || ""} onChange={(e) => setC({ gerente_cargo: e.target.value })} /></Field>
                <Field label="WhatsApp"><Input value={(contrato.gerente_whatsapp as string) || ""} onChange={(e) => setC({ gerente_whatsapp: e.target.value })} /></Field>
                <Field label="Responsável Técnico"><Input value={(contrato.responsavel_tecnico as string) || ""} onChange={(e) => setC({ responsavel_tecnico: e.target.value })} /></Field>
                <Field label="CREA"><Input value={(contrato.crea as string) || ""} onChange={(e) => setC({ crea: e.target.value })} /></Field>
              </div>
            </Section>
          </TabsContent>

          {/* FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Card label="Total Orçado" value={brl(totaisFin.orcado)} />
              <Card label="Total Pago" value={brl(totaisFin.pago)} color="text-emerald-700" />
              <Card label="Saldo" value={brl(totaisFin.saldo)} />
              <Card label="% Executado" value={`${totaisFin.pct.toFixed(1)}%`} />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Medições Semanais</h3>
              <Button onClick={addMedicao}><Plus className="mr-1 h-4 w-4" /> Lançar Medição</Button>
            </div>

            <div className="rounded-lg border bg-white">
              {medicoes.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">Nenhuma medição lançada.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Semana</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-3">Vencimento</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicoes.map((m) => {
                      const st = statusFinanceiro(m as { status?: string; data_vencimento?: string });
                      return (
                        <tr key={String(m.id)} className="border-b last:border-0">
                          <td className="p-2"><Input type="date" value={(m.semana_referencia as string) || ""} onChange={(e) => updMedicao(String(m.id), { semana_referencia: e.target.value })} className="h-8" /></td>
                          <td className="p-2"><Input value={(m.descricao as string) || ""} onChange={(e) => updMedicao(String(m.id), { descricao: e.target.value })} className="h-8" /></td>
                          <td className="p-2"><Input type="number" value={String(m.valor ?? "")} onChange={(e) => updMedicao(String(m.id), { valor: Number(e.target.value) })} className="h-8 w-32 text-right" /></td>
                          <td className="p-2"><Input type="date" value={(m.data_vencimento as string) || ""} onChange={(e) => updMedicao(String(m.id), { data_vencimento: e.target.value })} className="h-8" /></td>
                          <td className="p-2"><span className="rounded px-2 py-0.5 text-xs text-white" style={{ background: FIN_COLORS[st] }}>{FIN_LABELS[st]}</span></td>
                          <td className="p-2 text-right">
                            {m.status !== "pago" && <Button size="sm" variant="outline" onClick={() => setPagModal(String(m.id))}><Check className="h-3 w-3 mr-1" />Marcar Pago</Button>}
                            {m.comprovante_url ? <Button size="icon" variant="ghost" onClick={() => verComprovante(String(m.comprovante_url))}><Eye className="h-4 w-4 text-slate-600" /></Button> : null}
                            <Button size="icon" variant="ghost" onClick={() => delMedicao(String(m.id))}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* ADITIVOS */}
          <TabsContent value="aditivos" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Aditivos</h3>
              <Button onClick={addAditivo}><Plus className="mr-1 h-4 w-4" /> Novo Aditivo</Button>
            </div>
            <div className="rounded-lg border bg-white">
              {aditivos.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">Nenhum aditivo.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr><th className="p-3">Descrição</th><th className="p-3">Área m²</th><th className="p-3">Valor m²</th><th className="p-3">Total</th><th className="p-3">Prazo +</th><th></th></tr>
                  </thead>
                  <tbody>
                    {aditivos.map((a) => (
                      <tr key={String(a.id)} className="border-b last:border-0">
                        <td className="p-2"><Input value={(a.descricao as string) || ""} onChange={(e) => updAditivo(String(a.id), { descricao: e.target.value })} className="h-8" /></td>
                        <td className="p-2"><Input type="number" value={String(a.area_m2 ?? "")} onChange={(e) => { const v = Number(e.target.value); updAditivo(String(a.id), { area_m2: v, valor_total: v * Number(a.valor_m2 || 0) }); }} className="h-8 w-24" /></td>
                        <td className="p-2"><Input type="number" value={String(a.valor_m2 ?? "")} onChange={(e) => { const v = Number(e.target.value); updAditivo(String(a.id), { valor_m2: v, valor_total: Number(a.area_m2 || 0) * v }); }} className="h-8 w-28" /></td>
                        <td className="p-2 font-semibold">{brl(Number(a.valor_total || 0))}</td>
                        <td className="p-2"><Input type="number" value={String(a.prazo_adicional_dias ?? "")} onChange={(e) => updAditivo(String(a.id), { prazo_adicional_dias: Number(e.target.value) })} className="h-8 w-20" /></td>
                        <td className="p-2 text-right"><Button size="icon" variant="ghost" onClick={() => delAditivo(String(a.id))}><Trash2 className="h-4 w-4 text-rose-600" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* ASSINATURA */}
          <TabsContent value="assinatura" className="space-y-4">
            <div className="rounded-lg border bg-white p-6 space-y-4">
              <h3 className="font-semibold">Status do Contrato</h3>
              <Timeline status={status} />
              {contrato.assinatura_cliente ? (
                <div className="space-y-2">
                  <Label>Assinatura do Cliente ({fmtData(contrato.assinatura_cliente_data as string)})</Label>
                  <img src={contrato.assinatura_cliente as string} alt="assinatura cliente" className="h-32 rounded border bg-white" />
                </div>
              ) : (
                <p className="text-sm text-slate-500">Cliente ainda não assinou.</p>
              )}
              {contrato.assinatura_fm ? (
                <div className="space-y-2">
                  <Label>Assinatura F&M ({fmtData(contrato.assinatura_fm_data as string)})</Label>
                  <img src={contrato.assinatura_fm as string} alt="assinatura fm" className="h-32 rounded border bg-white" />
                </div>
              ) : status === "aguardando_fm" ? (
                <div className="space-y-2">
                  <Label>Assinar como F&M</Label>
                  <SignaturePad ref={fmPadRef} />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={assinarFM} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                      {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Assinar Contrato
                    </Button>
                    {empresa.assinatura_fm_default && (
                      <Button variant="outline" onClick={usarAssinaturaPadrao} disabled={saving}>
                        <Check className="mr-1 h-4 w-4" /> Usar assinatura padrão
                      </Button>
                    )}
                  </div>
                  {!empresa.assinatura_fm_default && (
                    <p className="text-xs text-slate-500">Dica: cadastre sua assinatura padrão em <Link to="/admin/configuracoes" className="text-blue-600 underline">/admin/configuracoes</Link> para reutilizar com um clique.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Aguardando o cliente assinar para liberar a assinatura F&M.</p>
              )}
            </div>
          </TabsContent>

          {/* PREVIEW */}
          <TabsContent value="preview">
            <div id="contrato-preview" className="rounded-lg border bg-white p-8">
              <ContratoTexto c={contrato} empresa={empresa} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      {pagModal && (
        <MarcarPagoModal
          open={!!pagModal}
          onClose={() => setPagModal(null)}
          lancamentoId={pagModal}
          contratoId={id}
          onSaved={(patch) => setMedicoes((arr) => arr.map((m) => m.id === pagModal ? { ...m, ...patch } : m))}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-slate-600">{label}</Label>{children}</div>;
}
function Card({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return <div className="rounded-md border bg-white p-3"><div className="text-xs text-slate-500">{label}</div><div className={`text-lg font-bold ${color}`}>{value}</div></div>;
}
function ProspectLinha({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-blue-100 py-1 last:border-0">
      <span className="text-blue-900/70">{k}</span>
      <span className="font-medium text-blue-950">{v || "—"}</span>
    </div>
  );
}
function Timeline({ status }: { status: ContratoStatus }) {
  const steps: ContratoStatus[] = ["rascunho", "aguardando_cliente", "aguardando_fm", "assinado"];
  const idx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <div className={`h-2 flex-1 rounded ${i <= idx ? "" : "bg-slate-200"}`} style={i <= idx ? { background: STATUS_COLORS[s] } : {}} />
          <span className="text-xs">{STATUS_LABELS[s]}</span>
        </div>
      ))}
    </div>
  );
}