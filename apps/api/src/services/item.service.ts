import type { ItemRecord } from '../repositories/item.repository'

export type ItemStore = {
  list(): ItemRecord[] | Promise<ItemRecord[]>
  create(item: ItemRecord): void | Promise<void>
  deleteById(id: string): boolean | Promise<boolean>
}

export class ItemService {
  constructor(private readonly store: ItemStore) {}

  list(): Promise<ItemRecord[]> | ItemRecord[] {
    return this.store.list()
  }

  async create(input: { sku?: string; name?: string; unit?: string }): Promise<ItemRecord> {
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
      await this.store.create(item)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw httpError('SKU already exists', 409)
      }
      throw error
    }

    return item
  }

  async deleteById(id: string): Promise<void> {
    const deleted = await this.store.deleteById(id)
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
  let current: unknown = error
  while (current && typeof current === 'object') {
    if ('code' in current && current.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return true
    }
    if (
      'message' in current &&
      typeof current.message === 'string' &&
      current.message.includes('UNIQUE constraint failed')
    ) {
      return true
    }
    current = 'cause' in current ? current.cause : undefined
  }
  return false
}
