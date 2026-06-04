import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/f/$slug")({
  loader: ({ params }) => {
    throw redirect({ to: "/fornecedor/$slug", params: { slug: params.slug } });
  },
  component: () => null,
});