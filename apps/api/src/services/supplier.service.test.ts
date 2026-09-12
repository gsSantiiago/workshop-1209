import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import { SupplierRepository } from '../repositories/supplier.repository'
import { SupplierService } from './supplier.service'

const valid = { name: 'Acme' }
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function uniqueByCode() {
  return Object.assign(new Error('UNIQUE constraint failed: suppliers.name'), {
    code: 'SQLITE_CONSTRAINT_UNIQUE',
  })
}

function uniqueByMessage() {
  return new Error('UNIQUE constraint failed: suppliers.name')
}

function uniqueByCause() {
  return Object.assign(new Error('wrapped'), { cause: uniqueByCode() })
}

function foreignKeyByCode() {
  return Object.assign(new Error('FOREIGN KEY constraint failed'), {
    code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
  })
}

describe('SupplierService', () => {
  test('C4 create with blank or whitespace name throws 400 and does not call repository.create', async () => {
    for (const name of ['', '   ']) {
      const suppliers = sinon.createStubInstance(SupplierRepository)
      const service = new SupplierService(suppliers)

      try {
        await service.create({ name })
        throw new Error(`expected create to throw for ${JSON.stringify(name)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('name is required')
      }

      expect(suppliers.create.notCalled).toBe(true)
    }
  })

  test('C2 create trims name and persists UUID id and ISO-8601 createdAt', async () => {
    const suppliers = sinon.createStubInstance(SupplierRepository)
    suppliers.create.resolves()
    const service = new SupplierService(suppliers)

    const created = await service.create({ name: '  Acme  ' })

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.name).toBe('Acme')
    expect(suppliers.create.calledOnce).toBe(true)
    expect(suppliers.create.firstCall.args[0]).toEqual(created)
  })

  test('C3 create maps a unique-constraint error to 409 Supplier already exists', async () => {
    const errors = [uniqueByCode(), uniqueByMessage(), uniqueByCause()]

    for (const thrown of errors) {
      const suppliers = sinon.createStubInstance(SupplierRepository)
      suppliers.create.rejects(thrown)
      const service = new SupplierService(suppliers)

      try {
        await service.create(valid)
        throw new Error('expected create to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(409)
        expect((error as Error).message).toBe('Supplier already exists')
      }
    }
  })

  test('create rethrows errors that are not unique violations', async () => {
    const boom = new Error('disk full')
    const suppliers = sinon.createStubInstance(SupplierRepository)
    suppliers.create.rejects(boom)
    const service = new SupplierService(suppliers)

    try {
      await service.create(valid)
      throw new Error('expected create to throw')
    } catch (error) {
      expect(error).toBe(boom)
    }
  })

  test('C5 deleteById succeeds when the repository deletes the row', async () => {
    const suppliers = sinon.createStubInstance(SupplierRepository)
    suppliers.deleteById.resolves(true)
    const service = new SupplierService(suppliers)
    await service.deleteById('supplier-1')
    expect(suppliers.deleteById.calledOnceWith('supplier-1')).toBe(true)
  })

  test('C6 deleteById maps a foreign-key error to 409 Supplier has Purchase', async () => {
    const suppliers = sinon.createStubInstance(SupplierRepository)
    suppliers.deleteById.rejects(foreignKeyByCode())
    const service = new SupplierService(suppliers)

    try {
      await service.deleteById('supplier-1')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(409)
      expect((error as Error).message).toBe('Supplier has Purchase')
    }
  })

  test('C7 deleteById throws 404 when the repository deletes nothing', async () => {
    const suppliers = sinon.createStubInstance(SupplierRepository)
    suppliers.deleteById.resolves(false)
    const service = new SupplierService(suppliers)

    try {
      await service.deleteById('missing')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('Supplier not found')
    }
  })
})
