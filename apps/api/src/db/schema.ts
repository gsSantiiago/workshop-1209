import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  createdAt: text('created_at').notNull(),
})
