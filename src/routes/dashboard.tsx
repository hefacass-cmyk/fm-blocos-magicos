import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clock, Hammer, Camera, FileText, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard da Obra | F&M Construções Inteligentes" },
      { name: "description", content: "Acompanhe o progresso da sua obra em tempo real." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const etapas = [
    { nome: "Projeto Aprovado", status: "done", data: "12/03/2026" },
    { nome: "Fundação", status: "done", data: "28/03/2026" },
    { nome: "Estrutura IBPP", status: "doing", data: "Em andamento" },
    { nome: "Cobertura", status: "todo", data: "Previsto 15/06" },
    { nome: "Acabamentos", status: "todo", data: "Previsto 10/07" },
    { nome: "Entrega", status: "todo", data: "Previsto 30/07" },
  ];

  const progresso = 42;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 text-2xl font-extrabold tracking-tight">
              <span style={{ color: "#1A4D7A" }}>F</span>
              <span style={{ color: "#F4B941" }}>&</span>
              <span style={{ color: "#06A77D" }}>M</span>
            </div>
            <div className="hidden sm:block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Construções Inteligentes
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Sair
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Obra</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">Residência João Silva</h1>
              <p className="text-sm text-muted-foreground">Camaçari/BA · 180m² · Sistema IBPP</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código</p>
              <p className="mt-1 font-mono text-sm text-foreground">FM-JOÃO-20260529</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Progresso geral</span>
              <span className="text-2xl font-extrabold" style={{ color: "#06A77D" }}>{progresso}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progresso}%`, backgroundColor: "#06A77D" }}
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <Stat icon={<Clock className="h-5 w-5" />} label="Prazo restante" value="58 dias" color="#1A4D7A" />
          <Stat icon={<Hammer className="h-5 w-5" />} label="Etapa atual" value="Estrutura IBPP" color="#F4B941" />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="No prazo" value="Sim" color="#06A77D" />
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-bold text-foreground">Cronograma</h2>
          <ol className="mt-4 space-y-3">
            {etapas.map((e) => (
              <li key={e.nome} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full text-white text-xs font-bold"
                    style={{
                      backgroundColor:
                        e.status === "done" ? "#06A77D" : e.status === "doing" ? "#F4B941" : "#cbd5e1",
                    }}
                  >
                    {e.status === "done" ? "✓" : e.status === "doing" ? "•" : ""}
                  </div>
                  <span className="font-medium text-foreground">{e.nome}</span>
                </div>
                <span className="text-sm text-muted-foreground">{e.data}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <Action icon={<Camera className="h-5 w-5" />} title="Fotos da obra" desc="Veja as últimas atualizações" />
          <Action icon={<FileText className="h-5 w-5" />} title="Documentos" desc="Contratos e medições" />
          <Action icon={<MessageCircle className="h-5 w-5" />} title="Falar com gerente" desc="WhatsApp direto" />
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Action({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button className="text-left rounded-2xl bg-white p-5 shadow-sm border hover:border-primary/40 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
    </button>
  );
}