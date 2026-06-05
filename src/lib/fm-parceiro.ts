import { fmSupabase } from "./fm-supabase";

const STORAGE_KEY = "fm_parceiro_logado";

export type TipoParceiro = "PF" | "PJ";

export const ESPECIALIDADES = [
  "Engenheiro",
  "Arquiteto",
  "Mestre de Obra",
  "Pedreiro",
  "Ajudante Prático",
  "Ajudante",
  "Carpinteiro",
  "Marceneiro",
  "Eletricista",
  "Telhadista",
  "Sondagem",
  "Poço Artesiano",
  "Poço Semi-artesiano",
  "Gesseiro",
  "Pintor",
  "Outros",
] as const;

export const FM_WHATSAPP = "5571999154343";

export interface ParceiroLogado {
  id?: string | number;
  Tipo?: TipoParceiro;
  Nome?: string | null;
  Especialidade?: string | null;
  Cidade?: string | null;
  Whatsapp?: string | null;
  CPF?: string | null;
  CNPJ?: string | null;
  Status?: string | null;
  Foto_url?: string | null;
  [key: string]: unknown;
}

export function parseEspecialidades(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") {
    return v.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(-11).padStart(11, "0");
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

export function maskCnpj(v: string) {
  const d = v.replace(/\D/g, "");
  if (d.length !== 14) return v;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function saveParceiro(p: ParceiroLogado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function getParceiro(): ParceiroLogado | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ParceiroLogado) : null;
  } catch {
    return null;
  }
}

export function clearParceiro() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { fmSupabase };