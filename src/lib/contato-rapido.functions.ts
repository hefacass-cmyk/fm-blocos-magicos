import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FROM = "F&M Smart Build <onboarding@resend.dev>";
const DEST = "fmconstrucoesinteligentes@gmail.com";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const enviarContatoRapido = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      nome: z.string().min(2).max(120),
      email: z.string().email().max(200),
      telefone: z.string().min(4).max(30),
      whatsapp: z.string().max(30).optional().default(""),
      cidade: z.string().min(2).max(120),
      terreno: z.string().max(20).optional().default(""),
      tipos: z.array(z.string().max(80)).min(1).max(10),
    }),
  )
  .handler(async ({ data }) => {
    const tiposStr = data.tipos.join(", ");
    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Bahia" });
    const resumo =
      `Nome: ${data.nome}\n` +
      `E-mail: ${data.email}\n` +
      `Telefone: ${data.telefone}\n` +
      `WhatsApp: ${data.whatsapp || data.telefone}\n` +
      `Local: ${data.cidade}\n` +
      `Terreno: ${data.terreno || "—"} m²\n` +
      `Tipo: ${tiposStr}\n` +
      `Recebido em: ${dataHora}`;

    // 1) Email via Resend
    let emailOk = false; let emailErr: string | null = null;
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const html =
        `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#222">` +
        `<div style="background:#1A4D7A;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">` +
        `<h1 style="margin:0;font-size:20px">Novo pedido de orçamento</h1></div>` +
        `<div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px;background:#fff">` +
        `<p>Novo pedido de orçamento recebido pelo site F&amp;M Smart Build.</p>` +
        `<table style="width:100%;border-collapse:collapse;font-size:14px">` +
        `<tr><td style="padding:6px 0"><b>Nome</b></td><td>${escapeHtml(data.nome)}</td></tr>` +
        `<tr><td style="padding:6px 0"><b>E-mail</b></td><td>${escapeHtml(data.email)}</td></tr>` +
        `<tr><td style="padding:6px 0"><b>Telefone</b></td><td>${escapeHtml(data.telefone)}</td></tr>` +
        `<tr><td style="padding:6px 0"><b>WhatsApp</b></td><td>${escapeHtml(data.whatsapp || data.telefone)}</td></tr>` +
        `<tr><td style="padding:6px 0"><b>Local</b></td><td>${escapeHtml(data.cidade)}</td></tr>` +
        `<tr><td style="padding:6px 0"><b>Terreno</b></td><td>${escapeHtml(data.terreno || "—")} m²</td></tr>` +
        `<tr><td style="padding:6px 0"><b>Tipo</b></td><td>${escapeHtml(tiposStr)}</td></tr>` +
        `<tr><td style="padding:6px 0"><b>Data/hora</b></td><td>${escapeHtml(dataHora)}</td></tr>` +
        `</table></div></div>`;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            from: FROM,
            to: [DEST],
            reply_to: data.email,
            subject: `Novo pedido de orçamento — ${data.nome}`,
            html,
            text:
              `Novo pedido de orçamento recebido pelo site F&M Smart Build.\n\n${resumo}`,
          }),
        });
        emailOk = res.ok;
        if (!res.ok) emailErr = `Resend ${res.status}: ${(await res.text()).slice(0, 200)}`;
      } catch (e) {
        emailErr = (e as Error).message;
      }
    } else {
      emailErr = "RESEND_API_KEY ausente";
    }

    return { emailOk, emailErr, resumo };
  });