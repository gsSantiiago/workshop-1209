import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import { ItemRepository, type ItemRecord } from '../repositories/item.repository'
import { ItemService } from './item.service'

const valid = { sku: 'CEM-50', name: 'Cimento CP-II', unit: 'saco' }
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function uniqueByCode() {
  return Object.assign(new Error('UNIQUE constraint failed: items.sku'), {
    code: 'SQLITE_CONSTRAINT_UNIQUE',
  })
}

function uniqueByMessage() {
  return new Error('UNIQUE constraint failed: items.sku')
}

function uniqueByCause() {
  return Object.assign(new Error('wrapped'), { cause: uniqueByCode() })
}

describe('ItemService', () => {
  test('create with blank or whitespace sku, name, or unit throws 400 and does not call repository.create', async () => {
    const cases = [
      { sku: '', name: valid.name, unit: valid.unit },
      { sku: valid.sku, name: '', unit: valid.unit },
      { sku: valid.sku, name: valid.name, unit: '' },
      { sku: '   ', name: valid.name, unit: valid.unit },
      { sku: valid.sku, name: '   ', unit: valid.unit },
      { sku: valid.sku, name: valid.name, unit: '   ' },
    ]

    for (const input of cases) {
      const items = sinon.createStubInstance(ItemRepository)
      const service = new ItemService(items)

      try {
        await service.create(input)
        throw new Error(`expected create to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      }

      expect(items.create.notCalled).toBe(true)
    }
  })

  test('create trims sku, name, and unit before repository.create', async () => {
    const items = sinon.createStubInstance(ItemRepository)
    items.create.resolves()
    const service = new ItemService(items)

    await service.create({
      sku: '  CEM-50  ',
      name: '  Cimento CP-II  ',
      unit: '  saco  ',
    })

    expect(items.create.calledOnce).toBe(true)
    const stored = items.create.firstCall.args[0]
    expect(stored.sku).toBe('CEM-50')
    expect(stored.name).toBe('Cimento CP-II')
    expect(stored.unit).toBe('saco')
  })

  test('create persists a UUID id, ISO-8601 createdAt, and returns that record', async () => {
    const items = sinon.createStubInstance(ItemRepository)
    items.create.resolves()
    const service = new ItemService(items)

    const created = await service.create(valid)

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.sku).toBe('CEM-50')
    expect(items.create.firstCall.args[0]).toEqual(created)
  })

  test('create maps a unique-constraint error to 409', async () => {
    const errors = [uniqueByCode(), uniqueByMessage(), uniqueByCause()]

    for (const thrown of errors) {
      const items = sinon.createStubInstance(ItemRepository)
      items.create.rejects(thrown)
      const service = new ItemService(items)

      try {
        await service.create(valid)
        throw new Error('expected create to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(409)
        expect((error as Error).message).toBe('SKU already exists')
      }
    }
  })

  test('create rethrows errors that are not unique violations', async () => {
    const boom = new Error('disk full')
    const items = sinon.createStubInstance(ItemRepository)
    items.create.rejects(boom)
    const service = new ItemService(items)

    try {
      await service.create(valid)
      throw new Error('expected create to throw')
    } catch (error) {
      expect(error).toBe(boom)
    }
  })

  test('list returns whatever the repository lists', async () => {
    const rows: ItemRecord[] = [
      { id: '1', sku: 'CEM-50', name: 'Cimento CP-II', unit: 'saco', createdAt: '2026-09-07T00:00:00.000Z' },
    ]
    const items = sinon.createStubInstance(ItemRepository)
    items.list.resolves(rows)
    const service = new ItemService(items)
    expect(await service.list()).toBe(rows)
  })

  test('deleteById succeeds when the repository deletes the row', async () => {
    const items = sinon.createStubInstance(ItemRepository)
    items.deleteById.resolves(true)
    const service = new ItemService(items)
    await service.deleteById('item-1')
    expect(items.deleteById.calledOnceWith('item-1')).toBe(true)
  })

  test('deleteById throws 404 when the repository deletes nothing', async () => {
    const items = sinon.createStubInstance(ItemRepository)
    items.deleteById.resolves(false)
    const service = new ItemService(items)

    try {
      await service.deleteById('missing')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('Item not found')
    }
  })
})
