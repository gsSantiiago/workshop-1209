import { startServer } from './server'

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
  process.exit(1)
})

async function main() {
  const server = await startServer()

  const shutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, shutting down`)
    try {
      await server.close()
      process.exit(0)
    } catch (error) {
      server.log.error(error, 'Error during shutdown')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
