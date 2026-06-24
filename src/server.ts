import express from 'express';
import z from 'zod'
import bcrypt from "bcrypt"
import { db } from './db/db';
import { InsertUser, usersTable } from './db/schema';
import jsonwebtoken from 'jsonwebtoken'

const app = express();
const PORT = process.env.PORT || 3000;


// three base64 encoded chunks 
// JWT: header.payload.signature

// jwt process in my words
// user sends a payload to login like {email:cameron@gmail.com, password: isthissentoverthewireunhashedbtwwellwehavetlsnevermindlol?}
// the server will say okay they logged in successfully i trust you, I am now going to take your payload
// and hash it with my secret key <- do i need to know how this works fully? might as well know a lil
// server then sends back the jwt: header.payload.signature <- sig is the thing we just hashed using secret key and their payload
// then next time when they make a request they send along the jwt and we take 
// header.payload portion and check against our secret key (it will only match if the payload is not tampered with)
// reject or continue (user authenticated) 

// what goes into a token when we sign it? 
type UnverifiedRequest = { email: string, password: string } // z.email here later 
// type JWTPayload = {header: string, payload: UnverifiedRequest, signature: string} // should this be user specific? i mean they cant login to the todo table
type JWTPayload = { userId: number } // only the pk from the db, min information needed to verify who you are

type VerifiedPayload = UnverifiedRequest & { __brand: 'verified', iat: 'thisisaguessidkifthesearedatesornumbers', exp: 1000 }
type AuthenticatedRequest = UnverifiedRequest & { __brand: 'authenticated' }

// can i make this a type to validate the request coming in? 
// or just use zod?
// PARSE DONT VALIDATE <- good philosophy and what zod does as well and rust too
// you want to parse into a strongly typed thing instead of just validating the unknown

// type Email = string 
// // something with @ and . <- how to type this well 
// CHECK BOTTOM TO SEE THE BRANDED TYPES AND PROBABLY JUST USE ZOD HERE

// turn this into a discriminated union
// go read more on algebraic data types <- tie them into typescript and nextjs specifically
type LoginRequest = { email: Email, password: string }

type StatusCode = 200 | 201 | 404 // etc
type LoginResponse = { status: StatusCode } // some enum or something. this could be in three states
// 1. you logged in good job 
// 2. hey your password is wrong <- only so many attempts, and there is something with not 
// saying something in the response about the password for security but I can not remember 

// 3. your email does not exist or is typo
// SO THE ANSWER TO THIS: always return a generic 401 with invalid credentials, an attacker should not be able to brute
// force emails and see what emails are or are not registered

// POST   /auth/login          returns a JWT
// can fully type the Request with ts and zod after working
app.post('/auth/login', (req: , res: Response) => {
    // login, check with db and 
    // logic then return jwt. go look into more depth on jwt btw
    // something about rotating them or something <- custom solution before libary for now
    // how does bcrypt interact with jwt
    // from my understanding this moment: user logs in with password and it gets hashed via bcrypt usually with 10 salting rounds
    // then if login succeeds attach the jwt to this user
    // so the next time they log in they will already have one? so would we need to check the password again 
    // or is jwt used on all other routes except this one 
})

// POST   /auth/register       create account
app.post('/auth/register', (req, res) => {
    // make account and give jwt
    // only if the user does not exist already
    // can move this query into src/queries later. would probably also have a handlers and routes dir as well
    // {email: string, password: string}
    // check if we already have this email -> what code to reject with?
    const { email, password, name } = req.body

    try {
        let result = await db.select({
            email: usersTable.email
        }).from(usersTable)

        if (result.length > 0) {
            // user with this email exists, normally best practice here when registering
            // is to force the user to verify this email exists. and do verification that way.
            // for learning purposes I will just return email already exists for now -> which leads to account enumeration (BAD)
            res.send(JSON.stringify({ error: 'email already exists so go brute force it and take their lunch money' })).status(400)
        }

        const password_hash = await bcrypt.hash(password, 10)
        const new_user = await db.insert(usersTable).values({ email, name, password: password_hash }).returning()
        // now take new user and return them a jwt
        const user = { userId: new_user[0].id };

    } catch (error) {
        console.log("Something went wrong querying the db for user by email")
        // should make a discriminated union for all http errors and some custom
        res.send(JSON.stringify({ error: "Internal Server Error" })).status(500)
    }
})

// POST   /auth/logout         invalidate token
app.post('/auth/signout', (req, res) => {
    // get deeper explanation on what invalidate token means here 
})

// ==============================================
// would make a separate router per entity in larger app (at least i like the routes and handler dir pattern I use)
// routes is an Express Router and each handler is a function that gets the db connection and makes a request
// look into how to make sure the pool is efficient in typescript (I imagine the defaul pooling option I think that drizzle sets up with postgres is fine)

// GET    /todos               your todos only
app.get('/todos', (req: , res: Response) => {
})

// GET    /todos/:id           must be yours
app.get('/todos/:id', (req: , res: Response) => {
})

// POST   /todos               create
app.post('/todos', (req: , res: Response) => {
})

// PATCH  /todos/:id           update title or completed
app.patch('/todos/:id', (req: , res: Response) => {
})
// DELETE /todos/:id           delete
app.delete('/todos/:id', (req: , res: Response) => {
})

// // stretch
// GET    /todos?completed=true      filter
// GET    /todos?sort=createdAt      sort
app.get('/todos', (req: , res: Response) => {
})

app.get('/todos', (req: , res: Response) => {
})

app.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`);
})

// ==================================================
type Email = string & { __brand: 'Email' }

function parseEmail(s: string): Email {
    if (!s.includes('@')) throw new Error('invalid email');
    return s as Email;
}

// SPEC FOR CHALLENGE: TODO APP WITH AUTH

// POST   /auth/register       create account
// POST   /auth/login          returns a JWT
// POST   /auth/logout         invalidate token

// GET    /todos               your todos only
// GET    /todos/:id           must be yours
// POST   /todos               create
// PATCH  /todos/:id           update title or completed
// DELETE /todos/:id           delete

// // stretch
// GET    /todos?completed=true      filter
// GET    /todos?sort=createdAt      sort