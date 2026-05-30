import { fmSupabase } from "./fm-supabase";

const STORAGE_KEY = "fm_parceiro_logado";

export interface ParceiroLogado {
  id?: string | number;
  Nome?: string | null;
  Especialidade?: string | null;
  Cidade?: string | null;
  Whatsapp?: string | null;
  Cpf_cnpj?: string | null;
  Status?: string | null;
  Foto_url?: string | null;
  [key: string]: unknown;
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