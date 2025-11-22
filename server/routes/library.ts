import {Hono} from "hono"
import { zValidator } from '@hono/zod-validator'
import {z} from "zod"
import {db} from "../db/"
import { books, book_rentals, popularity_backup } from "../db/schema"
import { eq, like, ilike, and, ne, desc} from "drizzle-orm"
import { redis } from "../redis";



const bookSchema = z.object({
    id: z.number().int().positive(),
    title: z.string().min(3).max(50),
    genre: z.string(),
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

// search query by genre
libraryRoute.get('/search_genre', async(c) => {
  const genre = c.req.query('genre');
  const search = await db.select().from(books).where(like(books.genre,`%${genre}%`));
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
  
  // checks if cache already exists in redis and return array of rankings
  if(cached){
      return c.json({ popularity: JSON.parse(cached) });
  }

  // for service restart, redis lose its data so pull backup list from db and set that as the new rankings
  data = await db.select().from(popularity_backup).orderBy(desc(popularity_backup.createdAt)).limit(1);
  const rankings = data[0].rankings
  await redis.set("popularityCache", JSON.stringify(rankings))
  return c.json({popularity: rankings})
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







// renting/reserving book operations

// renting book
libraryRoute.post("/rent", async (c) => {
  const payload = c.get("jwtPayload");

  if (!payload?.sub) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = payload.sub;
  const bookId = Number(c.req.query("bookId"));


  // renting logic check
  const taken = await db.select().from(book_rentals).where(
    and(
      eq(book_rentals.bookId, bookId),
      ne(book_rentals.status, "returned")
    )
  );

  if (taken.length > 0) {
    return c.json({ error: "Book is already rented or reserved." },409);
  }

  await db.insert(book_rentals).values({
    userId,
    bookId,
    status: "rented"
  });

  return c.json({ ok: true });
});


// reserver book
libraryRoute.post("/reserve", async (c) =>{
  const payload = c.get("jwtPayload");

  if (!payload?.sub) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = payload.sub;
  const bookId = Number(c.req.query("bookId"));

  
  // renting logic check
  const taken = await db.select().from(book_rentals).where(
    and(
      eq(book_rentals.bookId, bookId),
      ne(book_rentals.status, "returned")
    )
  );

  if (taken.length > 0) {
    return c.json({ error: "Book already rented/reserved." }, 409);
  }

  await db.insert(book_rentals).values({
    userId,
    bookId,
    status: "reserve"
  });

  return c.json({ ok: true });
})



// USER DASHBOARD

//get all books from a user
libraryRoute.get("/retrieveBooks", async (c) => {
    const payload = c.get("jwtPayload");

  if (!payload?.sub) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = payload.sub;

  const allBooks = await db.select({
      rentalId: book_rentals.id,
      bookId: books.id,
      status: book_rentals.status,
      title: books.title,
      desc: books.desc,
      coverURL: books.coverURL,
  })
  .from(book_rentals)
  .innerJoin(books, eq(book_rentals.bookId, books.id))
  .where(eq(book_rentals.userId, userId));
  
  return c.json({ books: allBooks });
})

libraryRoute.delete("/rental/:id", async (c) => {
  // verify logged-in user
  const payload = c.get("jwtPayload");
  if (!payload?.sub) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = payload.sub;
  const rentalId = Number(c.req.param("id"));

  // delete rental record
  await db.delete(book_rentals).where(eq(book_rentals.id, rentalId));

  return c.json({ ok: true });
});