import type { FastifyInstance } from 'fastify'
import { SEED_ADMINISTRATOR } from '../src/db/seed'

export async function login(app: FastifyInstance): Promise<{ cookie: string }> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/login',
    payload: {
      email: SEED_ADMINISTRATOR.email,
      password: SEED_ADMINISTRATOR.password,
    },
  })
  if (response.statusCode !== 200) {
    throw new Error(`login failed: ${response.statusCode} ${response.body}`)
  }
  const cookie = response.cookies
    .map((entry) => `${entry.name}=${entry.value}`)
    .join('; ')
  return { cookie }
}
