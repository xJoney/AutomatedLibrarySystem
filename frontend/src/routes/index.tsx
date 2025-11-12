import { createFileRoute } from '@tanstack/react-router'
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
}

const client = hc<ApiRoutes>('/')

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
  if (isPending) return "Loading.."
  if (error) return "an error has occured: " + error.message;


  return (
    <>
  <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col items-center py-16 px-6">
      <h1 className="text-4xl font-bold text-center mb-12 tracking-wide text-gray-50">
        Book Library
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl">
        {data?.books.map((book) => (
          <div
            key={book.id}
            className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-lg
                       hover:shadow-indigo-600/20 hover:border-indigo-500 transition-all duration-300
                       hover:scale-[1.03]">
            <h2 className="text-xl font-semibold text-gray-50 mb-2">
              {book.title}
            </h2>
            <p className="text-gray-400 leading-relaxed">{book.desc}</p>
          </div>
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

