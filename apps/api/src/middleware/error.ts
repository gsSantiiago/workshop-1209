import type { FastifyInstance } from 'fastify'

function statusCodeOf(error: unknown): number {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode
  }
  return 500
}

export async function registerErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error)
    const statusCode = statusCodeOf(error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    void reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : message,
      statusCode,
    })
  })
}
