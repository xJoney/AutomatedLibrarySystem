import { createFileRoute, useSearch } from '@tanstack/react-router'
import { hc } from 'hono/client'
import type { ApiRoutes } from '../../../shared/api-routes'
import { useQuery } from '@tanstack/react-query'


export const Route = createFileRoute('/item')({
    validateSearch: (search) => ({
        id: Number(search.id ?? 0),   
    }),
    component: Item,
})

const client = hc<ApiRoutes>(import.meta.env.VITE_API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});
interface Book{
  id: number
  title: string
  desc: string
  coverURL: string
}

function Item() {

    const {id} = useSearch({from: "/item"})
    console.log("ID from search:", id)

    const { data, isLoading } = useQuery({
        queryKey: ['item', id],
        enabled: id > 0,
        queryFn: async () => {
        //@ts-ignore
        const res = await client.api.library[":id"].$get({ param: { id } })
        return (await res.json()) as {book: Book[]}
        },
    })
    if (!data || !data.book || data.book.length === 0) {
        return <p>Book not found.</p>
    }

    const book = data.book[0]
    console.log(book)



    // rent button
    const rentSubmit = async(submit: React.FormEvent) => {
        submit.preventDefault()
        console.log("rent button pressed")
        //@ts-ignore
        const res = await client.api.library.rent.$post({
            query: {bookId: String(id)},
            header: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
        })
        console.log(localStorage.getItem("token"))
        console.log(res)
    }


    // reservation button
    const submit = async(submit: React.FormEvent) => {
        submit.preventDefault()
        console.log("reserve button pressed")
        //@ts-ignore
        const res = await client.api.library.reserve.$post({
            query: {bookId: String(id)},
            header: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
        })
        console.log(localStorage.getItem("token"))
        console.log(res)
    }


    return (
        <>
            <div className="min-h-screen flex justify-center items-center p-10">
                <div className="w-full max-w-6xl bg-gray-900 border border-gray-700 rounded-2xl p-12 shadow-2xl">
                <div className="flex flex-col lg:flex-row gap-16 items-center lg:items-start">
                    <img
                    src={book.coverURL}
                    alt={book.title}
                    className="w-80 h-[32rem] object-contain rounded-xl shadow-lg"
                    />
                    <div className="flex flex-col max-w-2xl">
                    <h1 className="text-5xl font-extrabold mb-8 leading-tight">
                        {book.title}
                    </h1>
                    <p className="text-gray-300 text-xl leading-relaxed mb-10">
                        {book.desc}
                    </p>
                    <div className="flex gap-8">
                    <form onSubmit={rentSubmit} className="flex items-center gap-2">
                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-2xl rounded-xl text-white font-semibold">
                        Rent
                        </button>
                    </form>
                    <form onSubmit={submit} className="flex items-center gap-2">

                        <button className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-2xl rounded-xl text-white font-semibold">
                        Reserve
                        </button>
                        </form>
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </>
    )
}
