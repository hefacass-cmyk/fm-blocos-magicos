import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/loja')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/loja"!</div>
}
