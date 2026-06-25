import { Request, Response } from "express";
import * as z from "zod";
import { db } from "../db/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { todosTable } from "../db/schema";

const CreateTodoPayload = z.object({
  title: z.string().trim().min(1),
});

const UpdateTodoPayload = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
}).refine((data) => data.title !== undefined || data.completed !== undefined, {
  message: "At least one field (title or completed) must be provided",
});

// GET /todos
export const getTodos = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { completed, sort } = req.query;

  try {
    let query = db.select().from(todosTable).where(eq(todosTable.userId, userId));

    if (completed !== undefined) {
      const isCompleted = completed === "true";
      query = db
        .select()
        .from(todosTable)
        .where(and(eq(todosTable.userId, userId), eq(todosTable.completed, isCompleted)));
    }

    const todos = await query.orderBy(
      sort === "createdAt" ? asc(todosTable.createdAt) : desc(todosTable.createdAt)
    );

    res.status(200).json({ todos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /todos/:id
export const getTodoById = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const todoId = Number(req.params.id);

  if (isNaN(todoId)) {
    res.status(400).json({ error: "Invalid todo id" });
    return;
  }

  try {
    const result = await db
      .select()
      .from(todosTable)
      .where(and(eq(todosTable.id, todoId), eq(todosTable.userId, userId)));

    if (result.length === 0) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }

    res.status(200).json({ todo: result[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /todos
export const createTodo = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const payload = CreateTodoPayload.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const todo = await db
      .insert(todosTable)
      .values({ title: payload.data.title, userId, completed: false })
      .returning();

    res.status(201).json({ todo: todo[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /todos/:id
export const updateTodo = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const todoId = Number(req.params.id);

  if (isNaN(todoId)) {
    res.status(400).json({ error: "Invalid todo id" });
    return;
  }

  const payload = UpdateTodoPayload.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: payload.error.message });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(todosTable)
      .where(and(eq(todosTable.id, todoId), eq(todosTable.userId, userId)));

    if (existing.length === 0) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }

    const updated = await db
      .update(todosTable)
      .set(payload.data)
      .where(and(eq(todosTable.id, todoId), eq(todosTable.userId, userId)))
      .returning();

    res.status(200).json({ todo: updated[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /todos/:id
export const deleteTodo = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const todoId = Number(req.params.id);

  if (isNaN(todoId)) {
    res.status(400).json({ error: "Invalid todo id" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(todosTable)
      .where(and(eq(todosTable.id, todoId), eq(todosTable.userId, userId)));

    if (existing.length === 0) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }

    await db
      .delete(todosTable)
      .where(and(eq(todosTable.id, todoId), eq(todosTable.userId, userId)));

    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};