import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Star, Phone, Mail, MapPin, ArrowLeft, Search, X, CheckCircle2,
  MessageCircle, ThumbsUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fmSupabase } from "@/lib/fm-supabase";
import { ESPECIALIDADES, parseEspecialidades } from "@/lib/fm-parceiro";
import { AvaliarParceiroModal } from "@/components/fm/AvaliarParceiroModal";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const BRAND_DARK = "#2C3E50";

export const Route = createFileRoute("/parceiros")({
  validateSearch: (search: Record<string, unknown>) => ({
    especialidade: typeof search.especialidade === "string" ? search.especialidade : "",
  }),
  head: () => ({
    meta: [
      { title: "Nossos Parceiros | F&M Construções Inteligentes" },
      { name: "description", content: "Galeria pública de parceiros profissionais da F&M." },
    ],
  }),
  component: ParceirosPublicPage,
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

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const r = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          style={{ color: BRAND_YELLOW, fill: i <= r ? BRAND_YELLOW : "transparent" }}
        />
      ))}
    </div>
  );
}

function initials(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function formatLocation(cidade: string, estado: string) {
  const parts = [cidade, estado].filter(Boolean);
  return parts.join(", ") || "";
}

function getAvaliacaoDate(row: Row) {
  const raw = pick<string>(row, ["criado_em", "created_at"], "");
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function ParceiroModal({
  parceiro,
  avaliacoes,
  onClose,
}: {
  parceiro: Row;
  avaliacoes: Row[];
  onClose: () => void;
}) {
  const id = parceiro.id ?? parceiro.Id;
  const [avaliarOpen, setAvaliarOpen] = useState(false);
  const tipo = (parceiro.Tipo as string) ?? (parceiro.CNPJ ? "PJ" : "PF");
  const isPJ = tipo === "PJ";

  const nome = pick<string>(
    parceiro,
    isPJ ? ["Razao_social", "Nome_fantasia", "Nome", "nome"] : ["Nome", "nome", "Razao_social", "Nome_fantasia"],
    "Parceiro"
  );
  const nomeFantasia = isPJ ? pick<string>(parceiro, ["Nome_fantasia", "nome_fantasia"], "") : "";
  const cidade = pick<string>(parceiro, ["Cidade", "cidade"], "");
  const estado = pick<string>(parceiro, ["Estado", "UF", "estado"], "");
  const foto = pick<string>(parceiro, ["Foto_url", "foto_url", "Foto"], "");
  const whatsapp = pick<string>(parceiro, ["Whatsapp", "whatsapp", "WhatsApp", "Telefone", "telefone"], "");
  const telefone = pick<string>(parceiro, ["Telefone", "telefone", "Whatsapp", "whatsapp"], "");
  const esps = isPJ
    ? [pick<string>(parceiro, ["Segmento", "segmento", "Categoria", "categoria", "Especialidade", "especialidade"], "")].filter(Boolean)
    : parseEspecialidades(parceiro.Especialidade ?? (parceiro as Row).Especialidades);

  const avs = avaliacoes
    .filter(
      (a) => String(pick<string | number>(a, ["Parceiro_id", "parceiro_id"], "")) === String(id),
    )
    .sort((a, b) => getAvaliacaoDate(b) - getAvaliacaoDate(a));
  const ratings = avs
    .map((a) => Number(pick<number | string>(a, ["Rating", "rating"], 0)))
    .filter((n) => n > 0);
  const media = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
  const ultima = avs[0];
  const depoimentosAprovados = avs.filter((a) => {
    const aprovado = pick<boolean | string>(a, ["Aprovado", "aprovado"], false);
    const dep = pick<string>(a, ["Depoimento", "depoimento"], "");
    return (aprovado === true || aprovado === "true") && !!dep && String(dep).trim().length > 0;
  });

  const waLink = (num: string) => {
    const clean = num.replace(/\D/g, "");
    const msg = encodeURIComponent("Olá! Vi seu perfil no portal F&M e gostaria de um orçamento.");
    return `https://wa.me/55${clean}?text=${msg}`;
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-lg w-[92vw] p-0 gap-0 overflow-hidden border-0 rounded-2xl"
        onInteractOutside={(e) => {
          if (avaliarOpen) { e.preventDefault(); return; }
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          if (avaliarOpen) { e.preventDefault(); return; }
          onClose();
        }}
      >
        <DialogTitle className="sr-only">Perfil do parceiro</DialogTitle>

        {/* Header */}
        <div className="relative bg-[#1A4D7A] px-6 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {foto ? (
            <img
              src={foto}
              alt={nome}
              className="mx-auto h-20 w-20 rounded-full object-cover border-4 border-white/30 shadow-lg"
            />
          ) : (
            <div className="mx-auto h-20 w-20 rounded-full border-4 border-white/30 shadow-lg grid place-items-center text-white text-2xl font-bold bg-[#1A4D7A]">
              {initials(nome)}
            </div>
          )}

          <h2 className="mt-3 text-lg font-bold text-white leading-tight">{nome}</h2>
          {nomeFantasia && <p className="text-sm text-white/80">{nomeFantasia}</p>}

          <span
            className="mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white text-[#1A4D7A]"
          >
            {isPJ ? "Empresa" : "Pessoa Física"}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Localização */}
          {(cidade || estado) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" style={{ color: BRAND_BLUE }} />
              <span>{formatLocation(cidade, estado)}</span>
            </div>
          )}

          {/* Atuação */}
          {esps.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {isPJ ? "Segmento" : "Especialidades"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {esps.map((e) => (
                  <span
                    key={e}
                    className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Avaliação */}
          <div>
            <div className="flex items-center gap-2">
              <Stars rating={media} size={18} />
              <span className="text-sm font-bold" style={{ color: BRAND_DARK }}>
                {ratings.length > 0 ? `${media.toFixed(1)}` : "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {ratings.length > 0 ? `(${ratings.length} ${ratings.length === 1 ? "avaliação" : "avaliações"})` : "Sem avaliações"}
              </span>
            </div>

            {ultima && (() => {
              const comentario = pick<string>(ultima, ["Comentario", "comentario"], "");
              const nomeAv = pick<string>(ultima, ["Nome_avaliador", "Nome", "nome"], "Cliente");
              return comentario ? (
                <div className="mt-3 rounded-xl bg-[#F7FAFC] p-4 border-l-4" style={{ borderLeftColor: BRAND_YELLOW }}>
                  <p className="text-sm italic text-foreground/80 leading-relaxed">"{comentario}"</p>
                  <p className="mt-2 text-xs font-bold" style={{ color: BRAND_BLUE }}>— {nomeAv}</p>
                </div>
              ) : null;
            })()}

            {depoimentosAprovados.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Depoimentos
                </p>
                {depoimentosAprovados.map((d, i) => {
                  const nomeAv = pick<string>(d, ["Nome_avaliador", "nome_avaliador", "Nome", "nome"], "Cliente");
                  const dep = pick<string>(d, ["Depoimento", "depoimento"], "");
                  const cidadeAv = pick<string>(d, ["Cidade_avaliador", "cidade_avaliador"], "");
                  return (
                    <div
                      key={i}
                      className="rounded-xl bg-[#F7FAFC] p-3 border-l-4"
                      style={{ borderLeftColor: BRAND_BLUE }}
                    >
                      <p className="text-sm italic text-foreground/80 leading-relaxed">"{dep}"</p>
                      <p className="mt-1.5 text-xs font-bold" style={{ color: BRAND_BLUE }}>
                        — {nomeAv}
                        {cidadeAv && (
                          <span className="ml-1 font-normal text-muted-foreground">· {cidadeAv}</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contato */}
          <div className="space-y-2">
            <button
              onClick={() => setAvaliarOpen(true)}
              className="flex items-center justify-center gap-2 w-full rounded-xl border-2 py-2.5 text-sm font-bold transition hover:bg-muted/40"
              style={{ borderColor: BRAND_YELLOW, color: BRAND_BLUE }}
            >
              <ThumbsUp className="h-4 w-4" /> Avaliar este parceiro
            </button>
            {whatsapp && (
              <a
                href={waLink(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:brightness-110"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                <MessageCircle className="h-4 w-4" />
                Chamar no WhatsApp
              </a>
            )}
            {telefone && (
              <a
                href={`tel:${telefone.replace(/\D/g, "")}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl border py-2.5 text-sm font-semibold transition hover:bg-muted/40"
                style={{ color: BRAND_BLUE, borderColor: "#e2e8f0" }}
              >
                <Phone className="h-4 w-4" />
                {telefone}
              </a>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 bg-[#F7FAFC] border-t flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" style={{ color: BRAND_GREEN }} />
          Profissional cadastrado na rede F&M
        </div>
      </DialogContent>
      {avaliarOpen && (
        <AvaliarParceiroModal
          parceiroId={id as string | number}
          parceiroNome={nome}
          onClose={() => setAvaliarOpen(false)}
        />
      )}
    </Dialog>
  );
}

function ParceirosPublicPage() {
  const { especialidade } = Route.useSearch();
  const [parceiros, setParceiros] = useState<Row[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Row[]>([]);
  const [filtro, setFiltro] = useState(especialidade || "");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedParceiro, setSelectedParceiro] = useState<Row | null>(null);

  useEffect(() => {
    setFiltro(especialidade || "");
  }, [especialidade]);

  useEffect(() => {
    let active = true;
    async function load() {
      const [p, aLegacy, aPublicas] = await Promise.all([
        fmSupabase.from("parceiros_publico").select("*"),
        fmSupabase.from("Avaliacoes").select("*"),
        fmSupabase.from("avaliacoes").select("*").eq("aprovado", true),
      ]);
      console.log("[parceiros] parceiros:", p);
      console.log("[parceiros] avaliacoes legacy:", aLegacy);
      console.log("[parceiros] avaliacoes publicas:", aPublicas);
      if (!active) return;
      setParceiros((p.data as Row[]) ?? []);
      const novas = ((aPublicas.data as Row[]) ?? []).map((a) => ({
        ...a,
        Parceiro_id: a.parceiro_id,
        Rating: a.nota,
        Comentario: a.comentario,
        Nome_avaliador: a.nome_avaliador,
        Telefone_avaliador: a.telefone_avaliador,
        Email_avaliador: a.email_avaliador,
        Depoimento: a.depoimento,
        Cidade_avaliador: a.cidade_avaliador,
        Aprovado: a.aprovado,
      }));
      const todas = [...(((aLegacy.data as Row[]) ?? [])), ...novas].sort(
        (a, b) => getAvaliacaoDate(b) - getAvaliacaoDate(a),
      );
      setAvaliacoes(todas);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const parceirosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return parceiros.filter((p) => {
      const esps = parseEspecialidades(
        p.Especialidade ?? (p as Row).Especialidades ?? (p as Row).especialidades,
      );
      if (filtro && !esps.some((e) => e.toLowerCase() === filtro.toLowerCase())) return false;
      if (!q) return true;
      const nome = String(pick<string>(p, ["Nome_fantasia", "Razao_social", "Nome", "nome"], "")).toLowerCase();
      const cidade = String(pick<string>(p, ["Cidade", "cidade"], "")).toLowerCase();
      return nome.includes(q) || cidade.includes(q);
    });
  }, [parceiros, filtro, busca]);

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
            to="/parceiro/login"
            className="rounded-md px-3 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            Sou Parceiro
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: BRAND_BLUE }}>
            Nossos Parceiros
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Profissionais que constroem com a F&M.
          </p>
        </div>

        <div className="mt-6 max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por nome ou cidade..."
            className="w-full rounded-full border bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setFiltro("")}
            className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            style={filtro === "" ? { backgroundColor: BRAND_YELLOW, borderColor: BRAND_YELLOW, color: "#1a1a1a" } : { backgroundColor: "#fff" }}
          >
            Todos
          </button>
          {ESPECIALIDADES.map((e) => (
            <button
              key={e}
              onClick={() => setFiltro(e)}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
              style={filtro === e ? { backgroundColor: BRAND_YELLOW, borderColor: BRAND_YELLOW, color: "#1a1a1a" } : { backgroundColor: "#fff" }}
            >
              {e}
            </button>
          ))}
        </div>

        {!loading && (
          <p className="mt-4 text-center text-sm font-semibold" style={{ color: BRAND_DARK }}>
            {parceirosFiltrados.length} {parceirosFiltrados.length === 1 ? "profissional encontrado" : "profissionais encontrados"}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : parceirosFiltrados.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Nenhum parceiro encontrado.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {parceirosFiltrados.map((p) => {
              const id = p.id ?? p.Id;
              const tipo = (p.Tipo as string) ?? (p.CNPJ ? "PJ" : "PF");
              const nome = pick<string>(p, ["Nome_fantasia", "Razao_social", "Nome", "nome"], "Parceiro");
              const esps = parseEspecialidades(p.Especialidade ?? (p as Row).Especialidades);
              const cidade = pick<string>(p, ["Cidade", "cidade"], "");
              const estado = pick<string>(p, ["Estado", "UF", "estado"], "");
              const foto = pick<string>(p, ["Foto_url", "foto_url", "Foto"], "");
              const avs = avaliacoes
                .filter(
                  (a) => String(pick<string | number>(a, ["Parceiro_id", "parceiro_id"], "")) === String(id),
                )
                .sort((a, b) => getAvaliacaoDate(b) - getAvaliacaoDate(a));
              const ratings = avs
                .map((a) => Number(pick<number | string>(a, ["Rating", "rating"], 0)))
                .filter((n) => n > 0);
              const media = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
              const ultima = avs[0];
              return (
                <article
                  key={String(id)}
                  className="rounded-2xl bg-white border shadow-sm p-5 flex flex-col cursor-pointer transition hover:shadow-md hover:-translate-y-0.5"
                  onClick={() => setSelectedParceiro(p)}
                >
                  <div className="flex items-center gap-3">
                    {foto ? (
                      <img src={foto} alt={nome} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div
                        className="h-14 w-14 rounded-full grid place-items-center text-white font-bold"
                        style={{ backgroundColor: BRAND_BLUE }}
                      >
                        {initials(nome)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold truncate" style={{ color: BRAND_DARK }}>{nome}</h3>
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: tipo === "PJ" ? BRAND_BLUE : BRAND_GREEN }}
                        >
                          {tipo}
                        </span>
                      </div>
                      {(cidade || estado) && (
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {[cidade, estado].filter(Boolean).join(" / ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {esps.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {esps.map((e) => (
                        <span
                          key={e}
                          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Stars rating={media} />
                    <span className="text-xs font-bold" style={{ color: BRAND_DARK }}>
                      {ratings.length ? `${media.toFixed(1)}/5` : "Sem avaliações"}
                    </span>
                  </div>

                  {ultima && (
                    <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs flex-1">
                      {(() => {
                        const comentario = pick<string>(ultima, ["Comentario", "comentario"], "");
                        const nomeAv = pick<string>(ultima, ["Nome_avaliador", "Nome", "nome"], "Cliente");
                        const tel = pick<string>(ultima, ["Telefone_avaliador", "Telefone", "telefone"], "");
                        const email = pick<string>(ultima, ["Email_avaliador", "Email", "email"], "");
                        return (
                          <>
                            {comentario && <p className="italic text-foreground/80">"{comentario}"</p>}
                            <p className="mt-1 font-bold" style={{ color: BRAND_BLUE }}>{nomeAv}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {tel && (
                                <a
                                  href={`tel:${tel.replace(/\D/g, "")}`}
                                  className="inline-flex items-center gap-1 hover:underline"
                                  style={{ color: BRAND_GREEN }}
                                >
                                  <Phone className="h-3 w-3" /> {tel}
                                </a>
                              )}
                              {email && (
                                <a
                                  href={`mailto:${email}`}
                                  className="inline-flex items-center gap-1 hover:underline"
                                  style={{ color: BRAND_BLUE }}
                                >
                                  <Mail className="h-3 w-3" /> {email}
                                </a>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {selectedParceiro && (
          <ParceiroModal
            parceiro={selectedParceiro}
            avaliacoes={avaliacoes}
            onClose={() => setSelectedParceiro(null)}
          />
        )}
      </main>
    </div>
  );
}