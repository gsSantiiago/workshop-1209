import { createDb } from '../db/client'
import { ItemRepository } from '../repositories/item.repository'
import { JobRepository } from '../repositories/job.repository'
import { MovementRepository } from '../repositories/movement.repository'
import { StockRepository } from '../repositories/stock.repository'
import { UserRepository } from '../repositories/user.repository'
import { WarehouseRepository } from '../repositories/warehouse.repository'
import { ItemService } from '../services/item.service'
import { MovementService } from '../services/movement.service'
import { JobService } from '../services/job.service'
import { StockService } from '../services/stock.service'
import { UserService } from '../services/user.service'
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
    tokens.jobRepository,
    (c) => new JobRepository(c.get(tokens.db)),
  )
  container.register(
    tokens.jobService,
    (c) => new JobService(c.get(tokens.jobRepository)),
  )
  container.register(
    tokens.stockRepository,
    (c) => new StockRepository(c.get(tokens.db)),
  )
  container.register(
    tokens.stockService,
    (c) => new StockService(c.get(tokens.stockRepository)),
  )
  container.register(
    tokens.userRepository,
    (c) => new UserRepository(c.get(tokens.db)),
  )
  container.register(
    tokens.userService,
    (c) => new UserService(c.get(tokens.userRepository)),
  )
  container.register(
    tokens.movementRepository,
    (c) => new MovementRepository(c.get(tokens.db)),
  )
  container.register(
    tokens.movementService,
    (c) => new MovementService(c.get(tokens.movementRepository)),
  )
}
