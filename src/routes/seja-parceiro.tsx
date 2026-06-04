import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/seja-parceiro")({
  loader: () => {
    throw redirect({ to: "/cadastro-parceiro" });
  },
  component: () => null,
});
