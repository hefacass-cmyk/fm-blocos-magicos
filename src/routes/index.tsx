import { createFileRoute } from "@tanstack/react-router";
import { FMSite } from "@/components/fm/FMSite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "F&M Construções Inteligentes | Tecnologia IBPP em Camaçari/BA" },
      { name: "description", content: "Construtora especializada em IBPP (Inova Blocos Paredes Prontas): 46% mais rápido e 20% mais econômico que a alvenaria convencional. Solicite seu diagnóstico gratuito." },
      { property: "og:title", content: "F&M Construções Inteligentes — Construção Inteligente, Entrega Garantida" },
      { property: "og:description", content: "Sistema IBPP: 46% mais rápido e 20% mais econômico que a alvenaria convencional." },
    ],
  }),
  component: Index,
});

function Index() {
  return <FMSite />;
}
