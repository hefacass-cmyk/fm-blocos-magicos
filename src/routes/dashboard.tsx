import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { fmSupabase, getCliente, clearCliente } from "@/lib/fm-supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const BRAND_BLUE = "#1A4D7A";
const BRAND_GREEN = "#06A77D";
const BRAND_YELLOW = "#F4B941";

type Row = Record<string, unknown>;

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
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [clienteData, setClienteData] = useState<Row | null>(null);
  const [atualizacaoHoje, setAtualizacaoHoje] = useState<Row | null>(null);
  const [relatorios, setRelatorios] = useState<Row[]>([]);
  const [relatorioOpen, setRelatorioOpen] = useState<Row | null>(null);
  const [pagoTotal, setPagoTotal] = useState(0);
  const cliente = typeof window !== "undefined" ? getCliente() : null;

  useEffect(() => {
    let active = true;
    async function load() {
      if (!cliente) {
        setLoading(false);
        setErro("Faça login para visualizar sua obra.");
        return;
      }
      try {
        const [{ data: clienteRow, error: clienteError }, { data: updateRow, error: updateError }, relRes, finRes] = await Promise.all([
          fmSupabase
            .from("clientes")
            .select("*")
            .eq("id", cliente.id as string | number)
            .maybeSingle(),
          fmSupabase
            .from("obra_atualizacoes")
            .select("*")
            .eq("cliente_id", cliente.id as string | number)
            .order("data", { ascending: false })
            .limit(1)
            .maybeSingle(),
          fmSupabase
            .from("relatorios_semanais")
            .select("*")
            .eq("cliente_id", cliente.id as string | number)
            .neq("status", "rascunho")
            .order("semana_inicio", { ascending: false }),
          fmSupabase
            .from("obra_financeiro")
            .select("valor")
            .eq("cliente_id", cliente.id as string | number),
        ]);

        console.log("[dashboard] clientes:", { cliente_id: cliente.id, data: clienteRow, error: clienteError });
        console.log("[dashboard] obra_atualizacoes:", { cliente_id: cliente.id, data: updateRow, error: updateError });

        if (!active) return;
        if (clienteError) {
          console.error("[dashboard] erro ao carregar cliente:", clienteError);
          setErro("Erro ao carregar dados da obra.");
        } else if (!clienteRow) {
          setErro("Nenhum cadastro de obra foi encontrado para este cliente.");
        } else {
          if (updateError) {
            console.error("[dashboard] erro ao carregar atualização:", updateError);
          }
          setClienteData(clienteRow as Row);
          setAtualizacaoHoje((updateRow as Row | null) ?? null);
          setRelatorios((relRes.data as Row[]) ?? []);
          const totalPago = ((finRes.data as Row[] | null) ?? []).reduce(
            (sum, r) => sum + (Number(r.valor) || 0),
            0,
          );
          setPagoTotal(totalPago);
          setErro(null);
        }
      } catch (e) {
        console.error(e);
        if (active) setErro("Erro inesperado ao carregar a obra.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [cliente?.id]);

  const pick = <T,>(keys: string[], fallback: T): T => {
    for (const source of [atualizacaoHoje, clienteData, cliente as Row | null]) {
      if (!source) continue;
      for (const k of keys) {
        const v = source[k];
        if (v !== undefined && v !== null && v !== "") return v as T;
      }
    }
    return fallback;
  };

  const progresso = Number(pick<number | string>(["progresso", "Percentual", "percentual"], 0)) || 0;
  const orcadoMo = Number((clienteData?.orcado_mo as number | string) ?? 0) || 0;
  const orcadoMaterial = Number((clienteData?.orcado_material as number | string) ?? 0) || 0;
  const orcadoExtras = Number((clienteData?.orcado_extras as number | string) ?? 0) || 0;
  const orcado = orcadoMo + orcadoMaterial + orcadoExtras;
  const pago = pagoTotal;
  const saldo = orcado - pago;
  const dataInicio = pick<string>(["Data", "data_inicio", "inicio"], "—");
  const prazoEsperado = pick<string>(
    ["data_termino", "Prazo_esperado", "Prazo", "Previsao_termino", "prazo_esperado", "prazo", "previsao_termino"],
    "",
  );
  const percentualFinanceiro = orcado > 0 ? Math.round((pago / orcado) * 100) : 0;
  const hojeDescricao = pick<string>(["titulo", "descricao", "Descricao", "hoje_descricao"], "Sem atividade registrada para hoje");
  const hojeHorario = pick<string>(["data", "Data", "hoje_horario", "horario"], "");
  const equipe = Number(
    pick<number | string>(["profissionais_canteiro", "Equipe", "Profissionais", "Equipe_hoje", "equipe", "profissionais", "equipe_hoje"], 0),
  ) || 0;
  const gerente = pick<string>(["gerente_nome", "gerente", "responsavel", "nome"], "Equipe F&M");
  const cargo = pick<string>(["gerente_cargo", "responsavel_cargo"], "Engenheiro responsável");
  const tituloObra = pick<string>(["obra_nome", "Obra_nome", "titulo", "nome_obra", "endereco"], "Sua Obra em Camaçari");

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const fmtDate = (v: string) => {
    if (!v || v === "—") return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/30 text-muted-foreground">
        Carregando sua obra...
      </div>
    );
  }

  if (erro && !clienteData) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/30 p-6">
        <div className="max-w-md w-full rounded-2xl bg-white border p-6 text-center shadow-sm">
          <p className="text-sm text-destructive font-semibold">{erro}</p>
          <Link
            to="/"
            onClick={() => clearCliente()}
            className="mt-4 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Voltar para o site
          </Link>
        </div>
      </div>
    );
  }

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
              {tituloObra}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              onClick={() => clearCliente()}
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
            <Link to="/" onClick={() => clearCliente()} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
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
              <p className="mt-1 font-semibold">{fmtDate(dataInicio)}</p>
            </div>
            {prazoEsperado && (
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-xs uppercase tracking-wider text-white/60">Prazo esperado</p>
                <p className="mt-1 font-semibold">{fmtDate(prazoEsperado)}</p>
              </div>
            )}
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs uppercase tracking-wider text-white/60">Equipe</p>
              <p className="mt-1 font-semibold flex items-center gap-1.5">
                <Users className="h-4 w-4" style={{ color: BRAND_GREEN }} />
                {equipe} {equipe === 1 ? "profissional" : "profissionais"}
              </p>
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
              <p className="text-xl font-bold text-foreground">{hojeDescricao}</p>
              {hojeHorario && (
                <p className="mt-1 text-sm text-muted-foreground">{hojeHorario}</p>
              )}
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
                <Users className="h-4 w-4" style={{ color: BRAND_GREEN }} />
                {equipe} profissionais no canteiro
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
                {percentualFinanceiro}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${percentualFinanceiro}%`, backgroundColor: BRAND_GREEN }}
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
            {gerente} · {cargo}
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ContactButton icon={<MessageCircle className="h-5 w-5" />} label="WhatsApp" color={BRAND_GREEN} />
            <ContactButton icon={<Phone className="h-5 w-5" />} label="Ligar" color={BRAND_BLUE} />
            <ContactButton icon={<FileText className="h-5 w-5" />} label="Documentos" color={BRAND_YELLOW} dark />
          </div>
        </section>

        {/* SEÇÃO 7 — RELATÓRIOS SEMANAIS */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: BRAND_BLUE }}>
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Relatórios semanais</h2>
          </div>
          {relatorios.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum relatório enviado ainda.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {relatorios.map((r) => (
                <li key={String(r.id)}>
                  <button
                    onClick={async () => {
                      setRelatorioOpen(r);
                      if (r.status !== "visualizado") {
                        await fmSupabase
                          .from("relatorios_semanais")
                          .update({ visualizado_em: new Date().toISOString(), status: "visualizado" })
                          .eq("id", r.id);
                      }
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">{String(r.semana_inicio ?? "")} → {String(r.semana_fim ?? "")}</p>
                      <p className="font-semibold text-foreground">{String(r.titulo ?? "—")}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: BRAND_GREEN }}>{Number(r.progresso_total ?? 0)}%</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground py-4">
          F&M Construções Inteligentes · Atualizado em tempo real
        </p>
      </main>
      {relatorioOpen && (
        <RelatorioModal r={relatorioOpen} onClose={() => setRelatorioOpen(null)} />
      )}
    </div>
  );
}

function RelatorioModal({ r, onClose }: { r: Row; onClose: () => void }) {
  const fotos = Array.isArray(r.fotos) ? (r.fotos as string[]) : [];
  const lista = (v: unknown): string[] => Array.isArray(v) ? (v as string[]) : [];
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle>{String(r.titulo ?? "Relatório semanal")}</DialogTitle>
        <p className="text-xs text-muted-foreground">{String(r.semana_inicio ?? "")} → {String(r.semana_fim ?? "")}</p>
        <div className="mt-3 space-y-4 text-sm">
          {r.resumo ? <p className="whitespace-pre-wrap text-foreground/80">{String(r.resumo)}</p> : null}
          <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-center">
            <div><p className="text-xs text-muted-foreground">Semana</p><p className="font-bold">{Number(r.progresso_semana ?? 0)}%</p></div>
            <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold">{Number(r.progresso_total ?? 0)}%</p></div>
            <div><p className="text-xs text-muted-foreground">Profissionais</p><p className="font-bold">{Number(r.profissionais ?? 0)}</p></div>
          </div>
          <Block title="Serviços executados" items={lista(r.servicos_executados)} />
          <Block title="Materiais utilizados" items={lista(r.materiais_utilizados)} />
          <Block title="Pendências" items={lista(r.pendencias)} />
          <Block title="Próximos passos" items={lista(r.proximos_passos)} />
          {fotos.length > 0 && (
            <div>
              <p className="font-semibold mb-2">Fotos da semana</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {fotos.map((u, i) => (
                  <img key={i} src={u} alt={`foto ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-foreground/80">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
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