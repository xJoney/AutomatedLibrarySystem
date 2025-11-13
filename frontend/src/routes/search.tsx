import { createFileRoute, useSearch } from '@tanstack/react-router'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/search')({
    validateSearch: (search) => ({q: String(search.q ?? ''),}), //ensure url query is string
    component: SearchPage,
})


const client = hc<ApiRoutes>('/')

interface Book {
  id: number
  title: string
  desc: string
}

interface Popularity {
  title: string
  count: string
}

function SearchPage() {
    /* 
    NOTE to self on how to use useQuery:
    queryKey -> caches data w/ key, no need to refetch
    enabled -> make sure search not empty
    queryfn -> function that fetches the data

    data, isPending, error can be added later
    */
    const { q } = useSearch({from: '/search'}) //gets search query param from URL

    const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    enabled: !!q,
    queryFn: async () => {
      //@ts-ignore
      const res = await client.api.library.search.$get({ query: { q } })
      return (await res.json()) as {
        results: Book[]
        popularity: Popularity
      }
    },
  })

  return(
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Results for “{q}”</h1>
      {data?.results?.length ? (
        data.results.map((book) => (
          <div key={book.id} className="bg-slate-800 p-3 mb-2 rounded">
            <h2 className="font-semibold">{book.title}</h2>
            <p className="text-gray-400">{book.desc}</p>
          </div>
        ))
      ) : (
        <p>No books found.</p>
      )}

      {data?.popularity && (
        <div className="mt-4 bg-slate-900 border border-slate-700 rounded p-3">
          <h2 className="text-lg font-semibold mb-2">Popularity</h2>
          <p className="text-gray-300">
            <span className="font-medium">{data?.popularity.title}</span> has been
            searched <span className="text-blue-400">{data?.popularity.count}</span>{' '}
            times.
          </p>
        </div>
      )}
    </div>
  ) 
}
