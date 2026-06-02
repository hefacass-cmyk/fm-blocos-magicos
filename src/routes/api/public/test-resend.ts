import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/test-resend")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const to = url.searchParams.get("to") || "delivered@resend.dev";
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          return Response.json({ ok: false, error: "RESEND_API_KEY ausente" }, { status: 500 });
        }
        const resetUrl = "https://www.fmsmartbuild.com.br/reset-senha/teste-token-abc";
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: "F&M Construções <onboarding@resend.dev>",
            to: [to],
            subject: "Teste · Reset de senha F&M",
            html: `<p>Teste de envio Resend.</p><p><a href="${resetUrl}">Link de reset (teste)</a></p>`,
            text: `Teste. Link: ${resetUrl}`,
          }),
        });
        const body = await res.text();
        return Response.json({
          ok: res.ok,
          status: res.status,
          body: body.slice(0, 400),
          to,
          keyPrefix: apiKey.slice(0, 6),
        });
      },
    },
  },
});