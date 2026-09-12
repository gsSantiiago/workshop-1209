import { and, eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { items, jobs, movements, purchases, stock, warehouses } from '../db/schema'
import type { StockRecord } from './stock.repository'

export type MovementType = 'receipt' | 'transfer' | 'issue'

export type MovementRecord = {
  id: string
  type: MovementType
  itemId: string
  quantity: number
  warehouseId: string
  toWarehouseId: string | null
  jobId: string | null
  purchaseId: string | null
  createdAt: string
}

export type PurchaseRef = {
  id: string
  itemId: string
  warehouseId: string
  quantity: number
}

export type StockDelta = {
  warehouseId: string
  itemId: string
  quantity: number
}

export class MovementRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<MovementRecord[]> {
    const rows = await this.db.select().from(movements)
    return rows.map(toMovement)
  }

  async existsWarehouse(id: string): Promise<boolean> {
    const rows = await this.db.select({ id: warehouses.id }).from(warehouses).where(eq(warehouses.id, id)).limit(1)
    return rows.length > 0
  }

  async existsItem(id: string): Promise<boolean> {
    const rows = await this.db.select({ id: items.id }).from(items).where(eq(items.id, id)).limit(1)
    return rows.length > 0
  }

  async existsJob(id: string): Promise<boolean> {
    const rows = await this.db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, id)).limit(1)
    return rows.length > 0
  }

  async findPurchase(id: string): Promise<PurchaseRef | null> {
    const rows = await this.db.select().from(purchases).where(eq(purchases.id, id)).limit(1)
    const row = rows[0]
    if (!row) {
      return null
    }
    return {
      id: row.id,
      itemId: row.itemId,
      warehouseId: row.warehouseId,
      quantity: row.quantity,
    }
  }

  async findStock(warehouseId: string, itemId: string): Promise<StockRecord | null> {
    const rows = await this.db
      .select()
      .from(stock)
      .where(and(eq(stock.warehouseId, warehouseId), eq(stock.itemId, itemId)))
      .limit(1)
    const row = rows[0]
    if (!row) {
      return null
    }
    return {
      id: row.id,
      warehouseId: row.warehouseId,
      itemId: row.itemId,
      quantity: row.quantity,
      createdAt: row.createdAt,
    }
  }

  async apply(movement: MovementRecord, deltas: StockDelta[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(movements).values({
        id: movement.id,
        type: movement.type,
        itemId: movement.itemId,
        quantity: movement.quantity,
        warehouseId: movement.warehouseId,
        toWarehouseId: movement.toWarehouseId,
        jobId: movement.jobId,
        purchaseId: movement.purchaseId,
        createdAt: movement.createdAt,
      })

      for (const delta of deltas) {
        const existing = await tx
          .select()
          .from(stock)
          .where(and(eq(stock.warehouseId, delta.warehouseId), eq(stock.itemId, delta.itemId)))
          .limit(1)
        const row = existing[0]
        if (row) {
          await tx.update(stock).set({ quantity: delta.quantity }).where(eq(stock.id, row.id))
        } else {
          await tx.insert(stock).values({
            id: crypto.randomUUID(),
            warehouseId: delta.warehouseId,
            itemId: delta.itemId,
            quantity: delta.quantity,
            createdAt: new Date().toISOString(),
          })
        }
      }
    })
  }
}

function toMovement(row: typeof movements.$inferSelect): MovementRecord {
  return {
    id: row.id,
    type: row.type as MovementType,
    itemId: row.itemId,
    quantity: row.quantity,
    warehouseId: row.warehouseId,
    toWarehouseId: row.toWarehouseId ?? null,
    jobId: row.jobId ?? null,
    purchaseId: row.purchaseId ?? null,
    createdAt: row.createdAt,
  }
}
