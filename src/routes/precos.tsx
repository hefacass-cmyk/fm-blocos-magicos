import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Camera, Wrench, Phone, ShieldCheck, Layers, Building2, X } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { WHATSAPP_FM } from "@/lib/fm-admin";

export const Route = createFileRoute("/precos")({
  head: () => ({
    meta: [
      { title: "Serviços F&M · F&M Smart Build" },
      { name: "description", content: "Conheça os serviços F&M Smart Build: monitoramento, gestão de obra, documentação e muito mais. Construção inteligente com transparência total." },
      { property: "og:title", content: "Serviços F&M · F&M Smart Build" },
      { property: "og:description", content: "Monitoramento, gestão e serviços técnicos para sua obra com a F&M Smart Build." },
    ],
  }),
  component: PrecosPage,
});

const BLUE = "#1A4D7A";
const YELLOW = "#F4B941";
const GREEN = "#06A77D";

const PLANOS = [
  { key: "F&M TOTAL", icon: <ShieldCheck className="h-5 w-5" />, desc: "Tudo incluso: gestão completa, mão de obra e materiais." },
  { key: "F&M GESTÃO", icon: <Building2 className="h-5 w-5" />, desc: "Gestão profissional + mão de obra. Você compra os materiais." },
  { key: "F&M ESSENCIAL", icon: <Layers className="h-5 w-5" />, desc: "Pacote enxuto para quem quer construir com economia." },
  { key: "SÓ GESTÃO", icon: <Wrench className="h-5 w-5" />, desc: "Acompanhamento técnico e gestão da sua obra." },
] as const;

const SISTEMAS = ["Inova Blocos", "Alvenaria", "ICF"] as const;

type Linha = Record<string, unknown>;

function normalizar(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }

const DESCRICOES: Record<string, string> = {
  // Câmeras
  "cameraunitaria": "Monitore sua obra 24h por dia pelo celular ou computador. Câmera HD instalada no canteiro com acesso remoto em tempo real.",
  "fmlive": "Pacote completo de monitoramento: 2 câmeras HD + internet dedicada na obra. Acompanhe cada etapa de qualquer lugar do mundo pelo nosso dashboard exclusivo.",
  "fmlivepro": "A solução premium para obras em locais sem infraestrutura de internet. 2 câmeras HD + antena Starlink com conexão via satélite. Monitoramento garantido em qualquer terreno.",
  "mensalidadeinternet": "Conexão dedicada e estável para manter suas câmeras sempre online. Sem interrupções, sem surpresas.",
  // Técnicos
  "databookeletronicodaobra": "Documentação digital completa da sua obra: fotos semanais, relatórios, laudos e registros organizados em um único arquivo eletrônico entregue ao final da construção. Seu histórico para sempre.",
  "databookeletronico": "Documentação digital completa da sua obra: fotos semanais, relatórios, laudos e registros organizados em um único arquivo eletrônico entregue ao final da construção. Seu histórico para sempre.",
  "readequacaodeferragem": "Revisamos o projeto estrutural e adequamos o consumo de aço ao sistema IBPP, reduzindo até 25% no custo de ferragem sem comprometer a segurança da obra.",
  "levantamentodequantitativodeblocos": "Calculamos com precisão a quantidade exata de blocos IBPP necessários para sua obra, evitando desperdício de material e garantindo o abastecimento correto em cada fase da construção.",
  "cartatecnicaaoengenheiro": "Documento técnico formal elaborado pela F&M explicando as especificidades do sistema IBPP ao engenheiro responsável pelo seu projeto estrutural.",
  "segurodaobra": "Proteção financeira contra imprevistos durante a construção: incêndio, danos a terceiros, roubo de materiais e outros riscos cobertos sob consulta com nossa corretora parceira.",
  // Inclusos
  "relatoriosemanalfotograficodigital": "Toda sexta-feira você recebe um relatório completo com fotos, serviços executados na semana, profissionais no canteiro e próximos passos. Transparência total, sempre.",
  "acessoaodashboarddocliente": "Sua obra na palma da mão. Acompanhe o progresso em tempo real, veja o histórico financeiro, acesse fotos e documentos pelo nosso portal exclusivo.",
  "ligacaoprovisoriadeaguaeluz": "Instalamos a infraestrutura provisória necessária para início das obras: ligação de água e energia elétrica no canteiro, sem custo adicional.",
  "tapumeeplacadeobra": "Cercamento de proteção e identificação visual da obra com placa F&M. Segurança para o canteiro e profissionalismo na apresentação.",
  "containerescritorionocanteiro": "Estrutura física de gestão instalada na obra para reuniões, armazenamento de documentos e controle diário da execução pelos nossos gerentes.",
};

