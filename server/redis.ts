import { createClient } from "redis";

// sets up the redis access that will listen on port 6379
// export const redis = createClient({ url: "redis://localhost:6379" });
export const redis = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379"
});

await redis.connect();

