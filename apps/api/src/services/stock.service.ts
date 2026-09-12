import { StockRepository, type StockRecord } from '../repositories/stock.repository'

export type StockInput = {
  warehouseId?: string
  itemId?: string
  quantity?: unknown
}

export class StockService {
  constructor(private readonly stock: StockRepository) {}

  list(): Promise<StockRecord[]> | StockRecord[] {
    return this.stock.list()
  }

  async create(input: StockInput): Promise<StockRecord> {
    const warehouseId = input.warehouseId?.trim() ?? ''
    const itemId = input.itemId?.trim() ?? ''
    if (!warehouseId || !itemId || !isNonNegativeQuantity(input.quantity)) {
      throw httpError('warehouseId, itemId, and a non-negative quantity are required', 400)
    }

    const row: StockRecord = {
      id: crypto.randomUUID(),
      warehouseId,
      itemId,
      quantity: input.quantity,
      createdAt: new Date().toISOString(),
    }

    try {
      await this.stock.create(row)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw httpError('Stock already exists', 409)
      }
      if (isForeignKeyViolation(error)) {
        throw httpError('Warehouse or Item not found', 400)
      }
      throw error
    }

    return row
  }

  async deleteById(id: string): Promise<void> {
    const deleted = await this.stock.deleteById(id)
    if (!deleted) {
      throw httpError('Stock not found', 404)
    }
  }
}

function isNonNegativeQuantity(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function httpError(message: string, statusCode: number): Error {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = statusCode
  return error
}

function isUniqueViolation(error: unknown): boolean {
  return constraintFailed(error, 'SQLITE_CONSTRAINT_UNIQUE', 'UNIQUE constraint failed')
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
