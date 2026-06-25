# typesafe-todo-api

![Tests](https://img.shields.io/badge/tests-48%20passed-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

A fully type-safe REST API for managing todos with JWT authentication. Built with Express, Drizzle ORM, and Zod.
Have you ever felt THIS type safe before? 
...and yes this readme is over the top for a todo rest API but lets face it I have to code something and you know those colored buttons above look cool

## Stack

- **Runtime** — Node.js + Express
- **Language** — TypeScript (strict mode)
- **Database** — Neon (serverless Postgres) via Drizzle ORM
- **Validation** — Zod
- **Auth** — JWT + bcrypt
- **Testing** — Vitest + Supertest

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Neon](https://neon.tech) account with a Postgres database ready (or if you know what you are doing Docker and Postgres or any serverless db provider of your choice)

### Installation

```bash
git clone https://github.com/CPoooo/typesafe-todo-api
cd typesafe-todo-api
npm i
```

### Environment Variables

Copy `.env.example` to `.env` generate a secret key and fill in your values:

```bash
cp .env.example .env
```

For generating the secret key:

```bash
openssl rand -hex 64
```

Paste the generated value into `SECRET_KEY`.

| Variable       | Description                                    |
| -------------- | ---------------------------------------------- |
| `DATABASE_URL` | Your Neon Postgres connection string           |
| `PORT`         | Port to run the server on (defaults to `3000`) |
| `SECRET_KEY`   | Secret used to sign and verify JWT tokens      |

### Database Setup

Push the schema to your DB:

```bash
npm run db:push
```

### Run

```bash
npm run dev
```

### Test

```bash
npm run test
```

---

## API Reference

All `/todos` routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Route            | Auth | Description             |
| ------ | ---------------- | ---- | ----------------------- |
| POST   | `/auth/register` | No   | Register a new user     |
| POST   | `/auth/login`    | No   | Login and receive a JWT |
| POST   | `/auth/signout`  | No   | Stateless signout       |

### Todos

| Method | Route        | Auth | Description                        |
| ------ | ------------ | ---- | ---------------------------------- |
| GET    | `/todos`     | Yes  | Get all todos for the current user |
| GET    | `/todos/:id` | Yes  | Get a single todo by ID            |
| POST   | `/todos`     | Yes  | Create a new todo                  |
| PATCH  | `/todos/:id` | Yes  | Update a todo's title or status    |
| DELETE | `/todos/:id` | Yes  | Delete a todo                      |

#### Query Params — `GET /todos`

| Param       | Type              | Description                                          |
| ----------- | ----------------- | ---------------------------------------------------- |
| `completed` | `true` \| `false` | Filter by completion status                          |
| `sort`      | `createdAt`       | Sort ascending by created date (default: descending) |

---

## Examples
I can upload the postman collection as well if someone REALLY wants it 

### Register

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "cameron@example.com",
  "name": "Cameron",
  "password": "password123"
}
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "cameron@example.com",
  "password": "password123"
}
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Create a Todo

```bash
POST /todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Buy milk"
}
```

```json
{
  "todo": {
    "id": 1,
    "userId": 1,
    "title": "Buy milk",
    "completed": false,
    "createdAt": "2025-06-01T00:00:00.000Z"
  }
}
```

### Update a Todo

```bash
PATCH /todos/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed": true
}
```

```json
{
  "todo": {
    "id": 1,
    "userId": 1,
    "title": "Buy milk",
    "completed": true,
    "createdAt": "2025-06-01T00:00:00.000Z"
  }
}
```

---

## License

MIT

As if I need a license for this but hey! Its the MIT one take it and do something cool with this
