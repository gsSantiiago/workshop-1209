import type { FastifyInstance } from 'fastify'
import { container, tokens } from '../container/container'
import { AssignmentService } from '../services/assignment.service'

export async function assignmentRoutes(fastify: FastifyInstance) {
  const assignments = container.get<AssignmentService>(tokens.assignmentService)

  fastify.get('/api/assignments', async () => assignments.list())

  fastify.post('/api/assignments', async (request, reply) => {
    const body = (request.body ?? {}) as {
      staffId?: string
      jobId?: string
      startsOn?: string
      endsOn?: string
    }
    const assignment = await assignments.create(body)
    return reply.status(201).send(assignment)
  })

  fastify.delete('/api/assignments/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await assignments.deleteById(id)
    return reply.status(204).send()
  })
}
