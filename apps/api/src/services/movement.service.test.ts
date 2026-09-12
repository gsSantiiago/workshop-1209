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
        purchaseId: null,
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

  const validTransfer = {
    fromWarehouseId: 'warehouse-a',
    toWarehouseId: 'warehouse-b',
    itemId: 'item-1',
    quantity: 3,
  }

  function stubTransferRefs(movements: sinon.SinonStubbedInstance<MovementRepository>) {
    movements.existsWarehouse.resolves(true)
    movements.existsItem.resolves(true)
  }

  test('createTransfer persists a transfer Movement with UUID id and ISO-8601 createdAt', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    stubTransferRefs(movements)
    movements.findStock.onFirstCall().resolves({
      id: 'stock-a',
      warehouseId: 'warehouse-a',
      itemId: 'item-1',
      quantity: 10,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.findStock.onSecondCall().resolves({
      id: 'stock-b',
      warehouseId: 'warehouse-b',
      itemId: 'item-1',
      quantity: 5,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.apply.resolves()
    const service = new MovementService(movements)

    const created = await service.createTransfer(validTransfer)

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.type).toBe('transfer')
    expect(created.warehouseId).toBe('warehouse-a')
    expect(created.toWarehouseId).toBe('warehouse-b')
    expect(created.itemId).toBe('item-1')
    expect(created.quantity).toBe(3)
    expect(created.jobId).toBeNull()
    expect(movements.apply.calledOnce).toBe(true)
    expect(movements.apply.firstCall.args[0]).toEqual(created)
  })

  test('createTransfer subtracts source Stock and adds destination Stock', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    stubTransferRefs(movements)
    movements.findStock.onFirstCall().resolves({
      id: 'stock-a',
      warehouseId: 'warehouse-a',
      itemId: 'item-1',
      quantity: 10,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.findStock.onSecondCall().resolves({
      id: 'stock-b',
      warehouseId: 'warehouse-b',
      itemId: 'item-1',
      quantity: 5,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.apply.resolves()
    const service = new MovementService(movements)

    await service.createTransfer(validTransfer)

    expect(movements.apply.firstCall.args[1]).toEqual([
      { warehouseId: 'warehouse-a', itemId: 'item-1', quantity: 7 },
      { warehouseId: 'warehouse-b', itemId: 'item-1', quantity: 8 },
    ])
  })

  test('createTransfer creates destination Stock at 3 when it is missing', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    stubTransferRefs(movements)
    movements.findStock.onFirstCall().resolves({
      id: 'stock-a',
      warehouseId: 'warehouse-a',
      itemId: 'item-1',
      quantity: 10,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.findStock.onSecondCall().resolves(null)
    movements.apply.resolves()
    const service = new MovementService(movements)

    await service.createTransfer(validTransfer)

    expect(movements.apply.firstCall.args[1]).toEqual([
      { warehouseId: 'warehouse-a', itemId: 'item-1', quantity: 7 },
      { warehouseId: 'warehouse-b', itemId: 'item-1', quantity: 3 },
    ])
  })

  test('createTransfer with missing or short source Stock throws 400 and does not call apply', async () => {
    const sources = [null, {
      id: 'stock-a',
      warehouseId: 'warehouse-a',
      itemId: 'item-1',
      quantity: 2,
      createdAt: '2026-09-12T00:00:00.000Z',
    }]

    for (const source of sources) {
      const movements = sinon.createStubInstance(MovementRepository)
      stubTransferRefs(movements)
      movements.findStock.resolves(source)
      const service = new MovementService(movements)

      try {
        await service.createTransfer(validTransfer)
        throw new Error('expected createTransfer to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('Insufficient Stock')
      }

      expect(movements.apply.notCalled).toBe(true)
    }
  })

  test('createTransfer with the same Warehouse throws 400 and does not call apply', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    const service = new MovementService(movements)

    try {
      await service.createTransfer({
        fromWarehouseId: 'warehouse-a',
        toWarehouseId: 'warehouse-a',
        itemId: 'item-1',
        quantity: 3,
      })
      throw new Error('expected createTransfer to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      expect((error as Error).message).toBe('fromWarehouseId and toWarehouseId must differ')
    }

    expect(movements.apply.notCalled).toBe(true)
    expect(movements.findStock.notCalled).toBe(true)
  })

  test('createTransfer with blank ids throws 400 and does not call apply', async () => {
    const cases = [
      { fromWarehouseId: '', toWarehouseId: 'warehouse-b', itemId: 'item-1', quantity: 3 },
      { fromWarehouseId: 'warehouse-a', toWarehouseId: '', itemId: 'item-1', quantity: 3 },
      { fromWarehouseId: 'warehouse-a', toWarehouseId: 'warehouse-b', itemId: '', quantity: 3 },
      { fromWarehouseId: '   ', toWarehouseId: 'warehouse-b', itemId: 'item-1', quantity: 3 },
    ]

    for (const input of cases) {
      const movements = sinon.createStubInstance(MovementRepository)
      const service = new MovementService(movements)

      try {
        await service.createTransfer(input)
        throw new Error(`expected createTransfer to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe(
          'fromWarehouseId, toWarehouseId, itemId, and a positive quantity are required',
        )
      }

      expect(movements.apply.notCalled).toBe(true)
    }
  })

  test('createTransfer with invalid quantity throws 400 and does not call apply', async () => {
    const cases = [undefined, null, '3', NaN, Infinity, 0, -1]

    for (const quantity of cases) {
      const movements = sinon.createStubInstance(MovementRepository)
      const service = new MovementService(movements)

      try {
        await service.createTransfer({
          fromWarehouseId: 'warehouse-a',
          toWarehouseId: 'warehouse-b',
          itemId: 'item-1',
          quantity,
        })
        throw new Error(`expected createTransfer to throw for ${String(quantity)}`)
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('quantity must be a positive number')
      }

      expect(movements.apply.notCalled).toBe(true)
    }
  })

  test('createTransfer maps a foreign-key error to 400 Warehouse or Item not found', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    stubTransferRefs(movements)
    movements.findStock.onFirstCall().resolves({
      id: 'stock-a',
      warehouseId: 'warehouse-a',
      itemId: 'item-1',
      quantity: 10,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.findStock.onSecondCall().resolves(null)
    movements.apply.rejects(foreignKeyByCode())
    const service = new MovementService(movements)

    try {
      await service.createTransfer(validTransfer)
      throw new Error('expected createTransfer to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      expect((error as Error).message).toBe('Warehouse or Item not found')
    }
  })

  test('createTransfer equal to source Stock leaves source at 0', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    stubTransferRefs(movements)
    movements.findStock.onFirstCall().resolves({
      id: 'stock-a',
      warehouseId: 'warehouse-a',
      itemId: 'item-1',
      quantity: 3,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.findStock.onSecondCall().resolves(null)
    movements.apply.resolves()
    const service = new MovementService(movements)

    await service.createTransfer(validTransfer)

    expect(movements.apply.firstCall.args[1]).toEqual([
      { warehouseId: 'warehouse-a', itemId: 'item-1', quantity: 0 },
      { warehouseId: 'warehouse-b', itemId: 'item-1', quantity: 3 },
    ])
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

  const validIssue = {
    warehouseId: 'warehouse-1',
    itemId: 'item-1',
    jobId: 'job-1',
    quantity: 2,
  }

  function stubIssueRefs(movements: sinon.SinonStubbedInstance<MovementRepository>) {
    movements.existsWarehouse.resolves(true)
    movements.existsItem.resolves(true)
    movements.existsJob.resolves(true)
  }

  test('createIssue persists an issue Movement with jobId and no Job quantity', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    stubIssueRefs(movements)
    movements.findStock.resolves({
      id: 'stock-1',
      warehouseId: 'warehouse-1',
      itemId: 'item-1',
      quantity: 10,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.apply.resolves()
    const service = new MovementService(movements)

    const created = await service.createIssue(validIssue)

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.type).toBe('issue')
    expect(created.warehouseId).toBe('warehouse-1')
    expect(created.itemId).toBe('item-1')
    expect(created.jobId).toBe('job-1')
    expect(created.quantity).toBe(2)
    expect(created.toWarehouseId).toBeNull()
    expect(Object.keys(created).sort()).toEqual([
      'createdAt',
      'id',
      'itemId',
      'jobId',
      'purchaseId',
      'quantity',
      'toWarehouseId',
      'type',
      'warehouseId',
    ])
    expect(created.purchaseId).toBeNull()
    expect(movements.apply.calledOnce).toBe(true)
    expect(movements.apply.firstCall.args[0]).toEqual(created)
  })

  test('createIssue subtracts 2 from source Stock', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    stubIssueRefs(movements)
    movements.findStock.resolves({
      id: 'stock-1',
      warehouseId: 'warehouse-1',
      itemId: 'item-1',
      quantity: 10,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.apply.resolves()
    const service = new MovementService(movements)

    await service.createIssue(validIssue)

    expect(movements.apply.firstCall.args[1]).toEqual([
      { warehouseId: 'warehouse-1', itemId: 'item-1', quantity: 8 },
    ])
  })

  test('createIssue keeps Stock at 0 when the Issue empties the row', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    stubIssueRefs(movements)
    movements.findStock.resolves({
      id: 'stock-1',
      warehouseId: 'warehouse-1',
      itemId: 'item-1',
      quantity: 2,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.apply.resolves()
    const service = new MovementService(movements)

    await service.createIssue(validIssue)

    expect(movements.apply.calledOnce).toBe(true)
    expect(movements.apply.firstCall.args[1]).toEqual([
      { warehouseId: 'warehouse-1', itemId: 'item-1', quantity: 0 },
    ])
  })

  test('createIssue with missing or short source Stock throws 400 and does not call apply', async () => {
    const sources = [null, {
      id: 'stock-1',
      warehouseId: 'warehouse-1',
      itemId: 'item-1',
      quantity: 1,
      createdAt: '2026-09-12T00:00:00.000Z',
    }]

    for (const source of sources) {
      const movements = sinon.createStubInstance(MovementRepository)
      stubIssueRefs(movements)
      movements.findStock.resolves(source)
      const service = new MovementService(movements)

      try {
        await service.createIssue(validIssue)
        throw new Error('expected createIssue to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('Insufficient Stock')
      }

      expect(movements.apply.notCalled).toBe(true)
    }
  })

  test('createIssue with blank ids throws 400 and does not call apply', async () => {
    const cases = [
      { warehouseId: '', itemId: 'item-1', jobId: 'job-1', quantity: 2 },
      { warehouseId: 'warehouse-1', itemId: '', jobId: 'job-1', quantity: 2 },
      { warehouseId: 'warehouse-1', itemId: 'item-1', jobId: '', quantity: 2 },
      { warehouseId: '   ', itemId: 'item-1', jobId: 'job-1', quantity: 2 },
    ]

    for (const input of cases) {
      const movements = sinon.createStubInstance(MovementRepository)
      const service = new MovementService(movements)

      try {
        await service.createIssue(input)
        throw new Error(`expected createIssue to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe(
          'warehouseId, itemId, jobId, and a positive quantity are required',
        )
      }

      expect(movements.apply.notCalled).toBe(true)
    }
  })

  test('createIssue with invalid quantity throws 400 and does not call apply', async () => {
    const cases = [undefined, null, '2', NaN, Infinity, 0, -1]

    for (const quantity of cases) {
      const movements = sinon.createStubInstance(MovementRepository)
      const service = new MovementService(movements)

      try {
        await service.createIssue({
          warehouseId: 'warehouse-1',
          itemId: 'item-1',
          jobId: 'job-1',
          quantity,
        })
        throw new Error(`expected createIssue to throw for ${String(quantity)}`)
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('quantity must be a positive number')
      }

      expect(movements.apply.notCalled).toBe(true)
    }
  })

  test('createIssue with a missing Warehouse or Item throws 400 and does not call apply', async () => {
    const cases = [
      { warehouse: false, item: true },
      { warehouse: true, item: false },
    ]

    for (const refs of cases) {
      const movements = sinon.createStubInstance(MovementRepository)
      movements.existsWarehouse.resolves(refs.warehouse)
      movements.existsItem.resolves(refs.item)
      movements.existsJob.resolves(true)
      const service = new MovementService(movements)

      try {
        await service.createIssue(validIssue)
        throw new Error('expected createIssue to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('Warehouse or Item not found')
      }

      expect(movements.apply.notCalled).toBe(true)
    }
  })

  test('C19 createReceipt sets purchaseId null', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    movements.findStock.resolves(null)
    movements.apply.resolves()
    const service = new MovementService(movements)

    const created = await service.createReceipt(validReceipt)

    expect(created.purchaseId).toBeNull()
    expect(created.type).toBe('receipt')
    expect(movements.apply.firstCall.args[0].purchaseId).toBeNull()
  })

  test('C16 createReceiptFromPurchase persists a receipt Movement with purchaseId and adds 12.5 to Stock', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    movements.findPurchase.resolves({
      id: 'purchase-1',
      itemId: 'item-1',
      warehouseId: 'warehouse-1',
      quantity: 12.5,
    })
    movements.findStock.resolves({
      id: 'stock-1',
      warehouseId: 'warehouse-1',
      itemId: 'item-1',
      quantity: 4,
      createdAt: '2026-09-12T00:00:00.000Z',
    })
    movements.apply.resolves()
    const service = new MovementService(movements)

    const created = await service.createReceiptFromPurchase('purchase-1')

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.type).toBe('receipt')
    expect(created.itemId).toBe('item-1')
    expect(created.quantity).toBe(12.5)
    expect(created.warehouseId).toBe('warehouse-1')
    expect(created.toWarehouseId).toBeNull()
    expect(created.jobId).toBeNull()
    expect(created.purchaseId).toBe('purchase-1')
    expect(movements.apply.calledOnce).toBe(true)
    expect(movements.apply.firstCall.args[0]).toEqual(created)
    expect(movements.apply.firstCall.args[1]).toEqual([
      { warehouseId: 'warehouse-1', itemId: 'item-1', quantity: 16.5 },
    ])
  })

  test('C17 createReceiptFromPurchase maps a unique-constraint error to 409 Purchase already received', async () => {
    const unique = Object.assign(new Error('UNIQUE constraint failed: movements.purchase_id'), {
      code: 'SQLITE_CONSTRAINT_UNIQUE',
    })
    const movements = sinon.createStubInstance(MovementRepository)
    movements.findPurchase.resolves({
      id: 'purchase-1',
      itemId: 'item-1',
      warehouseId: 'warehouse-1',
      quantity: 12.5,
    })
    movements.findStock.resolves(null)
    movements.apply.rejects(unique)
    const service = new MovementService(movements)

    try {
      await service.createReceiptFromPurchase('purchase-1')
      throw new Error('expected createReceiptFromPurchase to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(409)
      expect((error as Error).message).toBe('Purchase already received')
    }
  })

  test('C18 createReceiptFromPurchase throws 404 when the Purchase is missing and does not call apply', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    movements.findPurchase.resolves(null)
    const service = new MovementService(movements)

    try {
      await service.createReceiptFromPurchase('00000000-0000-4000-8000-000000000000')
      throw new Error('expected createReceiptFromPurchase to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('Purchase not found')
    }

    expect(movements.apply.notCalled).toBe(true)
  })

  test('createIssue with a missing Job throws 400 and does not call apply', async () => {
    const movements = sinon.createStubInstance(MovementRepository)
    movements.existsWarehouse.resolves(true)
    movements.existsItem.resolves(true)
    movements.existsJob.resolves(false)
    const service = new MovementService(movements)

    try {
      await service.createIssue(validIssue)
      throw new Error('expected createIssue to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      expect((error as Error).message).toBe('Job not found')
    }

    expect(movements.apply.notCalled).toBe(true)
  })
})
