import { createClient } from "@supabase/supabase-js";

// Conexão direta ao Supabase externo do cliente F&M.
// A anon/publishable key é pública por design (RLS protege os dados).
const SUPABASE_URL = "https://hdjlwidfnikbahfhrkil.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_a5Nuz82MbLRzOZ-Bc3Xuhg_UFSKrdka";

export const fmSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "fm-supabase-auth",
  },
});

const STORAGE_KEY = "fm_cliente_logado";

export interface ClienteLogado {
  id?: string | number;
  codigo_cliente: string;
  codigo?: string | null;
  cpf_cnpj: string;
  nome?: string | null;
  obra_nome?: string | null;
  [key: string]: unknown;
}

export function saveCliente(c: ClienteLogado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function getCliente(): ClienteLogado | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClienteLogado) : null;
  } catch {
    return null;
  }
}

export function clearCliente() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Retorna apenas dígitos do CPF/CNPJ. */
export function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}