import { createFileRoute, useSearch, Link } from '@tanstack/react-router'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/search')({
    validateSearch: (search) => ({q: String(search.q ?? ''),}), //ensure url query is string
    component: SearchPage,
})


const client = hc<ApiRoutes>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});
interface Book {
  id: number
  title: string
  desc: string
  coverURL: string
}

interface Popularity {
  value: string
  score: number
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
      }
    },
  })

    const popularity = useQuery({
    queryKey: ['popularity', q],
    enabled: !!q,
    queryFn: async () => {
      //@ts-ignore
      const res = await client.api.library.searchTracker.$get({ query: { q } })
      return (await res.json()) as {
        popularity: Popularity[]
      }
    },
  })

  return(
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="border border-gray-700">
          <h1 className="text-2xl font-bold mb-6 text-center">
          Results for “{q}”
          </h1>
    
          {data?.results?.length ? (
            data.results.map((book) => (
            <Link
              key={book.id}
              to="/item"         
              search={{ id: book.id }}
              className="flex items-center gap-6 p-4 mb-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors"
            > 
                <img
                  src={book.coverURL}
                  alt={book.title}
                  className="w-20 h-32 object-contain rounded-md"
                />

                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">{book.title}</h2>
                  <p className="text-gray-400 text-sm">{book.desc}</p>
                </div>
              </Link>
          ))
          ) : (
            <p>No books found.</p>
          )}
        </div>
    </div>

  {/* {popularity.data?.popularity && (
    <div className="mt-6 bg-slate-900 border border-slate-700 rounded p-3">
      <h2 className="text-lg font-semibold mb-2">Top 5 Searches</h2>
      <ol className="list-decimal list-inside text-gray-300">
        {popularity.data.popularity.map((book, i) => (
          <li key={i}>
            {book.value} — <span className="text-blue-400">{book.score}</span>
          </li>
        ))}
      </ol>
    </div>
  )} */}
    </div>
  ) 
}
