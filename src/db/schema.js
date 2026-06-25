"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todosTable = exports.usersTable = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.usersTable = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    password: (0, pg_core_1.text)('password_hash').notNull(),
});
exports.todosTable = (0, pg_core_1.pgTable)('todos', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull()
        .references(function () { return exports.usersTable.id; }, { onDelete: 'cascade' }), // so when we delete a user all their todos are also deleted
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull()
        .$onUpdate(function () { return new Date(); }) // on update get new timestamp
});
