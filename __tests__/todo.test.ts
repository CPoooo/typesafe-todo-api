import { describe, it, expect, vi, beforeEach } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";

// --- DB mock ---
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../src/db/db", () => ({ db: mockDb }));
vi.mock("../src/db/schema", () => ({
  usersTable: {},
  todosTable: {
    id: "id",
    userId: "userId",
    title: "title",
    completed: "completed",
    createdAt: "createdAt",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
}));

process.env.SECRET_KEY = "test-secret";

const { app } = await import("../src/app");
const request = supertest(app);

// ─── helpers ──────────────────────────────────────────────────────────────────

const validToken = jwt.sign({ userId: 1 }, "test-secret");
const auth = `Bearer ${validToken}`;
const expiredToken = jwt.sign({ userId: 1 }, "test-secret", { expiresIn: -1 });

const fakeTodo = { id: 1, userId: 1, title: "Buy milk", completed: false, createdAt: new Date() };

function mockSelectDbErrorWithOrderBy() {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue(new Error("DB exploded")),
      }),
    }),
  });
}

function mockSelectReturns(rows: unknown[]) {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(rows),
      }),
    }),
  });
}

function mockSelectReturnsOnce(rows: unknown[]) {
  mockDb.select.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows),
    }),
  });
}

function mockSelectDbError() {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error("DB exploded")),
    }),
  });
}

function mockInsertReturns(row: unknown) {
  mockDb.insert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([row]),
    }),
  });
}

function mockUpdateReturns(row: unknown) {
  mockDb.update.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([row]),
      }),
    }),
  });
}

function mockDeleteSuccess() {
  mockDb.delete.mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  });
}

// ─── Auth middleware ───────────────────────────────────────────────────────────

