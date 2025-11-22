import { pgTable, unique, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	// age: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const books = pgTable("books", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	desc: text().notNull(),
	genre: text().notNull(),
	coverURL: text("cover_url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const popularity_backup = pgTable("popularity_backup", {
	id:serial("id").primaryKey(),
	createdAt: timestamp("created_at").defaultNow(),
	rankings: jsonb("rankings").notNull()
});