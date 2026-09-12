import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { StockService } from '../services/stock.service'

export async function stockRoutes(fastify: FastifyInstance) {
  const stock = container.get<StockService>(tokens.stockService)

  fastify.get('/api/stock', async () => stock.list())
}
