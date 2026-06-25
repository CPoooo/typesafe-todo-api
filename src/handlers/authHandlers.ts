import { Request, Response } from "express";
import * as z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { usersTable } from "../db/schema";

const LoginPayload = z.object({
  email: z.string().trim(),
  password: z.string().trim(),
});

const RegisterPayload = z.object({
  email: z.string().trim(),
  name: z.string().trim(),
  password: z.string().trim(),
});

const signToken = (userId: number) =>
  jwt.sign({ userId }, process.env.SECRET_KEY!);

export const login = async (req: Request, res: Response) => {
  const payload = LoginPayload.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, password } = payload.data;

  try {
    const result = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (result.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.status(200).json({ token: signToken(user.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const register = async (req: Request, res: Response) => {
  const payload = RegisterPayload.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, password, name } = payload.data;

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with that email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db
      .insert(usersTable)
      .values({ email, name, password: passwordHash })
      .returning();

    res.status(201).json({ token: signToken(newUser[0].id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// JWT is stateless and real invalidation requires a token denylist of some sort (Redis etc.)
// For now we will get to this when we build the nextjs client or turn some other client. Leptos on frontend and ts on backend? That is illegal btw 
export const signout = (_req: Request, res: Response) => {
  res.status(200).json({ message: "Signed out successfully" });
};