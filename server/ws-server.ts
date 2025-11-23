import { WebSocketServer, WebSocket } from 'ws'
import { redis } from './redis.js'

const clients = new Set<WebSocket>()
console.log("Websocket server running on ws://localhost:4000");


const sub = redis.duplicate()
await sub.connect()

// forward popularity updates to the client
await sub.subscribe('popularity', (message) => {
  console.log("Redis message received:", message)

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
})

//standalone websocket using ws library, acts like bridge between Redis and frontend
const wss = new WebSocketServer({ port: 4000 }) 
wss.on('connection', async (ws) => {
  console.log('websocked client connected')
  clients.add(ws)

  ws.on('close', async () => {
    clients.delete(ws)
    console.log('websocket client disconnected')
  })
})

