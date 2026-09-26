import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import type { PurchaseRecord } from '../repositories/purchase.repository'
import { RequisitionRepository, type RequisitionRecord } from '../repositories/requisition.repository'
import { RequisitionService } from './requisition.service'

const open: RequisitionRecord = {
  id: 'req-1',
  itemId: 'item-1',
  jobId: 'job-1',
  quantity: 12.5,
  status: 'open',
  purchaseId: null,
  createdAt: '2026-09-26T00:00:00.000Z',
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function ready(requisitions: sinon.SinonStubbedInstance<RequisitionRepository>) {
  requisitions.existsItem.resolves(true)
  requisitions.existsJob.resolves(true)
  requisitions.existsSupplier.resolves(true)
  requisitions.existsWarehouse.resolves(true)
  requisitions.create.resolves()
}

describe('RequisitionService', () => {
  test('create persists an open row and does not copy a caller id', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    ready(requisitions)
    const service = new RequisitionService(requisitions)

    const created = await service.create('Operator', {
      itemId: 'item-1',
      jobId: 'job-1',
      quantity: 12.5,
    })

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.itemId).toBe('item-1')
    expect(created.jobId).toBe('job-1')
    expect(created.quantity).toBe(12.5)
    expect(created.status).toBe('open')
    expect(created.purchaseId).toBeNull()
    expect(Object.keys(created).sort()).toEqual([
      'createdAt',
      'id',
      'itemId',
      'jobId',
      'purchaseId',
      'quantity',
      'status',
    ])
    expect(requisitions.create.calledOnce).toBe(true)
    expect(requisitions.create.firstCall.args[0]).toEqual(created)
  })

  test('criterion 6: Administrator create returns 403 before the repository is read', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    const service = new RequisitionService(requisitions)

    try {
      await service.create('Administrator', {
        itemId: 'missing-item',
        jobId: 'job-1',
        quantity: 12.5,
      })
      throw new Error('expected create to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(403)
      expect((error as Error).message).toBe('Forbidden')
    }

    expect(requisitions.existsItem.notCalled).toBe(true)
    expect(requisitions.existsJob.notCalled).toBe(true)
    expect(requisitions.create.notCalled).toBe(true)
  })

  test('criterion 8: Administrator cancel returns 403 before the repository is read', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    const service = new RequisitionService(requisitions)

    try {
      await service.cancel('Administrator', 'missing')
      throw new Error('expected cancel to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(403)
      expect((error as Error).message).toBe('Forbidden')
    }

    expect(requisitions.cancelIfOpen.notCalled).toBe(true)
    expect(requisitions.findById.notCalled).toBe(true)
  })

  test('criterion 25: Operator convert returns 403 before the repository is read', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    const service = new RequisitionService(requisitions)

    try {
      await service.convert('Operator', 'missing', {
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        quantity: 1,
      })
      throw new Error('expected convert to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(403)
      expect((error as Error).message).toBe('Forbidden')
    }

    expect(requisitions.findById.notCalled).toBe(true)
    expect(requisitions.convertIfOpen.notCalled).toBe(true)
  })

  test('criterion 35: Operator refuse returns 403 before the repository is read', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    const service = new RequisitionService(requisitions)

    try {
      await service.refuse('Operator', 'missing')
      throw new Error('expected refuse to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(403)
      expect((error as Error).message).toBe('Forbidden')
    }

    expect(requisitions.refuseIfOpen.notCalled).toBe(true)
    expect(requisitions.findById.notCalled).toBe(true)
  })

  test('convert copies the Requisition quantity and ignores the body quantity', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    ready(requisitions)
    requisitions.findById.resolves(open)
    const converted: RequisitionRecord = {
      ...open,
      status: 'converted',
      purchaseId: 'purchase-1',
    }
    requisitions.convertIfOpen.returns(converted)
    const service = new RequisitionService(requisitions)

    const result = await service.convert('Administrator', open.id, {
      supplierId: '  supplier-1  ',
      warehouseId: 'warehouse-1',
      quantity: 1,
    })

    expect(result).toEqual(converted)
    expect(requisitions.convertIfOpen.calledOnce).toBe(true)
    const purchase = requisitions.convertIfOpen.firstCall.args[1] as PurchaseRecord
    expect(purchase.quantity).toBe(12.5)
    expect(purchase.itemId).toBe('item-1')
    expect(purchase.supplierId).toBe('supplier-1')
    expect(purchase.warehouseId).toBe('warehouse-1')
    expect('jobId' in purchase).toBe(false)
  })

  test('convert returns 409 when the row is no longer open and leaves convertIfOpen as the loser', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    ready(requisitions)
    requisitions.findById.resolves(open)
    requisitions.convertIfOpen.returns('not-open')
    const service = new RequisitionService(requisitions)

    try {
      await service.convert('Administrator', open.id, {
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        quantity: 1,
      })
      throw new Error('expected convert to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(409)
      expect((error as Error).message).toBe('Requisition is not open')
    }

    expect(requisitions.convertIfOpen.calledOnce).toBe(true)
  })

  test('cancel returns 409 when cancelIfOpen reports the row is not open', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    requisitions.cancelIfOpen.resolves('not-open')
    const service = new RequisitionService(requisitions)

    try {
      await service.cancel('Operator', open.id)
      throw new Error('expected cancel to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(409)
      expect((error as Error).message).toBe('Requisition is not open')
    }
  })

  test('refuse returns 409 when refuseIfOpen reports the row is not open', async () => {
    const requisitions = sinon.createStubInstance(RequisitionRepository)
    requisitions.refuseIfOpen.resolves('not-open')
    const service = new RequisitionService(requisitions)

    try {
      await service.refuse('Administrator', open.id)
      throw new Error('expected refuse to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(409)
      expect((error as Error).message).toBe('Requisition is not open')
    }
  })
})
