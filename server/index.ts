import { config } from "dotenv";
config({ path: "server/.env" });

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set! The server cannot start.");
}

import app from './app'
const server = Bun.serve({
  fetch: app.fetch
});

console.log(`Listening on ${server.url}`);