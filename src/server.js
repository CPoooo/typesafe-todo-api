"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var bcrypt_1 = require("bcrypt");
var db_1 = require("./db/db");
var drizzle_orm_1 = require("drizzle-orm"); // when we (me) make the src/queries dir we can remove all this
var schema_1 = require("./db/schema");
var jsonwebtoken_1 = require("jsonwebtoken");
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3000;
// 1. you logged in good job 
// 2. hey your password is wrong <- only so many attempts, and there is something with not 
// saying something in the response about the password for security but I can not remember 
// 3. your email does not exist or is typo
// SO THE ANSWER TO THIS: always return a generic 401 with invalid credentials, an attacker should not be able to brute
// force emails and see what emails are or are not registered
// POST   /auth/login          returns a JWT
// can fully type the Request with ts and zod after working
app.post('/auth/login', function (req, res) {
    // login, check with db and 
    // logic then return jwt. go look into more depth on jwt btw
    // something about rotating them or something <- custom solution before libary for now
    // how does bcrypt interact with jwt
    // from my understanding this moment: user logs in with password and it gets hashed via bcrypt usually with 10 salting rounds
    // then if login succeeds attach the jwt to this user
    // so the next time they log in they will already have one? so would we need to check the password again 
    // or is jwt used on all other routes except this one 
});
// POST   /auth/register       create account
app.post('/auth/register', function (req, res) {
    // make account and give jwt
    // only if the user does not exist already
    // can move this query into src/queries later. would probably also have a handlers and routes dir as well
    // {email: string, password: string}
    // check if we already have this email -> what code to reject with?
    var _a = req.body, email = _a.email, password = _a.password, name = _a.name;
    try {
        var result = yield db_1.db.selectDistinct().from(schema_1.usersTable).where((0, drizzle_orm_1.eq)(schema_1.usersTable.email, email));
        if (result.length > 0) {
            // user with this email exists, normally best practice here when registering
            // is to force the user to verify this email exists. and do verification that way.
            // for learning purposes I will just return email already exists for now -> which leads to account enumeration (BAD)
            res.status(400).send(JSON.stringify({ error: 'email already exists so go brute force it and take their lunch money' }));
        }
        var password_hash = yield bcrypt_1.default.hash(password, 10);
        var new_user = yield db_1.db.insert(schema_1.usersTable).values({ email: email, name: name, password: password_hash }).returning();
        // now take new user and return them a jwt
        var user = { userId: new_user[0].id };
        var token = jsonwebtoken_1.default.sign(user, process.env.SECRET_KEY); // find a good way to error earlier in this file with this doesnt exist
        // maybe some zod on the .env like I saw the Syntax guy do (for now we assert dominance, I mean assert not null)
        res.status(201).send(JSON.stringify(token));
    }
    catch (error) {
        console.log("Something went wrong querying the db for user by email");
        // should make a discriminated union for all http errors and some custom
        res.status(500).send(JSON.stringify({ error: "Internal Server Error" }));
    }
});
// POST   /auth/logout         invalidate token
app.post('/auth/signout', function (req, res) {
    // get deeper explanation on what invalidate token means here 
});
// ==============================================
// would make a separate router per entity in larger app (at least i like the routes and handler dir pattern I use)
// routes is an Express Router and each handler is a function that gets the db connection and makes a request
// look into how to make sure the pool is efficient in typescript (I imagine the defaul pooling option I think that drizzle sets up with postgres is fine)
// GET    /todos               your todos only
app.get('/todos', function (req, res) {
});
// GET    /todos/:id           must be yours
app.get('/todos/:id', function (req, res) {
});
// POST   /todos               create
app.post('/todos', function (req, res) {
});
// PATCH  /todos/:id           update title or completed
app.patch('/todos/:id', function (req, res) {
});
// DELETE /todos/:id           delete
app.delete('/todos/:id', function (req, res) {
});
// // stretch
// GET    /todos?completed=true      filter
// GET    /todos?sort=createdAt      sort
app.get('/todos', function (req, res) {
});
app.get('/todos', function (req, res) {
});
app.listen(PORT, function () {
    console.log("App listening on port: ".concat(PORT));
});
function parseEmail(s) {
    if (!s.includes('@'))
        throw new Error('invalid email');
    return s;
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
