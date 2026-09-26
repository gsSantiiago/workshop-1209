import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { items, movements, purchases, requisitions, suppliers, warehouses } from '../db/schema'

export type PurchaseRecord = {
  id: string
  supplierId: string
  itemId: string
  warehouseId: string
  quantity: number
  createdAt: string
}

export class PurchaseRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<PurchaseRecord[]> {
    const rows = await this.db.select().from(purchases)
    return rows.map(toPurchase)
  }

  async existsSupplier(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1)
    return rows.length > 0
  }

  async existsItem(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, id))
      .limit(1)
    return rows.length > 0
  }

  async existsWarehouse(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: warehouses.id })
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1)
    return rows.length > 0
  }

  async create(purchase: PurchaseRecord): Promise<void> {
    await this.db.insert(purchases).values({
      id: purchase.id,
      supplierId: purchase.supplierId,
      itemId: purchase.itemId,
      warehouseId: purchase.warehouseId,
      quantity: purchase.quantity,
      createdAt: purchase.createdAt,
    })
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(purchases)
      .where(eq(purchases.id, id))
      .returning({ id: purchases.id })
    return deleted.length > 0
  }

  async hasMovement(purchaseId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: movements.id })
      .from(movements)
      .where(eq(movements.purchaseId, purchaseId))
      .limit(1)
    return rows.length > 0
  }

  async hasRequisition(purchaseId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: requisitions.id })
      .from(requisitions)
      .where(eq(requisitions.purchaseId, purchaseId))
      .limit(1)
    return rows.length > 0
  }
}

function toPurchase(row: typeof purchases.$inferSelect): PurchaseRecord {
  return {
    id: row.id,
    supplierId: row.supplierId,
    itemId: row.itemId,
    warehouseId: row.warehouseId,
    quantity: row.quantity,
    createdAt: row.createdAt,
  }
}
