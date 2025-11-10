import {Hono} from "hono"
import { zValidator } from '@hono/zod-validator'
import {z} from "zod"
import {db} from "../db/"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"



const userSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(3).max(50),
    email: z.string().min(3).max(50),
    age: z.string().max(3).max(50),
    // createdAt: 
    // num: z.number().int().positive() //if wanted to add number   
})

// structure for book
type User = z.infer<typeof userSchema>
// runtime check to make sure structure is correct before posting
const createPostSchema = userSchema.omit({id: true})

// create new instance of Hono
export const userRoute = new Hono()



// CRUD operations

//get all useres
userRoute.get("/", async (c) => {
  const allUsers = await db.select().from(users)
  return c.json({ users: allUsers })
})

// insert user to database
userRoute.post("/", zValidator("json", createPostSchema), async (c) => {
  const data = await c.req.valid("json")
  const inserted = await db.insert(users).values(data).returning() // <-- write to Neon
  c.status(201)
  return c.json(inserted[0])
})

// delete book from database based on id
userRoute.delete("/:id{[0-9]+}", async (c) =>{
    const id = Number.parseInt(c.req.param("id"));
  const deleted = await db.delete(users).where(eq(users.id, id)).returning();
    if (deleted.length === 0){
        return c.notFound()
    }
    return c.json({user: deleted[0]})
})