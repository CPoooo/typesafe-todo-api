import { text, serial, timestamp, pgTable, integer } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
})

export const todosTable = pgTable('todos', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull()
        .references(() => usersTable.id, { onDelete: 'cascade' }), // so when we delete a user all their todos are also deleted
    title: text('title').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull()
        .$onUpdate(() => new Date()) // on update get new timestamp
})


// need to get this down better
export type 