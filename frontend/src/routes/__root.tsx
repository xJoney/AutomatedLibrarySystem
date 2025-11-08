import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => (
  <div className="min-h-screen w-full flex flex-col bg-slate-900 text-gray-100">
    {/* Navbar */}
    <nav className="flex gap-4 p-4 bg-slate-800 text-gray-200 shadow-md">
      <Link to="/" className="[&.active]:font-bold hover:text-indigo-400">
        Home
      </Link>
      <Link to="/about" className="[&.active]:font-bold hover:text-indigo-400">
        About
      </Link>
    </nav>

    {/* Main route content */}
    <main className="flex-1">
      <Outlet />
    </main>

    {/* Devtools */}
    {import.meta.env.DEV && <TanStackRouterDevtools />}
  </div>
)

export const Route = createRootRoute({
  component: RootLayout,
})
