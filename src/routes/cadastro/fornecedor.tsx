import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cadastro/fornecedor")({
  loader: () => {
    throw redirect({ to: "/cadastro-fornecedor" });
  },
  component: () => null,
});