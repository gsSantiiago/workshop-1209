import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { WarehouseService } from '../services/warehouse.service'

export async function warehouseRoutes(fastify: FastifyInstance) {
  const warehouses = container.get<WarehouseService>(tokens.warehouseService)

  fastify.get('/api/warehouses', async () => warehouses.list())

  fastify.post('/api/warehouses', async (request, reply) => {
    const body = (request.body ?? {}) as { name?: string }
    const warehouse = await warehouses.create(body)
    return reply.status(201).send(warehouse)
  })

  fastify.delete('/api/warehouses/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await warehouses.deleteById(id)
    return reply.status(204).send()
  })
}
