import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  LogOut,
  Star,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  MessageCircle,
  Share2,
  Copy,
  Check,
  Instagram,
  Building2,
  Plus,
  AlertTriangle,
  Download,
  Users,
} from "lucide-react";
import {
  fmSupabase,
  getParceiro,
  clearParceiro,
  parseEspecialidades,
  maskCpf,
  maskCnpj,
  ESPECIALIDADES,
  FM_WHATSAPP,
} from "@/lib/fm-parceiro";
import { SolicitarAmpliacaoModal } from "@/components/fm/SolicitarAmpliacaoModal";
import { logAdmin } from "@/lib/fm-tracking";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const BRAND_GREEN = "#06A77D";
const BRAND_DARK = "#2C3E50";

export const Route = createFileRoute("/parceiro/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard do Parceiro | F&M" }] }),
  component: ParceiroDashboardPage,
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

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
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

function ParceiroDashboardPage() {
  const navigate = useNavigate();
  const parceiro = typeof window !== "undefined" ? getParceiro() : null;

  const [avaliacoes, setAvaliacoes] = useState<Row[]>([]);
  const [oportunidades, setOportunidades] = useState<Row[]>([]);
  const [obras, setObras] = useState<Row[]>([]);
  const [leads, setLeads] = useState<Row[]>([]);
  const [limiteObras, setLimiteObras] = useState<number>(4);
  const [ampliacaoStatus, setAmpliacaoStatus] = useState<string | null>(null);
  const [showAmpliar, setShowAmpliar] = useState(false);
  const [showNovaObra, setShowNovaObra] = useState(false);
  const [novaDesc, setNovaDesc] = useState("");
  const [salvandoObra, setSalvandoObra] = useState(false);
  const [filtroEsp, setFiltroEsp] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parceiro) {
      navigate({ to: "/parceiro/login" });
      return;
    }
    let active = true;
    async function load() {
      try {
        const [av, op, obrasRes, parceiroRes, solicRes] = await Promise.all([
          fmSupabase
            .from("Avaliacoes")
            .select("*")
            .eq("Parceiro_id", parceiro!.id as string | number),
          fmSupabase
            .from("Mural_oportunidades")
            .select("*")
            .eq("status", "aberta"),
          fmSupabase
            .from("obras_parceiro")
            .select("*")
            .eq("parceiro_id", parceiro!.id as string | number)
            .order("created_at", { ascending: false }),
          fmSupabase
            .from("parceiros")
            .select("limite_obras")
            .eq("id", parceiro!.id as string | number)
            .maybeSingle(),
          fmSupabase
            .from("solicitacoes_ampliacao")
            .select("status, criado_em")
            .eq("parceiro_id", parceiro!.id as string | number)
            .order("criado_em", { ascending: false })
            .limit(1),
        ]);
        const leadsRes = await fmSupabase
          .from("leads_indicacao")
          .select("*")
          .eq("parceiro_id", String(parceiro!.id))
          .order("created_at", { ascending: false });
        console.log("[parceiro/dashboard] avaliacoes:", av);
        console.log("[parceiro/dashboard] oportunidades:", op);
        if (!active) return;
        setAvaliacoes((av.data as Row[]) ?? []);
        setOportunidades((op.data as Row[]) ?? []);
        setObras((obrasRes.data as Row[]) ?? []);
        setLeads((leadsRes.data as Row[]) ?? []);
        const lim = Number((parceiroRes.data as Row | null)?.limite_obras ?? 4) || 4;
        setLimiteObras(lim);
        const ultima = (solicRes.data as Row[] | null)?.[0];
        setAmpliacaoStatus(ultima ? String(ultima.status ?? "") : null);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parceiro?.id]);

  const ratings = avaliacoes
    .map((a) => Number(pick<number | string>(a, ["Rating", "rating", "Estrelas", "estrelas"], 0)))
    .filter((n) => n > 0);
  const media = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;

  const oportunidadesFiltradas = filtroEsp
    ? oportunidades.filter(
        (o) => pick<string>(o, ["Especialidade", "especialidade"], "") === filtroEsp,
      )
    : oportunidades;

  if (!parceiro) return null;

  const tipo = (parceiro.Tipo as "PF" | "PJ" | undefined) ?? (parceiro.CNPJ ? "PJ" : "PF");
  const especialidadesParceiro = parseEspecialidades(
    parceiro.Especialidade ?? (parceiro as Row).Especialidades ?? (parceiro as Row).especialidades,
  );
  const nomeExibido =
    tipo === "PJ"
      ? pick<string>(parceiro as Row, ["Nome_fantasia", "Razao_social", "Nome"], "Parceiro")
      : (parceiro.Nome ?? "Parceiro");
  const anos = pick<string | number>(parceiro as Row, ["Anos_experiencia", "anos_experiencia", "Experiencia"], "");
  const cidade = pick<string>(parceiro as Row, ["Cidade", "cidade"], "");
  const estado = pick<string>(parceiro as Row, ["Estado", "UF", "estado"], "");
  const email = pick<string>(parceiro as Row, ["Email", "email"], "");
  const whats = pick<string>(parceiro as Row, ["Whatsapp", "WhatsApp", "whatsapp"], "");

  const slug = String(
    pick<string>(parceiro as Row, ["slug", "Slug"], "") ||
      (parceiro.id !== undefined ? String(parceiro.id) : ""),
  );
  const shareUrl = slug
    ? `https://www.fmsmartbuild.com.br/parceiro/${slug}`
    : "";

  const atingiuLimite = obras.length >= limiteObras;

  const abrirNovaObra = () => {
    if (atingiuLimite) {
      setShowAmpliar(true);
    } else {
      setShowNovaObra(true);
    }
  };

  const salvarObra = async () => {
    if (!novaDesc.trim()) return;
    setSalvandoObra(true);
    try {
      const { data, error } = await fmSupabase
        .from("obras_parceiro")
        .insert({
          parceiro_id: parceiro!.id,
          descricao: novaDesc.trim().slice(0, 500),
        })
        .select()
        .single();
      if (error) throw error;
      setObras((arr) => [data as Row, ...arr]);
      await logAdmin("obra_cadastrada", `Parceiro ${parceiro!.id} cadastrou obra`, "parceiro");
      setNovaDesc("");
      setShowNovaObra(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar obra.");
    } finally {
      setSalvandoObra(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-0.5 text-xl font-extrabold tracking-tight shrink-0">
              <span style={{ color: BRAND_BLUE }}>F</span>
              <span style={{ color: BRAND_YELLOW }}>&</span>
              <span style={{ color: BRAND_GREEN }}>M</span>
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm sm:text-base font-bold truncate" style={{ color: BRAND_BLUE }}>
                {nomeExibido}
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {especialidadesParceiro.length > 0 ? (
                  especialidadesParceiro.slice(0, 3).map((e) => (
                    <span
                      key={e}
                      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
                    >
                      {e}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => { clearParceiro(); navigate({ to: "/parceiro/login" }); }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <section
          className="rounded-2xl p-6 shadow-sm border text-white"
          style={{ background: `linear-gradient(135deg, ${BRAND_BLUE}, #2a6aa0)` }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold">Meu Perfil</h2>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase"
              style={{
                backgroundColor:
                  String(parceiro.Status ?? "").toLowerCase() === "ativo" ? BRAND_GREEN : "#94a3b8",
                color: "#fff",
              }}
            >
              {parceiro.Status ?? "—"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {tipo === "PF" ? (
              <>
                <InfoRow label="Nome" value={parceiro.Nome ?? "—"} />
                <InfoRow label="CPF" value={parceiro.CPF ? maskCpf(String(parceiro.CPF)) : "—"} />
                <InfoRow label="RG" value={pick<string>(parceiro as Row, ["RG", "rg"], "—")} />
                <InfoRow label="WhatsApp" value={whats || "—"} />
                <InfoRow label="Email" value={email || "—"} />
                <InfoRow label="Cidade / Estado" value={[cidade, estado].filter(Boolean).join(" / ") || "—"} />
              </>
            ) : (
              <>
                <InfoRow label="Razão Social" value={pick<string>(parceiro as Row, ["Razao_social", "Razao_Social"], "—")} />
                <InfoRow label="Nome Fantasia" value={pick<string>(parceiro as Row, ["Nome_fantasia", "Nome"], "—")} />
                <InfoRow label="CNPJ" value={parceiro.CNPJ ? maskCnpj(String(parceiro.CNPJ)) : "—"} />
                <InfoRow label="Responsável" value={pick<string>(parceiro as Row, ["Responsavel", "responsavel"], "—")} />
                <InfoRow label="WhatsApp" value={whats || "—"} />
                <InfoRow label="Email" value={email || "—"} />
                <InfoRow label="Cidade / Estado" value={[cidade, estado].filter(Boolean).join(" / ") || "—"} />
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {especialidadesParceiro.map((e) => (
              <span
                key={e}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
              >
                {e}
              </span>
            ))}
            {anos !== "" && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-white/15 border border-white/30">
                {anos} ano(s) de experiência
              </span>
            )}
          </div>
        </section>

        {shareUrl && <ShareCardSection shareUrl={shareUrl} nome={nomeExibido} />}

        {shareUrl && <LeadsSection leads={leads} />}

        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold" style={{ color: BRAND_DARK }}>
              <Building2 className="h-5 w-5" /> Minhas Obras
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: atingiuLimite ? "#ef4444" : BRAND_BLUE }}>
                {obras.length} / {limiteObras}
              </span>
              <button
                onClick={abrirNovaObra}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <Plus className="h-4 w-4" /> Cadastrar obra
              </button>
            </div>
          </div>
          {atingiuLimite && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm" style={{ borderColor: BRAND_YELLOW, backgroundColor: "#FFF8E7", color: BRAND_BLUE }}>
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Você atingiu o limite de {limiteObras} obras grátis.{" "}
                {ampliacaoStatus === "pendente" ? (
                  <strong>Solicitação de ampliação enviada — aguardando admin.</strong>
                ) : (
                  <button onClick={() => setShowAmpliar(true)} className="font-bold underline">
                    Solicitar ampliação
                  </button>
                )}
              </span>
            </div>
          )}
          {obras.length > 0 && (
            <ul className="mt-4 divide-y">
              {obras.map((o, i) => (
                <li key={i} className="py-2 text-sm">
                  <p className="font-medium">{String(o.descricao ?? "—")}</p>
                  <p className="text-xs text-slate-500">{String(o.created_at ?? "").slice(0,10)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>Minhas Avaliações</h2>
            {ratings.length > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={media} size={26} />
                <span className="text-xl font-extrabold" style={{ color: BRAND_DARK }}>
                  {media.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">({ratings.length})</span>
              </div>
            )}
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : avaliacoes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Você ainda não tem avaliações.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {avaliacoes.map((a, i) => {
                const rating = Number(pick<number | string>(a, ["Rating", "rating", "Estrelas"], 0));
                const comentario = pick<string>(a, ["Comentario", "comentario"], "");
                const nome = pick<string>(a, ["Nome_avaliador", "Nome", "nome"], "Cliente");
                const tel = pick<string>(a, ["Telefone_avaliador", "Telefone", "telefone", "Whatsapp"], "");
                const emailAv = pick<string>(a, ["Email_avaliador", "Email", "email"], "");
                const obra = pick<string>(a, ["Obra_nome", "Obra", "obra"], "");
                const data = pick<string>(a, ["Data", "data", "created_at"], "");
                const origem = String(pick<string>(a, ["Origem", "origem", "Tipo"], "Cliente"));
                const isFM = /f.?m/i.test(origem);
                return (
                  <div key={i} className="rounded-xl border p-4 bg-muted/20 flex flex-col">
                    <div className="flex items-center justify-between">
                      <Stars rating={rating} size={18} />
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: isFM ? BRAND_BLUE : BRAND_GREEN }}
                      >
                        {isFM ? "F&M" : "Cliente"}
                      </span>
                    </div>
                    {comentario && (
                      <p className="mt-2 text-sm font-medium text-foreground italic">"{comentario}"</p>
                    )}
                    <p className="mt-3 text-sm font-bold" style={{ color: BRAND_BLUE }}>{nome}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs">
                      {tel && (
                        <a
                          href={`tel:${tel.replace(/\D/g, "")}`}
                          className="inline-flex items-center gap-1 hover:underline"
                          style={{ color: BRAND_GREEN }}
                        >
                          <Phone className="h-3 w-3" /> {tel}
                        </a>
                      )}
                      {emailAv && (
                        <a
                          href={`mailto:${emailAv}`}
                          className="inline-flex items-center gap-1 hover:underline"
                          style={{ color: BRAND_BLUE }}
                        >
                          <Mail className="h-3 w-3" /> {emailAv}
                        </a>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {obra && <span>Obra: {obra}</span>}
                      {data && <span>{String(data).slice(0, 10)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>Mural de Oportunidades</h2>
            <select
              value={filtroEsp}
              onChange={(e) => setFiltroEsp(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm bg-background"
            >
              <option value="">Todas especialidades</option>
              {ESPECIALIDADES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : oportunidadesFiltradas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma oportunidade disponível no momento.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {oportunidadesFiltradas.map((o, i) => {
                const titulo = pick<string>(o, ["Titulo", "titulo"], "Vaga");
                const esp = pick<string>(o, ["Especialidade", "especialidade"], "");
                const cidadeO = pick<string>(o, ["Cidade", "cidade"], "");
                const dataInicio = pick<string>(o, ["Data_inicio", "data_inicio", "Data"], "");
                const desc = pick<string>(o, ["Descricao", "descricao"], "");
                const msg = encodeURIComponent(`Olá! Tenho interesse na oportunidade "${titulo}" do Mural F&M.`);
                return (
                  <div key={i} className="rounded-xl border p-4 flex flex-col">
                    <h3 className="text-base font-bold" style={{ color: BRAND_BLUE }}>{titulo}</h3>
                    {esp && (
                      <span
                        className="mt-2 self-start inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ backgroundColor: BRAND_YELLOW, color: "#1a1a1a" }}
                      >
                        <Briefcase className="h-3 w-3" /> {esp}
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {cidadeO && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {cidadeO}
                        </span>
                      )}
                      {dataInicio && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {String(dataInicio).slice(0, 10)}
                        </span>
                      )}
                    </div>
                    {desc && <p className="mt-3 text-sm text-foreground/80 flex-1">{desc}</p>}
                    <a
                      href={`https://wa.me/${FM_WHATSAPP}?text=${msg}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                      style={{ backgroundColor: BRAND_GREEN }}
                    >
                      <MessageCircle className="h-4 w-4" /> Tenho Interesse
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground py-4">
          <Link to="/parceiros" className="hover:underline">Ver galeria pública de parceiros</Link>
        </p>
      </main>

      {/* Modal nova obra */}
      {showNovaObra && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold" style={{ color: BRAND_BLUE }}>Cadastrar obra</h3>
            <label className="mt-3 block text-xs font-bold uppercase text-slate-500">Descrição</label>
            <textarea
              value={novaDesc}
              onChange={(e) => setNovaDesc(e.target.value.slice(0, 500))}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 p-3 text-sm focus:border-[#1A4D7A] focus:outline-none"
              placeholder="Ex.: Reforma de cobertura residencial em Salvador..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowNovaObra(false)} className="rounded-md px-3 py-2 text-sm font-bold text-slate-600">
                Cancelar
              </button>
              <button
                onClick={salvarObra}
                disabled={salvandoObra || !novaDesc.trim()}
                className="rounded-md px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {salvandoObra ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SolicitarAmpliacaoModal
        open={showAmpliar}
        onClose={() => { setShowAmpliar(false); setAmpliacaoStatus("pendente"); }}
        parceiroId={parceiro.id!}
        parceiroNome={nomeExibido}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

function ShareCardSection({ shareUrl, nome }: { shareUrl: string; nome: string }) {
  const [copied, setCopied] = useState(false);
  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`,
    [shareUrl],
  );
  const msg = encodeURIComponent(
    `Conheça meu cartão de visita digital F&M: ${shareUrl}`,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5" style={{ color: BRAND_BLUE }} />
        <h2 className="text-lg font-bold" style={{ color: BRAND_DARK }}>
          Compartilhar meu cartão
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Divulgue seu perfil público {nome ? `de ${nome}` : ""} nas redes sociais.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-[auto_1fr]">
        <div
          className="flex items-center justify-center rounded-xl border bg-white p-3"
          style={{ borderColor: BRAND_YELLOW }}
        >
          <img
            src={qrUrl}
            alt="QR Code do cartão"
            width={180}
            height={180}
            className="h-44 w-44"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 truncate bg-transparent text-sm outline-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <a
              href={`https://wa.me/?text=${msg}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a
              href={`https://www.instagram.com/`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                copy();
                window.open("https://www.instagram.com/", "_blank");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)",
              }}
            >
              <Instagram className="h-4 w-4" /> Instagram
            </a>
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                copy();
                window.open("https://www.tiktok.com/", "_blank");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              style={{ backgroundColor: "#111" }}
            >
              <Share2 className="h-4 w-4" /> TikTok
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            Dica: o link foi copiado automaticamente ao abrir Instagram/TikTok — basta colar no app.
          </p>
        </div>
      </div>
    </section>
  );
}