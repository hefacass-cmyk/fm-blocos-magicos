import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LogOut,
  Menu,
  X,
  Calendar,
  Users,
  Camera,
  Video,
  Wallet,
  CheckCircle2,
  MessageCircle,
  FileText,
  Phone,
} from "lucide-react";

const BRAND_BLUE = "#1A4D7A";
const BRAND_GREEN = "#06A77D";
const BRAND_YELLOW = "#F4B941";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Sua Obra em Camaçari | F&M Construções Inteligentes" },
      { name: "description", content: "Acompanhe o progresso da sua obra em tempo real." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const progresso = 72;
  const orcado = 250_000;
  const pago = 180_000;
  const saldo = orcado - pago;

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 text-xl font-extrabold tracking-tight">
              <span style={{ color: BRAND_BLUE }}>F</span>
              <span style={{ color: BRAND_YELLOW }}>&</span>
              <span style={{ color: BRAND_GREEN }}>M</span>
            </div>
            <h1
              className="text-sm sm:text-lg font-bold leading-tight"
              style={{ color: BRAND_BLUE }}
            >
              Sua Obra em Camaçari
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <LogOut className="h-4 w-4" /> Sair
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border text-muted-foreground"
              aria-label="Abrir menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t bg-white px-4 py-3 space-y-2">
            <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <LogOut className="h-4 w-4" /> Sair
            </Link>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* SEÇÃO 1 — PROGRESSO */}
        <section
          className="rounded-2xl p-6 shadow-lg text-white"
          style={{
            background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #0f3558 100%)`,
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">
            Progresso da Obra
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <span className="text-6xl font-extrabold leading-none" style={{ color: BRAND_GREEN }}>
              {progresso}%
            </span>
            <span className="text-sm text-white/80 pb-2">concluído</span>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progresso}%`, backgroundColor: BRAND_GREEN }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs uppercase tracking-wider text-white/60">Início</p>
              <p className="mt-1 font-semibold">12/03/2026</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs uppercase tracking-wider text-white/60">Prazo esperado</p>
              <p className="mt-1 font-semibold">30/07/2026</p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2 — HOJE NA OBRA */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-bold text-foreground">O que acontece hoje?</h2>
          <div className="mt-4 flex items-start gap-4">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              <Calendar className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-foreground">Concretagem da laje 02</p>
              <p className="mt-1 text-sm text-muted-foreground">Sábado, 30 de maio · 07h às 17h</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
                <Users className="h-4 w-4" style={{ color: BRAND_GREEN }} />
                8 profissionais no canteiro
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3 — AÇÕES RÁPIDAS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="flex items-center justify-center gap-3 rounded-2xl px-5 py-5 text-base font-bold text-white shadow-md hover:opacity-95 active:scale-[0.98] transition"
            style={{ backgroundColor: BRAND_GREEN }}
          >
            <Camera className="h-5 w-5" />
            VER FOTOS DA SEMANA
          </button>
          <button
            className="flex items-center justify-center gap-3 rounded-2xl px-5 py-5 text-base font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition"
            style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
          >
            <Video className="h-5 w-5" />
            CÂMERA AO VIVO
          </button>
        </section>

        {/* SEÇÃO 4 — FINANCEIRO */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-lg text-white"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Financeiro</h2>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FinanceItem label="Orçado" value={fmt(orcado)} color={BRAND_BLUE} />
            <FinanceItem label="Pago" value={fmt(pago)} color={BRAND_GREEN} />
            <FinanceItem label="Saldo" value={fmt(saldo)} color={BRAND_YELLOW} />
          </div>
          <div className="mt-5">
            <div className="flex items-end justify-between mb-2 text-sm">
              <span className="font-semibold text-foreground">Execução financeira</span>
              <span className="font-bold" style={{ color: BRAND_GREEN }}>
                {Math.round((pago / orcado) * 100)}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(pago / orcado) * 100}%`, backgroundColor: BRAND_GREEN }}
              />
            </div>
          </div>
        </section>

        {/* SEÇÃO 5 — PRÓXIMAS ETAPAS */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-bold text-foreground">Próximas etapas</h2>
          <ol className="mt-4 space-y-3">
            {[
              { nome: "Cura do concreto", data: "31/05 — 03/06", done: false },
              { nome: "Alvenaria pavimento superior", data: "04/06 — 18/06", done: false },
              { nome: "Instalações elétricas e hidráulicas", data: "19/06 — 05/07", done: false },
              { nome: "Cobertura", data: "A partir de 15/06", done: false },
            ].map((e) => (
              <li
                key={e.nome}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-foreground">{e.nome}</span>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">{e.data}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* SEÇÃO 6 — CONTATO */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-bold text-foreground">Fale com o seu gerente de obra</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Carlos Mendes · Engenheiro responsável
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ContactButton icon={<MessageCircle className="h-5 w-5" />} label="WhatsApp" color={BRAND_GREEN} />
            <ContactButton icon={<Phone className="h-5 w-5" />} label="Ligar" color={BRAND_BLUE} />
            <ContactButton icon={<FileText className="h-5 w-5" />} label="Documentos" color={BRAND_YELLOW} dark />
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground py-4">
          F&M Construções Inteligentes · Atualizado em tempo real
        </p>
      </main>
    </div>
  );
}

function FinanceItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-extrabold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function ContactButton({
  icon,
  label,
  color,
  dark,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  dark?: boolean;
}) {
  return (
    <button
      className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-sm hover:opacity-95 active:scale-[0.98] transition"
      style={{ backgroundColor: color, color: dark ? "#1a1a1a" : "#fff" }}
    >
      {icon}
      {label}
    </button>
  );
}