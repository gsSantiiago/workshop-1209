import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { stock } from '../db/schema'

export type StockRecord = {
  id: string
  warehouseId: string
  itemId: string
  quantity: number
  createdAt: string
}

export class StockRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<StockRecord[]> {
    const rows = await this.db.select().from(stock)
    return rows.map((row) => ({
      id: row.id,
      warehouseId: row.warehouseId,
      itemId: row.itemId,
      quantity: row.quantity,
      createdAt: row.createdAt,
    }))
  }

  async create(row: StockRecord): Promise<void> {
    await this.db.insert(stock).values({
      id: row.id,
      warehouseId: row.warehouseId,
      itemId: row.itemId,
      quantity: row.quantity,
      createdAt: row.createdAt,
    })
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(stock)
      .where(eq(stock.id, id))
      .returning({ id: stock.id })
    return deleted.length > 0
  }
}
