import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'
import { type ApiRoutes } from "../../../shared/api-routes"
import type { Book } from '../lib/types'

export const Route = createFileRoute('/')({
  component: Index,
})

const client = hc<ApiRoutes>('/')

async function getBooks(): Promise<{ books: Book[] }> {
  const res = await client.api.library.$get()
  if (!res.ok) {
    throw new Error("server error")
  }
  const data = await res.json()
  return data
}

function Index() {
  const { isPending, error, data } = useQuery({ queryKey: ['books'], queryFn: getBooks })

  if (isPending) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">An error has occurred: {error.message}</div>


  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center py-16 px-6">
        <h1 className="text-5xl font-bold text-center mb-12 tracking-tight text-gray-900">
          Welcome to the Book Library
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl animate-fade-in">
          {data?.books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md
                       hover:shadow-lg hover:border-indigo-300 transition-all duration-300
                       hover:scale-105">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {book.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">{book.desc}</p>
            </div>
          ))}
        </div>
        {data?.books.length === 0 && (
          <p className="text-gray-500 mt-16 text-lg animate-pulse">
            Loading library...
          </p>
        )}
      </div>
    </>
  )
}
