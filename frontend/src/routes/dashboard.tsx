import { createFileRoute, useSearch } from '@tanstack/react-router'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'
import { useQuery } from '@tanstack/react-query'


export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

const client = hc<ApiRoutes>('/')

interface Book {
  id: number
  title: string
  desc: string
  coverURL: string
}

function Dashboard() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6 text-center">
        Rented
      </h1>
      <div>Hello "/dashboard"!</div>
      <h1 className="text-2xl font-bold mb-6 text-center">
        Reserved
      </h1>
    </>
  )
}
