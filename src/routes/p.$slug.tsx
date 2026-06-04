import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/p/$slug")({
  loader: ({ params }) => {
    throw redirect({ to: "/parceiro/$slug", params: { slug: params.slug } });
  },
  component: () => null,
});