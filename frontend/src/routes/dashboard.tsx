import { createFileRoute, useSearch, Link } from '@tanstack/react-router'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'
import { useQuery,useQueryClient } from '@tanstack/react-query'


export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

const client = hc<ApiRoutes>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});

interface Record {
  rentalId: number
  bookId: number
  status: string
  title: string
  desc: string
  coverURL: string
}

function Dashboard() {  

  const queryClient = useQueryClient();
  const removeRental = async (rentalId: number) => {
    console.log("removing rental", rentalId)

    //@ts-ignore
    const res = await client.api.library.rental[":id"].$delete({
      param: { id: rentalId.toString() },
      header: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
    queryClient.invalidateQueries({ queryKey: ['userBooks'] }); //gets the updated list without reloading page
  }  

  const { data, isLoading } = useQuery({
    queryKey: ['userBooks'],
    queryFn: async () => {
      //@ts-ignore
      const res = await client.api.library.retrieveBooks.$get({ 
        header: {Authorization: `Bearer ${localStorage.getItem("token")}`}
      });
      return (await res.json()) as {
        books: Record[]
      }
    },
  })

  return (
    <>
      <h1 className="text-2xl font-bold mb-6 text-center">Rented/Reserved List</h1>
      <div className="min-h-screen flex justify-center items-center p-10">
        <div className="w-full max-w-6xl bg-gray-900 border border-gray-700 rounded-2xl p-12 shadow-2xl">

          {(() => {
            const rented = data?.books?.filter((r: Record) => r.status === "rented") || []
            const reserved = data?.books?.filter((r: Record) => r.status === "reserve") || []

            return (
              <>
                <h2 className="text-xl font-bold mb-4">Rented</h2>
                {rented.length ? (
                  rented.map((record: Record) => (
                    <div
                      key={record.rentalId}
                      className="flex items-center gap-6 p-4 mb-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors">
                      <Link
                        to="/item"
                        search={{ id: record.bookId }}
                        className="flex items-center gap-6 flex-1">
                        <img
                          src={record.coverURL}
                          alt={record.title}
                          className="w-20 h-32 object-contain rounded-md"/>
                        <div className="flex flex-col">
                          <h2 className="text-lg font-semibold">{record.title}</h2>
                          <p className="text-gray-400 text-sm">{record.desc}</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => removeRental(record.rentalId)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold">
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 mb-8">No rented books.</p>
                )}

                <h2 className="text-xl font-bold mt-10 mb-4">Reserved</h2>
                {reserved.length ? (
                  reserved.map((record: Record) => (
                    <div
                      key={record.rentalId}
                      className="flex items-center gap-6 p-4 mb-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors">
                      <Link
                        to="/item"
                        search={{ id: record.bookId }}
                        className="flex items-center gap-6 flex-1">
                        <img
                          src={record.coverURL}
                          alt={record.title}
                          className="w-20 h-32 object-contain rounded-md"/>
                        <div className="flex flex-col">
                          <h2 className="text-lg font-semibold">{record.title}</h2>
                          <p className="text-gray-400 text-sm">{record.desc}</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => removeRental(record.rentalId)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold">
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No reserved books.</p>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </>
  )
}

