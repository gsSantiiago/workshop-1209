import { createDb } from '../db/client'
import { ItemRepository } from '../repositories/item.repository'
import { StockRepository } from '../repositories/stock.repository'
import { WarehouseRepository } from '../repositories/warehouse.repository'
import { ItemService } from '../services/item.service'
import { StockService } from '../services/stock.service'
import { WarehouseService } from '../services/warehouse.service'
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
  container.register(
    tokens.warehouseRepository,
    (c) => new WarehouseRepository(c.get(tokens.db)),
  )
  container.register(
    tokens.warehouseService,
    (c) => new WarehouseService(c.get(tokens.warehouseRepository)),
  )
  container.register(
    tokens.stockRepository,
    (c) => new StockRepository(c.get(tokens.db)),
  )
  container.register(
    tokens.stockService,
    (c) => new StockService(c.get(tokens.stockRepository)),
  )
}
