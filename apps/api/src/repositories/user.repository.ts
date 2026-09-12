import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { users } from '../db/schema'

export const roles = ['Administrator', 'Operator'] as const
export type Role = (typeof roles)[number]

export type UserRecord = {
  id: string
  email: string
  role: Role
  createdAt: string
}

export type UserWithPassword = UserRecord & {
  passwordHash: string
}

export class UserRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<UserRecord[]> {
    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role as Role,
      createdAt: row.createdAt,
    }))
  }

  async create(user: UserWithPassword): Promise<void> {
    await this.db.insert(users).values({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: user.createdAt,
    })
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id })
    return deleted.length > 0
  }

  async findById(id: string): Promise<UserRecord | null> {
    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    const row = rows[0]
    if (!row) {
      return null
    }
    return {
      id: row.id,
      email: row.email,
      role: row.role as Role,
      createdAt: row.createdAt,
    }
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1)
    const row = rows[0]
    if (!row) {
      return null
    }
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as Role,
      createdAt: row.createdAt,
    }
  }
}
