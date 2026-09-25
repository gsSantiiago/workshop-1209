import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Database } from 'bun:sqlite'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { login } from './login'

const dbDir = mkdtempSync(join(tmpdir(), 'fake-erp-staff-'))
const dbFile = join(dbDir, 'test.sqlite')
Bun.env.DB_FILE_NAME = dbFile
Bun.env.LOG_LEVEL = 'silent'

const { container } = await import('../src/container/container')
const { createServer } = await import('../src/server')

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const operator = { email: 'op-staff@local', password: 'secret', role: 'Operator' }

function clearTables() {
  const sqlite = new Database(dbFile)
  sqlite.exec('DELETE FROM assignments')
  sqlite.exec('DELETE FROM staff')
  sqlite.exec('DELETE FROM jobs')
  sqlite.close()
}

describe('staff HTTP', () => {
  let app: Awaited<ReturnType<typeof createServer>>
  let cookie = ''

  beforeAll(async () => {
    container.clear()
    app = await createServer()
    cookie = (await login(app)).cookie
  })

  function request(opts: { method: string; url: string; payload?: unknown }) {
    return app.inject({
      ...opts,
      headers: { cookie },
    })
  }

  beforeEach(() => {
    clearTables()
  })

  afterAll(async () => {
    await app.close()
    container.clear()
  })

  test('C1 POST /api/staff creates Staff without User fields', async () => {
    const response = await request({
      method: 'POST',
      url: '/api/staff',
      payload: { name: '  Ana  ' },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as Record<string, unknown>
    expect(body.id).toMatch(UUID)
    expect(body.name).toBe('Ana')
    expect(body.createdAt).toMatch(ISO_8601)
    expect(body).not.toHaveProperty('userId')
    expect(body).not.toHaveProperty('email')
    expect(body).not.toHaveProperty('password')
    expect(body).not.toHaveProperty('passwordHash')
    expect(body).not.toHaveProperty('role')
    expect(Object.keys(body).sort()).toEqual(['createdAt', 'id', 'name'])
  })

  test('C2 GET /api/staff on empty table returns 200 []', async () => {
    const response = await request({ method: 'GET', url: '/api/staff' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  test('C3 POST /api/staff with blank or whitespace name returns 400 and does not persist', async () => {
    for (const name of ['', '   ']) {
      clearTables()

      const response = await request({
        method: 'POST',
        url: '/api/staff',
        payload: { name },
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        error: 'name is required',
        statusCode: 400,
      })

      const list = await request({ method: 'GET', url: '/api/staff' })
      expect(list.json()).toEqual([])
    }
  })

  test('C4 POST /api/staff duplicate name returns 409 and the unique on name holds', async () => {
    const first = await request({
      method: 'POST',
      url: '/api/staff',
      payload: { name: 'Ana' },
    })
    expect(first.statusCode).toBe(201)

    const second = await request({
      method: 'POST',
      url: '/api/staff',
      payload: { name: 'Ana' },
    })
    expect(second.statusCode).toBe(409)
    expect(second.json()).toEqual({
      error: 'Staff already exists',
      statusCode: 409,
    })

    const list = await request({ method: 'GET', url: '/api/staff' })
    const rows = list.json() as { name: string }[]
    expect(rows.filter((row) => row.name === 'Ana')).toHaveLength(1)

    const sqlite = new Database(dbFile)
    const indexes = sqlite.query('PRAGMA index_list(staff)').all() as {
      name: string
      unique: number
    }[]
    sqlite.close()
    expect(indexes.some((index) => index.name === 'staff_name_unique' && index.unique === 1)).toBe(
      true,
    )
  })

  test('C5 DELETE /api/staff/:id returns 204 and removes the Staff', async () => {
    const created = await request({
      method: 'POST',
      url: '/api/staff',
      payload: { name: 'Ana' },
    })
    const { id } = created.json() as { id: string }

    const deleted = await request({ method: 'DELETE', url: `/api/staff/${id}` })
    expect(deleted.statusCode).toBe(204)

    const list = await request({ method: 'GET', url: '/api/staff' })
    const rows = list.json() as { id: string }[]
    expect(rows.find((row) => row.id === id)).toBeUndefined()
  })

  test('C6 DELETE /api/staff/:id missing id returns 404', async () => {
    const response = await request({
      method: 'DELETE',
      url: '/api/staff/00000000-0000-4000-8000-000000000000',
    })
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      error: 'Staff not found',
      statusCode: 404,
    })
  })

  test('C7 Operator creates Staff', async () => {
    const createdUser = await request({
      method: 'POST',
      url: '/api/users',
      payload: operator,
    })
    expect(createdUser.statusCode).toBe(201)

    const signedIn = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { email: operator.email, password: operator.password },
    })
    expect(signedIn.statusCode).toBe(200)
    const operatorCookie = signedIn.cookies
      .map((entry) => `${entry.name}=${entry.value}`)
      .join('; ')

    const response = await app.inject({
      method: 'POST',
      url: '/api/staff',
      headers: { cookie: operatorCookie },
      payload: { name: 'Ana' },
    })
    expect(response.statusCode).toBe(201)
    expect((response.json() as { name: string }).name).toBe('Ana')
  })

  test('C18 DELETE /api/staff/:id with Assignment returns 409 and keeps Staff', async () => {
    const staff = (
      await request({ method: 'POST', url: '/api/staff', payload: { name: 'Ana' } })
    ).json() as { id: string }
    const job = (
      await request({ method: 'POST', url: '/api/jobs', payload: { name: 'Site A' } })
    ).json() as { id: string }
    const assignment = await request({
      method: 'POST',
      url: '/api/assignments',
      payload: {
        staffId: staff.id,
        jobId: job.id,
        startsOn: '2026-09-01',
        endsOn: '2026-09-30',
      },
    })
    expect(assignment.statusCode).toBe(201)

    const response = await request({ method: 'DELETE', url: `/api/staff/${staff.id}` })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      error: 'Staff has Assignment',
      statusCode: 409,
    })

    const list = (await request({ method: 'GET', url: '/api/staff' })).json() as { id: string }[]
    expect(list.some((row) => row.id === staff.id)).toBe(true)
  })

  test('C21 staff and assignment routes without a session return 401', async () => {
    const routes = [
      { method: 'GET', url: '/api/staff' },
      { method: 'POST', url: '/api/staff' },
      { method: 'DELETE', url: '/api/staff/00000000-0000-4000-8000-000000000000' },
      { method: 'GET', url: '/api/assignments' },
      { method: 'POST', url: '/api/assignments' },
      { method: 'DELETE', url: '/api/assignments/00000000-0000-4000-8000-000000000000' },
    ]

    for (const route of routes) {
      const response = await app.inject(route)
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({
        error: 'Unauthorized',
        statusCode: 401,
      })
    }
  })
})
