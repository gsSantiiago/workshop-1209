import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { warehouses } from '../db/schema'

export type WarehouseRecord = {
  id: string
  name: string
  createdAt: string
}

export class WarehouseRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<WarehouseRecord[]> {
    const rows = await this.db.select().from(warehouses)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
    }))
  }

  async create(warehouse: WarehouseRecord): Promise<void> {
    await this.db.insert(warehouses).values({
      id: warehouse.id,
      name: warehouse.name,
      createdAt: warehouse.createdAt,
    })
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(warehouses)
      .where(eq(warehouses.id, id))
      .returning({ id: warehouses.id })
    return deleted.length > 0
  }
}
