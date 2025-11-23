import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import { useEffect } from 'react'


const client = hc<ApiRoutes>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    const token = localStorage.getItem("token");

    return fetch(input, {
      ...init,
      credentials: "include", // REQUIRED for cookies to work
      headers: {
        ...(init?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // use only when exists
      },
    });
  },
});


function NavBar() {
  const queryClient = useQueryClient()

    useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL)
    
    ws.onopen = () => {
      console.log("web socket connected")
    }

    ws.onmessage = (event) => {
      const rankings = JSON.parse(event.data)
      console.log("web socket update received", event.data)
      queryClient.setQueryData(['popularity'], { popularity: rankings})
    }

    ws.onerror =  (err) => {
      console.error("Websocket error", err)
    }

    return () => {
      ws.close()
    }
  
  },[])


  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const submit = async(submit: React.FormEvent) => {
    submit.preventDefault()
    if (!query.trim()) {
      return
    }
    //@ts-ignore
    await client.api.library.searchTracker.$get({
      query: { q: query }
    })
    navigate({ to: '/search', search: { q: query } })
  }

  return (
    <nav className="flex items-center gap-4 p-4 bg-slate-800 text-gray-200 shadow-md">
      <Link to="/" className="[&.active]:font-bold hover:text-indigo-400">
        Home
      </Link>
      <Link to="/about" className="[&.active]:font-bold hover:text-indigo-400">
        About
      </Link>
      {isAuthenticated && (
        <Link to="/account" className="[&.active]:font-bold hover:text-indigo-400">
        Account
        </Link>
      )}


      <div className="flex items-center gap-4 ml-auto">
        {isAuthenticated ? (
          <>
            <span>Welcome, {user?.name}!</span>
            <button
              onClick={() =>{
                logout()
                navigate({to: '/'})
            }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="[&.active]:font-bold hover:text-indigo-400">
              Login
            </Link>
            <Link to="/signup" className="[&.active]:font-bold hover:text-indigo-400">
              Sign Up
            </Link>
          </>
        )}
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books..."
            className="rounded-md px-3 py-1 bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm"
          >
            Search
          </button>
        </form>
      </div>
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