describe("Auth middleware (applied to all /todos routes)", () => {
  it("401 — no Authorization header", async () => {
    const res = await request.get("/todos");
    expect(res.status).toBe(401);
  });

  it("401 — Authorization header without Bearer prefix", async () => {
    const res = await request.get("/todos").set("Authorization", validToken);
    expect(res.status).toBe(401);
  });

  it("401 — malformed token", async () => {
    const res = await request.get("/todos").set("Authorization", "Bearer notavalidtoken");
    expect(res.status).toBe(401);
  });

  it("401 — expired token", async () => {
    const res = await request.get("/todos").set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it("401 — token signed with wrong secret", async () => {
    const badToken = jwt.sign({ userId: 1 }, "wrong-secret");
    const res = await request.get("/todos").set("Authorization", `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });
});

// ─── GET /todos ───────────────────────────────────────────────────────────────

describe("GET /todos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("200 — returns todos for authenticated user", async () => {
    mockSelectReturns([fakeTodo]);

    const res = await request.get("/todos").set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body.todos).toHaveLength(1);
  });

  it("200 — returns empty array when user has no todos", async () => {
    mockSelectReturns([]);

    const res = await request.get("/todos").set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body.todos).toHaveLength(0);
  });

  it("200 — ?completed=true filters completed todos", async () => {
    mockSelectReturns([{ ...fakeTodo, completed: true }]);

    const res = await request.get("/todos?completed=true").set("Authorization", auth);
    expect(res.status).toBe(200);
  });

  it("200 — ?completed=false filters incomplete todos", async () => {
    mockSelectReturns([fakeTodo]);

    const res = await request.get("/todos?completed=false").set("Authorization", auth);
    expect(res.status).toBe(200);
  });

  it("200 — ?sort=createdAt sorts by createdAt", async () => {
    mockSelectReturns([fakeTodo]);

    const res = await request.get("/todos?sort=createdAt").set("Authorization", auth);
    expect(res.status).toBe(200);
  });

  it("500 — db throws", async () => {
    mockSelectDbError();

    const res = await request.get("/todos").set("Authorization", auth);
    expect(res.status).toBe(500);
  });
});

// ─── GET /todos/:id ───────────────────────────────────────────────────────────

describe("GET /todos/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("200 — returns todo that belongs to user", async () => {
    mockSelectReturnsOnce([fakeTodo]);

    const res = await request.get("/todos/1").set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body.todo).toBeDefined();
  });

  it("400 — non-numeric id", async () => {
    const res = await request.get("/todos/abc").set("Authorization", auth);
    expect(res.status).toBe(400);
  });

  it("404 — todo not found (or belongs to another user)", async () => {
    mockSelectReturnsOnce([]);

    const res = await request.get("/todos/999").set("Authorization", auth);
    expect(res.status).toBe(404);
  });

  it("500 — db throws", async () => {
    mockSelectDbError();

    const res = await request.get("/todos/1").set("Authorization", auth);
    expect(res.status).toBe(500);
  });
});

// ─── POST /todos ──────────────────────────────────────────────────────────────

describe("POST /todos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("201 — creates todo and returns it", async () => {
    mockInsertReturns(fakeTodo);

    const res = await request
      .post("/todos")
      .set("Authorization", auth)
      .send({ title: "Buy milk" });

    expect(res.status).toBe(201);
    expect(res.body.todo).toBeDefined();
  });

  it("400 — missing title", async () => {
    const res = await request.post("/todos").set("Authorization", auth).send({});
    expect(res.status).toBe(400);
  });

  it("400 — empty title string", async () => {
    const res = await request.post("/todos").set("Authorization", auth).send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("400 — title is whitespace only", async () => {
    const res = await request.post("/todos").set("Authorization", auth).send({ title: "   " });
    expect(res.status).toBe(400);
  });

  it("500 — db throws", async () => {
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error("DB exploded")),
      }),
    });

    const res = await request
      .post("/todos")
      .set("Authorization", auth)
      .send({ title: "Buy milk" });

    expect(res.status).toBe(500);
  });
});

// ─── PATCH /todos/:id ─────────────────────────────────────────────────────────

describe("PATCH /todos/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("200 — updates title", async () => {
    mockSelectReturnsOnce([fakeTodo]);
    mockUpdateReturns({ ...fakeTodo, title: "Updated title" });

    const res = await request
      .patch("/todos/1")
      .set("Authorization", auth)
      .send({ title: "Updated title" });

    expect(res.status).toBe(200);
    expect(res.body.todo.title).toBe("Updated title");
  });

  it("200 — updates completed", async () => {
    mockSelectReturnsOnce([fakeTodo]);
    mockUpdateReturns({ ...fakeTodo, completed: true });

    const res = await request
      .patch("/todos/1")
      .set("Authorization", auth)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.todo.completed).toBe(true);
  });

  it("200 — updates both title and completed", async () => {
    mockSelectReturnsOnce([fakeTodo]);
    mockUpdateReturns({ ...fakeTodo, title: "New title", completed: true });

    const res = await request
      .patch("/todos/1")
      .set("Authorization", auth)
      .send({ title: "New title", completed: true });

    expect(res.status).toBe(200);
  });

  it("400 — non-numeric id", async () => {
    const res = await request
      .patch("/todos/abc")
      .set("Authorization", auth)
      .send({ title: "x" });
    expect(res.status).toBe(400);
  });

  it("400 — empty body (no fields provided)", async () => {
    const res = await request.patch("/todos/1").set("Authorization", auth).send({});
    expect(res.status).toBe(400);
  });

  it("400 — empty title string", async () => {
    const res = await request
      .patch("/todos/1")
      .set("Authorization", auth)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("404 — todo not found", async () => {
    mockSelectReturnsOnce([]);

    const res = await request
      .patch("/todos/999")
      .set("Authorization", auth)
      .send({ title: "x" });

    expect(res.status).toBe(404);
  });

  it("500 — db throws on select", async () => {
    mockSelectDbError();

    const res = await request
      .patch("/todos/1")
      .set("Authorization", auth)
      .send({ title: "x" });

    expect(res.status).toBe(500);
  });
});

// ─── DELETE /todos/:id ────────────────────────────────────────────────────────

describe("DELETE /todos/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("200 — deletes todo that belongs to user", async () => {
    mockSelectReturnsOnce([fakeTodo]);
    mockDeleteSuccess();

    const res = await request.delete("/todos/1").set("Authorization", auth);
    expect(res.status).toBe(200);
  });

  it("400 — non-numeric id", async () => {
    const res = await request.delete("/todos/abc").set("Authorization", auth);
    expect(res.status).toBe(400);
  });

  it("404 — todo not found (or belongs to another user)", async () => {
    mockSelectReturnsOnce([]);

    const res = await request.delete("/todos/999").set("Authorization", auth);
    expect(res.status).toBe(404);
  });

  it("500 — db throws", async () => {
    mockSelectDbError();

    const res = await request.delete("/todos/1").set("Authorization", auth);
    expect(res.status).toBe(500);
  });
});