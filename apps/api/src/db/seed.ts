import { users } from './schema'
import type { AppDatabase } from './client'

export const SEED_ADMINISTRATOR = {
  email: 'admin@local',
  password: 'admin',
  role: 'Administrator',
} as const

export async function seedAdministratorIfEmpty(db: AppDatabase): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1)
  if (existing.length > 0) {
    return
  }

  await db.insert(users).values({
    id: crypto.randomUUID(),
    email: SEED_ADMINISTRATOR.email,
    passwordHash: await Bun.password.hash(SEED_ADMINISTRATOR.password),
    role: SEED_ADMINISTRATOR.role,
    createdAt: new Date().toISOString(),
  })
}
