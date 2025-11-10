import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'


function NavBar() {
  return (
    <nav className="flex gap-4 p-4 bg-slate-800 text-gray-200 shadow-md">
      <Link to="/" className="[&.active]:font-bold hover:text-indigo-400">
        Home
      </Link>
      <Link to="/about" className="[&.active]:font-bold hover:text-indigo-400">
        About
      </Link>
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
