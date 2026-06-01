import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import fmLogo from "@/assets/fm-logo.png";
import { Mail, Phone, ArrowRight } from "lucide-react";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";
const CADASTRO_URL = "https://www.fmsmartbuild.com.br/cadastro-parceiro";

export const Route = createFileRoute("/parceiro-invite")({
  head: () => ({
    meta: [
      { title: "Seja um Parceiro F&M | F&M Construções Inteligentes" },
      {
        name: "description",
        content:
          "Cartão de visita digital da F&M Construções Inteligentes. Cadastre-se como parceiro ou fornecedor.",
      },
    ],
  }),
  component: ParceiroInvitePage,
});

function ParceiroInvitePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: "#0f2a44" }}
    >
      <div
        className="w-full max-w-[420px] rounded-3xl p-8 sm:p-10 text-center shadow-2xl"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src={fmLogo}
            alt="F&M Construções Inteligentes"
            className="h-16 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Título e subtítulo */}
        <h1
          className="mt-6 text-2xl sm:text-3xl font-extrabold leading-tight"
          style={{ color: BRAND_YELLOW }}
        >
          Seja um Parceiro F&M
        </h1>
        <p className="mt-2 text-base text-white/90">
          Construa o futuro com a gente
        </p>

        {/* QR Code */}
        <div className="mt-8 flex justify-center">
          <div
            className="rounded-2xl bg-white p-4 shadow-lg"
            style={{ maxWidth: 220, width: "100%" }}
          >
            <QRCodeSVG
              value={CADASTRO_URL}
              size={180}
              level="M"
              includeMargin={false}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-white/80">
          Escaneie e cadastre-se agora
        </p>

        {/* Botão */}
        <div className="mt-6">
          <Link
            to="/cadastro-parceiro"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-6 py-4 text-base font-bold shadow-lg transition hover:brightness-105 active:scale-[0.98]"
            style={{ backgroundColor: BRAND_YELLOW, color: "#1A1A1A" }}
          >
            Acessar Formulário de Cadastro
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Separador */}
        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Contato
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* Rodapé */}
        <div className="mt-6 space-y-3">
          <a
            href="mailto:helder@fmconstrucoes.com.br"
            className="flex items-center justify-center gap-2 text-sm text-white/90 hover:text-white transition"
          >
            <Mail className="h-4 w-4 shrink-0" style={{ color: BRAND_YELLOW }} />
            helder@fmconstrucoes.com.br
          </a>
          <a
            href="tel:+5571999454343"
            className="flex items-center justify-center gap-2 text-sm text-white/90 hover:text-white transition"
          >
            <Phone className="h-4 w-4 shrink-0" style={{ color: BRAND_YELLOW }} />
            (71) 99945-4343
          </a>
        </div>

        <p className="mt-8 text-[10px] uppercase tracking-widest text-white/30">
          F&M Construções Inteligentes
        </p>
      </div>
    </div>
  );
}
