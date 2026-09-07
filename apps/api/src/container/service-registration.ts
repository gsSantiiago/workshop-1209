import { createDb } from '../db/client'
import { ItemRepository } from '../repositories/item.repository'
import { ItemService } from '../services/item.service'
import { container, tokens } from './container'

export function registerServices(): void {
  container.register(tokens.db, () => createDb())
  container.register(
    tokens.itemRepository,
    (c) => new ItemRepository(c.get(tokens.db)),
  )
  container.register(
    tokens.itemService,
    (c) => new ItemService(c.get(tokens.itemRepository)),
  )
}
