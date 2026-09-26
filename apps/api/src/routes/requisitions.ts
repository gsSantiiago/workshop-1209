import type { FastifyInstance, FastifyRequest } from 'fastify'
import { container, tokens } from '../container/container'
import { RequisitionService } from '../services/requisition.service'
import { UserService } from '../services/user.service'

export async function requisitionRoutes(fastify: FastifyInstance) {
  const requisitions = container.get<RequisitionService>(tokens.requisitionService)
  const users = container.get<UserService>(tokens.userService)

  async function roleOf(request: FastifyRequest): Promise<string> {
    const user = await users.getById(request.session.userId as string)
    return user.role
  }

  fastify.get('/api/requisitions', async () => requisitions.list())

  fastify.post('/api/requisitions', async (request, reply) => {
    const body = (request.body ?? {}) as {
      itemId?: string
      jobId?: string
      quantity?: unknown
    }
    const created = await requisitions.create(await roleOf(request), body)
    return reply.status(201).send(created)
  })

  fastify.post('/api/requisitions/:id/cancel', async (request) => {
    const { id } = request.params as { id: string }
    return requisitions.cancel(await roleOf(request), id)
  })

  fastify.post('/api/requisitions/:id/convert', async (request) => {
    const { id } = request.params as { id: string }
    const body = (request.body ?? {}) as {
      supplierId?: string
      warehouseId?: string
      quantity?: unknown
    }
    return requisitions.convert(await roleOf(request), id, body)
  })

  fastify.post('/api/requisitions/:id/refuse', async (request) => {
    const { id } = request.params as { id: string }
    return requisitions.refuse(await roleOf(request), id)
  })
}
