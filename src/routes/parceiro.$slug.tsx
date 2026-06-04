import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Instagram,
  MapPin,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Lock,
  Building2,
} from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { logAdmin, trackAcesso } from "@/lib/fm-tracking";
import { LeadForm } from "./fornecedor.$slug";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#25D366";
const FM_WHATSAPP = "5571999454343";
const VIDEO_URL =
  "https://hdjlwidfnikbahfhrkil.supabase.co/storage/v1/object/public/videos/novo.mp4";
const SITE_URL = "https://www.fmsmartbuild.com.br";
const DEFAULT_LIMITE_OBRAS = 5;

export const Route = createFileRoute("/parceiro/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Parceiro F&M | ${params.slug}` },
      {
        name: "description",
        content:
          "Cartão de visita digital do parceiro certificado F&M Construções Inteligentes.",
      },
    ],
  }),
  component: ParceiroPublicoPage,
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

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

type Obra = { id: string | number; descricao: string; fotos: string[] };
type Feedback = { id: string | number; depoimento: string; nome: string };
type Avaliacao = {
  id: string | number;
  nota: number;
  comentario: string;
  nome_cliente: string;
  criado_em?: string;
};

function ParceiroPublicoPage() {
  const { slug } = Route.useParams();
  const [parceiro, setParceiro] = useState<Row | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const perfilRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        // tenta por slug; fallback por id
        let row: Row | null = null;
        const bySlug = await fmSupabase
          .from("parceiros_publico")
          .select("*")
          .eq("slug", slug)
          .limit(1)
          .maybeSingle();
        if (bySlug.data) row = bySlug.data as Row;
        if (!row) {
          const byId = await fmSupabase
            .from("parceiros_publico")
            .select("*")
            .eq("id", slug)
            .limit(1)
            .maybeSingle();
          if (byId.data) row = byId.data as Row;
        }
        if (!active) return;
        if (!row) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setParceiro(row);
        const parceiroId = row.id as string | number;

        const [obrasRes, fotosRes, fbRes, avRes] = await Promise.all([
          fmSupabase
            .from("obras_parceiro")
            .select("*")
            .eq("parceiro_id", parceiroId)
            .order("created_at", { ascending: true }),
          fmSupabase
            .from("fotos_obra")
            .select("*")
            .eq("parceiro_id", parceiroId),
          fmSupabase
            .from("feedbacks_parceiro")
            .select("*")
            .eq("parceiro_id", parceiroId),
          fmSupabase
            .from("avaliacoes")
            .select("*")
            .eq("parceiro_id", parceiroId)
            .order("criado_em", { ascending: false }),
        ]);

        const fotosByObra = new Map<string, string[]>();
        for (const f of (fotosRes.data ?? []) as Row[]) {
          const oid = String(f.obra_id);
          const url = String(pick<string>(f, ["url", "public_url"], ""));
          if (!url) continue;
          const arr = fotosByObra.get(oid) ?? [];
          arr.push(url);
          fotosByObra.set(oid, arr);
        }
        const obrasArr: Obra[] = ((obrasRes.data ?? []) as Row[]).map((o) => ({
          id: o.id as string | number,
          descricao: String(pick<string>(o, ["descricao"], "")),
          fotos: (fotosByObra.get(String(o.id)) ?? []).slice(0, 4),
        }));
        const fbArr: Feedback[] = ((fbRes.data ?? []) as Row[]).map((f) => ({
          id: f.id as string | number,
          depoimento: String(pick<string>(f, ["depoimento"], "")),
          nome: String(pick<string>(f, ["nome_cliente", "nome"], "Cliente")),
        }));
        setObras(obrasArr);
        setFeedbacks(fbArr);
        const avArr: Avaliacao[] = ((avRes.data ?? []) as Row[]).map((a) => ({
          id: a.id as string | number,
          nota: Number(a.nota) || 0,
          comentario: String(pick<string>(a, ["comentario"], "")),
          nome_cliente: String(pick<string>(a, ["nome_cliente", "nome"], "Cliente")),
          criado_em: String(pick<string>(a, ["criado_em", "created_at"], "")),
        }));
        setAvaliacoes(avArr);
        trackAcesso(`/parceiro/${slug}`);
        logAdmin("visualizacao_perfil", `Perfil ${row.nome ?? slug} visualizado`, "publico");
      } catch (e) {
        console.error("[parceiro/$slug] erro:", e);
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const ratings = avaliacoes.map((a) => a.nota).filter((n) => n > 0);
  const media = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;

  const refetchAvaliacoes = async () => {
    if (!parceiro) return;
    const { data } = await fmSupabase
      .from("avaliacoes")
      .select("*")
      .eq("parceiro_id", parceiro.id as string | number)
      .order("criado_em", { ascending: false });
    const arr: Avaliacao[] = ((data ?? []) as Row[]).map((a) => ({
      id: a.id as string | number,
      nota: Number(a.nota) || 0,
      comentario: String(pick<string>(a, ["comentario"], "")),
      nome_cliente: String(pick<string>(a, ["nome_cliente", "nome"], "Cliente")),
      criado_em: String(pick<string>(a, ["criado_em", "created_at"], "")),
    }));
    setAvaliacoes(arr);
  };

  const limite = Number(
    pick<number | string>(parceiro, ["limite_obras"], DEFAULT_LIMITE_OBRAS),
  ) || DEFAULT_LIMITE_OBRAS;
  const obrasVisiveis = obras.slice(0, limite);
  const atingiuLimite = obras.length >= limite;

  const handleVideoEnded = () => {
    perfilRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: BRAND_BLUE }}
        />
      </div>
    );
  }

  if (notFound || !parceiro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>
          Parceiro não encontrado
        </h1>
        <p className="text-sm text-slate-600">
          O cartão que você está tentando acessar não está disponível.
        </p>
        <Link
          to="/"
          className="rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: BRAND_BLUE }}
        >
          Voltar ao site
        </Link>
      </div>
    );
  }

  const nome = String(pick<string>(parceiro, ["nome"], "Parceiro F&M"));
  const empresa = String(pick<string>(parceiro, ["empresa"], ""));
  const especialidade = String(
    pick<string>(parceiro, ["especialidade", "segmento"], ""),
  );
  const cidade = String(pick<string>(parceiro, ["cidade"], ""));
  const estado = String(pick<string>(parceiro, ["estado"], ""));
  const whats = onlyDigits(
    String(pick<string>(parceiro, ["whatsapp", "telefone"], "")),
  );
  const whatsFull = whats.length >= 11 && !whats.startsWith("55")
    ? `55${whats}`
    : whats;
  const instagram = String(pick<string>(parceiro, ["instagram"], "")).replace(
    /^@/,
    "",
  );
  const fotoPerfil = String(
    pick<string>(parceiro, ["foto_perfil", "avatar_url", "foto"], ""),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* BLOCO 1 — Vídeo F&M */}
      <section className="relative w-full bg-black">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          playsInline
          controls
          onEnded={handleVideoEnded}
          className="block h-auto max-h-[80vh] w-full object-cover"
        />
        <div
          className="absolute right-3 top-3 rounded-md px-3 py-1.5 text-sm font-extrabold shadow"
          style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
        >
          F&amp;M
        </div>
      </section>

      {/* BLOCO 2 — Perfil */}
      <section
        ref={perfilRef}
        className="px-4 pt-10 pb-8"
        style={{
          background: `linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)`,
        }}
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div
            className="relative h-32 w-32 overflow-hidden rounded-full border-4 shadow-lg sm:h-40 sm:w-40"
            style={{ borderColor: BRAND_YELLOW }}
          >
            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt={nome}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-white"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {nome.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1
            className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: BRAND_BLUE }}
          >
            {nome}
          </h1>
          {Boolean(parceiro?.verificado) && (
            <span
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-200"
              title="Parceiro verificado pela F&M"
            >
              ✅ Verificado
            </span>
          )}
          {(empresa || especialidade) && (
            <p className="mt-1 text-base font-semibold text-slate-700">
              {[empresa, especialidade].filter(Boolean).join(" • ")}
            </p>
          )}
          {avaliacoes.length > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm" style={{ color: BRAND_BLUE }}>
              <Star className="h-4 w-4" style={{ color: BRAND_YELLOW, fill: BRAND_YELLOW }} />
              {media.toFixed(1)} ({avaliacoes.length} {avaliacoes.length === 1 ? "avaliação" : "avaliações"})
            </div>
          )}
          {(cidade || estado) && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {[cidade, estado].filter(Boolean).join(" / ")}
            </p>
          )}

          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {whatsFull && (
              <a
                href={`https://wa.me/${whatsFull}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp
              </a>
            )}
            {instagram && (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <Instagram className="h-5 w-5" /> Ver no Instagram
              </a>
            )}
          </div>
        </div>
      </section>

      {/* BLOCO 3 — Obras */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-5 inline-flex items-center gap-2 text-xl font-bold"
            style={{ color: BRAND_BLUE }}
          >
            <Building2 className="h-5 w-5" /> Obras Realizadas
          </h2>

          {obrasVisiveis.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Este parceiro ainda não cadastrou obras.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {obrasVisiveis.map((obra) => (
                <ObraCard key={String(obra.id)} obra={obra} />
              ))}
            </div>
          )}

          {atingiuLimite && (
            <div
              className="mt-6 flex flex-col items-center gap-3 rounded-xl border p-5 text-center"
              style={{
                borderColor: BRAND_YELLOW,
                backgroundColor: "#FFF8E7",
              }}
            >
              <Lock
                className="h-6 w-6"
                style={{ color: BRAND_BLUE }}
              />
              <p className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>
                Você atingiu o limite de obras. Entre em contato com a F&amp;M
                para ampliar seu perfil.
              </p>
              <a
                href={`https://wa.me/${FM_WHATSAPP}?text=${encodeURIComponent(
                  `Olá! Quero ampliar o limite de obras do parceiro ${nome}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                <MessageCircle className="h-4 w-4" /> Solicitar ampliação
              </a>
            </div>
          )}
        </div>
      </section>

      {/* BLOCO 4 — Depoimentos */}
      <section className="px-4 py-10" style={{ backgroundColor: "#f8fafc" }}>
          <div className="mx-auto max-w-3xl">
            <h2
              className="mb-5 inline-flex items-center gap-2 text-xl font-bold"
              style={{ color: BRAND_BLUE }}
            >
              <Quote className="h-5 w-5" /> Depoimentos de Clientes
            </h2>

          {avaliacoes.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {avaliacoes.map((fb) => (
                <div
                  key={String(fb.id)}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4"
                        style={{
                          color: BRAND_YELLOW,
                          fill: i <= fb.nota ? BRAND_YELLOW : "transparent",
                        }}
                      />
                    ))}
                  </div>
                  {fb.comentario && (
                    <p className="mt-3 text-sm italic text-slate-700">
                      "{fb.comentario}"
                    </p>
                  )}
                  <p
                    className="mt-3 text-sm font-bold"
                    style={{ color: BRAND_BLUE }}
                  >
                    — {fb.nome_cliente}
                  </p>
                </div>
              ))}
            </div>
          )}
          {feedbacks.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {feedbacks.map((fb) => (
                <div key={String(fb.id)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm italic text-slate-700">"{fb.depoimento}"</p>
                  <p className="mt-3 text-sm font-bold" style={{ color: BRAND_BLUE }}>— {fb.nome}</p>
                </div>
              ))}
            </div>
          )}

          <AvaliarForm parceiroId={parceiro.id as string | number} onSent={refetchAvaliacoes} />
          </div>
      </section>

      {/* BLOCO 4.5 — Lead / Orçamento */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <LeadForm
            origem="parceiro"
            destinatarioId={String(parceiro.id)}
            destinatarioNome={nome}
          />
        </div>
      </section>

      {/* BLOCO 5 — Rodapé F&M */}
      <footer
        className="px-4 py-10 text-center text-white"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        <div
          className="mx-auto inline-flex items-center rounded-md px-3 py-1.5 text-base font-extrabold"
          style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
        >
          F&amp;M
        </div>
        <p className="mt-3 text-sm font-semibold">
          Parceiro certificado F&amp;M Construções Inteligentes
        </p>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition hover:brightness-110"
          style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
        >
          Quero construir com a F&amp;M
        </a>
      </footer>
    </div>
  );
}

function ObraCard({ obra }: { obra: Obra }) {
  const [idx, setIdx] = useState(0);
  const total = obra.fotos.length;
  const next = () => setIdx((i) => (i + 1) % Math.max(total, 1));
  const prev = () => setIdx((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));
  const fotoAtual = useMemo(() => obra.fotos[idx], [obra.fotos, idx]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-slate-100">
        {fotoAtual ? (
          <img
            src={fotoAtual}
            alt={obra.descricao || "Obra"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Sem foto
          </div>
        )}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {obra.fotos.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      i === idx ? BRAND_YELLOW : "rgba(255,255,255,0.6)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {obra.descricao && (
        <div className="p-3">
          <p className="text-sm text-slate-700">{obra.descricao}</p>
        </div>
      )}
    </div>
  );
}

function AvaliarForm({
  parceiroId,
  onSent,
}: {
  parceiroId: string | number;
  onSent: () => void;
}) {
  const storageKey = `fm_avaliou_${parceiroId}`;
  const jaAvaliou =
    typeof window !== "undefined" && !!localStorage.getItem(storageKey);
  const [nota, setNota] = useState(5);
  const [nome, setNome] = useState("");
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(jaAvaliou);
  const [err, setErr] = useState("");

  if (sent) {
    return (
      <div className="mt-8 rounded-xl border bg-white p-5 text-center text-sm text-slate-600">
        ✅ Obrigado pela sua avaliação!
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { setErr("Informe seu nome."); return; }
    if (nota < 1 || nota > 5) { setErr("Nota inválida."); return; }
    setErr("");
    setLoading(true);
    try {
      const { error } = await fmSupabase.from("avaliacoes").insert({
        parceiro_id: parceiroId,
        nota,
        comentario: comentario.trim().slice(0, 500) || null,
        nome_cliente: nome.trim().slice(0, 100),
      });
      if (error) throw error;
      localStorage.setItem(storageKey, "1");
      await logAdmin("avaliacao_enviada", `Avaliação ${nota}⭐ para parceiro ${parceiroId}`, "publico");
      setSent(true);
      onSent();
    } catch (e) {
      console.error(e);
      setErr("Não foi possível enviar agora.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="text-base font-extrabold" style={{ color: BRAND_BLUE }}>
        Deixe sua avaliação
      </h3>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setNota(i)}
            aria-label={`${i} estrelas`}
            className="p-1"
          >
            <Star
              className="h-7 w-7"
              style={{
                color: BRAND_YELLOW,
                fill: i <= nota ? BRAND_YELLOW : "transparent",
              }}
            />
          </button>
        ))}
      </div>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        maxLength={100}
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#1A4D7A] focus:outline-none"
      />
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value.slice(0, 500))}
        rows={3}
        placeholder="Comentário (opcional)"
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#1A4D7A] focus:outline-none"
      />
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-lg py-3 text-sm font-extrabold disabled:opacity-60"
        style={{ backgroundColor: BRAND_YELLOW, color: BRAND_BLUE }}
      >
        {loading ? "Enviando..." : "Enviar Avaliação"}
      </button>
    </form>
  );
}