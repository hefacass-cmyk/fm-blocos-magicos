import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/test-resend")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const to = url.searchParams.get("to") || "delivered@resend.dev";
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ ok: false, error: "RESEND_API_KEY ausente" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        const resetUrl = "https://www.fmsmartbuild.com.br/reset-senha/test-token-123";
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: "F&M Construções <onboarding@resend.dev>",
            to: [to],
            subject: "Teste · Redefinição de senha F&M",
            html: `<p>Teste de envio Resend.</p><p><a href="${resetUrl}">Link de reset (teste)</a></p>`,
            text: `Teste de envio. Link: ${resetUrl}`,
          }),
        });
        const body = await res.text();
        return new Response(
          JSON.stringify({ ok: res.ok, status: res.status, body: body.slice(0, 400), to }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});