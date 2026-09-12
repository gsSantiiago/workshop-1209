import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import { StockRepository, type StockRecord } from '../repositories/stock.repository'
import { StockService } from './stock.service'

describe('StockService', () => {
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
})
