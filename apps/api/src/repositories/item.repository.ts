import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { items, requisitions, stock } from '../db/schema'

export type ItemRecord = {
  id: string
  sku: string
  name: string
  unit: string
  createdAt: string
}

export class ItemRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<ItemRecord[]> {
    const rows = await this.db.select().from(items)
    return rows.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      unit: row.unit,
      createdAt: row.createdAt,
    }))
  }

  async create(item: ItemRecord): Promise<void> {
    await this.db.insert(items).values({
      id: item.id,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      createdAt: item.createdAt,
    })
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(items)
      .where(eq(items.id, id))
      .returning({ id: items.id })
    return deleted.length > 0
  }

  async hasStock(itemId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: stock.id })
      .from(stock)
      .where(eq(stock.itemId, itemId))
      .limit(1)
    return rows.length > 0
  }

  async hasRequisition(itemId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: requisitions.id })
      .from(requisitions)
      .where(eq(requisitions.itemId, itemId))
      .limit(1)
    return rows.length > 0
  }
}
