import { fmSupabase } from "./fm-supabase";

/** Insere um log em logs_admin (silencioso se a tabela não existir). */
export async function logAdmin(
  tipo: string,
  descricao: string,
  origem?: string,
) {
  try {
    await fmSupabase
      .from("logs_admin")
      .insert({ tipo, descricao, origem: origem ?? "site" });
  } catch {
    /* ignore */
  }
}

const ACESSO_KEY = "fm_acesso_logged";

/** Registra um acesso à rota (uma vez por sessão por rota). */
export async function trackAcesso(rota: string) {
  if (typeof window === "undefined") return;
  try {
    const key = `${ACESSO_KEY}:${rota}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    await fmSupabase.from("acessos_site").insert({ rota });
  } catch {
    /* ignore */
  }
}

/** Normaliza string para busca (lowercase, sem acento). */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}