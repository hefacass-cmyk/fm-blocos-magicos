import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Envia o email de redefinição de senha via Resend.
 * RESEND_API_KEY é lido do ambiente do servidor.
 *
 * Remetente: por padrão `F&M Construções <onboarding@resend.dev>`
 * (domínio sandbox do Resend — funciona sem verificação).
 * Para usar `contato@fmsmartbuild.com.br`, verifique o domínio em
 * https://resend.com/domains e troque FROM abaixo.
 */
const FROM = "F&M Construções <onboarding@resend.dev>";

export const sendResetEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      to: z.string().email(),
      nome: z.string().max(120).optional(),
      resetUrl: z.string().url(),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "RESEND_API_KEY ausente no servidor." };
    }

    const nome = data.nome?.trim() || "parceiro";
    const subject = "Redefinição de senha · F&M Construções";
    const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222">
  <div style="background:#1A4D7A;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">
    <h1 style="margin:0;font-size:20px">F&amp;M Construções</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px;background:#fff">
    <p>Olá, <strong>${escapeHtml(nome)}</strong>,</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta de parceiro.</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${data.resetUrl}" style="background:#F4B941;color:#1A4D7A;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block">
        Criar nova senha
      </a>
    </p>
    <p style="font-size:13px;color:#555">Ou copie e cole este link no navegador:</p>
    <p style="word-break:break-all;font-size:12px;color:#1A4D7A">${data.resetUrl}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p style="font-size:12px;color:#888">
      Este link expira em <strong>2 horas</strong>. Se você não solicitou, ignore este email.
    </p>
  </div>
</div>`.trim();

    const text =
      `Olá, ${nome}.\n\nRedefina sua senha em: ${data.resetUrl}\n\nO link expira em 2 horas.\nSe você não solicitou, ignore este email.\n\nF&M Construções`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: FROM,
          to: [data.to],
          subject,
          html,
          text,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[resend]", res.status, body);
        return { ok: false as const, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
      }
      const json = (await res.json()) as { id?: string };
      return { ok: true as const, id: json.id ?? null };
    } catch (err) {
      console.error("[resend] exception", err);
      return { ok: false as const, error: (err as Error).message };
    }
  });

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}