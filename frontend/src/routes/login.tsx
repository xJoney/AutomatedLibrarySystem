import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'
import { useAuth } from '../lib/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const client = hc<ApiRoutes>('/')

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginSchema = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: async (values: LoginSchema) => {
      const res = await client.api.users.login.$post({ json: values })
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Login failed')
      }
    },
    onSuccess: () => {
      login() // Trigger a refetch of the user
      navigate({ to: '/' })
    },
  })

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-6 mt-16">
      <h1 className="text-3xl font-bold text-center text-gray-900">Login</h1>
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full p-3 bg-gray-100 rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full p-3 bg-gray-100 rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Logging in...' : 'Login'}
        </button>
        {mutation.isError && (
          <p className="text-red-500 text-sm mt-2 text-center">
            {mutation.error.message}
          </p>
        )}
      </form>
    </div>
  )
}
