import { SupplierRepository, type SupplierRecord } from '../repositories/supplier.repository'

export type SupplierInput = {
  name?: string
}

export class SupplierService {
  constructor(private readonly suppliers: SupplierRepository) {}

  list(): Promise<SupplierRecord[]> | SupplierRecord[] {
    return this.suppliers.list()
  }

  async create(input: SupplierInput): Promise<SupplierRecord> {
    const name = input.name?.trim() ?? ''
    if (!name) {
      throw httpError('name is required', 400)
    }

    const supplier: SupplierRecord = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    }

    try {
      await this.suppliers.create(supplier)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw httpError('Supplier already exists', 409)
      }
      throw error
    }

    return supplier
  }

  async deleteById(id: string): Promise<void> {
    let deleted: boolean
    try {
      deleted = await this.suppliers.deleteById(id)
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw httpError('Supplier has Purchase', 409)
      }
      throw error
    }
    if (!deleted) {
      throw httpError('Supplier not found', 404)
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
