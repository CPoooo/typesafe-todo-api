import { describe, it, expect, vi, beforeEach } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";

// --- DB mock ---
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
};

vi.mock("../src/db/db", () => ({ db: mockDb }));
vi.mock("../src/db/schema", () => ({
  usersTable: { email: "email", id: "id", password: "password" },
  todosTable: {},
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
}));

// Lazy import AFTER mocks are set up
const { app } = await import("../src/app");
const request = supertest(app);

// ─── helpers ──────────────────────────────────────────────────────────────────

const validToken = jwt.sign({ userId: 1 }, "test-secret");
const authHeader = `Bearer ${validToken}`;

function mockUserNotFound() {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  });
}

function mockUserFound(overrides = {}) {
  const user = {
    id: 1,
    email: "cameron@test.com",
    name: "Cameron",
    password: "$2b$10$hashedpassword",
    ...overrides,
  };
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([user]),
    }),
  });
  return user;
}

function mockInsertUser(returnVal = { id: 1 }) {
  mockDb.insert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([returnVal]),
    }),
  });
}

function mockDbError() {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error("DB exploded")),
    }),
  });
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

describe("POST /auth/register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("201 — returns token on valid registration", async () => {
    mockUserNotFound();
    mockInsertUser({ id: 1 });

    const res = await request.post("/auth/register").send({
      email: "cameron@test.com",
      name: "Cameron",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it("400 — missing email", async () => {
    const res = await request.post("/auth/register").send({
      name: "Cameron",
      password: "password123",
    });
    expect(res.status).toBe(400);
  });

  it("400 — invalid email format", async () => {
    const res = await request.post("/auth/register").send({
      email: "notanemail",
      name: "Cameron",
      password: "password123",
    });
    expect(res.status).toBe(400);
  });

  it("400 — missing name", async () => {
    const res = await request.post("/auth/register").send({
      email: "cameron@test.com",
      password: "password123",
    });
    expect(res.status).toBe(400);
  });

  it("400 — missing password", async () => {
    const res = await request.post("/auth/register").send({
      email: "cameron@test.com",
      name: "Cameron",
    });
    expect(res.status).toBe(400);
  });

  it("400 — empty body", async () => {
    const res = await request.post("/auth/register").send({});
    expect(res.status).toBe(400);
  });

  it("409 — email already exists", async () => {
    mockUserFound();

    const res = await request.post("/auth/register").send({
      email: "cameron@test.com",
      name: "Cameron",
      password: "password123",
    });
    expect(res.status).toBe(409);
  });

  it("500 — db throws", async () => {
    mockDbError();

    const res = await request.post("/auth/register").send({
      email: "cameron@test.com",
      name: "Cameron",
      password: "password123",
    });
    expect(res.status).toBe(500);
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("200 — returns token on valid credentials", async () => {
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash("password123", 10);
    mockUserFound({ password: hash });

    const res = await request.post("/auth/login").send({
      email: "cameron@test.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("400 — missing email", async () => {
    const res = await request.post("/auth/login").send({ password: "password123" });
    expect(res.status).toBe(400);
  });

  it("400 — missing password", async () => {
    const res = await request.post("/auth/login").send({ email: "cameron@test.com" });
    expect(res.status).toBe(400);
  });

  it("400 — empty body", async () => {
    const res = await request.post("/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("401 — user not found", async () => {
    mockUserNotFound();

    const res = await request.post("/auth/login").send({
      email: "ghost@test.com",
      password: "password123",
    });
    expect(res.status).toBe(401);
  });

  it("401 — wrong password", async () => {
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash("correctpassword", 10);
    mockUserFound({ password: hash });

    const res = await request.post("/auth/login").send({
      email: "cameron@test.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("500 — db throws", async () => {
    mockDbError();

    const res = await request.post("/auth/login").send({
      email: "cameron@test.com",
      password: "password123",
    });
    expect(res.status).toBe(500);
  });
});

// ─── POST /auth/signout ───────────────────────────────────────────────────────

describe("POST /auth/signout", () => {
  it("200 — always succeeds (stateless JWT)", async () => {
    const res = await request.post("/auth/signout");
    expect(res.status).toBe(200);
  });
});