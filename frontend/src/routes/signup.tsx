import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

const client = hc<ApiRoutes>('/')

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignupSchema = z.infer<typeof signupSchema>

function SignupPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  })

  const mutation = useMutation({
    mutationFn: async (values: SignupSchema) => {
      const res = await client.api.users.signup.$post({ json: values })
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Signup failed')
      }
      return res.json()
    },
    onSuccess: () => {
      navigate({ to: '/login' })
    },
  })

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-6 mt-16">
      <h1 className="text-3xl font-bold text-center text-gray-900">Sign Up</h1>
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full p-3 bg-gray-100 rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
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
          {mutation.isPending ? 'Signing up...' : 'Sign Up'}
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
