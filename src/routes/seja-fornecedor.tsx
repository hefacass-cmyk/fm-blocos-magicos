import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/seja-fornecedor")({
  loader: () => {
    throw redirect({ to: "/cadastro-fornecedor" });
  },
  component: () => null,
});
