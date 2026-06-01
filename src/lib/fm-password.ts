import { fmSupabase } from "./fm-supabase";

/** PBKDF2-SHA256 via Web Crypto. Formato: pbkdf2$<iter>$<saltB64>$<hashB64> */
const ITER = 100_000;

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITER },
    key,
    256,
  );
  return b64(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return `pbkdf2$${ITER}$${b64(salt.buffer as ArrayBuffer)}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [alg, iterStr, saltB64, hashB64] = stored.split("$");
    if (alg !== "pbkdf2") return false;
    const salt = unb64(saltB64);
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: Number(iterStr) },
      key,
      256,
    );
    return b64(bits) === hashB64;
  } catch {
    return false;
  }
}

/** Gera token URL-safe de 32 bytes. */
export function generateToken(): string {
  const buf = crypto.getRandomValues(new Uint8Array(32));
  return b64(buf.buffer as ArrayBuffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const TOKEN_TTL_HOURS = 2;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export interface ResetTokenRow {
  id: string;
  parceiro_id: string;
  token: string;
  email: string;
  criado_em: string;
  expira_em: string;
  usado: boolean;
  usado_em: string | null;
}

export async function countRecentAttempts(email: string): Promise<number> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await fmSupabase
    .from("password_reset_tokens")
    .select("id", { count: "exact", head: true })
    .eq("email", email.toLowerCase())
    .gte("criado_em", since);
  return count ?? 0;
}

export function buildResetUrl(token: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.fmsmartbuild.com.br";
  return `${base}/reset-senha/${token}`;
}

export async function logTentativa(
  tipo: string,
  descricao: string,
) {
  try {
    await fmSupabase
      .from("logs_admin")
      .insert({ tipo, descricao, origem: "password-reset" });
  } catch {
    /* ignore */
  }
}