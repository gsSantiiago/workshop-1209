import cors from '@fastify/cors'
import Fastify from 'fastify'
import { config } from './config/env'
import { registerServices } from './container/service-registration'
import { registerErrorHandler } from './middleware/error'
import { healthRoutes } from './routes/health'

export async function createServer() {
  registerServices()

  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  })

  await fastify.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  })

  await registerErrorHandler(fastify)
  await fastify.register(healthRoutes)

  return fastify
}

export async function startServer() {
  const fastify = await createServer()

  try {
    const address = await fastify.listen({
      host: config.HOST,
      port: config.PORT,
    })
    fastify.log.info(`Server listening at ${address}`)
    return fastify
  } catch (error) {
    fastify.log.error(error, 'Failed to start server')
    process.exit(1)
  }
}
