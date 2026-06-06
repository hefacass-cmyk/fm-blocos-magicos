import { fmSupabase } from "./fm-supabase";

export type ContratoStatus =
  | "rascunho"
  | "aguardando_cliente"
  | "dados_cliente_enviados"
  | "aguardando_revisao"
  | "em_revisao"
  | "aguardando_fm"
  | "assinado_cliente"
  | "assinado"
  | "cancelado";
export type SistemaConstrutivo = "IBPP" | "Alvenaria" | "ICF";
export type TipoServico = "F&M TOTAL" | "F&M GESTÃO" | "F&M ESSENCIAL" | "Só Gestão";
export type PlanoCamera = "sem_camera" | "live" | "live_pro";
export type FinanceiroStatus = "pendente" | "pago" | "atrasado";

export const STATUS_LABELS: Record<ContratoStatus, string> = {
  rascunho: "Rascunho",
  aguardando_cliente: "Aguardando Cliente",
  dados_cliente_enviados: "Dados Recebidos",
  aguardando_revisao: "Aguardando Revisão",
  em_revisao: "Alteração Solicitada",
  aguardando_fm: "Aguardando F&M",
  assinado_cliente: "Assinado p/ Cliente",
  assinado: "Assinado",
  cancelado: "Cancelado",
};

export const STATUS_COLORS: Record<ContratoStatus, string> = {
  rascunho: "#94a3b8",
  aguardando_cliente: "#F4B941",
  dados_cliente_enviados: "#3B82F6",
  aguardando_revisao: "#F4B941",
  em_revisao: "#ef4444",
  aguardando_fm: "#3B82F6",
  assinado_cliente: "#06A77D",
  assinado: "#06A77D",
  cancelado: "#ef4444",
};

/** Retorna o caminho público da etapa atual do fluxo de contrato. */
export function linkPublicoEtapa(status: string | null | undefined, token: string): string {
  switch (status) {
    case "aguardando_revisao":
    case "em_revisao":
      return `/contrato/revisar/${token}`;
    case "assinado_cliente":
    case "assinado":
      return `/contrato/revisar/${token}`;
    case "dados_cliente_enviados":
      return `/contrato/revisar/${token}`;
    default:
      return `/contrato/dados/${token}`;
  }
}

export const FIN_LABELS: Record<FinanceiroStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
};

export const FIN_COLORS: Record<FinanceiroStatus, string> = {
  pendente: "#F4B941",
  pago: "#06A77D",
  atrasado: "#ef4444",
};

// Tabela de preços: [sistema][tipoServico] = R$/m²
export const TABELA_PRECOS: Record<SistemaConstrutivo, Partial<Record<TipoServico, number>>> = {
  IBPP: { "F&M TOTAL": 2800, "F&M GESTÃO": 800, "F&M ESSENCIAL": 1400, "Só Gestão": 600 },
  Alvenaria: { "F&M TOTAL": 2400, "F&M GESTÃO": 700, "F&M ESSENCIAL": 1200, "Só Gestão": 500 },
  ICF: { "F&M TOTAL": 3200, "F&M GESTÃO": 900, "F&M ESSENCIAL": 1600, "Só Gestão": 700 },
};

export const PLANOS_CAMERA: Record<PlanoCamera, { label: string; valor: number }> = {
  sem_camera: { label: "Sem Câmera", valor: 0 },
  live: { label: "F&M Live – R$540/mês", valor: 540 },
  live_pro: { label: "F&M Live Pro – R$1.440 setup + R$300/mês", valor: 1740 },
};

export function precoM2(sistema?: string | null, servico?: string | null): number {
  if (!sistema || !servico) return 0;
  return TABELA_PRECOS[sistema as SistemaConstrutivo]?.[servico as TipoServico] ?? 0;
}

export function calcularValores(d: {
  area_m2?: number | null;
  valor_m2?: number | null;
  plano_camera?: string | null;
  databook_eletronico?: boolean | null;
}) {
  const area = Number(d.area_m2 || 0);
  const vm2 = Number(d.valor_m2 || 0);
  const valor_servico = area * vm2;
  const valor_camera = PLANOS_CAMERA[(d.plano_camera as PlanoCamera) || "sem_camera"]?.valor ?? 0;
  const valor_databook = d.databook_eletronico ? valor_servico * 0.03 : 0;
  const valor_total = valor_servico + valor_camera + valor_databook;
  const valor_adiantamento = valor_total * 0.15;
  return { valor_servico, valor_camera, valor_databook, valor_total, valor_adiantamento };
}

export function calcularDataFim(inicio?: string | null, prazoDias?: number | null): string | null {
  if (!inicio || !prazoDias) return null;
  const d = new Date(inicio + "T00:00:00");
  d.setDate(d.getDate() + Number(prazoDias));
  return d.toISOString().slice(0, 10);
}

export function proximaSegunda(from = new Date()): string {
  const d = new Date(from);
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function gerarNumeroContrato(): Promise<string> {
  const ano = new Date().getFullYear();
  const { data } = await fmSupabase
    .from("contratos")
    .select("numero")
    .ilike("numero", `FM-%-${ano}`)
    .order("criado_em", { ascending: false });
  const nums = ((data as { numero?: string }[]) || [])
    .map((r) => Number((r.numero || "").match(/FM-(\d+)-/)?.[1] || 0))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `FM-${String(next).padStart(3, "0")}-${ano}`;
}

export function brl(v: number | null | undefined): string {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtData(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
  return dt.toLocaleDateString("pt-BR");
}

export function statusFinanceiro(r: { status?: string | null; data_vencimento?: string | null }): FinanceiroStatus {
  if (r.status === "pago") return "pago";
  if (r.data_vencimento && new Date(r.data_vencimento + "T23:59:59") < new Date()) return "atrasado";
  return "pendente";
}

export { fmSupabase };