import type { FastifyInstance, FastifyRequest } from 'fastify'

function isPublic(request: FastifyRequest): boolean {
  const url = request.url.split('?')[0]
  if (request.method === 'GET' && url === '/health') {
    return true
  }
  if (request.method === 'POST' && url === '/api/login') {
    return true
  }
  return false
}

function unauthorized(): Error {
  const error = new Error('Unauthorized') as Error & { statusCode: number }
  error.statusCode = 401
  return error
}

export async function registerAuth(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request) => {
    if (isPublic(request)) {
      return
    }
    if (!request.session.userId) {
      throw unauthorized()
    }
  })
}
