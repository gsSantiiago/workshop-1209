import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import { WarehouseRepository, type WarehouseRecord } from '../repositories/warehouse.repository'
import { WarehouseService } from './warehouse.service'

const valid = { name: 'Central' }
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function uniqueByCode() {
  return Object.assign(new Error('UNIQUE constraint failed: warehouses.name'), {
    code: 'SQLITE_CONSTRAINT_UNIQUE',
  })
}

function uniqueByMessage() {
  return new Error('UNIQUE constraint failed: warehouses.name')
}

function uniqueByCause() {
  return Object.assign(new Error('wrapped'), { cause: uniqueByCode() })
}

function foreignKeyByCode() {
  return Object.assign(new Error('FOREIGN KEY constraint failed'), {
    code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
  })
}

describe('WarehouseService', () => {
  test('create with blank or whitespace name throws 400 and does not call repository.create', async () => {
    for (const name of ['', '   ']) {
      const warehouses = sinon.createStubInstance(WarehouseRepository)
      const service = new WarehouseService(warehouses)

      try {
        await service.create({ name })
        throw new Error(`expected create to throw for ${JSON.stringify(name)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      }

      expect(warehouses.create.notCalled).toBe(true)
    }
  })

  test('create trims name before repository.create', async () => {
    const warehouses = sinon.createStubInstance(WarehouseRepository)
    warehouses.create.resolves()
    const service = new WarehouseService(warehouses)

    await service.create({ name: '  Central  ' })

    expect(warehouses.create.calledOnce).toBe(true)
    expect(warehouses.create.firstCall.args[0].name).toBe('Central')
  })

  test('create persists a UUID id, ISO-8601 createdAt, and returns that record', async () => {
    const warehouses = sinon.createStubInstance(WarehouseRepository)
    warehouses.create.resolves()
    const service = new WarehouseService(warehouses)

    const created = await service.create(valid)

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.name).toBe('Central')
    expect(warehouses.create.firstCall.args[0]).toEqual(created)
  })

  test('create maps a unique-constraint error to 409', async () => {
    const errors = [uniqueByCode(), uniqueByMessage(), uniqueByCause()]

    for (const thrown of errors) {
      const warehouses = sinon.createStubInstance(WarehouseRepository)
      warehouses.create.rejects(thrown)
      const service = new WarehouseService(warehouses)

      try {
        await service.create(valid)
        throw new Error('expected create to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(409)
        expect((error as Error).message).toBe('Warehouse already exists')
      }
    }
  })

  test('create rethrows errors that are not unique violations', async () => {
    const boom = new Error('disk full')
    const warehouses = sinon.createStubInstance(WarehouseRepository)
    warehouses.create.rejects(boom)
    const service = new WarehouseService(warehouses)

    try {
      await service.create(valid)
      throw new Error('expected create to throw')
    } catch (error) {
      expect(error).toBe(boom)
    }
  })

  test('list returns whatever the repository lists', async () => {
    const rows: WarehouseRecord[] = [
      { id: '1', name: 'Central', createdAt: '2026-09-07T00:00:00.000Z' },
    ]
    const warehouses = sinon.createStubInstance(WarehouseRepository)
    warehouses.list.resolves(rows)
    const service = new WarehouseService(warehouses)
    expect(await service.list()).toBe(rows)
  })

  test('deleteById succeeds when the repository deletes the row', async () => {
    const warehouses = sinon.createStubInstance(WarehouseRepository)
    warehouses.deleteById.resolves(true)
    const service = new WarehouseService(warehouses)
    await service.deleteById('warehouse-1')
    expect(warehouses.deleteById.calledOnceWith('warehouse-1')).toBe(true)
  })

  test('deleteById throws 404 when the repository deletes nothing', async () => {
    const warehouses = sinon.createStubInstance(WarehouseRepository)
    warehouses.deleteById.resolves(false)
    const service = new WarehouseService(warehouses)

    try {
      await service.deleteById('missing')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('Warehouse not found')
    }
  })

  test('deleteById maps a foreign-key error to 409', async () => {
    const warehouses = sinon.createStubInstance(WarehouseRepository)
    warehouses.deleteById.rejects(foreignKeyByCode())
    const service = new WarehouseService(warehouses)

    try {
      await service.deleteById('warehouse-1')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(409)
      expect((error as Error).message).toBe('Warehouse has Stock')
    }
  })
})
