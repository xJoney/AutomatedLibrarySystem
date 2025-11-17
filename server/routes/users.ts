import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/";
import { users as usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { sign, verify } from "hono/jwt";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

// Zod Schemas for validation
const signupSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const userRoute = new Hono()
  // Signup
  .post("/signup", zValidator("json", signupSchema), async (c) => {
    try {
      const { name, email, password } = c.req.valid("json");

      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (existingUser.length > 0) {
        return c.json({ error: "User with this email already exists" }, 409);
      }

      const hashedPassword = await Bun.password.hash(password);

      const [newUser] = await db
        .insert(usersTable)
        .values({
          name,
          email,
          password_hash: hashedPassword,
          age: "99", // Placeholder as per original schema, can be removed or updated
        })
        .returning({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        });

      return c.json(newUser, 201);
    } catch (error) {
      console.error("Signup Error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  })

  // Login
  .post("/login", zValidator("json", loginSchema), async (c) => {
    try {
      const { email, password } = c.req.valid("json");

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "Invalid credentials" }, 401);
      }

      const isPasswordValid = await Bun.password.verify(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return c.json({ error: "Invalid credentials" }, 401);
      }

      const payload = {
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
      };
      const secret = process.env.JWT_SECRET!;
      const token = await sign(payload, secret);

      setCookie(c, "auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
      });

      return c.json({ message: "Logged in successfully", token });
    } catch (error) {
      console.error("Login Error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  })

  // Get current user
  .get("/me", async (c) => {
    const token = getCookie(c, "auth_token");
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const secret = process.env.JWT_SECRET!;
    try {
      const payload = await verify(token, secret);
      const [user] = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(usersTable)
        .where(eq(usersTable.id, payload.sub as number));

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }
      return c.json(user);
    } catch (e) {
      // This catches JWT verification errors (invalid/expired)
      // and any potential database errors.
      console.error("Get Me Error:", e);
      return c.json({ error: "Unauthorized" }, 401);
    }
  })

  // Logout
  .post("/logout", async (c) => {
    try {
      deleteCookie(c, "auth_token", {
        path: "/",
      });
      return c.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout Error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  });