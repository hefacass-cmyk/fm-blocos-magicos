import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FROM = "F&M Smart Build <onboarding@resend.dev>";
const DEST = "fmconstrucoesinteligentes@gmail.com";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const enviarSolicitacaoCodigo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      nome: z.string().trim().min(2).max(120),
      cpfCnpj: z.string().trim().min(11).max(20),
      whatsapp: z.string().trim().min(8).max(30),
    }).parse,
  )
  .handler(async ({ data }) => {
    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Bahia" });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { ok: false, error: "RESEND_API_KEY ausente" };

    const html =
      `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#222">` +
      `<div style="background:#1A4D7A;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">` +
      `<h1 style="margin:0;font-size:20px">Solicitação de Código de Cliente</h1></div>` +
      `<div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px;background:#fff">` +
      `<p>Nova solicitação de código recebida pelo site F&amp;M Smart Build.</p>` +
      `<table style="width:100%;border-collapse:collapse;font-size:14px">` +
      `<tr><td style="padding:6px 0"><b>Nome</b></td><td>${esc(data.nome)}</td></tr>` +
      `<tr><td style="padding:6px 0"><b>CPF/CNPJ</b></td><td>${esc(data.cpfCnpj)}</td></tr>` +
      `<tr><td style="padding:6px 0"><b>WhatsApp</b></td><td>${esc(data.whatsapp)}</td></tr>` +
      `<tr><td style="padding:6px 0"><b>Data/hora</b></td><td>${esc(dataHora)}</td></tr>` +
      `</table></div></div>`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: FROM,
          to: [DEST],
          subject: "Solicitação de Código de Cliente",
          html,
          text:
            `Nova solicitação de código de cliente.\n\n` +
            `Nome: ${data.nome}\nCPF/CNPJ: ${data.cpfCnpj}\nWhatsApp: ${data.whatsapp}\n` +
            `Recebido em: ${dataHora}`,
        }),
      });
      if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });