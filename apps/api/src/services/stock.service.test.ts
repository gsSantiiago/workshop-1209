import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import { StockRepository, type StockRecord } from '../repositories/stock.repository'
import { StockService } from './stock.service'

const valid = {
  warehouseId: 'warehouse-1',
  itemId: 'item-1',
  quantity: 12.5,
}
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function uniqueByCode() {
  return Object.assign(new Error('UNIQUE constraint failed: stock.warehouse_id'), {
    code: 'SQLITE_CONSTRAINT_UNIQUE',
  })
}

function uniqueByMessage() {
  return new Error('UNIQUE constraint failed: stock.warehouse_id')
}

function uniqueByCause() {
  return Object.assign(new Error('wrapped'), { cause: uniqueByCode() })
}

function foreignKeyByCode() {
  return Object.assign(new Error('FOREIGN KEY constraint failed'), {
    code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
  })
}

function foreignKeyByMessage() {
  return new Error('FOREIGN KEY constraint failed')
}

describe('StockService', () => {
  test('create with blank warehouseId or itemId throws 400 and does not call repository.create', async () => {
    const cases = [
      { warehouseId: '', itemId: valid.itemId, quantity: valid.quantity },
      { warehouseId: valid.warehouseId, itemId: '', quantity: valid.quantity },
      { warehouseId: '   ', itemId: valid.itemId, quantity: valid.quantity },
      { warehouseId: valid.warehouseId, itemId: '   ', quantity: valid.quantity },
    ]

    for (const input of cases) {
      const stock = sinon.createStubInstance(StockRepository)
      const service = new StockService(stock)

      try {
        await service.create(input)
        throw new Error(`expected create to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      }

      expect(stock.create.notCalled).toBe(true)
    }
  })

  test('create with missing or invalid quantity throws 400 and does not call repository.create', async () => {
    const cases = [undefined, null, '12', NaN, Infinity, -1, -0.5]

    for (const quantity of cases) {
      const stock = sinon.createStubInstance(StockRepository)
      const service = new StockService(stock)

      try {
        await service.create({
          warehouseId: valid.warehouseId,
          itemId: valid.itemId,
          quantity,
        })
        throw new Error(`expected create to throw for ${String(quantity)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      }

      expect(stock.create.notCalled).toBe(true)
    }
  })

  test('create trims warehouseId and itemId before repository.create', async () => {
    const stock = sinon.createStubInstance(StockRepository)
    stock.create.resolves()
    const service = new StockService(stock)

    await service.create({
      warehouseId: '  warehouse-1  ',
      itemId: '  item-1  ',
      quantity: 0,
    })

    expect(stock.create.calledOnce).toBe(true)
    const stored = stock.create.firstCall.args[0]
    expect(stored.warehouseId).toBe('warehouse-1')
    expect(stored.itemId).toBe('item-1')
    expect(stored.quantity).toBe(0)
  })

  test('create persists a UUID id, ISO-8601 createdAt, and returns that record', async () => {
    const stock = sinon.createStubInstance(StockRepository)
    stock.create.resolves()
    const service = new StockService(stock)

    const created = await service.create(valid)

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.warehouseId).toBe('warehouse-1')
    expect(created.itemId).toBe('item-1')
    expect(created.quantity).toBe(12.5)
    expect(stock.create.firstCall.args[0]).toEqual(created)
  })

  test('create maps a unique-constraint error to 409', async () => {
    const errors = [uniqueByCode(), uniqueByMessage(), uniqueByCause()]

    for (const thrown of errors) {
      const stock = sinon.createStubInstance(StockRepository)
      stock.create.rejects(thrown)
      const service = new StockService(stock)

      try {
        await service.create(valid)
        throw new Error('expected create to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(409)
        expect((error as Error).message).toBe('Stock already exists')
      }
    }
  })

  test('create maps a foreign-key error to 400', async () => {
    const errors = [foreignKeyByCode(), foreignKeyByMessage()]

    for (const thrown of errors) {
      const stock = sinon.createStubInstance(StockRepository)
      stock.create.rejects(thrown)
      const service = new StockService(stock)

      try {
        await service.create(valid)
        throw new Error('expected create to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('Warehouse or Item not found')
      }
    }
  })

  test('create rethrows errors that are not constraint violations', async () => {
    const boom = new Error('disk full')
    const stock = sinon.createStubInstance(StockRepository)
    stock.create.rejects(boom)
    const service = new StockService(stock)

    try {
      await service.create(valid)
      throw new Error('expected create to throw')
    } catch (error) {
      expect(error).toBe(boom)
    }
  })

  test('list returns whatever the repository lists', async () => {
    const rows: StockRecord[] = [
      {
        id: '1',
        warehouseId: 'warehouse-1',
        itemId: 'item-1',
        quantity: 4,
        createdAt: '2026-09-07T00:00:00.000Z',
      },
    ]
    const stock = sinon.createStubInstance(StockRepository)
    stock.list.resolves(rows)
    const service = new StockService(stock)
    expect(await service.list()).toBe(rows)
  })

  test('deleteById succeeds when the repository deletes the row', async () => {
    const stock = sinon.createStubInstance(StockRepository)
    stock.deleteById.resolves(true)
    const service = new StockService(stock)
    await service.deleteById('stock-1')
    expect(stock.deleteById.calledOnceWith('stock-1')).toBe(true)
  })

  test('deleteById throws 404 when the repository deletes nothing', async () => {
    const stock = sinon.createStubInstance(StockRepository)
    stock.deleteById.resolves(false)
    const service = new StockService(stock)

    try {
      await service.deleteById('missing')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('Stock not found')
    }
  })
})
