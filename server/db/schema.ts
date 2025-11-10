import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  age: integer("age"),
  createdAt: timestamp("created_at").defaultNow(),
});


export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  desc: text("desc").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});