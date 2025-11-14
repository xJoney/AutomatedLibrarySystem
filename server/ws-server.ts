import { WebSocketServer } from 'ws'
import { redis } from './redis.js'


//standalone websocket using ws library, acts like bridge between Redis and frontend

const wss = new WebSocketServer({ port: 8081 }) 
wss.on('connection', async (ws) => {
  console.log('websocked client connected')

  const sub = redis.duplicate()
  await sub.connect()

  // forward popularity updates to the client
  await sub.subscribe('popularity', (message) => ws.send(message))

  ws.on('close', async () => {
    await sub.unsubscribe('popularity')
    await sub.quit()
    console.log('websocket is closed')
  })
})

console.log('WebSocket server running on ws://localhost:8081')
