import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { libraryRoute } from './routes/library'
import { userRoute } from './routes/users'
import { verify } from "hono/jwt";
import { cors } from "hono/cors"; 

const app = new Hono()

// Allow frontend using cors
app.use(
  '*',
  cors({
    origin: 'http://localhost:5173', // or "*""
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// logs 
app.use('*', logger())


app.use("/api/library/*", async (c, next) => {
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

export default api
export type ApiRoutes = typeof api