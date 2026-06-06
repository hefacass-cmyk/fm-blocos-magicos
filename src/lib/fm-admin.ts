import { fmSupabase } from "./fm-supabase";

export const BRL = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const FM_BLUE = "#1A4D7A";
export const FM_YELLOW = "#F4B941";
export const FM_GREEN = "#06A77D";
export const FM_RED = "#DC2626";

export type StatusEfetivo = "pago" | "pendente" | "atrasado";

export function statusEfetivo(l: { status?: string | null; data_vencimento?: string | null }): StatusEfetivo {
  const s = (l.status || "").toLowerCase();
  if (s === "pago") return "pago";
  const venc = l.data_vencimento;
  if (venc) {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const d = new Date(venc + "T00:00:00");
    if (d < hoje) return "atrasado";
  }
  return "pendente";
}

/** Lê uma view de forma defensiva; se a view não existir devolve null. */
export async function lerView<T = Record<string, unknown>>(view: string): Promise<T[] | null> {
  try {
    const { data, error } = await fmSupabase.from(view).select("*");
    if (error) return null;
    return (data || []) as T[];
  } catch {
    return null;
  }
}

/** Upload em bucket público; devolve a URL pública. */
export async function uploadParaBucket(bucket: string, path: string, file: File): Promise<string> {
  const { error } = await fmSupabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: "3600",
  });
  if (error) throw error;
  const { data } = fmSupabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Gera URL assinada (bucket privado). */
export async function urlAssinada(bucket: string, path: string, expiresSec = 600): Promise<string> {
  const { data, error } = await fmSupabase.storage.from(bucket).createSignedUrl(path, expiresSec);
  if (error) throw error;
  return data.signedUrl;
}

export const WHATSAPP_FM = "https://wa.me/5571999454343";
