import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { MovementService } from '../services/movement.service'
import { PurchaseService } from '../services/purchase.service'

export async function purchaseRoutes(fastify: FastifyInstance) {
  const purchases = container.get<PurchaseService>(tokens.purchaseService)
  const movements = container.get<MovementService>(tokens.movementService)

  fastify.get('/api/purchases', async () => purchases.list())

  fastify.post('/api/purchases', async (request, reply) => {
    const body = (request.body ?? {}) as {
      supplierId?: string
      itemId?: string
      warehouseId?: string
      quantity?: unknown
    }
    const purchase = await purchases.create(body)
    return reply.status(201).send(purchase)
  })

  fastify.delete('/api/purchases/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await purchases.deleteById(id)
    return reply.status(204).send()
  })

  fastify.post('/api/purchases/:id/receipts', async (request, reply) => {
    const { id } = request.params as { id: string }
    const movement = await movements.createReceiptFromPurchase(id)
    return reply.status(201).send(movement)
  })
}
