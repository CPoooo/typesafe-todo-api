import { text, serial, timestamp, pgTable, integer, boolean } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password_hash').notNull(),
})

export const todosTable = pgTable('todos', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull()
        .references(() => usersTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    completed: boolean('completed').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
})

// need to get this down better (do i need a deleteUser type too?) do i have to type everything myself?
export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect

export type InsertTodo = typeof todosTable.$inferInsert
export type SelectTodo = typeof todosTable.$inferSelect