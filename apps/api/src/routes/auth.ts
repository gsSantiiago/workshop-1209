import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { UserService } from '../services/user.service'

export async function authRoutes(fastify: FastifyInstance) {
  const users = container.get<UserService>(tokens.userService)

  fastify.post('/api/login', async (request) => {
    const body = (request.body ?? {}) as { email?: string; password?: string }
    const user = await users.authenticate(body)
    request.session.userId = user.id
    return user
  })

  fastify.post('/api/logout', async (request, reply) => {
    await request.session.destroy()
    return reply.status(204).send()
  })

  fastify.get('/api/me', async (request) => {
    return users.getById(request.session.userId as string)
  })
}
