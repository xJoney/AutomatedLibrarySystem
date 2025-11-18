import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'

const client = hc<ApiRoutes>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});


// Type for the user data returned from the /me endpoint
export interface User {
  id: number
  name: string
  email: string
}



// updated to include authorization 
async function fetchCurrentUser(): Promise<User> {
  const res = await client.api.users.me.$get({    
      header: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      } 
  ,})
  if (!res.ok) {
    throw new Error('Failed to fetch user')
  }
  return res.json()
}

export function useAuth() {
  const queryClient = useQueryClient()

  const {
    data: user,
    isPending: isLoading,
    isError,
  } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: fetchCurrentUser,
    retry: false, // Don't retry on 401/404 errors
  })

  const loginMutation = useMutation({
    mutationFn: async () => {
      // This mutation is just for invalidating and refetching user
      await queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.users.logout.$post()
      if (!res.ok) {
        throw new Error('Logout failed')
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['user', 'me'], null) // Clear user data immediately
      // Optionally, invalidate other queries that depend on auth
    },
  })

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
  }
}
