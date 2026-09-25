import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Database } from 'bun:sqlite'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { login } from './login'

const dbDir = mkdtempSync(join(tmpdir(), 'fake-erp-assignments-'))
const dbFile = join(dbDir, 'test.sqlite')
Bun.env.DB_FILE_NAME = dbFile
Bun.env.LOG_LEVEL = 'silent'

const { container } = await import('../src/container/container')
const { createServer } = await import('../src/server')

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const operator = { email: 'op-assign@local', password: 'secret', role: 'Operator' }

function clearTables() {
  const sqlite = new Database(dbFile)
  sqlite.exec('DELETE FROM assignments')
  sqlite.exec('DELETE FROM staff')
  sqlite.exec('DELETE FROM movements')
  sqlite.exec('DELETE FROM stock')
  sqlite.exec('DELETE FROM jobs')
  sqlite.exec('DELETE FROM warehouses')
  sqlite.exec('DELETE FROM items')
  sqlite.close()
}

describe('assignments HTTP', () => {
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

  async function seedRefs() {
    const staff = (
      await request({ method: 'POST', url: '/api/staff', payload: { name: 'Ana' } })
    ).json() as { id: string; name: string }
    const job = (
      await request({ method: 'POST', url: '/api/jobs', payload: { name: 'Site A' } })
    ).json() as { id: string; name: string }
    return { staff, job }
  }

  beforeEach(() => {
    clearTables()
  })

  afterAll(async () => {
    await app.close()
    container.clear()
  })

  test('C8 POST /api/assignments creates Assignment including same-day period without writing Stock or Movement', async () => {
    const { staff, job } = await seedRefs()
    const stockBefore = (await request({ method: 'GET', url: '/api/stock' })).json()
    const movementsBefore = (await request({ method: 'GET', url: '/api/movements' })).json()

    const ranged = await request({
      method: 'POST',
      url: '/api/assignments',
      payload: {
        staffId: staff.id,
        jobId: job.id,
        startsOn: '2026-09-01',
        endsOn: '2026-09-30',
      },
    })
    expect(ranged.statusCode).toBe(201)
    const rangedBody = ranged.json() as Record<string, unknown>
    expect(rangedBody.id).toMatch(UUID)
    expect(rangedBody.staffId).toBe(staff.id)
    expect(rangedBody.jobId).toBe(job.id)
    expect(rangedBody.startsOn).toBe('2026-09-01')
    expect(rangedBody.endsOn).toBe('2026-09-30')
    expect(rangedBody.createdAt).toMatch(ISO_8601)

    const sameDay = await request({
      method: 'POST',
      url: '/api/assignments',
      payload: {
        staffId: staff.id,
        jobId: job.id,
        startsOn: '2026-10-01',
        endsOn: '2026-10-01',
      },
    })
    expect(sameDay.statusCode).toBe(201)
    const sameDayBody = sameDay.json() as Record<string, unknown>
    expect(sameDayBody.startsOn).toBe('2026-10-01')
    expect(sameDayBody.endsOn).toBe('2026-10-01')
    expect(sameDayBody.createdAt).toMatch(ISO_8601)

    expect((await request({ method: 'GET', url: '/api/stock' })).json()).toEqual(stockBefore)
    expect((await request({ method: 'GET', url: '/api/movements' })).json()).toEqual(movementsBefore)
  })

  test('C9 GET /api/assignments on empty table returns 200 []', async () => {
    const response = await request({ method: 'GET', url: '/api/assignments' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  test('C10 POST /api/assignments with missing or unknown Staff or Job returns 400 and persists nothing', async () => {
    const { staff, job } = await seedRefs()
    const cases = [
      { staffId: undefined, jobId: job.id, startsOn: '2026-09-01', endsOn: '2026-09-30' },
      { staffId: 'missing', jobId: job.id, startsOn: '2026-09-01', endsOn: '2026-09-30' },
      { staffId: staff.id, jobId: undefined, startsOn: '2026-09-01', endsOn: '2026-09-30' },
      { staffId: staff.id, jobId: 'missing', startsOn: '2026-09-01', endsOn: '2026-09-30' },
    ]

    for (const payload of cases) {
      const response = await request({ method: 'POST', url: '/api/assignments', payload })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        error: 'Staff or Job not found',
        statusCode: 400,
      })
    }

    expect((await request({ method: 'GET', url: '/api/assignments' })).json()).toEqual([])
  })

  test('C11 POST /api/assignments with missing or invalid period returns 400 and persists nothing', async () => {
    const { staff, job } = await seedRefs()
    const cases = [
      { staffId: staff.id, jobId: job.id, endsOn: '2026-09-30' },
      { staffId: staff.id, jobId: job.id, startsOn: '2026-09-01' },
      { staffId: staff.id, jobId: job.id, startsOn: '', endsOn: '2026-09-30' },
      { staffId: staff.id, jobId: job.id, startsOn: '2026-09-01', endsOn: '' },
      { staffId: staff.id, jobId: job.id, startsOn: '2026-9-01', endsOn: '2026-09-30' },
      { staffId: staff.id, jobId: job.id, startsOn: '2026-09-01T00:00:00Z', endsOn: '2026-09-30' },
      { staffId: staff.id, jobId: job.id, startsOn: '2026/09/01', endsOn: '2026-09-30' },
    ]

    for (const payload of cases) {
      const response = await request({ method: 'POST', url: '/api/assignments', payload })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        error: 'startsOn and endsOn are required as YYYY-MM-DD',
        statusCode: 400,
      })
    }

    expect((await request({ method: 'GET', url: '/api/assignments' })).json()).toEqual([])
  })

  test('C12 POST /api/assignments with endsOn before startsOn returns 400 and persists nothing', async () => {
    const { staff, job } = await seedRefs()
    const response = await request({
      method: 'POST',
      url: '/api/assignments',
      payload: {
        staffId: staff.id,
        jobId: job.id,
        startsOn: '2026-09-30',
        endsOn: '2026-09-01',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      error: 'endsOn must be on or after startsOn',
      statusCode: 400,
    })
    expect((await request({ method: 'GET', url: '/api/assignments' })).json()).toEqual([])
  })

  test('C13 POST /api/assignments duplicate period returns 409 and the unique index holds', async () => {
    const { staff, job } = await seedRefs()
    const payload = {
      staffId: staff.id,
      jobId: job.id,
      startsOn: '2026-09-01',
      endsOn: '2026-09-30',
    }
    const first = await request({ method: 'POST', url: '/api/assignments', payload })
    expect(first.statusCode).toBe(201)

    const second = await request({ method: 'POST', url: '/api/assignments', payload })
    expect(second.statusCode).toBe(409)
    expect(second.json()).toEqual({
      error: 'Assignment already exists',
      statusCode: 409,
    })

    const list = (await request({ method: 'GET', url: '/api/assignments' })).json() as unknown[]
    expect(list).toHaveLength(1)

    const sqlite = new Database(dbFile)
    const indexes = sqlite.query('PRAGMA index_list(assignments)').all() as {
      name: string
      unique: number
    }[]
    sqlite.close()
    expect(
      indexes.some(
        (index) => index.name === 'assignments_staff_job_period_unique' && index.unique === 1,
      ),
    ).toBe(true)
  })

  test('C14 POST /api/assignments for one Staff on two Jobs persists both', async () => {
    const { staff, job } = await seedRefs()
    const jobB = (
      await request({ method: 'POST', url: '/api/jobs', payload: { name: 'Site B' } })
    ).json() as { id: string }

    const first = await request({
      method: 'POST',
      url: '/api/assignments',
      payload: {
        staffId: staff.id,
        jobId: job.id,
        startsOn: '2026-09-01',
        endsOn: '2026-09-30',
      },
    })
    const second = await request({
      method: 'POST',
      url: '/api/assignments',
      payload: {
        staffId: staff.id,
        jobId: jobB.id,
        startsOn: '2026-09-01',
        endsOn: '2026-09-30',
      },
    })
    expect(first.statusCode).toBe(201)
    expect(second.statusCode).toBe(201)

    const list = (await request({ method: 'GET', url: '/api/assignments' })).json() as {
      staffId: string
      jobId: string
    }[]
    expect(list).toHaveLength(2)
    expect(list.every((row) => row.staffId === staff.id)).toBe(true)
    expect(list.map((row) => row.jobId).sort()).toEqual([job.id, jobB.id].sort())
  })

  test('C15 DELETE /api/assignments/:id returns 204 and removes the Assignment', async () => {
    const { staff, job } = await seedRefs()
    const created = await request({
      method: 'POST',
      url: '/api/assignments',
      payload: {
        staffId: staff.id,
        jobId: job.id,
        startsOn: '2026-09-01',
        endsOn: '2026-09-30',
      },
    })
    const { id } = created.json() as { id: string }

    const deleted = await request({ method: 'DELETE', url: `/api/assignments/${id}` })
    expect(deleted.statusCode).toBe(204)

    const list = (await request({ method: 'GET', url: '/api/assignments' })).json() as { id: string }[]
    expect(list.find((row) => row.id === id)).toBeUndefined()
  })

  test('C16 DELETE /api/assignments/:id missing id returns 404', async () => {
    const response = await request({
      method: 'DELETE',
      url: '/api/assignments/00000000-0000-4000-8000-000000000000',
    })
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      error: 'Assignment not found',
      statusCode: 404,
    })
  })

  test('C17 Operator creates Assignment', async () => {
    const { staff, job } = await seedRefs()
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
      url: '/api/assignments',
      headers: { cookie: operatorCookie },
      payload: {
        staffId: staff.id,
        jobId: job.id,
        startsOn: '2026-09-01',
        endsOn: '2026-09-30',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as { staffId: string; jobId: string }
    expect(body.staffId).toBe(staff.id)
    expect(body.jobId).toBe(job.id)
  })

  test('C19 DELETE /api/jobs/:id with Assignment and no Movement returns 409 Job has Assignment', async () => {
    const { staff, job } = await seedRefs()
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

    const response = await request({ method: 'DELETE', url: `/api/jobs/${job.id}` })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      error: 'Job has Assignment',
      statusCode: 409,
    })

    const jobs = (await request({ method: 'GET', url: '/api/jobs' })).json() as { id: string }[]
    expect(jobs.some((row) => row.id === job.id)).toBe(true)
  })
})
