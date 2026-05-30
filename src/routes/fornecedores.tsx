import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Phone, Mail, MapPin, ArrowLeft, MessageCircle, Building2, Search } from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const BRAND_DARK = "#2C3E50";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({
    meta: [
      { title: "Nossos Fornecedores Parceiros | F&M Construções Inteligentes" },
      { name: "description", content: "Fornecedores parceiros da F&M Construções Inteligentes." },
    ],
  }),
  component: FornecedoresPage,
});

type Row = Record<string, unknown>;

function pick<T>(row: Row | null | undefined, keys: string[], fallback: T): T {
  if (!row) return fallback;
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return fallback;
}

function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Row[]>([]);
  const [categoria, setCategoria] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await fmSupabase.from("Fornecedores").select("*");
      console.log("[fornecedores] resposta:", { data, error });
      if (!active) return;
      setFornecedores((data as Row[]) ?? []);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    fornecedores.forEach((f) => {
      const c = pick<string>(f, ["Categoria", "categoria"], "");
      if (c) s.add(c);
    });
    return Array.from(s).sort();
  }, [fornecedores]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return fornecedores.filter((f) => {
      const cat = String(pick<string>(f, ["Categoria", "categoria"], ""));
      if (categoria && cat !== categoria) return false;
      if (!q) return true;
      const nome = String(pick<string>(f, ["Nome", "Empresa", "Nome_empresa"], "")).toLowerCase();
      const cidade = String(pick<string>(f, ["Cidade", "cidade"], "")).toLowerCase();
      return nome.includes(q) || cidade.includes(q);
    });
  }, [fornecedores, categoria, busca]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex items-center gap-0.5 text-xl font-extrabold tracking-tight">
            <span style={{ color: BRAND_BLUE }}>F</span>
            <span style={{ color: BRAND_YELLOW }}>&</span>
            <span style={{ color: BRAND_GREEN }}>M</span>
          </div>
          <Link
            to="/parceiros"
            className="text-sm font-semibold hover:underline"
            style={{ color: BRAND_BLUE }}
          >
            Parceiros
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: BRAND_BLUE }}>
            Nossos Fornecedores Parceiros
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Empresas que apoiam as obras inteligentes da F&M.
          </p>
        </div>

        <div className="mt-6 max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por empresa ou cidade..."
            className="w-full rounded-full border bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {categorias.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setCategoria("")}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
              style={categoria === "" ? { backgroundColor: BRAND_BLUE, borderColor: BRAND_BLUE, color: "#fff" } : { backgroundColor: "#fff" }}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                style={categoria === c ? { backgroundColor: BRAND_BLUE, borderColor: BRAND_BLUE, color: "#fff" } : { backgroundColor: "#fff" }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Nenhum fornecedor encontrado.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((f, i) => {
              const nome = pick<string>(f, ["Nome", "Empresa", "Nome_empresa"], "Fornecedor");
              const categoriaF = pick<string>(f, ["Categoria", "categoria"], "");
              const responsavel = pick<string>(f, ["Responsavel", "Contato", "responsavel"], "");
              const whats = pick<string>(f, ["Whatsapp", "WhatsApp", "whatsapp"], "");
              const tel = pick<string>(f, ["Telefone", "telefone"], "");
              const email = pick<string>(f, ["Email", "email"], "");
              const endereco = pick<string>(f, ["Endereco", "endereco"], "");
              const cidade = pick<string>(f, ["Cidade", "cidade"], "");
              const estado = pick<string>(f, ["Estado", "UF", "estado"], "");
              const whatsDigits = whats.replace(/\D/g, "");
              const telDigits = tel.replace(/\D/g, "");
              return (
                <article key={i} className="rounded-2xl bg-white border shadow-sm p-5 flex flex-col">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg grid place-items-center text-white shrink-0"
                      style={{ backgroundColor: BRAND_BLUE }}
                    >
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold truncate" style={{ color: BRAND_DARK }}>{nome}</h3>
                      {categoriaF && (
                        <span
                          className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
                        >
                          {categoriaF}
                        </span>
                      )}
                    </div>
                  </div>

                  {responsavel && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      <span className="font-bold">Contato:</span> {responsavel}
                    </p>
                  )}

                  <div className="mt-3 space-y-1.5 text-sm flex-1">
                    {whats && (
                      <a
                        href={`https://wa.me/${whatsDigits.length >= 11 ? "55" + whatsDigits.replace(/^55/, "") : whatsDigits}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 hover:underline"
                        style={{ color: BRAND_GREEN }}
                      >
                        <MessageCircle className="h-4 w-4" /> {whats}
                      </a>
                    )}
                    {tel && (
                      <a
                        href={`tel:${telDigits}`}
                        className="block inline-flex items-center gap-2 hover:underline"
                        style={{ color: BRAND_BLUE }}
                      >
                        <Phone className="h-4 w-4" /> {tel}
                      </a>
                    )}
                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="block inline-flex items-center gap-2 hover:underline break-all"
                        style={{ color: BRAND_BLUE }}
                      >
                        <Mail className="h-4 w-4 shrink-0" /> {email}
                      </a>
                    )}
                    {(endereco || cidade || estado) && (
                      <p className="inline-flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          {endereco}
                          {endereco && (cidade || estado) ? " — " : ""}
                          {[cidade, estado].filter(Boolean).join(" / ")}
                        </span>
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}