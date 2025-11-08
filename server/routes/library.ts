import {Hono} from "hono"
import { zValidator } from '@hono/zod-validator'
import {z} from "zod"



const bookSchema = z.object({
    id: z.number().int().positive(),
    title: z.string().min(3).max(50),
    desc: z.string(),
    // num: z.number().int().positive() //if wanted to add number   
})

// structure for book
type Book = z.infer<typeof bookSchema>
// runtime check to make sure structure is correct before posting
const createPostSchema = bookSchema.omit({id: true})

// temporary "db"
const fakeBooks: Book[] = [
    {id: 1, title: "Book1", desc: "desc1"},
    {id: 2, title: "Book2", desc: "desc2"},
    {id: 3, title: "Book3", desc: "desc3"}
]




// create new instance of Hono
export const libraryRoute = new Hono()

// CRUD operations
.get("/", async(c) => {
    return c.json({books: fakeBooks})
})

//checks with zValidator before running post
.post("/", zValidator("json", createPostSchema),async(c) => {
    const data = await c.req.valid("json")
    const book = createPostSchema.parse(data)
    fakeBooks.push({...book, id: fakeBooks.length+1})
    c.status(201)
    return c.json(book)
})

.get("/:id{[0-9]+}", (c) =>{
    const id = Number.parseInt(c.req.param("id"));

    const book = fakeBooks.find(book => book.id === id)
    if(!book){
        return c.notFound()
    }
    return c.json({book})
})


.delete("/:id{[0-9]+}", (c) =>{
    const id = Number.parseInt(c.req.param("id"));
    const index = fakeBooks.findIndex(book => book.id === id)
    if (index === -1){
        return c.notFound()
    }
    const deletedBook = fakeBooks.splice(index,1)[0]
    return c.json({book: deletedBook})
})
//.put
