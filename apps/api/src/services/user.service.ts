import {
  roles,
  UserRepository,
  type Role,
  type UserRecord,
  type UserWithPassword,
} from '../repositories/user.repository'

export type UserInput = {
  email?: string
  password?: string
  role?: string
}

export type LoginInput = {
  email?: string
  password?: string
}

export class UserService {
  constructor(private readonly users: UserRepository) {}

  list(): Promise<UserRecord[]> | UserRecord[] {
    return this.users.list()
  }

  async getById(id: string): Promise<UserRecord> {
    const user = await this.users.findById(id)
    if (!user) {
      throw httpError('User not found', 404)
    }
    return user
  }

  async create(input: UserInput): Promise<UserRecord> {
    const email = input.email?.trim().toLowerCase() ?? ''
    const password = input.password ?? ''
    const role = input.role?.trim() ?? ''
    if (!email || !password || !isRole(role)) {
      throw httpError('email, password, and role are required', 400)
    }

    const user: UserWithPassword = {
      id: crypto.randomUUID(),
      email,
      passwordHash: await Bun.password.hash(password),
      role,
      createdAt: new Date().toISOString(),
    }

    try {
      await this.users.create(user)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw httpError('Email already exists', 409)
      }
      throw error
    }

    return toPublic(user)
  }

  async authenticate(input: LoginInput): Promise<UserRecord> {
    const email = input.email?.trim().toLowerCase() ?? ''
    const password = input.password ?? ''
    if (!email || !password) {
      throw httpError('Invalid credentials', 401)
    }

    const found = await this.users.findByEmail(email)
    if (!found || !(await Bun.password.verify(password, found.passwordHash))) {
      throw httpError('Invalid credentials', 401)
    }

    return toPublic(found)
  }

  async deleteById(id: string): Promise<void> {
    const deleted = await this.users.deleteById(id)
    if (!deleted) {
      throw httpError('User not found', 404)
    }
  }
}

function toPublic(user: UserWithPassword): UserRecord {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}

function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value)
}

function httpError(message: string, statusCode: number): Error {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = statusCode
  return error
}

function isUniqueViolation(error: unknown): boolean {
  return constraintFailed(error, 'SQLITE_CONSTRAINT_UNIQUE', 'UNIQUE constraint failed')
}

function constraintFailed(error: unknown, code: string, message: string): boolean {
  let current: unknown = error
  while (current && typeof current === 'object') {
    if ('code' in current && current.code === code) {
      return true
    }
    if (
      'message' in current &&
      typeof current.message === 'string' &&
      current.message.includes(message)
    ) {
      return true
    }
    current = 'cause' in current ? current.cause : undefined
  }
  return false
}
