import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const types = sqliteTable('types', {
  id: text('id').primaryKey(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  typeId: text('type_id').notNull(),
  priority: integer('priority').notNull(),
  dueAt: integer('due_at'),
  detail: text('detail').notNull().default(''),
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type TypeRow = typeof types.$inferSelect;
export type NewTypeRow = typeof types.$inferInsert;
export type TodoRow = typeof todos.$inferSelect;
export type NewTodoRow = typeof todos.$inferInsert;
export type SettingRow = typeof settings.$inferSelect;
