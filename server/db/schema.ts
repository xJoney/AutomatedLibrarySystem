import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  age: text("age").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  desc: text("desc").notNull(),
  coverURL: text("cover_url").notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const book_rentals = pgTable("book_rentals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  bookId: integer("book_id").references(() => books.id),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  returnedAt: timestamp("returned_at"),
});

export const popularity_backup = pgTable("popularity_backup", {
  id:serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  rankings: jsonb("rankings").notNull()
});