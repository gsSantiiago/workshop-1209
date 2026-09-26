import { ItemRepository, type ItemRecord } from '../repositories/item.repository'

export type ItemInput = {
  sku?: string
  name?: string
  unit?: string
}

export class ItemService {
  constructor(private readonly items: ItemRepository) {}

  list(): Promise<ItemRecord[]> | ItemRecord[] {
    return this.items.list()
  }

  async create(input: ItemInput): Promise<ItemRecord> {
    const sku = input.sku?.trim() ?? ''
    const name = input.name?.trim() ?? ''
    const unit = input.unit?.trim() ?? ''
    if (!sku || !name || !unit) {
      throw httpError('sku, name, and unit are required', 400)
    }

    const item: ItemRecord = {
      id: crypto.randomUUID(),
      sku,
      name,
      unit,
      createdAt: new Date().toISOString(),
    }

    try {
      await this.items.create(item)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw httpError('SKU already exists', 409)
      }
      throw error
    }

    return item
  }

  async deleteById(id: string): Promise<void> {
    let deleted: boolean
    try {
      deleted = await this.items.deleteById(id)
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        if (await this.items.hasStock(id)) {
          throw httpError('Item has Stock', 409)
        }
        if (await this.items.hasRequisition(id)) {
          throw httpError('Item has Requisition', 409)
        }
        throw httpError('Item has Stock', 409)
      }
      throw error
    }
    if (!deleted) {
      throw httpError('Item not found', 404)
    }
  }
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
