import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fmSupabase, linkPublicoEtapa } from "@/lib/fm-contratos";

export const Route = createFileRoute("/contrato/$token")({
  head: () => ({ meta: [{ title: "Contrato · F&M" }] }),
  component: ContratoRedirectPage,
});

function ContratoRedirectPage() {
  const { token } = useParams({ from: "/contrato/$token" });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error } = await fmSupabase
        .from("contratos")
        .select("status")
        .eq("token_cliente", token)
        .maybeSingle();
      if (error || !data) { setErro(error?.message ?? "Contrato não encontrado para este link."); return; }
      const path = linkPublicoEtapa((data as { status?: string }).status, token);
      window.location.replace(path);
    })();
  }, [token]);

  if (erro) {
    return <div className="mx-auto max-w-xl p-6"><div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">{erro}</div></div>;
  }
  return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
}