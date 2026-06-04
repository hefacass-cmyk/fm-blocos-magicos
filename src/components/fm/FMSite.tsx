import { useState } from "react";
import {
  Menu, X, AlertTriangle, ShieldCheck, Clock, Wallet, Recycle,
  Layers, Snowflake, PanelsTopLeft, MapPin, Phone, Mail,
  Instagram, Facebook, Linkedin, ArrowRight, CheckCircle2, Calculator,
  BookOpen, User, Users, Building2, Zap, BadgeDollarSign, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientLoginModal } from "./ClientLoginModal";
import { Link } from "@tanstack/react-router";
import fmLogo from "@/assets/fm-logo.png";
import { ESPECIALIDADES } from "@/lib/fm-parceiro";
import heroImg from "@/assets/hero-construction.jpg";
import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import p3 from "@/assets/portfolio-3.jpg";
import p4 from "@/assets/portfolio-4.jpg";
import p5 from "@/assets/portfolio-5.jpg";
import p6 from "@/assets/portfolio-6.jpg";

const NAV = [
  { id: "home", label: "Início" },
  { id: "solucao", label: "Solução" },
  { id: "tecnologias", label: "Tecnologias" },
  { id: "portfolio", label: "Portfólio" },
  { id: "calculadora", label: "Economia" },
  { id: "blog", label: "Blog" },
  { id: "contato", label: "Contato" },
];

