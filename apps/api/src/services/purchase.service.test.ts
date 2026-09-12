import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import { PurchaseRepository } from '../repositories/purchase.repository'
import { PurchaseService } from './purchase.service'

const valid = {
  supplierId: 'supplier-1',
  itemId: 'item-1',
  warehouseId: 'warehouse-1',
  quantity: 12.5,
}
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function stubRefs(purchases: sinon.SinonStubbedInstance<PurchaseRepository>) {
  purchases.existsSupplier.resolves(true)
  purchases.existsItem.resolves(true)
  purchases.existsWarehouse.resolves(true)
}

function foreignKeyByCode() {
  return Object.assign(new Error('FOREIGN KEY constraint failed'), {
    code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
  })
}

describe('PurchaseService', () => {
  test('C9 create persists UUID id, ISO-8601 createdAt, quantity 12.5, and no status', async () => {
    const purchases = sinon.createStubInstance(PurchaseRepository)
    stubRefs(purchases)
    purchases.create.resolves()
    const service = new PurchaseService(purchases)

    const created = await service.create(valid)

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.supplierId).toBe('supplier-1')
    expect(created.itemId).toBe('item-1')
    expect(created.warehouseId).toBe('warehouse-1')
    expect(created.quantity).toBe(12.5)
    expect('status' in created).toBe(false)
    expect(purchases.create.calledOnce).toBe(true)
    expect(purchases.create.firstCall.args[0]).toEqual(created)
  })

  test('C10 create with blank ids or missing quantity throws 400 and does not call repository.create', async () => {
    const cases = [
      { supplierId: '', itemId: 'item-1', warehouseId: 'warehouse-1', quantity: 12.5 },
      { supplierId: 'supplier-1', itemId: '', warehouseId: 'warehouse-1', quantity: 12.5 },
      { supplierId: 'supplier-1', itemId: 'item-1', warehouseId: '', quantity: 12.5 },
      { supplierId: '   ', itemId: 'item-1', warehouseId: 'warehouse-1', quantity: 12.5 },
      { supplierId: 'supplier-1', itemId: '   ', warehouseId: 'warehouse-1', quantity: 12.5 },
      { supplierId: 'supplier-1', itemId: 'item-1', warehouseId: '   ', quantity: 12.5 },
      { supplierId: 'supplier-1', itemId: 'item-1', warehouseId: 'warehouse-1' },
    ]

    for (const input of cases) {
      const purchases = sinon.createStubInstance(PurchaseRepository)
      const service = new PurchaseService(purchases)

      try {
        await service.create(input)
        throw new Error(`expected create to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe(
          'supplierId, itemId, warehouseId, and a positive quantity are required',
        )
      }

      expect(purchases.create.notCalled).toBe(true)
    }
  })

  test('C11 create with quantity 0, -1, NaN or Infinity throws 400 and does not call repository.create', async () => {
    for (const quantity of [0, -1, NaN, Infinity]) {
      const purchases = sinon.createStubInstance(PurchaseRepository)
      const service = new PurchaseService(purchases)

      try {
        await service.create({ ...valid, quantity })
        throw new Error(`expected create to throw for ${String(quantity)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('quantity must be a positive number')
      }

      expect(purchases.create.notCalled).toBe(true)
    }
  })

  test('C12 create with a missing Supplier, Item, or Warehouse throws 400 and does not call repository.create', async () => {
    const cases = [
      { supplier: false, item: true, warehouse: true },
      { supplier: true, item: false, warehouse: true },
      { supplier: true, item: true, warehouse: false },
    ]

    for (const refs of cases) {
      const purchases = sinon.createStubInstance(PurchaseRepository)
      purchases.existsSupplier.resolves(refs.supplier)
      purchases.existsItem.resolves(refs.item)
      purchases.existsWarehouse.resolves(refs.warehouse)
      const service = new PurchaseService(purchases)

      try {
        await service.create(valid)
        throw new Error('expected create to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('Supplier, Item, or Warehouse not found')
      }

      expect(purchases.create.notCalled).toBe(true)
    }
  })

  test('C13 deleteById succeeds when the repository deletes the row', async () => {
    const purchases = sinon.createStubInstance(PurchaseRepository)
    purchases.deleteById.resolves(true)
    const service = new PurchaseService(purchases)
    await service.deleteById('purchase-1')
    expect(purchases.deleteById.calledOnceWith('purchase-1')).toBe(true)
  })

  test('C14 deleteById maps a foreign-key error to 409 Purchase has Movement', async () => {
    const purchases = sinon.createStubInstance(PurchaseRepository)
    purchases.deleteById.rejects(foreignKeyByCode())
    const service = new PurchaseService(purchases)

    try {
      await service.deleteById('purchase-1')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(409)
      expect((error as Error).message).toBe('Purchase has Movement')
    }
  })

  test('C15 deleteById throws 404 when the repository deletes nothing', async () => {
    const purchases = sinon.createStubInstance(PurchaseRepository)
    purchases.deleteById.resolves(false)
    const service = new PurchaseService(purchases)

    try {
      await service.deleteById('missing')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('Purchase not found')
    }
  })
})
