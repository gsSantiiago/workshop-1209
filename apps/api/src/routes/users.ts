import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { UserService } from '../services/user.service'

export async function userRoutes(fastify: FastifyInstance) {
  const users = container.get<UserService>(tokens.userService)

  fastify.get('/api/users', async () => users.list())

  fastify.post('/api/users', async (request, reply) => {
    const body = (request.body ?? {}) as {
      email?: string
      password?: string
      role?: string
    }
    const user = await users.create(body)
    return reply.status(201).send(user)
  })

  fastify.delete('/api/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await users.deleteById(id)
    return reply.status(204).send()
  })
}
