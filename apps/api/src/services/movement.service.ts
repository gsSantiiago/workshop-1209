import {
  MovementRepository,
  type MovementRecord,
} from '../repositories/movement.repository'

export type ReceiptInput = {
  warehouseId?: string
  itemId?: string
  quantity?: unknown
}

export type TransferInput = {
  fromWarehouseId?: string
  toWarehouseId?: string
  itemId?: string
  quantity?: unknown
}

export class MovementService {
  constructor(private readonly movements: MovementRepository) {}

  list(): Promise<MovementRecord[]> | MovementRecord[] {
    return this.movements.list()
  }

  async createReceipt(input: ReceiptInput): Promise<MovementRecord> {
    const warehouseId = input.warehouseId?.trim() ?? ''
    const itemId = input.itemId?.trim() ?? ''
    if (!warehouseId || !itemId) {
      throw httpError('warehouseId, itemId, and a positive quantity are required', 400)
    }
    if (!isPositiveQuantity(input.quantity)) {
      throw httpError('quantity must be a positive number', 400)
    }

    const current = await this.movements.findStock(warehouseId, itemId)
    const movement: MovementRecord = {
      id: crypto.randomUUID(),
      type: 'receipt',
      itemId,
      quantity: input.quantity,
      warehouseId,
      toWarehouseId: null,
      jobId: null,
      createdAt: new Date().toISOString(),
    }

    try {
      await this.movements.apply(movement, [
        { warehouseId, itemId, quantity: (current?.quantity ?? 0) + input.quantity },
      ])
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw httpError('Warehouse or Item not found', 400)
      }
      throw error
    }

    return movement
  }

  async createTransfer(input: TransferInput): Promise<MovementRecord> {
    const fromWarehouseId = input.fromWarehouseId?.trim() ?? ''
    const toWarehouseId = input.toWarehouseId?.trim() ?? ''
    const itemId = input.itemId?.trim() ?? ''
    if (!fromWarehouseId || !toWarehouseId || !itemId) {
      throw httpError(
        'fromWarehouseId, toWarehouseId, itemId, and a positive quantity are required',
        400,
      )
    }
    if (!isPositiveQuantity(input.quantity)) {
      throw httpError('quantity must be a positive number', 400)
    }
    if (fromWarehouseId === toWarehouseId) {
      throw httpError('fromWarehouseId and toWarehouseId must differ', 400)
    }

    const source = await this.movements.findStock(fromWarehouseId, itemId)
    if (!source || source.quantity < input.quantity) {
      throw httpError('Insufficient Stock', 400)
    }
    const dest = await this.movements.findStock(toWarehouseId, itemId)
    const movement: MovementRecord = {
      id: crypto.randomUUID(),
      type: 'transfer',
      itemId,
      quantity: input.quantity,
      warehouseId: fromWarehouseId,
      toWarehouseId,
      jobId: null,
      createdAt: new Date().toISOString(),
    }

    try {
      await this.movements.apply(movement, [
        { warehouseId: fromWarehouseId, itemId, quantity: source.quantity - input.quantity },
        { warehouseId: toWarehouseId, itemId, quantity: (dest?.quantity ?? 0) + input.quantity },
      ])
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw httpError('Warehouse or Item not found', 400)
      }
      throw error
    }

    return movement
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
