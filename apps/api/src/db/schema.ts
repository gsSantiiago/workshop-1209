import { real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  createdAt: text('created_at').notNull(),
})

export const warehouses = sqliteTable('warehouses', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull(),
})

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  createdAt: text('created_at').notNull(),
})

export const stock = sqliteTable(
  'stock',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    itemId: text('item_id')
      .notNull()
      .references(() => items.id),
    quantity: real('quantity').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('stock_warehouse_item_unique').on(table.warehouseId, table.itemId),
  ],
)
