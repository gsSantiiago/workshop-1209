import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import { MovementRepository, type MovementRecord } from '../repositories/movement.repository'
import { MovementService } from './movement.service'

const validReceipt = {
  warehouseId: 'warehouse-1',
  itemId: 'item-1',
  quantity: 12.5,
}
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function foreignKeyByCode() {
  return Object.assign(new Error('FOREIGN KEY constraint failed'), {
    code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
  })
}

function foreignKeyByMessage() {
  return new Error('FOREIGN KEY constraint failed')
}

describe('MovementService', () => {
  test('list returns whatever the repository lists', async () => {
    const rows: MovementRecord[] = [
      {
        id: 'm-1',
        type: 'receipt',
        itemId: 'item-1',
        quantity: 12.5,
        warehouseId: 'warehouse-1',
        toWarehouseId: null,
        jobId: null,
        createdAt: '2026-09-12T00:00:00.000Z',
      },
    ]
    const movements = sinon.createStubInstance(MovementRepository)
    movements.list.resolves(rows)
    const service = new MovementService(movements)
    expect(await service.list()).toBe(rows)
  })

  test('createReceipt persists a receipt Movement with UUID id and ISO-8601 createdAt', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    movements.findStock.resolves(null)
    movements.apply.resolves()
    const service = new MovementService(movements)

    const created = await service.createReceipt(validReceipt)

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.type).toBe('receipt')
    expect(created.warehouseId).toBe('warehouse-1')
    expect(created.itemId).toBe('item-1')
    expect(created.quantity).toBe(12.5)
    expect(created.toWarehouseId).toBeNull()
    expect(created.jobId).toBeNull()
    expect(movements.apply.calledOnce).toBe(true)
    expect(movements.apply.firstCall.args[0]).toEqual(created)
  })

  test('createReceipt creates Stock at 12.5 when no Stock row exists', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    movements.findStock.resolves(null)
    movements.apply.resolves()
    const service = new MovementService(movements)

    await service.createReceipt(validReceipt)

    expect(movements.findStock.calledOnceWith('warehouse-1', 'item-1')).toBe(true)
    expect(movements.apply.firstCall.args[1]).toEqual([
      { warehouseId: 'warehouse-1', itemId: 'item-1', quantity: 12.5 },
    ])
  })

  test('createReceipt adds 12.5 to existing Stock quantity 4', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    movements.findStock.resolves({
      id: 'stock-1',
      warehouseId: 'warehouse-1',
      itemId: 'item-1',
      quantity: 4,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.apply.resolves()
    const service = new MovementService(movements)

    await service.createReceipt(validReceipt)

    expect(movements.apply.firstCall.args[1]).toEqual([
      { warehouseId: 'warehouse-1', itemId: 'item-1', quantity: 16.5 },
    ])
  })

  test('createReceipt with invalid quantity throws 400 and does not call apply', async () => {
    const cases = [undefined, null, '12', NaN, Infinity, 0, -1]

    for (const quantity of cases) {
      const movements = sinon.createStubInstance(MovementRepository)
      const service = new MovementService(movements)

      try {
        await service.createReceipt({
          warehouseId: validReceipt.warehouseId,
          itemId: validReceipt.itemId,
          quantity,
        })
        throw new Error(`expected createReceipt to throw for ${String(quantity)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('quantity must be a positive number')
      }

      expect(movements.apply.notCalled).toBe(true)
      expect(movements.findStock.notCalled).toBe(true)
    }
  })

  test('createReceipt with blank warehouseId or itemId throws 400 and does not call apply', async () => {
    const cases = [
      { warehouseId: '', itemId: validReceipt.itemId, quantity: validReceipt.quantity },
      { warehouseId: validReceipt.warehouseId, itemId: '', quantity: validReceipt.quantity },
      { warehouseId: '   ', itemId: validReceipt.itemId, quantity: validReceipt.quantity },
      { warehouseId: validReceipt.warehouseId, itemId: '   ', quantity: validReceipt.quantity },
    ]

    for (const input of cases) {
      const movements = sinon.createStubInstance(MovementRepository)
      const service = new MovementService(movements)

      try {
        await service.createReceipt(input)
        throw new Error(`expected createReceipt to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe(
          'warehouseId, itemId, and a positive quantity are required',
        )
      }

      expect(movements.apply.notCalled).toBe(true)
    }
  })

  test('createReceipt maps a foreign-key error to 400 Warehouse or Item not found', async () => {
    const errors = [foreignKeyByCode(), foreignKeyByMessage()]

    for (const thrown of errors) {
      const movements = sinon.createStubInstance(MovementRepository)
      movements.findStock.resolves(null)
      movements.apply.rejects(thrown)
      const service = new MovementService(movements)

      try {
        await service.createReceipt(validReceipt)
        throw new Error('expected createReceipt to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('Warehouse or Item not found')
      }
    }
  })
})
