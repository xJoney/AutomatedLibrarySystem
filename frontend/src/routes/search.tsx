import { createFileRoute, useSearch } from '@tanstack/react-router'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'
import { useQuery } from '@tanstack/react-query'
import type { Book } from '../lib/types'

export const Route = createFileRoute('/search')({
  validateSearch: (search) => ({ q: String(search.q ?? '') }),
  component: SearchPage,
})

const client = hc<ApiRoutes>('/')

async function searchBooks(q: string) {
  const res = await client.api.library.search.$get({ query: { q } })
  if (!res.ok) {
    throw new Error('Search failed')
  }
  return (await res.json()) as Book[]
}

function SearchPage() {
  const { q } = useSearch({ from: '/search' })
  const { data: books = [], isPending, error } = useQuery({
    queryKey: ['search', q],
    enabled: !!q,
    queryFn: () => searchBooks(q),
  })

  if (isPending) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">An error has occurred: {error.message}</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Results for “{q}”</h1>
      <div className="space-y-4">
        {books.length > 0 ? (
          books.map((book) => (
            <div key={book.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{book.title}</h2>
              <p className="text-gray-600 mt-1">{book.desc}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No books found.</p>
        )}
      </div>
    </div>
  )
}
