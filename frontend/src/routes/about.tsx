import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">About Our Library</h1>
      <p className="text-lg text-gray-700 leading-relaxed mb-6">
        This is an automated library system that allows you to browse, search, and manage a collection of books. 
        Our goal is to provide a simple and intuitive interface for accessing our library's resources.
      </p>
      <p className="text-lg text-gray-700 leading-relaxed">
        This project is built with React, TypeScript, and Tailwind CSS on the frontend, and Node.js with Hono on the backend.
      </p>
    </div>
  )
}