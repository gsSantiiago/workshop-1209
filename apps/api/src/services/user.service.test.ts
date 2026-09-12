import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import {
  UserRepository,
  type UserRecord,
  type UserWithPassword,
} from '../repositories/user.repository'
import { UserService } from './user.service'

const valid = { email: 'op@local', password: 'secret', role: 'Operator' }
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function uniqueByCode() {
  return Object.assign(new Error('UNIQUE constraint failed: users.email'), {
    code: 'SQLITE_CONSTRAINT_UNIQUE',
  })
}

function uniqueByMessage() {
  return new Error('UNIQUE constraint failed: users.email')
}

function uniqueByCause() {
  return Object.assign(new Error('wrapped'), { cause: uniqueByCode() })
}

describe('UserService', () => {
  test('create with blank email, password, or role throws 400 and does not call repository.create', async () => {
    const cases = [
      { email: '', password: valid.password, role: valid.role },
      { email: '   ', password: valid.password, role: valid.role },
      { email: valid.email, password: '', role: valid.role },
      { email: valid.email, password: valid.password, role: '' },
      { email: valid.email, password: valid.password, role: '   ' },
      { email: valid.email, password: valid.password, role: 'Admin' },
      { email: valid.email, password: valid.password, role: 'administrator' },
    ]

    for (const input of cases) {
      const users = sinon.createStubInstance(UserRepository)
      const service = new UserService(users)

      try {
        await service.create(input)
        throw new Error(`expected create to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      }

      expect(users.create.notCalled).toBe(true)
    }
  })

  test('create trims and lowercases email and does not store the plaintext password', async () => {
    const users = sinon.createStubInstance(UserRepository)
    users.create.resolves()
    const service = new UserService(users)

    const created = await service.create({
      email: '  OP@Local  ',
      password: 'secret',
      role: 'Operator',
    })

    expect(users.create.calledOnce).toBe(true)
    const stored = users.create.firstCall.args[0]
    expect(stored.email).toBe('op@local')
    expect(stored.passwordHash).not.toBe('secret')
    expect(stored.passwordHash.length).toBeGreaterThan(0)
    expect(created).toEqual({
      id: stored.id,
      email: 'op@local',
      role: 'Operator',
      createdAt: stored.createdAt,
    })
    expect('passwordHash' in created).toBe(false)
  })

  test('create persists a UUID id, ISO-8601 createdAt, and returns that record without the hash', async () => {
    const users = sinon.createStubInstance(UserRepository)
    users.create.resolves()
    const service = new UserService(users)

    const created = await service.create(valid)

    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO_8601)
    expect(created.email).toBe('op@local')
    expect(created.role).toBe('Operator')
    expect(users.create.firstCall.args[0]).toMatchObject({
      id: created.id,
      email: created.email,
      role: created.role,
      createdAt: created.createdAt,
    })
  })

  test('create maps a unique-constraint error to 409', async () => {
    const errors = [uniqueByCode(), uniqueByMessage(), uniqueByCause()]

    for (const thrown of errors) {
      const users = sinon.createStubInstance(UserRepository)
      users.create.rejects(thrown)
      const service = new UserService(users)

      try {
        await service.create(valid)
        throw new Error('expected create to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(409)
        expect((error as Error).message).toBe('Email already exists')
      }
    }
  })

  test('create rethrows errors that are not unique violations', async () => {
    const boom = new Error('disk full')
    const users = sinon.createStubInstance(UserRepository)
    users.create.rejects(boom)
    const service = new UserService(users)

    try {
      await service.create(valid)
      throw new Error('expected create to throw')
    } catch (error) {
      expect(error).toBe(boom)
    }
  })

  test('list returns whatever the repository lists', async () => {
    const rows: UserRecord[] = [
      {
        id: '1',
        email: 'admin@local',
        role: 'Administrator',
        createdAt: '2026-09-07T00:00:00.000Z',
      },
    ]
    const users = sinon.createStubInstance(UserRepository)
    users.list.resolves(rows)
    const service = new UserService(users)
    expect(await service.list()).toBe(rows)
  })

  test('getById returns the user when the repository finds it', async () => {
    const row: UserRecord = {
      id: 'user-1',
      email: 'op@local',
      role: 'Operator',
      createdAt: '2026-09-07T00:00:00.000Z',
    }
    const users = sinon.createStubInstance(UserRepository)
    users.findById.resolves(row)
    const service = new UserService(users)
    expect(await service.getById('user-1')).toBe(row)
    expect(users.findById.calledOnceWith('user-1')).toBe(true)
  })

  test('getById throws 404 when the repository finds nothing', async () => {
    const users = sinon.createStubInstance(UserRepository)
    users.findById.resolves(null)
    const service = new UserService(users)

    try {
      await service.getById('missing')
      throw new Error('expected getById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('User not found')
    }
  })

  test('deleteById succeeds when the repository deletes the row', async () => {
    const users = sinon.createStubInstance(UserRepository)
    users.deleteById.resolves(true)
    const service = new UserService(users)
    await service.deleteById('user-1')
    expect(users.deleteById.calledOnceWith('user-1')).toBe(true)
  })

  test('deleteById throws 404 when the repository deletes nothing', async () => {
    const users = sinon.createStubInstance(UserRepository)
    users.deleteById.resolves(false)
    const service = new UserService(users)

    try {
      await service.deleteById('missing')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('User not found')
    }
  })

  test('authenticate returns the public user when email and password match', async () => {
    const stored: UserWithPassword = {
      id: 'user-1',
      email: 'admin@local',
      passwordHash: await Bun.password.hash('admin'),
      role: 'Administrator',
      createdAt: '2026-09-07T00:00:00.000Z',
    }
    const users = sinon.createStubInstance(UserRepository)
    users.findByEmail.resolves(stored)
    const service = new UserService(users)

    const user = await service.authenticate({
      email: '  Admin@Local  ',
      password: 'admin',
    })

    expect(users.findByEmail.calledOnceWith('admin@local')).toBe(true)
    expect(user).toEqual({
      id: stored.id,
      email: stored.email,
      role: stored.role,
      createdAt: stored.createdAt,
    })
    expect('passwordHash' in user).toBe(false)
  })

  test('authenticate throws 401 when the user is missing', async () => {
    const users = sinon.createStubInstance(UserRepository)
    users.findByEmail.resolves(null)
    const service = new UserService(users)

    try {
      await service.authenticate({ email: 'nobody@local', password: 'admin' })
      throw new Error('expected authenticate to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(401)
      expect((error as Error).message).toBe('Invalid credentials')
    }
  })

  test('authenticate throws 401 when the password is wrong', async () => {
    const users = sinon.createStubInstance(UserRepository)
    users.findByEmail.resolves({
      id: 'user-1',
      email: 'admin@local',
      passwordHash: await Bun.password.hash('admin'),
      role: 'Administrator',
      createdAt: '2026-09-07T00:00:00.000Z',
    })
    const service = new UserService(users)

    try {
      await service.authenticate({ email: 'admin@local', password: 'nope' })
      throw new Error('expected authenticate to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(401)
      expect((error as Error).message).toBe('Invalid credentials')
    }
  })

  test('authenticate throws 401 for blank email or password and does not look up', async () => {
    for (const input of [
      { email: '', password: 'admin' },
      { email: '   ', password: 'admin' },
      { email: 'admin@local', password: '' },
    ]) {
      const users = sinon.createStubInstance(UserRepository)
      const service = new UserService(users)

      try {
        await service.authenticate(input)
        throw new Error(`expected authenticate to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(401)
        expect((error as Error).message).toBe('Invalid credentials')
      }

      expect(users.findByEmail.notCalled).toBe(true)
    }
  })
})
