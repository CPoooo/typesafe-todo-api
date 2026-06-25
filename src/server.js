"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var bcrypt_1 = require("bcrypt");
var db_1 = require("./db/db");
var drizzle_orm_1 = require("drizzle-orm"); // when we (me) make the src/queries dir we can remove all this
var schema_1 = require("./db/schema");
var jsonwebtoken_1 = require("jsonwebtoken");
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
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3000;
app.post('/auth/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log("logging in user");
        return [2 /*return*/];
    });
}); });
app.post('/auth/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, name, result, password_hash, new_user, user, token, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password, name = _a.name;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, db_1.db.selectDistinct().from(schema_1.usersTable).where((0, drizzle_orm_1.eq)(schema_1.usersTable.email, email))];
            case 2:
                result = _b.sent();
                if (result.length > 0) {
                    res.status(400).send(JSON.stringify({ error: 'email already exists so go brute force it and take their lunch money' }));
                }
                return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
            case 3:
                password_hash = _b.sent();
                return [4 /*yield*/, db_1.db.insert(schema_1.usersTable).values({ email: email, name: name, password: password_hash }).returning()];
            case 4:
                new_user = _b.sent();
                user = { userId: new_user[0].id };
                token = jsonwebtoken_1.default.sign(user, process.env.SECRET_KEY) // find a good way to error earlier in this file with this doesnt exist
                ;
                res.status(201).send(JSON.stringify(token));
                return [3 /*break*/, 6];
            case 5:
                error_1 = _b.sent();
                console.log("Something went wrong querying the db for user by email");
                // should make a discriminated union for all http errors and some custom
                res.status(500).send(JSON.stringify({ error: "Internal Server Error" }));
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// POST   /auth/logout         invalidate token
app.post('/auth/signout', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // get deeper explanation on what invalidate token means here 
        console.log("siging out user and invalidating jwt token for said user");
        return [2 /*return*/];
    });
}); });
// ==============================================
// would make a separate router per entity in larger app (at least i like the routes and handler dir pattern I use)
// routes is an Express Router and each handler is a function that gets the db connection and makes a request
// look into how to make sure the pool is efficient in typescript (I imagine the defaul pooling option I think that drizzle sets up with postgres is fine)
// GET    /todos               your todos only
app.get('/todos', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('todo');
        return [2 /*return*/];
    });
}); });
// GET    /todos/:id           must be yours
app.get('/todos/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('todo');
        return [2 /*return*/];
    });
}); });
// POST   /todos               create
app.post('/todos/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('todo');
        return [2 /*return*/];
    });
}); });
// PATCH  /todos/:id           update title or completed
app.patch('/todos/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id;
    return __generator(this, function (_a) {
        id = req.body.id;
        console.log("patching todo ".concat(id));
        res.send("todo/patch/:id");
        return [2 /*return*/];
    });
}); });
// DELETE /todos/:id           delete
app.delete('/todos/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id;
    return __generator(this, function (_a) {
        id = req.body.id;
        console.log("deleting todo ".concat(id));
        res.send("todo/delete/:id");
        return [2 /*return*/];
    });
}); });
// // stretch
// GET    /todos?completed=true      filter
// GET    /todos?sort=createdAt      sort
app.get('/todos', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('TODO');
        return [2 /*return*/];
    });
}); });
app.get('/todos', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('TODO');
        return [2 /*return*/];
    });
}); });
app.listen(PORT, function () {
    console.log("App listening on port: ".concat(PORT));
});
/* three base64 encoded chunks
 JWT: header.payload.signature jwt process in my words
 user sends a payload to login like {email:cameron@gmail.com, password: isthissentoverthewireunhashedbtwwellwehavetlsnevermindlol?}
 the server will say okay they logged in successfully i trust you, I am now going to take your payload
 and hash it with my secret key <- do i need to know how this works fully? might as well know a lil
 server then sends back the jwt: header.payload.signature <- sig is the thing we just hashed using secret key and their payload
 then next time when they make a request they send along the jwt and we take
 header.payload portion and check against our secret key (it will only match if the payload is not tampered with)reject or continue (user authenticated)
*/ 
