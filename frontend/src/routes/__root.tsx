import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useState } from 'react'
import { hc } from 'hono/client'
import { type ApiRoutes } from '../../../shared/api-routes'

const client = hc<ApiRoutes>('/')


interface Book{
  id: number
  title: string
  desc: string
}

async function searchBooks(q: string){
  //@ts-ignore
  const res = await client.api.library.search.$get({query: {q}})
  if(!res.ok){ // check in place
    throw new Error('server error')
  }
  const data = await res.json()
  return data
}

function NavBar() {
  const [query, setQuery] = useState ('')
  const [results, setResults] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string |null>(null)
  const navigate = useNavigate()

  const submit = async(e: React.FormEvent) => { //submit button
    e.preventDefault() //prevent full page reload when submitting
    if(!query.trim()){ //check for empty search
      return
    }

    // tries to call backend and search for user input
    try{
      setLoading(true)
      setError(null)

      const data = await searchBooks(query)
      setResults(data)
    }
    catch(err){
      setError((err as Error).message)
    }
    finally{
      setLoading(false)
    }

    //navigate to search page to display results, passes the data in q
    navigate({to:'/search', search: {q: query}})
  }


  return (
    <nav className="flex gap-4 p-4 bg-slate-800 text-gray-200 shadow-md">
      <Link to="/" className="[&.active]:font-bold hover:text-indigo-400">
        Home
      </Link>
      <Link to="/about" className="[&.active]:font-bold hover:text-indigo-400">
        About
      </Link>
      <form onSubmit={submit} className="flex items-center gap-2 ml-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books..."
          className="rounded-md px-3 py-1 text-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm">
          Search
        </button>
      </form>
    </nav>
  )
}


function Root() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-900 text-gray-100">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
}

export const Route = createRootRoute({
  component: Root,
})
