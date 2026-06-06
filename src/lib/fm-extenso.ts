// Converte um número de reais (R$) em sua representação por extenso em português.
// Suporta valores até bilhões. Trata centavos.

const UNI = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CEN = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const d = Math.floor(r / 10);
  const u = r % 10;
  const parts: string[] = [];
  if (c > 0) parts.push(CEN[c]);
  if (r >= 10 && r <= 19) parts.push(DEZ_A_DEZENOVE[r - 10]);
  else {
    if (d > 0) parts.push(DEZ[d]);
    if (u > 0) parts.push(UNI[u]);
  }
  return parts.join(" e ");
}

function inteiroExtenso(n: number): string {
  if (n === 0) return "zero";
  const bil = Math.floor(n / 1_000_000_000);
  const mil2 = Math.floor((n % 1_000_000_000) / 1_000_000);
  const mil = Math.floor((n % 1_000_000) / 1000);
  const u = n % 1000;
  const parts: string[] = [];
  if (bil > 0) parts.push(`${ate999(bil)} ${bil === 1 ? "bilhão" : "bilhões"}`);
  if (mil2 > 0) parts.push(`${ate999(mil2)} ${mil2 === 1 ? "milhão" : "milhões"}`);
  if (mil > 0) parts.push(`${mil === 1 ? "mil" : ate999(mil) + " mil"}`);
  if (u > 0) parts.push(ate999(u));
  return parts.join(" e ").replace(/\s+/g, " ").trim();
}

export function valorPorExtenso(valor: number): string {
  if (!isFinite(valor) || valor <= 0) return "zero reais";
  const inteiro = Math.floor(valor);
  const cent = Math.round((valor - inteiro) * 100);
  const partes: string[] = [];
  if (inteiro > 0) partes.push(`${inteiroExtenso(inteiro)} ${inteiro === 1 ? "real" : "reais"}`);
  if (cent > 0) partes.push(`${inteiroExtenso(cent)} ${cent === 1 ? "centavo" : "centavos"}`);
  return partes.join(" e ") || "zero reais";
}