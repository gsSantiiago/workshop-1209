import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { suppliers } from '../db/schema'

export type SupplierRecord = {
  id: string
  name: string
  createdAt: string
}

export class SupplierRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<SupplierRecord[]> {
    const rows = await this.db.select().from(suppliers)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
    }))
  }

  async create(supplier: SupplierRecord): Promise<void> {
    await this.db.insert(suppliers).values({
      id: supplier.id,
      name: supplier.name,
      createdAt: supplier.createdAt,
    })
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(suppliers)
      .where(eq(suppliers.id, id))
      .returning({ id: suppliers.id })
    return deleted.length > 0
  }
}
