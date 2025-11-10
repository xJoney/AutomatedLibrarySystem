import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { libraryRoute } from './routes/library'


const app = new Hono()

// logs 
app.use('*', logger())

//testing 
app.get("/test", c =>{
    return c.json({"message" : "test"})
})

//checks if server running
app.get("/", (c) => c.text("Server running"))

const apiRoutes = app.basePath("api").route("/library", libraryRoute)



export default app
export type ApiRoutes = typeof apiRoutes