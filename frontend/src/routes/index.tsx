import { createFileRoute, useSearch, Link } from '@tanstack/react-router'
import {useQuery} from '@tanstack/react-query'
import { hc } from 'hono/client'
import { type ApiRoutes } from "../../../shared/api-routes"

export const Route = createFileRoute('/')({
  component: Index,
})

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

const client = hc<ApiRoutes>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});
async function getBooks():Promise<{ books: Book[] }>{
  //@ts-ignore - compiler expects a known type, hono listing as
  const res = await client.api.library.$get()
  if(!res.ok){
    throw new Error("server error") 
  }
  const data = await res.json()
  return data
}

function Index() {
  const {isPending, error, data} = useQuery({ queryKey: ['books'], queryFn: getBooks})


  const popularity = useQuery({
    queryKey: ['popularity'],
    queryFn: async () => {
      //@ts-ignore
      const res = await client.api.library.popularity.$get()
      return (await res.json()) as {
        popularity: Popularity[]
      }
    },
  })

  if (isPending) return "Loading.."
  if (error) return "an error has occured: " + error.message;

  const popularBooks = popularity.data?.popularity?.map((p) => {
    const book = data?.books.find((b) => b.title === p.value) 
    if (!book){
      return null
    }

    return{
      ...book,
      score: p.score
    }
  })
  .filter(Boolean) as (Book & { score: number })[]


  return (
    <>
    <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col items-start py-16 px-6">
      <h1 className="text-4xl font-bold mb-4 tracking-wide text-gray-50 pl-4"> Popular</h1>
      <div className="flex gap-6 w-full overflow-x-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 snap-x snap-mandatory">
        {popularBooks.map((book) => (        
          <Link
            key={book.id}
            to = "/item"
            search={{ id: book.id }}
            className="min-w-[350px] bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-lg
                       hover:shadow-indigo-600/20 hover:border-indigo-500 transition-all duration-300
                       hover:scale-[1.03]">
            <img src={book.coverURL} alt={book.title}  className="w-full h-120 object-cover rounded-xl mb-4" />
            <h2 className="text-xl font-semibold text-gray-50 mb-2">
              {book.title}
            </h2>
            <p className="text-gray-400 leading-relaxed">{book.desc}</p>
          </Link>

        ))}
      </div>
      <h1 className="text-4xl font-bold mb-4 tracking-wide text-gray-50 pl-4">Genre 1</h1>
      <div className="flex gap-6 w-full overflow-x-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 snap-x snap-mandatory">
        {data?.books.map((book) => (        
          <Link
            key={book.id}
            to = "/item"
            search={{id: book.id}}
            className="min-w-[350px] bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-lg
                       hover:shadow-indigo-600/20 hover:border-indigo-500 transition-all duration-300
                       hover:scale-[1.03]">
            <img src={book.coverURL} alt={book.title}  className="w-full h-120 object-cover rounded-xl mb-4" />
            <h2 className="text-xl font-semibold text-gray-50 mb-2">
              {book.title}
            </h2>
            <p className="text-gray-400 leading-relaxed">{book.desc}</p>
          </Link>
        ))}
      </div>
      {data.books.length === 0 && (
        <p className="text-gray-500 mt-16 text-lg animate-pulse">
          Loading library...
        </p>
      )}
    </div>
    </>
  )
}