export function FMSite() {
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onLogin={() => setLoginOpen(true)} />
      <main>
        <Hero />
        <VideoSection />
        <ProblemSolution />
        <Technologies />
        <FindSpecialist />
        <Portfolio />
        <SavingsCalculator />
        <ICFCalculator />
        <SteelFrameCalculator />
        <BlogSection />
        <LeadForm />
      </main>
      <Footer />
      <ClientLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

function FindSpecialist() {
  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: "#F7FAFC" }}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "#1A4D7A" }}>
            Encontre um Especialista
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Profissionais parceiros da F&M prontos para sua obra.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {ESPECIALIDADES.map((esp) => (
            <Link
              key={esp}
              to="/parceiros"
              search={{ especialidade: esp }}
              className="group rounded-xl border bg-white p-4 text-center font-semibold text-sm transition hover:shadow-md hover:-translate-y-0.5"
              style={{ color: "#2C3E50", borderColor: "#E2E8F0" }}
            >
              <span className="block group-hover:text-[#1A4D7A]">{esp}</span>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/parceiros"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-bold text-white transition"
            style={{ backgroundColor: "#1A4D7A" }}
          >
            <Users className="h-4 w-4" /> Ver todos os parceiros
          </Link>
        </div>
      </div>
    </section>
  );
}

function Header({ onLogin }: { onLogin: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur border-b border-border" style={{ minWidth: 320 }}>
      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-7 h-16 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2 shrink-0">
          <img src={fmLogo} alt="F&M Construções Inteligentes" className="h-9 w-auto object-contain" />
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-bold text-primary">F&M Construções</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Inteligentes</div>
          </div>
        </a>
        <nav className="hidden xl:flex items-center gap-2">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="text-[12px] font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap px-1.5 py-1">
              {n.label}
            </a>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="text-[12px] font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap px-1.5 py-1 inline-flex items-center gap-0.5 outline-none">
              Parceiros <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem asChild>
                <Link to="/parceiros" className="cursor-pointer text-sm">Ver Parceiros</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/seja-parceiro" className="cursor-pointer text-sm">Seja Parceiro</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-[12px] font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap px-1.5 py-1 inline-flex items-center gap-0.5 outline-none">
              Fornecedores <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem asChild>
                <Link to="/fornecedores" className="cursor-pointer text-sm">Ver Fornecedores</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/seja-fornecedor" className="cursor-pointer text-sm">Seja Fornecedor</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/parceiro/login" className="text-[12px] font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap px-1.5 py-1">
            Área do Parceiro
          </Link>
        </nav>
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5 transition whitespace-nowrap"
          >
            <User className="h-3.5 w-3.5" /> Área do Cliente
          </button>
          <a href="#contato" className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-accent-foreground hover:brightness-95 transition whitespace-nowrap">
            Diagnóstico <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="xl:hidden flex items-center gap-2">
          <button
            onClick={onLogin}
            className="p-2 text-foreground hover:text-primary transition"
            aria-label="Área do Cliente"
          >
            <User className="h-6 w-6" />
          </button>
          <button className="p-2 -mr-2 text-foreground" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="xl:hidden border-t border-border bg-background">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-foreground/80">
                {n.label}
              </a>
            ))}
            <Link to="/parceiros" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-foreground/80">
              Ver Parceiros
            </Link>
            <Link to="/seja-parceiro" onClick={() => setOpen(false)} className="py-2 text-sm font-semibold text-accent">
              Seja Parceiro
            </Link>
            <Link to="/fornecedores" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-foreground/80">
              Ver Fornecedores
            </Link>
            <Link to="/seja-fornecedor" onClick={() => setOpen(false)} className="py-2 text-sm font-semibold text-accent">
              Seja Fornecedor
            </Link>
            <Link to="/parceiro/login" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-foreground/80">
              Área do Parceiro
            </Link>
            <button onClick={() => { setOpen(false); onLogin(); }} className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-primary/30 px-4 py-3 text-sm font-semibold text-primary">
              <User className="h-4 w-4" /> Área do Cliente
            </button>
            <a href="#contato" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">
              Solicitar Diagnóstico Gratuito
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="relative pt-16 min-h-[92vh] flex items-center overflow-hidden">
      <img src={heroImg} alt="Construção com sistema IBPP" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, color-mix(in oklab, var(--primary) 92%, transparent) 0%, color-mix(in oklab, var(--primary) 70%, transparent) 55%, transparent 100%)" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-primary-foreground">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider border border-white/20">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Camaçari · Bahia
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] max-w-3xl">
          Construção Inteligente.<br />
          <span className="text-accent">Entrega Garantida.</span>
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-white/90 max-w-2xl">
          Tecnologia IBPP: <strong>46% mais rápido</strong> e <strong>20% mais econômico</strong> que a alvenaria convencional.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#contato" className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-lg hover:brightness-95 transition">
            Solicitar Diagnóstico Gratuito <ArrowRight className="h-5 w-5" />
          </a>
          <a href="#tecnologias" className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/5 px-6 py-4 text-base font-semibold text-white hover:bg-white/10 transition">
            Conhecer Tecnologias
          </a>
          <Link to="/parceiros" className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/5 px-6 py-4 text-base font-semibold text-white hover:bg-white/10 transition">
            <Users className="h-5 w-5" /> Ver todos os parceiros
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-xl">
          {[
            { n: "46%", l: "Mais rápido" },
            { n: "20%", l: "Mais econômico" },
            { n: "100%", l: "Certificado" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg bg-white/10 backdrop-blur border border-white/15 p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-accent">{s.n}</div>
              <div className="text-xs text-white/80 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  const cards = [
    {
      icon: Building2,
      title: "Construção Industrializada",
      desc: "Sistema IBPP certificado",
    },
    {
      icon: Zap,
      title: "46% Mais Rápido",
      desc: "Que a alvenaria convencional",
    },
    {
      icon: BadgeDollarSign,
      title: "20% Mais Econômico",
      desc: "No custo total da obra",
    },
  ];
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "#1A4D7A" }}>
          Conheça a F&M Construções Inteligentes
        </h2>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Tecnologia, precisão e entrega garantida em cada obra.
        </p>

        <div className="mt-10 mx-4 sm:mx-[60px] lg:mx-auto w-full" style={{ maxWidth: 480 }}>
          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: "16/9" }}>
            <video
              className="w-full h-full object-contain"
              src="https://hdjlwidfnikbahfhrkil.supabase.co/storage/v1/object/public/videos/novo.mp4"
              controls
              autoPlay
              muted
              loop
              playsInline
              title="Vídeo Institucional F&M Construções Inteligentes"
            />
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="flex items-center gap-4 rounded-xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: "#1A4D7A" }}
              >
                <div
                  className="h-12 w-12 shrink-0 rounded-full grid place-items-center"
                  style={{ backgroundColor: "#F4B941" }}
                >
                  <Icon className="h-6 w-6" style={{ color: "#1A4D7A" }} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "#1A4D7A" }}>
                    {c.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProblemSolution() {
  const problems = ["Atrasos constantes no cronograma", "Custo final imprevisível", "Desperdício de materiais", "Mão de obra inconsistente"];
  const solutions = ["Prazo cumprido com precisão", "Custo controlado e transparente", "Tecnologia certificada (IBPP)", "Gestão técnica especializada"];
  return (
    <section id="solucao" className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Problema × Solução</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">Por que escolher F&M?</h2>
          <p className="mt-4 text-muted-foreground text-lg">Compare a obra convencional com a gestão F&M usando tecnologia IBPP.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-card border border-border p-7 lg:p-9 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-destructive/70" />
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-destructive/10 grid place-items-center text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Obra Convencional</h3>
            </div>
            <ul className="mt-6 space-y-3">
              {problems.map((p) => (
                <li key={p} className="flex items-start gap-3 text-foreground/80">
                  <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border p-7 lg:p-9 relative overflow-hidden text-primary-foreground" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}>
            <div className="absolute top-0 left-0 h-1 w-full bg-accent" />
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-accent/20 grid place-items-center text-accent">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Gestão F&M</h3>
            </div>
            <ul className="mt-6 space-y-3">
              {solutions.map((p) => (
                <li key={p} className="flex items-start gap-3 text-white/95">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const TECH = [
  {
    id: "ibpp",
    icon: Layers,
    name: "IBPP",
    tag: "Inova Blocos Paredes Prontas",
    summary: "Sistema construtivo industrializado de paredes prontas pré-moldadas em concreto, com instalação rápida e altíssima precisão dimensional.",
    pros: ["46% mais rápido que alvenaria", "20% de economia no custo total", "Paredes prontas com elétrica/hidráulica embutida", "Isolamento térmico e acústico superior", "Certificação técnica e estrutural"],
  },
  {
    id: "icf",
    icon: Snowflake,
    name: "ICF",
    tag: "Insulated Concrete Forms",
    summary: "Fôrmas isolantes de concreto que combinam estrutura e isolamento em uma única solução de altíssima eficiência energética.",
    pros: ["Excelente isolamento térmico", "Alta resistência estrutural", "Redução de até 50% em climatização", "Resistência a furacões e sismos", "Sustentável e durável"],
  },
  {
    id: "drywall",
    icon: PanelsTopLeft,
    name: "Drywall",
    tag: "Sistema de Vedação Leve",
    summary: "Solução leve, limpa e versátil para divisórias internas, forros e revestimentos, com obra seca e acabamento perfeito.",
    pros: ["Obra limpa e sem entulho", "Instalação extremamente rápida", "Permite reformas e adaptações", "Excelente conforto acústico", "Acabamento fino e uniforme"],
  },
];

function Technologies() {
  const [active, setActive] = useState<string | null>("ibpp");
  const current = TECH.find((t) => t.id === active) ?? null;
  return (
    <section id="tecnologias" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Tecnologias</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">Sistemas construtivos que entregamos</h2>
          <p className="mt-4 text-muted-foreground text-lg">Clique em cada tecnologia para conhecer suas vantagens técnicas.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {TECH.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(isActive ? null : t.id)}
                className={`text-left rounded-2xl border p-7 transition-all ${isActive ? "border-accent bg-card -translate-y-1" : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5"}`}
                style={isActive ? { boxShadow: "var(--shadow-card)" } : undefined}
              >
                <div className={`h-12 w-12 rounded-lg grid place-items-center ${isActive ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-primary">{t.name}</h3>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{t.tag}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {isActive ? "Fechar detalhes" : "Ver detalhes"} <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>
        {current && (
          <div className="mt-8 rounded-2xl border border-border bg-secondary p-7 lg:p-10">
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <span className="inline-block text-xs uppercase tracking-wider text-accent-foreground bg-accent rounded-full px-3 py-1 font-bold">{current.name}</span>
                <h3 className="mt-3 text-2xl font-bold text-primary">{current.tag}</h3>
                <p className="mt-4 text-foreground/80">{current.summary}</p>
              </div>
              <ul className="lg:col-span-3 grid sm:grid-cols-2 gap-3">
                {current.pros.map((p) => (
                  <li key={p} className="flex items-start gap-3 rounded-lg bg-card border border-border p-4">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-foreground">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const PROJECTS = [
  { src: p1, title: "Residência Alpha", type: "residencial" },
  { src: p2, title: "Centro Empresarial", type: "comercial" },
  { src: p3, title: "Obra em Execução", type: "residencial" },
  { src: p4, title: "Casa Contemporânea", type: "residencial" },
  { src: p5, title: "Galpão Logístico", type: "industrial" },
  { src: p6, title: "Sede Corporativa", type: "comercial" },
];

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "residencial", label: "Residencial" },
  { id: "comercial", label: "Comercial" },
  { id: "industrial", label: "Industrial" },
];

function Portfolio() {
  const [filter, setFilter] = useState("todos");
  const items = filter === "todos" ? PROJECTS : PROJECTS.filter((p) => p.type === filter);
  return (
    <section id="portfolio" className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-wider text-primary">Portfólio</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">Obras que entregam confiança</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${filter === f.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground/70 hover:text-primary"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((p) => (
            <figure key={p.title} className="group relative overflow-hidden rounded-2xl bg-card border border-border">
              <img src={p.src} alt={p.title} width={1024} height={768} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white" style={{ background: "linear-gradient(to top, rgba(26,77,122,0.92), transparent)" }}>
                <div className="text-xs uppercase tracking-wider text-accent font-bold">{p.type}</div>
                <div className="text-lg font-bold">{p.title}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function SavingsCalculator() {
  const [m2, setM2] = useState<number>(150);
  // Base: alvenaria convencional ~ R$ 2.500/m². IBPP economiza 20%.
  const COST_CONV = 2500;
  const totalConv = m2 * COST_CONV;
  const totalIbpp = totalConv * 0.8;
  const economy = totalConv - totalIbpp;
  const prazoConv = Math.round((m2 / 30) * 30); // ~30 dias por 30m² hipotético
  const prazoIbpp = Math.round(prazoConv * 0.54);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return (
    <section id="calculadora" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden border border-border" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}>
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 lg:p-12 text-primary-foreground">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-white/10 border border-white/20 rounded-full px-3 py-1 font-bold">
                <Calculator className="h-4 w-4" /> Calculadora de Economia
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold">Quanto você economiza com IBPP?</h2>
              <p className="mt-3 text-white/85">Informe a metragem desejada e descubra a economia em relação à alvenaria convencional.</p>
              <label className="block mt-8">
                <span className="text-sm font-semibold text-white/90">Metragem (m²)</span>
                <input
                  type="number"
                  min={20}
                  max={5000}
                  value={m2}
                  onChange={(e) => setM2(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-2 w-full rounded-lg bg-white text-foreground px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <input
                type="range" min={20} max={1000} step={10} value={Math.min(m2, 1000)}
                onChange={(e) => setM2(Number(e.target.value))}
                className="mt-4 w-full accent-[color:var(--accent)]"
              />
              <div className="mt-2 flex justify-between text-xs text-white/70"><span>20 m²</span><span>1000 m²</span></div>
            </div>
            <div className="p-8 lg:p-12 bg-card">
              <div className="text-sm text-muted-foreground">Estimativa para <strong className="text-primary">{m2} m²</strong></div>
              <div className="mt-2 text-xs text-muted-foreground">Base: alvenaria convencional R$ 2.500/m² · IBPP 20% mais econômico · 46% menos prazo</div>
              <div className="mt-6 grid gap-4">
                <Stat label="Custo Convencional" value={fmt(totalConv)} subtle />
                <Stat label="Custo com IBPP" value={fmt(totalIbpp)} highlight />
                <div className="rounded-xl border-2 border-accent bg-accent/10 p-5">
                  <div className="text-xs uppercase tracking-wider font-bold text-primary">Sua economia estimada</div>
                  <div className="mt-1 text-3xl lg:text-4xl font-extrabold text-primary">{fmt(economy)}</div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-foreground/80">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-success" /> {prazoConv} → <strong className="text-primary">{prazoIbpp} dias</strong></span>
                    <span className="inline-flex items-center gap-1.5"><Wallet className="h-4 w-4 text-success" /> 20% menos custo</span>
                    <span className="inline-flex items-center gap-1.5"><Recycle className="h-4 w-4 text-success" /> menos desperdício</span>
                  </div>
                </div>
              </div>
              <a href="#contato" className="mt-6 inline-flex items-center justify-center w-full gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:brightness-110 transition">
                Quero um orçamento detalhado <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ICFCalculator() {
  const [m2, setM2] = useState<number>(150);
  const COST_CONV = 2500;
  const COST_ICF = 2000;
  const totalConv = m2 * COST_CONV;
  const totalIcf = m2 * COST_ICF;
  const economy = totalConv - totalIcf;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden border border-border bg-card" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 lg:p-12">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-primary/10 border border-primary/20 rounded-full px-3 py-1 font-bold text-primary">
                <Calculator className="h-4 w-4" /> Calculadora ICF
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">Quanto você economiza com ICF?</h2>
              <p className="mt-3 text-muted-foreground">Informe a metragem desejada e descubra a economia em relação à alvenaria convencional.</p>
              <label className="block mt-8">
                <span className="text-sm font-semibold text-foreground">Metragem (m²)</span>
                <input
                  type="number"
                  min={20}
                  max={1000}
                  value={m2}
                  onChange={(e) => setM2(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-2 w-full rounded-lg bg-background border border-input text-foreground px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <input
                type="range" min={20} max={1000} step={10} value={m2}
                onChange={(e) => setM2(Number(e.target.value))}
                className="mt-4 w-full accent-[color:var(--primary)]"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>20 m²</span><span>1000 m²</span></div>
            </div>
            <div className="p-8 lg:p-12 bg-background border-l border-border">
              <div className="text-sm text-muted-foreground">Estimativa para <strong className="text-primary">{m2} m²</strong></div>
              <div className="mt-2 text-xs text-muted-foreground">Base: alvenaria convencional R$ 2.500/m² · ICF R$ 2.000/m² · 20% de economia</div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-xl p-5 border" style={{ background: "#f5f5f5", borderColor: "#e5e5e5" }}>
                  <div className="text-xs uppercase tracking-wider font-bold" style={{ color: "#666" }}>Custo Convencional</div>
                  <div className="mt-1 text-2xl font-bold line-through" style={{ color: "#999" }}>{fmt(totalConv)}</div>
                </div>
                <div className="rounded-xl p-5 border" style={{ background: "#e8f5f0", borderColor: "#06A77D" }}>
                  <div className="text-xs uppercase tracking-wider font-bold" style={{ color: "#06A77D" }}>Custo com ICF</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: "#06A77D" }}>{fmt(totalIcf)}</div>
                </div>
                <div className="rounded-xl p-5 border-2" style={{ background: "#fef6e3", borderColor: "#F4B941" }}>
                  <div className="text-xs uppercase tracking-wider font-bold" style={{ color: "#b37d1a" }}>Sua economia estimada</div>
                  <div className="mt-1 text-3xl lg:text-4xl font-extrabold" style={{ color: "#1A4D7A" }}>{fmt(economy)}</div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm" style={{ color: "#4a4a4a" }}>
                    <span className="inline-flex items-center gap-1.5">⏱ 30% menos prazo (100 → 65 dias)</span>
                    <span className="inline-flex items-center gap-1.5">📏 40% menos peso na fundação</span>
                  </div>
                </div>
              </div>
              <a href="#contato" className="mt-6 inline-flex items-center justify-center w-full gap-2 rounded-md px-5 py-3 text-sm font-bold text-white hover:brightness-110 transition" style={{ background: "#1A4D7A" }}>
                Quero um orçamento detalhado <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SteelFrameCalculator() {
  const [m2, setM2] = useState<number>(150);
  const COST_CONV = 2500;
  const COST_SF = 2500;
  const totalConv = m2 * COST_CONV;
  const totalSf = m2 * COST_SF;
  // Economia no ciclo da obra: prazo 126 → 60 dias = 66 dias salvos
  const diasEconomizados = 66;
  const custoDiario = m2 * 4; // estimativa de custo diário de obra proporcional
  const economiaCiclo = diasEconomizados * custoDiario;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden border border-border bg-card" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 lg:p-12">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-primary/10 border border-primary/20 rounded-full px-3 py-1 font-bold text-primary">
                <Calculator className="h-4 w-4" /> Calculadora Steel Frame
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">Quanto você economiza com Steel Frame + Drywall?</h2>
              <p className="mt-3 text-muted-foreground">Informe a metragem desejada e descubra a economia no ciclo da obra em relação à alvenaria convencional.</p>
              <label className="block mt-8">
                <span className="text-sm font-semibold text-foreground">Metragem (m²)</span>
                <input
                  type="number"
                  min={20}
                  max={1000}
                  value={m2}
                  onChange={(e) => setM2(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-2 w-full rounded-lg bg-background border border-input text-foreground px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <input
                type="range" min={20} max={1000} step={10} value={m2}
                onChange={(e) => setM2(Number(e.target.value))}
                className="mt-4 w-full accent-[color:var(--primary)]"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>20 m²</span><span>1000 m²</span></div>
            </div>
            <div className="p-8 lg:p-12 bg-background border-l border-border">
              <div className="text-sm text-muted-foreground">Estimativa para <strong className="text-primary">{m2} m²</strong></div>
              <div className="mt-2 text-xs text-muted-foreground">Base: alvenaria convencional R$ 2.500/m² · Steel Frame R$ 2.500/m² · custo similar, prazo e desperdício diferentes</div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-xl p-5 border" style={{ background: "#f5f5f5", borderColor: "#e5e5e5" }}>
                  <div className="text-xs uppercase tracking-wider font-bold" style={{ color: "#666" }}>Custo Convencional</div>
                  <div className="mt-1 text-2xl font-bold line-through" style={{ color: "#999" }}>{fmt(totalConv)}</div>
                </div>
                <div className="rounded-xl p-5 border" style={{ background: "#e8f5f0", borderColor: "#06A77D" }}>
                  <div className="text-xs uppercase tracking-wider font-bold" style={{ color: "#06A77D" }}>Custo com Steel Frame</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: "#06A77D" }}>{fmt(totalSf)}</div>
                </div>
                <div className="rounded-xl p-5 border-2" style={{ background: "#fef6e3", borderColor: "#F4B941" }}>
                  <div className="text-xs uppercase tracking-wider font-bold" style={{ color: "#b37d1a" }}>Economia no ciclo da obra</div>
                  <div className="mt-1 text-3xl lg:text-4xl font-extrabold" style={{ color: "#1A4D7A" }}>{fmt(economiaCiclo)}</div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm" style={{ color: "#4a4a4a" }}>
                    <span className="inline-flex items-center gap-1.5">⏱ 55-65% menos prazo (126 → 60 dias)</span>
                    <span className="inline-flex items-center gap-1.5">♻ Apenas 3-5% de desperdício</span>
                  </div>
                </div>
              </div>
              <a href="#contato" className="mt-6 inline-flex items-center justify-center w-full gap-2 rounded-md px-5 py-3 text-sm font-bold text-white hover:brightness-110 transition" style={{ background: "#1A4D7A" }}>
                Quero um orçamento detalhado <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight, subtle }: { label: string; value: string; highlight?: boolean; subtle?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "border-success bg-success/5" : "border-border bg-secondary"}`}>
      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${highlight ? "text-success" : subtle ? "text-muted-foreground line-through decoration-destructive/60" : "text-primary"}`}>{value}</div>
    </div>
  );
}

const ARTICLES = [
  {
    title: "Como economizar na construção da sua casa",
    summary: "Descubra estratégias práticas para reduzir custos sem abrir mão da qualidade, desde o planejamento até a escolha de materiais e tecnologias construtivas.",
    icon: Wallet,
  },
  {
    title: "O que é tecnologia IBPP e por que ela é mais rápida",
    summary: "Conheça o sistema Inova Blocos Paredes Prontas: paredes pré-moldadas em concreto que reduzem em 46% o prazo de execução da obra.",
    icon: Layers,
  },
  {
    title: "Como escolher o terreno certo",
    summary: "Aprenda a avaliar topografia, solo, acessos e documentação para evitar surpresas e garantir um projeto seguro e viável desde o início.",
    icon: MapPin,
  },
];

function BlogSection() {
  return (
    <section id="blog" className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Blog e Conteúdo Educativo</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">Conhecimento que transforma sua obra</h2>
          <p className="mt-4 text-muted-foreground text-lg">Dicas, tendências e orientações técnicas para quem quer construir com inteligência.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {ARTICLES.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.title} className="rounded-2xl bg-card border border-border p-7 flex flex-col transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
                <div className="h-12 w-12 rounded-lg bg-primary/10 grid place-items-center text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-primary leading-snug">{a.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{a.summary}</p>
                <div className="mt-auto pt-6">
                  <button className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent transition">
                    Ler mais <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LeadForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ nome: "", whatsapp: "", cidade: "", metragem: "", tipo: "residencial", mensagem: "" });
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.whatsapp.trim()) return;
    setSent(true);
  };
  return (
    <section id="contato" className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Diagnóstico Gratuito</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">Vamos planejar sua obra inteligente</h2>
          <p className="mt-4 text-muted-foreground text-lg">Preencha os dados e nossa equipe técnica entrará em contato em até 1 dia útil com um diagnóstico inicial gratuito.</p>
          <ul className="mt-8 space-y-3 text-foreground/80">
            <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> Camaçari · Bahia</li>
            <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /> WhatsApp (71) 99915-4343</li>
            <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /> orcamentos@fmconstrucoes.com.br</li>
          </ul>
        </div>
        <form onSubmit={submit} className="lg:col-span-3 rounded-2xl bg-card border border-border p-7 lg:p-9 shadow-sm">
          {sent ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
              <h3 className="mt-4 text-2xl font-bold text-primary">Recebido com sucesso!</h3>
              <p className="mt-2 text-muted-foreground">Nossa equipe entrará em contato em breve, {form.nome.split(" ")[0]}.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome completo" required>
                <input required maxLength={100} value={form.nome} onChange={(e) => update("nome", e.target.value)} className="input" />
              </Field>
              <Field label="WhatsApp" required>
                <input required maxLength={20} value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="(71) 99915-4343" className="input" />
              </Field>
              <Field label="Cidade">
                <input maxLength={80} value={form.cidade} onChange={(e) => update("cidade", e.target.value)} className="input" />
              </Field>
              <Field label="Metragem do terreno (m²)">
                <input type="number" min={0} max={100000} value={form.metragem} onChange={(e) => update("metragem", e.target.value)} className="input" />
              </Field>
              <Field label="Tipo de projeto" className="sm:col-span-2">
                <select value={form.tipo} onChange={(e) => update("tipo", e.target.value)} className="input">
                  <option value="residencial">Residencial</option>
                  <option value="comercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                </select>
              </Field>
              <Field label="Mensagem" className="sm:col-span-2">
                <textarea rows={4} maxLength={1000} value={form.mensagem} onChange={(e) => update("mensagem", e.target.value)} className="input resize-none" />
              </Field>
              <button type="submit" className="sm:col-span-2 mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-4 text-base font-bold text-accent-foreground hover:brightness-95 transition">
                Solicitar Diagnóstico Gratuito <ArrowRight className="h-5 w-5" />
              </button>
              <p className="sm:col-span-2 text-xs text-muted-foreground">Ao enviar, você concorda em ser contatado pela equipe F&M.</p>
            </div>
          )}
        </form>
      </div>
      <style>{`
        .input { width: 100%; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--background); padding: 0.7rem 0.9rem; font-size: 0.95rem; color: var(--foreground); transition: border-color .15s, box-shadow .15s; }
        .input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 18%, transparent); }
      `}</style>
    </section>
  );
}

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-sm font-semibold text-foreground">{label}{required && <span className="text-destructive"> *</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-accent text-accent-foreground grid place-items-center font-bold">F&M</div>
            <div>
              <div className="font-bold">F&M Construções Inteligentes</div>
              <div className="text-xs text-white/70 uppercase tracking-widest">Tecnologia IBPP · Camaçari/BA</div>
            </div>
          </div>
          <p className="mt-4 text-white/80 max-w-md">Construtora especializada em sistemas industrializados. Entregamos obras mais rápidas, econômicas e com qualidade técnica certificada.</p>
          <div className="mt-5 flex items-center gap-3">
            {[Instagram, Facebook, Linkedin].map((Icon, i) => (
              <a key={i} href="#" aria-label="rede social" className="h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-accent hover:text-accent-foreground transition">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-accent uppercase tracking-wider">Contato</div>
          <ul className="mt-4 space-y-3 text-sm text-white/85">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-accent" /> Camaçari · Bahia</li>
            <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-accent" /> (71) 99915-4343</li>
            <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 text-accent" /> orcamentos@fmconstrucoes.com.br</li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-bold text-accent uppercase tracking-wider">Navegação</div>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            {NAV.map((n) => (
              <li key={n.id}><a href={`#${n.id}`} className="hover:text-accent transition">{n.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 text-xs text-white/60 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} F&M Construções Inteligentes. Todos os direitos reservados.</span>
          <span>CNPJ XX.XXX.XXX/0001-XX</span>
        </div>
      </div>
    </footer>
  );
}