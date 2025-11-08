import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { libraryRoute } from './routes/library'


const app = new Hono()

app.use('*', logger())

app.get("/test", c =>{
    return c.json({"message" : "test"})
})

const apiRoutes = app.basePath("api").route("/library", libraryRoute)



export default app
export type ApiRoutes = typeof apiRoutes