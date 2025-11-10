import { config } from "dotenv";
config({ path: "./server/.env" });


import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// create Neon HTTP client
const sql = neon(process.env.DATABASE_URL!);

// create Drizzle ORM instance
export const db = drizzle(sql);