function descricaoServico(nome: string, fallback?: string): string {
  const k = normalizar(nome);
  return DESCRICOES[k] || fallback || "Serviço F&M Smart Build. Fale com um especialista para mais detalhes.";
}

function PrecosPage() {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [servicoAtivo, setServicoAtivo] = useState<{ nome: string; descricao: string; icon: React.ReactNode } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await fmSupabase.from("tabela_precos").select("*").eq("ativo", true);
        if (active) setLinhas(data || []);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  const matriz = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const sis of SISTEMAS) m[sis] = {};
    for (const l of linhas) {
      const sis = String(l.sistema || "");
      const serv = String(l.tipo_servico || l.servico || "");
      const preco = Number(l.preco_m2 || l.valor || 0);
      if (!sis || !serv) continue;
      const sisKey = SISTEMAS.find((s) => normalizar(s) === normalizar(sis));
      const planKey = PLANOS.find((p) => normalizar(p.key) === normalizar(serv));
      if (sisKey && planKey) m[sisKey][planKey.key] = preco;
    }
    return m;
  }, [linhas]);

  const cameras = linhas
    .filter((l) => normalizar(String(l.categoria || "")).includes("camera"))
    .filter((l) => !normalizar(String(l.nome || l.descricao || l.item || "")).includes("starlink"));
  const tecnicos = linhas.filter((l) => normalizar(String(l.categoria || "")).includes("tecn"));
  const inclusos = linhas.filter((l) => normalizar(String(l.categoria || "")).includes("inclus"));
  const consultar = linhas.filter((l) => normalizar(String(l.categoria || "")).includes("consult"));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-extrabold tracking-tight" style={{ color: BLUE }}>F&amp;M Smart Build</Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link to="/" className="font-medium text-slate-700 hover:text-primary">Início</Link>
            <Link to="/precos" className="font-bold" style={{ color: BLUE }}>Serviços F&amp;M</Link>
            <Link to="/iniciar-contrato" className="rounded-md px-3 py-1.5 text-xs font-bold text-slate-900" style={{ backgroundColor: YELLOW }}>
              Quero Construir
            </Link>
          </nav>
        </div>
      </header>

      <section className="py-16" style={{ background: `linear-gradient(135deg, ${BLUE}, #2a6aa0)` }}>
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">Construção Inteligente com Transparência Total</h1>
          <p className="mt-3 text-base sm:text-lg opacity-90">Escolha o plano ideal para sua obra</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/iniciar-contrato" className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-bold text-slate-900" style={{ backgroundColor: YELLOW }}>
              Iniciar minha obra <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={WHATSAPP_FM} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20">
              <Phone className="h-4 w-4" /> Falar com especialista
            </a>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl font-bold text-center" style={{ color: BLUE }}>Tabela comparativa</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">Serviços F&amp;M por sistema construtivo</p>
          <div className="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500" style={{ backgroundColor: "#F1F5F9" }}>
                  <th className="p-3"> </th>
                  {PLANOS.map((p) => (
                    <th key={p.key} className="p-3 text-center font-bold" style={{ color: BLUE }}>{p.key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SISTEMAS.map((s) => (
                  <tr key={s} className="border-t">
                    <td className="p-3 font-semibold" style={{ color: BLUE }}>{s}</td>
                    {PLANOS.map((p) => {
                      const v = matriz[s]?.[p.key];
                      return (
                        <td key={p.key} className="p-3 text-center">
                          {v ? <CheckCircle2 className="inline h-5 w-5" style={{ color: GREEN }} /> : <span className="text-slate-400">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLANOS.map((p) => (
              <div key={p.key} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 font-bold" style={{ color: BLUE }}>{p.icon} {p.key}</div>
                <p className="mt-2 text-sm text-slate-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Bloco titulo="Câmeras e Monitoramento" icon={<Camera className="h-5 w-5" />} itens={cameras} onOpen={setServicoAtivo} cardIcon={<Camera className="h-6 w-6" />} />
      <Bloco titulo="Serviços Técnicos" icon={<Wrench className="h-5 w-5" />} itens={tecnicos} onOpen={setServicoAtivo} cardIcon={<Wrench className="h-6 w-6" />} />
      <Bloco titulo="Inclusos em todos os planos" icon={<CheckCircle2 className="h-5 w-5" />} itens={inclusos} badge="INCLUSO" badgeColor={GREEN} onOpen={setServicoAtivo} cardIcon={<CheckCircle2 className="h-6 w-6" />} />
      <Bloco titulo="Consultar valores" icon={<Phone className="h-5 w-5" />} itens={consultar} onOpen={setServicoAtivo} cardIcon={<Phone className="h-6 w-6" />} />

      <section className="py-14" style={{ backgroundColor: "#F7FAFC" }}>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl font-bold" style={{ color: BLUE }}>Pronto para começar?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Solicite seu contrato em 3 passos ou fale com um especialista F&amp;M.</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/iniciar-contrato" className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-extrabold text-slate-900" style={{ backgroundColor: YELLOW }}>
              INICIAR MINHA OBRA <ArrowRight className="h-5 w-5" />
            </Link>
            <a href={WHATSAPP_FM} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-bold text-white" style={{ backgroundColor: BLUE }}>
              <Phone className="h-5 w-5" /> FALAR COM ESPECIALISTA
            </a>
          </div>
        </div>
      </section>

      {servicoAtivo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setServicoAtivo(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setServicoAtivo(null)}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center justify-center mb-3" style={{ color: BLUE }}>
              {servicoAtivo.icon}
            </div>
            <h3 className="text-center text-xl font-bold" style={{ color: BLUE }}>{servicoAtivo.nome}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{servicoAtivo.descricao}</p>
            <Link
              to="/iniciar-contrato"
              onClick={() => setServicoAtivo(null)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-extrabold text-slate-900"
              style={{ backgroundColor: YELLOW }}
            >
              QUERO ESTE SERVIÇO <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Bloco({
  titulo, icon, itens, badge, badgeColor, onOpen, cardIcon,
}: { titulo: string; icon: React.ReactNode; itens: Linha[]; badge?: string; badgeColor?: string; onOpen: (s: { nome: string; descricao: string; icon: React.ReactNode }) => void; cardIcon: React.ReactNode }) {
  if (itens.length === 0) return null;
  return (
    <section className="py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="flex items-center gap-2 text-xl font-bold" style={{ color: BLUE }}>{icon} {titulo}</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {itens.map((it, i) => {
            const nome = String(it.nome || it.descricao || it.item || "Item");
            const obs = String(it.observacao || it.detalhe || "");
            return (
              <button
                key={i}
                type="button"
                onClick={() => onOpen({ nome, descricao: descricaoServico(nome, obs), icon: cardIcon })}
                className="text-left rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{nome}</h3>
                  {badge && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: badgeColor || GREEN }}>{badge}</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{descricaoServico(nome, obs)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: BLUE }}>
                  Saiba mais <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
