import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cadastro/parceiro")({
  loader: () => {
    throw redirect({ to: "/cadastro-parceiro" });
  },
  component: () => null,
});