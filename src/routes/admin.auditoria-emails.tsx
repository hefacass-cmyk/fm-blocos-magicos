import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw, Search, CheckCircle2, XCircle, Mail } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";

const BRAND_BLUE = "#1A4D7A";
const ADMIN_KEY = "fm_admin_auth";

interface LogRow {
  id: string;
  tipo: string | null;
  descricao: string | null;
  origem: string | null;
  criado_em: string;
}

type StatusEnvio = "sucesso" | "falha" | "gerado" | "outro";

interface LinhaAuditoria {
  id: string;
  quando: string;
  email: string;
  status: StatusEnvio;
  tipo: string;
  detalhe: string;
  erro?: string;
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;

function classificar(desc: string, tipo: string): { status: StatusEnvio; erro?: string } {
  const d = desc.toLowerCase();
  if (d.includes("falha no envio") || d.includes("falha")) {
    const m = desc.match(/\(([^)]*)\)/);
    return { status: "falha", erro: m?.[1] };
  }
  if (d.includes("enviou") || d.includes("enviado")) return { status: "sucesso" };
  if (tipo === "reset_admin" || d.includes("gerou link")) return { status: "gerado" };
  return { status: "outro" };
}

export const Route = createFileRoute("/admin/auditoria-emails")({
  head: () => ({ meta: [{ title: "Auditoria de emails · Admin F&M" }] }),
  component: AdminAuditoriaEmailsPage,
});

function AdminAuditoriaEmailsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [filtro, setFiltro] = useState("");
  const [statusSel, setStatusSel] = useState<"todos" | StatusEnvio>("todos");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") {
      navigate({ to: "/admin/login" });
      return;
    }
    void load();
  }, [navigate]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await fmSupabase
        .from("logs_admin")
        .select("id, tipo, descricao, origem, criado_em")
        .eq("origem", "password-reset")
        .order("criado_em", { ascending: false })
        .limit(500);
      setRows((data ?? []) as LogRow[]);
    } finally {
      setLoading(false);
    }
  }

  const linhas: LinhaAuditoria[] = useMemo(() => {
    return rows.map((r) => {
      const desc = r.descricao ?? "";
      const tipo = r.tipo ?? "";
      const email = desc.match(EMAIL_RE)?.[0]?.toLowerCase() ?? "—";
      const cls = classificar(desc, tipo);
      return {
        id: r.id,
        quando: r.criado_em,
        email,
        status: cls.status,
        tipo,
        detalhe: desc,
        erro: cls.erro,
      };
    });
  }, [rows]);

  const filtradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return linhas.filter((l) => {
      if (statusSel !== "todos" && l.status !== statusSel) return false;
      if (q && !(l.email.includes(q) || l.detalhe.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [linhas, filtro, statusSel]);

  const resumo = useMemo(() => {
    const r = { sucesso: 0, falha: 0, gerado: 0, outro: 0 };
    linhas.forEach((l) => { r[l.status]++; });
    return r;
  }, [linhas]);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao painel
            </Link>
            <h1 className="mt-2 text-2xl font-bold" style={{ color: BRAND_BLUE }}>
              Auditoria de emails · Esqueci a senha
            </h1>
            <p className="text-sm text-muted-foreground">
              Status de cada envio do Resend (sucesso, falha, link gerado) com timestamp e erro quando houver.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" /> Recarregar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Sucesso" value={resumo.sucesso} color="text-green-700" />
          <Card label="Falha" value={resumo.falha} color="text-red-700" />
          <Card label="Apenas gerado" value={resumo.gerado} color="text-yellow-700" />
          <Card label="Outros" value={resumo.outro} color="text-slate-700" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por email ou texto..."
              className="w-full rounded-lg border border-input bg-white px-9 py-2.5 text-sm"
            />
          </div>
          <select
            value={statusSel}
            onChange={(e) => setStatusSel(e.target.value as typeof statusSel)}
            className="rounded-lg border border-input bg-white px-3 py-2.5 text-sm"
          >
            <option value="todos">Todos os status</option>
            <option value="sucesso">Sucesso</option>
            <option value="falha">Falha</option>
            <option value="gerado">Apenas gerado</option>
            <option value="outro">Outros</option>
          </select>
        </div>

        <div className="rounded-xl border bg-white">
          <div className="border-b px-4 py-3 text-sm font-bold" style={{ color: BRAND_BLUE }}>
            Eventos ({filtradas.length})
          </div>
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtradas.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum evento encontrado.
            </div>
          ) : (
            <div className="divide-y text-xs">
              {filtradas.map((l) => (
                <div key={l.id} className="grid grid-cols-12 gap-2 px-4 py-3">
                  <div className="col-span-12 sm:col-span-3 text-muted-foreground">
                    {new Date(l.quando).toLocaleString("pt-BR")}
                  </div>
                  <div className="col-span-6 sm:col-span-3 truncate font-semibold">{l.email}</div>
                  <div className="col-span-6 sm:col-span-2"><StatusBadge status={l.status} /></div>
                  <div className="col-span-12 sm:col-span-4 text-slate-700">
                    <div className="truncate" title={l.detalhe}>{l.detalhe}</div>
                    {l.erro && (
                      <div className="mt-1 text-red-700">Erro: {l.erro}</div>
                    )}
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{l.tipo}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          <Mail className="mr-1 inline h-3 w-3" />
          A classificação é derivada da descrição registrada em <code>logs_admin</code> (origem <code>password-reset</code>).
        </p>
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-[11px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusEnvio }) {
  if (status === "sucesso")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
        <CheckCircle2 className="h-3 w-3" /> Sucesso
      </span>
    );
  if (status === "falha")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
        <XCircle className="h-3 w-3" /> Falha
      </span>
    );
  if (status === "gerado")
    return (
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800">
        Link gerado
      </span>
    );
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
      Outro
    </span>
  );
}