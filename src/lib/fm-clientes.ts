import { fmSupabase } from "./fm-supabase";

export type TipoPessoa = "PF" | "PJ";
export type ObraStatus = "orcamento" | "iniciando" | "andamento" | "finalizando";
export type EtapaStatus = "pendente" | "em_andamento" | "concluida";
export type DocTipo = "contrato" | "planta" | "orcamento" | "nota_fiscal" | "outro";

export const STATUS_LABELS: Record<ObraStatus, string> = {
  orcamento: "Orçamento",
  iniciando: "Obra Iniciando",
  andamento: "Obra em Andamento",
  finalizando: "Obra Finalizando",
};

export const STATUS_COLORS: Record<ObraStatus, string> = {
  orcamento: "#94a3b8",
  iniciando: "#F4B941",
  andamento: "#3B82F6",
  finalizando: "#06A77D",
};

export const DOC_TIPOS: { value: DocTipo; label: string }[] = [
  { value: "contrato", label: "Contrato" },
  { value: "planta", label: "Planta" },
  { value: "orcamento", label: "Orçamento" },
  { value: "nota_fiscal", label: "Nota Fiscal" },
  { value: "outro", label: "Outro" },
];

export function onlyDigits(v: string) { return (v || "").replace(/\D/g, ""); }

export function maskCpf(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function maskCnpj(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskCpfCnpj(v: string, tipo: TipoPessoa) {
  return tipo === "PF" ? maskCpf(v) : maskCnpj(v);
}

export function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3");
}

export function maskCep(v: string) {
  return onlyDigits(v).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

export async function viaCep(cep: string) {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    const j = await res.json();
    if (j.erro) return null;
    return {
      rua: j.logradouro || "",
      bairro: j.bairro || "",
      cidade: j.localidade || "",
      estado: j.uf || "",
    };
  } catch {
    return null;
  }
}

export function gerarCodigoCliente(nome: string, date = new Date()) {
  const primeiro = (nome || "CLIENTE")
    .trim()
    .split(/\s+/)[0]
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4).padEnd(4, "X");
  return `FM-${primeiro || "CLIENTE"}-${dd}${mm}${yyyy}-${random}`;
}

export { fmSupabase };