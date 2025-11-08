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
      <div>
      </div>
      <h1>Books</h1>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <strong>{book.title}</strong>:{book.desc}
          </li>


        ))}
      </ul>
    </>
  )
}

export default App
