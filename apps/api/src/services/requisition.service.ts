import type { PurchaseRecord } from '../repositories/purchase.repository'
import {
  RequisitionRepository,
  type RequisitionRecord,
} from '../repositories/requisition.repository'

export type RequisitionInput = {
  itemId?: string
  jobId?: string
  quantity?: unknown
}

export type ConvertInput = {
  supplierId?: string
  warehouseId?: string
  quantity?: unknown
}

export class RequisitionService {
  constructor(private readonly requisitions: RequisitionRepository) {}

  list(): Promise<RequisitionRecord[]> | RequisitionRecord[] {
    return this.requisitions.list()
  }

  async create(role: string, input: RequisitionInput): Promise<RequisitionRecord> {
    if (role !== 'Operator') {
      throw httpError('Forbidden', 403)
    }

    const itemId = input.itemId?.trim() ?? ''
    const jobId = input.jobId?.trim() ?? ''
    if (!itemId || !jobId || input.quantity === undefined || input.quantity === null) {
      throw httpError('itemId, jobId, and a positive quantity are required', 400)
    }
    if (!isPositiveQuantity(input.quantity)) {
      throw httpError('quantity must be a positive number', 400)
    }
    if (!(await this.requisitions.existsItem(itemId)) || !(await this.requisitions.existsJob(jobId))) {
      throw httpError('Item or Job not found', 400)
    }

    const requisition: RequisitionRecord = {
      id: crypto.randomUUID(),
      itemId,
      jobId,
      quantity: input.quantity,
      status: 'open',
      purchaseId: null,
      createdAt: new Date().toISOString(),
    }
    await this.requisitions.create(requisition)
    return requisition
  }

  async cancel(role: string, id: string): Promise<RequisitionRecord> {
    if (role !== 'Operator') {
      throw httpError('Forbidden', 403)
    }
    return this.finish(await this.requisitions.cancelIfOpen(id))
  }

  async refuse(role: string, id: string): Promise<RequisitionRecord> {
    if (role !== 'Administrator') {
      throw httpError('Forbidden', 403)
    }
    return this.finish(await this.requisitions.refuseIfOpen(id))
  }

  async convert(role: string, id: string, input: ConvertInput): Promise<RequisitionRecord> {
    if (role !== 'Administrator') {
      throw httpError('Forbidden', 403)
    }

    const current = await this.requisitions.findById(id)
    if (!current) {
      throw httpError('Requisition not found', 404)
    }
    if (current.status !== 'open') {
      throw httpError('Requisition is not open', 409)
    }

    const supplierId = input.supplierId?.trim() ?? ''
    const warehouseId = input.warehouseId?.trim() ?? ''
    if (
      !supplierId ||
      !warehouseId ||
      !(await this.requisitions.existsSupplier(supplierId)) ||
      !(await this.requisitions.existsWarehouse(warehouseId))
    ) {
      throw httpError('Supplier or Warehouse not found', 400)
    }

    const purchase: PurchaseRecord = {
      id: crypto.randomUUID(),
      supplierId,
      itemId: current.itemId,
      warehouseId,
      quantity: current.quantity,
      createdAt: new Date().toISOString(),
    }
    return this.finish(this.requisitions.convertIfOpen(id, purchase))
  }

  private finish(result: RequisitionRecord | 'not-open' | 'missing'): RequisitionRecord {
    if (result === 'missing') {
      throw httpError('Requisition not found', 404)
    }
    if (result === 'not-open') {
      throw httpError('Requisition is not open', 409)
    }
    return result
  }
}

function isPositiveQuantity(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function httpError(message: string, statusCode: number): Error {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = statusCode
  return error
}
