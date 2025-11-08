import { useEffect, useState } from 'react'
import './App.css'

interface Book {
  id: number
  title: string
  desc: string
}
import { hc } from 'hono/client'
import { type ApiRoutes } from "../../server/app"

const client = hc<ApiRoutes>('/')

function App() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(()=>{
    async function fetchBooks(){
      // const res = await fetch("/api/library")
      const res = await client.api.library.$get()
      const data = await res.json()
      setBooks(data.books)
    }
    fetchBooks()
  },[])

  return (
    <>
  <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col items-center py-16 px-6">
      <h1 className="text-4xl font-bold text-center mb-12 tracking-wide text-gray-50">
        Book Library
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl">
        {books.map((book) => (
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
      {books.length === 0 && (
        <p className="text-gray-500 mt-16 text-lg animate-pulse">
          Loading library...
        </p>
      )}
    </div>
    </>
  )
}

export default App
