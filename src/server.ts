import express, { type Request, Response } from 'express';
import * as z from 'zod'
import bcrypt from "bcrypt"
import { db } from './db/db';
import { eq } from 'drizzle-orm'; // when we (me) make the src/queries dir we can remove all this
import { InsertUser, usersTable } from './db/schema';
import jwt from 'jsonwebtoken'

// SPEC FOR CHALLENGE: TODO APP WITH AUTH

// POST   /auth/register       create account
// POST   /auth/login          returns a JWT
// POST   /auth/logout         invalidate token

// GET    /todos               your todos only
// GET    /todos/:id           must be yours
// POST   /todos               create
// PATCH  /todos/:id           update title or completed
// DELETE /todos/:id           delete

// GET    /todos?completed=true      filter
// GET    /todos?sort=createdAt      sort

const app = express();
app.use(express.json())
const PORT = process.env.PORT || 3000;

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body

    if (!email) {
        res.status(400).send(JSON.stringify({ error: 'Request to login must have an email in the body' })) // will these checks just be done by zod? 
        return
    }

    if (!password) {
        res.status(400).send(JSON.stringify({ error: 'Request to login must have a password in the body' }))
        return
    }


    try {
        const result = await db.select().from(usersTable).where(eq(usersTable.email, email))

        if (result.length <= 0) {
            res.status(400).send({ error: "Invalid Credentials" })
            return
        }
        const user = result[0]

        const isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (!isPasswordCorrect) {
            res.status(400).send({ error: "Invalid Credentials" })
            return
        }

        const user_jwt = { userId: user.id }
        const token = jwt.sign(user_jwt, process.env.SECRET_KEY!)

        res.status(200).send(JSON.stringify({ token }))
    } catch (error) {
        console.log(error)
        res.status(500).send({ error: "Internal Server Error" })
    }
})

const RegisterPayload = z.object({
    email: z.email(),
    name: z.string(),
    password: z.string(),
})

app.post('/auth/register', async (req: Request, res) => {
    const payload = RegisterPayload.safeParse(req.body)
    if (!payload.success) {
        res.status(400).send({ error: "Invalid Request Body" })
        return
    }

    const { email, password, name } = payload.data

    try {
        const result = await db.select().from(usersTable).where(eq(usersTable.email, email))
        console.log(result)

        if (result.length > 0) {
            res.status(400).send(JSON.stringify({ error: 'email already exists so go brute force it and take their lunch money' })) // normally do "if this email exists you will receive a confirmation code"
            return
        }

        const password_hash = await bcrypt.hash(password, 10)
        const new_user = await db.insert(usersTable).values({ email, name, password: password_hash }).returning()
        const user = { userId: new_user[0].id };

        const token = jwt.sign(user, process.env.SECRET_KEY!) // find a good way to error earlier in this file with this doesnt exist

        res.status(201).send(JSON.stringify({ token }))
    } catch (error) {
        console.log("Something went wrong querying the db for user by email")
        res.status(500).send(JSON.stringify({ error: "Internal Server Error" })) // should make a discriminated union for all http errors and some custom
    }
})

// POST   /auth/logout         invalidate token
app.post('/auth/signout', async (req, res) => {
    // get deeper explanation on what invalidate token means here 
    console.log("siging out user and invalidating jwt token for said user")
    res.send("hello from /auth/signout")
})

// ==============================================
// would make a separate router per entity in larger app (at least i like the routes and handler dir pattern I use)
// routes is an Express Router and each handler is a function that gets the db connection and makes a request
// look into how to make sure the pool is efficient in typescript (I imagine the defaul pooling option I think that drizzle sets up with postgres is fine)

// GET    /todos               your todos only
app.get('/todos', async (req, res) => {
    console.log('todo')
    res.send("hello from /todos")
})

// GET    /todos/:id           must be yours
app.get('/todos/:id', async (req, res) => {
    console.log('todo')
    res.send("hello from /todos/:id")
})

// POST   /todos               create
app.post('/todos/:id', async (req, res) => {
    console.log('todo')
    res.send("hello from POST /todos/:id")
})

// PATCH  /todos/:id           update title or completed
app.patch('/todos/:id', async (req, res) => {
    const { id } = req.body
    console.log(`patching todo ${id}`)
    res.send("hello from PATCH /todos/:id")
})
// DELETE /todos/:id           delete
app.delete('/todos/:id', async (req, res) => {
    const { id } = req.body
    console.log(`deleting todo ${id}`)
    res.send("hello from /todos/:id")
})

// // stretch
// GET    /todos?completed=true      filter
// GET    /todos?sort=createdAt      sort
app.get('/todos', async (req, res) => {
    console.log('TODO')
    res.send("hello from /todos?completed=true") // filter only completed
})

app.get('/todos', async (req, res) => {
    console.log('TODO')
    res.send("hello from /sort?createdAt") // sorted by createdAt Desc (most recent i think is desc? lol)
})

app.listen(PORT, () => {
    console.log(`
\x1b[36m
 ████████╗ ██████╗ ██████╗  ██████╗      █████╗ ██████╗ ██╗
    ██╔══╝██╔═══██╗██╔══██╗██╔═══██╗    ██╔══██╗██╔══██╗██║
    ██║   ██║   ██║██║  ██║██║   ██║    ███████║██████╔╝██║
    ██║   ██║   ██║██║  ██║██║   ██║    ██╔══██║██╔═══╝ ██║
    ██║   ╚██████╔╝██████╔╝╚██████╔╝    ██║  ██║██║     ██║
    ╚═╝    ╚═════╝ ╚═════╝  ╚═════╝     ╚═╝  ╚═╝╚═╝     ╚═╝
\x1b[0m
\x1b[33m  ⚡ Server blazing on port ${PORT}\x1b[0m
\x1b[90m  ────────────────────────────────────────────────────\x1b[0m
\x1b[32m  ✓ Database connected (I think)
  ✓ Routes mounted (well yea)
  ✓ JWT auth ready (PRESENT THEM!! ...your secret key I mean)\x1b[0m
  \x1b[90m  ────────────────────────────────────────────────────\x1b[0m
Impressed? I mean there IS color in the terminal right now\x1b[0m
    `)
})

/* three base64 encoded chunks 
 JWT: header.payload.signature jwt process in my words
 user sends a payload to login like {email:cameron@gmail.com, password: isthissentoverthewireunhashedbtwwellwehavetlsnevermindlol?}
 the server will say okay they logged in successfully i trust you, I am now going to take your payload
 and hash it with my secret key <- do i need to know how this works fully? might as well know a lil
 server then sends back the jwt: header.payload.signature <- sig is the thing we just hashed using secret key and their payload
 then next time when they make a request they send along the jwt and we take 
 header.payload portion and check against our secret key (it will only match if the payload is not tampered with)reject or continue (user authenticated)
*/