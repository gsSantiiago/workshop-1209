import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { StockService } from '../services/stock.service'

export async function stockRoutes(fastify: FastifyInstance) {
  const stock = container.get<StockService>(tokens.stockService)

  fastify.get('/api/stock', async () => stock.list())

  fastify.post('/api/stock', async (request, reply) => {
    const body = (request.body ?? {}) as {
      warehouseId?: string
      itemId?: string
      quantity?: unknown
    }
    const row = await stock.create(body)
    return reply.status(201).send(row)
  })

  fastify.delete('/api/stock/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await stock.deleteById(id)
    return reply.status(204).send()
  })
}
