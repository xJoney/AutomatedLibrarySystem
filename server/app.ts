import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { libraryRoute } from './routes/library'
import { userRoute } from './routes/users'
import { verify } from "hono/jwt";


const app = new Hono()

// logs 
app.use('*', logger())


/*
this function is middleware used for checking JWT authentication..
checks the authorization header that gets passed when posting
to db when renting/reserving a book.

if successful, attaches the decoded payload to the context
so routes can access c.get("jwtPayload")
*/
app.use("*", async (c, next) => {
  const auth = c.req.header("Authorization");

  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);

    try {
      const payload = await verify(token, process.env.JWT_SECRET!);
      c.set("jwtPayload", payload);
    } catch (err) {
      console.error("JWT VERIFY ERROR:", err);
    }
  }

  await next();
});

//testing 
app.get("/test", c =>{
    return c.json({"message" : "test"})
})

//checks if server running
app.get("/", (c) => c.text("Server running"))

const api = app.basePath('/api')
                .route('/library', libraryRoute)
                .route('/users', userRoute)

export default app
export type ApiRoutes = typeof api