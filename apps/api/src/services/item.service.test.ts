import { describe, expect, mock, test } from 'bun:test'
import { ItemService } from './item.service'

const valid = { sku: 'CEM-50', name: 'Cimento CP-II', unit: 'saco' }

describe('ItemService', () => {
  test('create with blank or whitespace sku, name, or unit throws 400 and does not call store.create', async () => {
    const cases = [
      { sku: '', name: valid.name, unit: valid.unit },
      { sku: valid.sku, name: '', unit: valid.unit },
      { sku: valid.sku, name: valid.name, unit: '' },
      { sku: '   ', name: valid.name, unit: valid.unit },
      { sku: valid.sku, name: '   ', unit: valid.unit },
      { sku: valid.sku, name: valid.name, unit: '   ' },
    ]

    for (const input of cases) {
      const create = mock(() => undefined)
      const service = new ItemService({
        list: () => [],
        create,
        deleteById: () => false,
      })

      try {
        await service.create(input)
        throw new Error(`expected create to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      }

      expect(create).not.toHaveBeenCalled()
    }
  })

  test('create trims sku, name, and unit before store.create', async () => {
    const create = mock(() => undefined)
    const service = new ItemService({
      list: () => [],
      create,
      deleteById: () => false,
    })

    await service.create({
      sku: '  CEM-50  ',
      name: '  Cimento CP-II  ',
      unit: '  saco  ',
    })

    expect(create).toHaveBeenCalledTimes(1)
    const stored = create.mock.calls[0]?.[0] as {
      sku: string
      name: string
      unit: string
    }
    expect(stored.sku).toBe('CEM-50')
    expect(stored.name).toBe('Cimento CP-II')
    expect(stored.unit).toBe('saco')
  })
})
