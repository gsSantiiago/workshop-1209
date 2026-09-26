import { and, eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { items, jobs, purchases, requisitions, requisitionStatuses, suppliers, warehouses } from '../db/schema'
import type { PurchaseRecord } from './purchase.repository'

export type RequisitionStatus = (typeof requisitionStatuses)[number]

export type RequisitionRecord = {
  id: string
  itemId: string
  jobId: string
  quantity: number
  status: RequisitionStatus
  purchaseId: string | null
  createdAt: string
}

const NOT_OPEN = 'requisition-not-open'

export class RequisitionRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<RequisitionRecord[]> {
    const rows = await this.db.select().from(requisitions)
    return rows.map(toRequisition)
  }

  async findById(id: string): Promise<RequisitionRecord | undefined> {
    const rows = await this.db
      .select()
      .from(requisitions)
      .where(eq(requisitions.id, id))
      .limit(1)
    return rows[0] ? toRequisition(rows[0]) : undefined
  }

  async existsItem(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, id))
      .limit(1)
    return rows.length > 0
  }

  async existsJob(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1)
    return rows.length > 0
  }

  async existsSupplier(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, id))
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

  async create(requisition: RequisitionRecord): Promise<void> {
    await this.db.insert(requisitions).values({
      id: requisition.id,
      itemId: requisition.itemId,
      jobId: requisition.jobId,
      quantity: requisition.quantity,
      status: requisition.status,
      purchaseId: requisition.purchaseId,
      createdAt: requisition.createdAt,
    })
  }

  cancelIfOpen(id: string): Promise<RequisitionRecord | 'not-open' | 'missing'> {
    return this.transitionIfOpen(id, 'cancelled')
  }

  refuseIfOpen(id: string): Promise<RequisitionRecord | 'not-open' | 'missing'> {
    return this.transitionIfOpen(id, 'refused')
  }

  convertIfOpen(
    id: string,
    purchase: PurchaseRecord,
  ): RequisitionRecord | 'not-open' | 'missing' {
    try {
      return this.db.transaction((tx) => {
        tx.insert(purchases)
          .values({
            id: purchase.id,
            supplierId: purchase.supplierId,
            itemId: purchase.itemId,
            warehouseId: purchase.warehouseId,
            quantity: purchase.quantity,
            createdAt: purchase.createdAt,
          })
          .run()
        const updated = tx
          .update(requisitions)
          .set({ status: 'converted', purchaseId: purchase.id })
          .where(and(eq(requisitions.id, id), eq(requisitions.status, 'open')))
          .returning()
          .all()
        if (updated.length === 0) {
          throw new Error(NOT_OPEN)
        }
        return toRequisition(updated[0])
      })
    } catch (error) {
      if (error instanceof Error && error.message === NOT_OPEN) {
        const rows = this.db.select().from(requisitions).where(eq(requisitions.id, id)).all()
        return rows.length === 0 ? 'missing' : 'not-open'
      }
      throw error
    }
  }

  private async transitionIfOpen(
    id: string,
    status: 'cancelled' | 'refused',
  ): Promise<RequisitionRecord | 'not-open' | 'missing'> {
    const updated = await this.db
      .update(requisitions)
      .set({ status })
      .where(and(eq(requisitions.id, id), eq(requisitions.status, 'open')))
      .returning()
    if (updated.length > 0) {
      return toRequisition(updated[0])
    }
    const existing = await this.findById(id)
    if (!existing) return 'missing'
    return 'not-open'
  }
}

function toRequisition(row: typeof requisitions.$inferSelect): RequisitionRecord {
  return {
    id: row.id,
    itemId: row.itemId,
    jobId: row.jobId,
    quantity: row.quantity,
    status: row.status as RequisitionStatus,
    purchaseId: row.purchaseId,
    createdAt: row.createdAt,
  }
}
