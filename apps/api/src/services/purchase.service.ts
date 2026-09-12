import { PurchaseRepository, type PurchaseRecord } from '../repositories/purchase.repository'

export type PurchaseInput = {
  supplierId?: string
  itemId?: string
  warehouseId?: string
  quantity?: unknown
}

export class PurchaseService {
  constructor(private readonly purchases: PurchaseRepository) {}

  list(): Promise<PurchaseRecord[]> | PurchaseRecord[] {
    return this.purchases.list()
  }

  async create(input: PurchaseInput): Promise<PurchaseRecord> {
    const supplierId = input.supplierId?.trim() ?? ''
    const itemId = input.itemId?.trim() ?? ''
    const warehouseId = input.warehouseId?.trim() ?? ''
    if (!supplierId || !itemId || !warehouseId || input.quantity === undefined || input.quantity === null) {
      throw httpError('supplierId, itemId, warehouseId, and a positive quantity are required', 400)
    }
    if (!isPositiveQuantity(input.quantity)) {
      throw httpError('quantity must be a positive number', 400)
    }

    if (
      !(await this.purchases.existsSupplier(supplierId)) ||
      !(await this.purchases.existsItem(itemId)) ||
      !(await this.purchases.existsWarehouse(warehouseId))
    ) {
      throw httpError('Supplier, Item, or Warehouse not found', 400)
    }

    const purchase: PurchaseRecord = {
      id: crypto.randomUUID(),
      supplierId,
      itemId,
      warehouseId,
      quantity: input.quantity,
      createdAt: new Date().toISOString(),
    }

    await this.purchases.create(purchase)
    return purchase
  }

  async deleteById(id: string): Promise<void> {
    let deleted: boolean
    try {
      deleted = await this.purchases.deleteById(id)
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw httpError('Purchase has Movement', 409)
      }
      throw error
    }
    if (!deleted) {
      throw httpError('Purchase not found', 404)
    }
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

function isForeignKeyViolation(error: unknown): boolean {
  return constraintFailed(
    error,
    'SQLITE_CONSTRAINT_FOREIGNKEY',
    'FOREIGN KEY constraint failed',
  )
}

function constraintFailed(error: unknown, code: string, message: string): boolean {
  let current: unknown = error
  while (current && typeof current === 'object') {
    if ('code' in current && current.code === code) {
      return true
    }
    if (
      'message' in current &&
      typeof current.message === 'string' &&
      current.message.includes(message)
    ) {
      return true
    }
    current = 'cause' in current ? current.cause : undefined
  }
  return false
}
