import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { MovementService } from '../services/movement.service'

export async function movementRoutes(fastify: FastifyInstance) {
  const movements = container.get<MovementService>(tokens.movementService)

  fastify.get('/api/movements', async () => movements.list())

  fastify.post('/api/receipts', async (request, reply) => {
    const body = (request.body ?? {}) as {
      warehouseId?: string
      itemId?: string
      quantity?: unknown
    }
    const movement = await movements.createReceipt(body)
    return reply.status(201).send(movement)
  })

  fastify.post('/api/transfers', async (request, reply) => {
    const body = (request.body ?? {}) as {
      fromWarehouseId?: string
      toWarehouseId?: string
      itemId?: string
      quantity?: unknown
    }
    const movement = await movements.createTransfer(body)
    return reply.status(201).send(movement)
  })

  fastify.post('/api/issues', async (request, reply) => {
    const body = (request.body ?? {}) as {
      warehouseId?: string
      itemId?: string
      jobId?: string
      quantity?: unknown
    }
    const movement = await movements.createIssue(body)
    return reply.status(201).send(movement)
  })
}
