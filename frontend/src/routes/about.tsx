import { createFileRoute } from '@tanstack/react-router'
import type { ApiRoutes } from '../../../shared/api-routes'
import { hc } from 'hono/client'

export const Route = createFileRoute('/about')({
  component: About,
})

const client = hc<ApiRoutes>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});
function About() {
  return <div className="p-2">Hello from About!</div>
}