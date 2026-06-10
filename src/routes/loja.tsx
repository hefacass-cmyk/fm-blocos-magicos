import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ShoppingCart, ExternalLink, Wrench, HardHat, PaintBucket, Plug } from "lucide-react";

export const Route = createFileRoute("/loja")({
  head: () => ({
    meta: [
      { title: "Loja F&M | Catálogo de Materiais e Parceiros" },
      { name: "description", content: "Catálogo F&M de porcelanatos, revestimentos e acabamentos. Frete grátis acima de R$500 em Salvador e RMS." },
    ],
  }),
  component: LojaPage,
});

const CATALOGOS = [
  { titulo: "Catálogo Alpha", url: "https://hdjlwidfnikbahfhrkil.supabase.co/storage/v1/object/public/obra-arquivos/CATALOGO%20ALPHA.pdf" },
  { titulo: "Catálogo Completo 2021", url: "https://hdjlwidfnikbahfhrkil.supabase.co/storage/v1/object/public/obra-arquivos/CATALOGO.COMPLETO2021.pdf" },
];

type Produto = { id: string; nome: string; preco: number; unidade: "m²" | "un" };
const PRODUTOS: Produto[] = [
  { id: "p1", nome: "Porcelanato Eliane C AC 19x90", preco: 59.9, unidade: "m²" },
  { id: "p2", nome: "Porcelanato Munari Branco Eliane 90x90", preco: 59.9, unidade: "m²" },
  { id: "p3", nome: "Porcelanato Delta AC Obelisco 120x120", preco: 99.99, unidade: "m²" },
  { id: "p4", nome: "Piso Grês A AC 23x100", preco: 49.99, unidade: "m²" },
  { id: "p5", nome: "Porcelanato Natural A 120x120", preco: 89.9, unidade: "m²" },
  { id: "p6", nome: "Revestimento 37x76", preco: 69.9, unidade: "m²" },
  { id: "p7", nome: "Revestimento Retificado 30x60", preco: 49.9, unidade: "m²" },
  { id: "p8", nome: "Exagonal Cores", preco: 79.9, unidade: "m²" },
  { id: "p9", nome: "Revestimento 20x20 Elizabeth", preco: 85.9, unidade: "m²" },
  { id: "p10", nome: "Rock Face 10x30", preco: 259.9, unidade: "m²" },
  { id: "p11", nome: "Porcelanato Técnico Elizabeth 70x70", preco: 59.9, unidade: "m²" },
  { id: "p12", nome: "Porcelanato Damme 83x83", preco: 59.9, unidade: "m²" },
  { id: "p13", nome: "Porcelanato Delta AC 84x84", preco: 79.9, unidade: "m²" },
  { id: "p14", nome: "Porcelanato Ladrilho Hidráulico 60x60", preco: 79.9, unidade: "m²" },
  { id: "p15", nome: "Perfil Soleira Alumínio 3M", preco: 259.9, unidade: "un" },
  { id: "p16", nome: "Pedra Moledo Branca e Amarela", preco: 129.9, unidade: "m²" },
  { id: "p17", nome: "Rodapé Frisado/Liso 10cm Barra 2M", preco: 59.9, unidade: "un" },
  { id: "p18", nome: "Pedra Lá Roccio", preco: 219.9, unidade: "m²" },
  { id: "p19", nome: "Ralo Oculto 75cm", preco: 189.9, unidade: "un" },
  { id: "p20", nome: "Ralo Oculto 10x10", preco: 99.9, unidade: "un" },
];

