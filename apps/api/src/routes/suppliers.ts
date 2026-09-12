import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { SupplierService } from '../services/supplier.service'

export async function supplierRoutes(fastify: FastifyInstance) {
  const suppliers = container.get<SupplierService>(tokens.supplierService)

  fastify.get('/api/suppliers', async () => suppliers.list())

  fastify.post('/api/suppliers', async (request, reply) => {
    const body = (request.body ?? {}) as { name?: string }
    const supplier = await suppliers.create(body)
    return reply.status(201).send(supplier)
  })

  fastify.delete('/api/suppliers/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await suppliers.deleteById(id)
    return reply.status(204).send()
  })
}
