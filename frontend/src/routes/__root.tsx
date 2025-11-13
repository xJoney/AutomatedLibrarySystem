import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useState } from 'react'
import { useAuth } from '../lib/auth'

function NavBar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      return
    }
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
      <div className="flex items-center gap-4 ml-auto">
        {isAuthenticated ? (
          <>
            <span>Welcome, {user?.name}!</span>
            <button
              onClick={() => logout()}
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