const PARCEIROS = [
  { categoria: "Ferramentas e EPI", loja: "Shopee", icon: Wrench, url: "https://shopee.com.br/search?keyword=ferramentas%20epi%20construcao" },
  { categoria: "Equipamentos de Obra", loja: "Shopee", icon: HardHat, url: "https://shopee.com.br/search?keyword=equipamentos%20obra" },
  { categoria: "Tintas e Acabamentos", loja: "Leroy Merlin", icon: PaintBucket, url: "https://www.leroymerlin.com.br/tintas" },
  { categoria: "Hidráulica e Elétrica", loja: "Leroy Merlin", icon: Plug, url: "https://www.leroymerlin.com.br/hidraulica-e-eletrica" },
];

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function LojaPage() {
  const [sel, setSel] = useState<Record<string, number>>({});
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");

  const total = useMemo(
    () => PRODUTOS.reduce((acc, p) => acc + (sel[p.id] ? sel[p.id] * p.preco : 0), 0),
    [sel]
  );

  const toggle = (id: string) => {
    setSel((s) => {
      const next = { ...s };
      if (next[id] != null) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const setQtd = (id: string, q: number) => {
    setSel((s) => ({ ...s, [id]: Math.max(0, q) }));
  };

  const enviar = () => {
    const itens = PRODUTOS.filter((p) => sel[p.id] && sel[p.id] > 0);
    if (itens.length === 0) {
      alert("Selecione pelo menos um produto.");
      return;
    }
    if (!nome.trim() || !tel.trim()) {
      alert("Informe seu nome e telefone.");
      return;
    }
    const linhas = itens.map((p) => {
      const q = sel[p.id];
      const sub = q * p.preco;
      return `• ${p.nome} — ${q} ${p.unidade} x ${brl(p.preco)} = ${brl(sub)}`;
    });
    const msg = [
      "Olá! Gostaria de um orçamento da Loja F&M.",
      `Nome: ${nome}`,
      `Telefone: ${tel}`,
      "",
      "Produtos:",
      ...linhas,
      "",
      `Total estimado: ${brl(total)}`,
    ].join("\n");
    const url = `https://wa.me/5571999454343?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Banner frete */}
      <div className="w-full" style={{ backgroundColor: "#F4B941" }}>
        <div className="mx-auto max-w-7xl px-4 py-3 text-center font-bold text-sm sm:text-base" style={{ color: "#1A4D7A" }}>
          Frete grátis para pedidos acima de R$ 500,00 — Salvador e Região Metropolitana
        </div>
      </div>

      {/* Header simples */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#1A4D7A" }}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
          <div className="inline-flex items-center gap-2 font-bold" style={{ color: "#1A4D7A" }}>
            <ShoppingCart className="h-5 w-5" /> Loja F&M
          </div>
        </div>
      </div>

      {/* Seção 1 — Catálogo F&M */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "#1A4D7A" }}>
            Catálogo F&M
          </h1>
          <p className="mt-2 text-muted-foreground">
            Confira os catálogos completos e monte seu pedido abaixo.
          </p>

          <div className="mt-8 space-y-8">
            {CATALOGOS.map((c) => (
              <div key={c.url} className="rounded-xl border overflow-hidden bg-white shadow-sm">
                <div className="px-4 py-3 font-semibold" style={{ backgroundColor: "#1A4D7A", color: "white" }}>
                  {c.titulo}
                </div>
                <iframe
                  src={c.url}
                  title={c.titulo}
                  className="w-full"
                  style={{ height: "80vh", minHeight: 600, border: 0 }}
                />
                <div className="px-4 py-3 border-t text-sm flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Não conseguiu visualizar?</span>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold"
                    style={{ color: "#1A4D7A" }}
                  >
                    Abrir PDF em nova aba <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Formulário de pedido */}
          <div className="mt-12 rounded-2xl border bg-white p-5 sm:p-7 shadow-sm">
            <h2 className="text-2xl font-extrabold" style={{ color: "#1A4D7A" }}>
              Monte seu Orçamento
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Marque os produtos desejados, informe a quantidade e envie pelo WhatsApp.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRODUTOS.map((p) => {
                const checked = sel[p.id] != null;
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border p-3 transition"
                    style={{ borderColor: checked ? "#1A4D7A" : "#E2E8F0", backgroundColor: checked ? "#F0F7FF" : "white" }}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(p.id)}
                        className="mt-1 h-4 w-4 accent-[#1A4D7A]"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm" style={{ color: "#2C3E50" }}>{p.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {brl(p.preco)}/{p.unidade}
                        </div>
                      </div>
                    </label>
                    {checked && (
                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground">Qtd ({p.unidade}):</label>
                        <input
                          type="number"
                          min={0}
                          step={p.unidade === "m²" ? 0.5 : 1}
                          value={sel[p.id] ?? 0}
                          onChange={(e) => setQtd(p.id, Number(e.target.value))}
                          className="w-24 rounded-md border px-2 py-1 text-sm"
                        />
                        <span className="ml-auto text-sm font-semibold" style={{ color: "#1A4D7A" }}>
                          {brl((sel[p.id] || 0) * p.preco)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
                <input
                  type="tel"
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="(71) 99999-9999"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4" style={{ backgroundColor: "#F0F7FF" }}>
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#1A4D7A" }}>Total estimado</div>
                <div className="text-3xl font-extrabold" style={{ color: "#1A4D7A" }}>{brl(total)}</div>
              </div>
              <button
                onClick={enviar}
                className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-extrabold transition hover:brightness-95"
                style={{ backgroundColor: "#F4B941", color: "#1A4D7A" }}
              >
                Solicitar Orçamento via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 2 — Parceiros & Ofertas */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: "#F7FAFC" }}>
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "#1A4D7A" }}>
            Parceiros & Ofertas
          </h2>
          <p className="mt-2 text-muted-foreground">
            Lojas selecionadas pela F&M para complementar sua obra.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PARCEIROS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.categoria}
                  className="rounded-xl border bg-white p-5 flex flex-col shadow-sm hover:shadow-md transition"
                >
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "#F4B941" }}
                  >
                    <Icon className="h-6 w-6" style={{ color: "#1A4D7A" }} />
                  </div>
                  <div className="mt-4 font-bold" style={{ color: "#1A4D7A" }}>{p.categoria}</div>
                  <div className="text-xs text-muted-foreground mt-1">via {p.loja}</div>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                    style={{ backgroundColor: "#1A4D7A" }}
                  >
                    Ver Ofertas <ExternalLink className="h-4 w-4" />
                  </a>
                  <div className="mt-3 text-[11px] text-muted-foreground text-center">
                    Selecionado pela F&M • Compra segura
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
