import {Hono} from "hono"
import { zValidator } from '@hono/zod-validator'
import {z} from "zod"
import {db} from "../db/"
import { books } from "../db/schema"
import { eq, like, ilike } from "drizzle-orm"
import { redis } from "../redis";



const bookSchema = z.object({
    id: z.number().int().positive(),
    title: z.string().min(3).max(50),
    desc: z.string(),
    coverURL: z.string()
    // num: z.number().int().positive() //if wanted to add number   
})

// structure for book
type Book = z.infer<typeof bookSchema>
// runtime check to make sure structure is correct before posting
const createPostSchema = bookSchema.omit({id: true})

// create new instance of Hono
export const libraryRoute = new Hono()



// new CRUD operations

// get book by id
libraryRoute.get("/:id{[0-9]+}", async (c) =>{
    const id = Number.parseInt(c.req.param("id"));

    const book = await db.select().from(books).where(eq(books.id,id));
    if (book.length ===0){
      return c.notFound()
    }
    return c.json({book})
})

//get all books
libraryRoute.get("/", async (c) => {
  const allBooks = await db.select().from(books);
  return c.json({ books: allBooks });
})

// search query by title
libraryRoute.get('/search', async(c) => {
  const title = c.req.query('q');
  const search = await db.select().from(books).where(ilike(books.title,`%${title}%`));

  return c.json({results: search})
})



//search tracker - job queued through Redis to background worker
libraryRoute.get('/searchTracker', async(c) =>{
  const title = c.req.query('q');
  await redis.lPush("rankingQueue", JSON.stringify({ query: title, ts: Date.now() }));
  if(!title){
    return c.json({error: "empty query"}, 400)
  }
  return c.json({status: "job queued"})
})

//popularity - returns the updated list stored in Redis
libraryRoute.get('/popularity', async(c) =>{
  const cached = await redis.get("popularityCache");
  let data;

  if(cached===null){
    data = [];
  }
  else{
    data = JSON.parse(cached);
  }
  return c.json({popularity: data})
})




// insert book to database
libraryRoute.post("/", zValidator("json", createPostSchema), async (c) => {
  const data = await c.req.valid("json");
  const inserted = await db.insert(books).values(data).returning(); // <-- write to Neon
  c.status(201);
  return c.json(inserted[0]);
})

// delete book from database based on id
libraryRoute.delete("/:id{[0-9]+}", async (c) =>{
    const id = Number.parseInt(c.req.param("id"));
  const deleted = await db.delete(books).where(eq(books.id, id)).returning();
    if (deleted.length === 0){
        return c.notFound()
    }
    return c.json({book: deleted[0]})
})


