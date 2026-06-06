import { fmSupabase } from "./fm-supabase";

export const ADMIN_KEY = "fm_admin_auth";

export async function checkIsAdmin(): Promise<boolean> {
  const { data: u } = await fmSupabase.auth.getUser();
  if (!u?.user) return false;
  const { data, error } = await fmSupabase.rpc("is_admin");
  if (error) return false;
  return Boolean(data);
}

export async function signInAdmin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await fmSupabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    await fmSupabase.auth.signOut();
    return { ok: false, error: "Usuário sem permissão de admin." };
  }
  try { sessionStorage.setItem(ADMIN_KEY, "1"); } catch { /* ignore */ }
  return { ok: true };
}

export async function signOutAdmin() {
  try { sessionStorage.removeItem(ADMIN_KEY); } catch { /* ignore */ }
  await fmSupabase.auth.signOut();
}

/**
 * Restaura o flag de sessão admin se houver sessão Supabase válida com role admin.
 * Chamado no root para evitar bounce após F5.
 */
export async function restoreAdminSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(ADMIN_KEY) === "1") return true;
  const { data } = await fmSupabase.auth.getSession();
  if (!data.session) return false;
  const ok = await checkIsAdmin();
  if (ok) { try { sessionStorage.setItem(ADMIN_KEY, "1"); } catch { /* ignore */ } }
  return ok;
}