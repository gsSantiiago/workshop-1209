import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Database } from 'bun:sqlite'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { SEED_ADMINISTRATOR } from '../src/db/seed'

const dbDir = mkdtempSync(join(tmpdir(), 'fake-erp-requisitions-'))
const dbFile = join(dbDir, 'test.sqlite')
Bun.env.DB_FILE_NAME = dbFile
Bun.env.LOG_LEVEL = 'silent'

const { container } = await import('../src/container/container')
const { createServer } = await import('../src/server')

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const MISSING = '00000000-0000-4000-8000-000000000000'
const operator = { email: 'op-req@local', password: 'secret', role: 'Operator' }
const REQUISITION_KEYS = ['createdAt', 'id', 'itemId', 'jobId', 'purchaseId', 'quantity', 'status']
const PURCHASE_KEYS = ['createdAt', 'id', 'itemId', 'quantity', 'supplierId', 'warehouseId']

type Requisition = {
  id: string
  itemId: string
  jobId: string
  quantity: number
  status: string
  purchaseId: string | null
  createdAt: string
}

type Purchase = {
  id: string
  supplierId: string
  itemId: string
  warehouseId: string
  quantity: number
  createdAt: string
}

type Refs = {
  supplier: { id: string }
  item: { id: string }
  job: { id: string }
  warehouse: { id: string }
}

function clearTables() {
  const sqlite = new Database(dbFile)
  sqlite.exec('DELETE FROM requisitions')
  sqlite.exec('DELETE FROM movements')
  sqlite.exec('DELETE FROM assignments')
  sqlite.exec('DELETE FROM stock')
  sqlite.exec('DELETE FROM purchases')
  sqlite.exec('DELETE FROM suppliers')
  sqlite.exec('DELETE FROM staff')
  sqlite.exec('DELETE FROM jobs')
  sqlite.exec('DELETE FROM warehouses')
  sqlite.exec('DELETE FROM items')
  sqlite.close()
}

describe('requisitions HTTP', () => {
  let app: Awaited<ReturnType<typeof createServer>>
  let adminCookie = ''
  let operatorCookie = ''

  beforeAll(async () => {
    container.clear()
    app = await createServer()
    adminCookie = await cookieFor(SEED_ADMINISTRATOR.email, SEED_ADMINISTRATOR.password)
    const created = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { cookie: adminCookie },
      payload: operator,
    })
    if (created.statusCode !== 201) {
      throw new Error(`operator create failed: ${created.statusCode} ${created.body}`)
    }
    operatorCookie = await cookieFor(operator.email, operator.password)
  })

  function call(
    opts: { method: string; url: string; payload?: unknown },
    cookie = adminCookie,
  ) {
    return app.inject({
      ...opts,
      headers: { cookie },
    })
  }

  async function cookieFor(email: string, password: string) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { email, password },
    })
    if (response.statusCode !== 200) {
      throw new Error(`login failed: ${response.statusCode} ${response.body}`)
    }
    return response.cookies.map((entry) => `${entry.name}=${entry.value}`).join('; ')
  }

  async function seedRefs(): Promise<Refs> {
    const supplier = (await call({ method: 'POST', url: '/api/suppliers', payload: { name: 'Acme' } })).json() as {
      id: string
    }
    const item = (
      await call({
        method: 'POST',
        url: '/api/items',
        payload: { sku: 'CEM-50', name: 'Cimento CP-II', unit: 'saco' },
      })
    ).json() as { id: string }
    const job = (await call({ method: 'POST', url: '/api/jobs', payload: { name: 'Site A' } })).json() as {
      id: string
    }
    const warehouse = (
      await call({ method: 'POST', url: '/api/warehouses', payload: { name: 'Depot A' } })
    ).json() as { id: string }
    return { supplier, item, job, warehouse }
  }

  async function openRequisition(refs: Refs) {
    const response = await call(
      {
        method: 'POST',
        url: '/api/requisitions',
        payload: { itemId: refs.item.id, jobId: refs.job.id, quantity: 12.5 },
      },
      operatorCookie,
    )
    expect(response.statusCode).toBe(201)
    return response.json() as Requisition
  }

  async function listRequisitions(cookie = adminCookie) {
    const response = await call({ method: 'GET', url: '/api/requisitions' }, cookie)
    expect(response.statusCode).toBe(200)
    return response.json() as Requisition[]
  }

  async function listPurchases() {
    const response = await call({ method: 'GET', url: '/api/purchases' })
    expect(response.statusCode).toBe(200)
    return response.json() as Purchase[]
  }

  function convertPayload(refs: Refs) {
    return { supplierId: refs.supplier.id, warehouseId: refs.warehouse.id, quantity: 1 }
  }

  beforeEach(() => {
    clearTables()
  })

  afterAll(async () => {
    await app.close()
    container.clear()
  })

  test('criterion 1: GET /api/requisitions on an empty table returns 200 []', async () => {
    const asOperator = await call({ method: 'GET', url: '/api/requisitions' }, operatorCookie)
    const asAdministrator = await call({ method: 'GET', url: '/api/requisitions' }, adminCookie)
    expect(asOperator.statusCode).toBe(200)
    expect(asOperator.json()).toEqual([])
    expect(asAdministrator.statusCode).toBe(200)
    expect(asAdministrator.json()).toEqual([])
  })

  test('criterion 2: POST /api/requisitions returns 201 open and both roles list that row', async () => {
    const refs = await seedRefs()
    const purchasesBefore = await listPurchases()

    const response = await call(
      {
        method: 'POST',
        url: '/api/requisitions',
        payload: { itemId: refs.item.id, jobId: refs.job.id, quantity: 12.5 },
      },
      operatorCookie,
    )
    expect(response.statusCode).toBe(201)
    const body = response.json() as Requisition
    expect(Object.keys(body).sort()).toEqual(REQUISITION_KEYS)
    expect(body.id).toMatch(UUID)
    expect(body.itemId).toBe(refs.item.id)
    expect(body.jobId).toBe(refs.job.id)
    expect(body.quantity).toBe(12.5)
    expect(body.status).toBe('open')
    expect(body.purchaseId).toBeNull()
    expect(body.createdAt).toMatch(ISO_8601)

    expect(await listRequisitions(operatorCookie)).toEqual([body])
    expect(await listRequisitions(adminCookie)).toEqual([body])
    expect(await listPurchases()).toEqual(purchasesBefore)
  })

  test('criterion 3: blank itemId, jobId, or missing quantity returns 400 and stores nothing', async () => {
    const refs = await seedRefs()
    const cases = [
      { itemId: '', jobId: refs.job.id, quantity: 12.5 },
      { itemId: '   ', jobId: refs.job.id, quantity: 12.5 },
      { itemId: refs.item.id, jobId: '', quantity: 12.5 },
      { itemId: refs.item.id, jobId: '   ', quantity: 12.5 },
      { itemId: refs.item.id, jobId: refs.job.id },
    ]

    for (const payload of cases) {
      const response = await call({ method: 'POST', url: '/api/requisitions', payload }, operatorCookie)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        error: 'itemId, jobId, and a positive quantity are required',
        statusCode: 400,
      })
    }

    expect(await listRequisitions()).toEqual([])
  })

  test('criterion 4: quantity 0 or -1 returns 400 and stores nothing', async () => {
    const refs = await seedRefs()
    for (const quantity of [0, -1]) {
      const response = await call(
        {
          method: 'POST',
          url: '/api/requisitions',
          payload: { itemId: refs.item.id, jobId: refs.job.id, quantity },
        },
        operatorCookie,
      )
      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        error: 'quantity must be a positive number',
        statusCode: 400,
      })
    }
    expect(await listRequisitions()).toEqual([])
  })

  test('criterion 5: missing itemId or jobId returns 400 and stores nothing', async () => {
    const refs = await seedRefs()
    const cases = [
      { itemId: MISSING, jobId: refs.job.id, quantity: 12.5 },
      { itemId: refs.item.id, jobId: MISSING, quantity: 12.5 },
    ]
    for (const payload of cases) {
      const response = await call({ method: 'POST', url: '/api/requisitions', payload }, operatorCookie)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({ error: 'Item or Job not found', statusCode: 400 })
    }
    expect(await listRequisitions()).toEqual([])
  })

  test('criterion 6: Administrator create with a missing itemId returns 403 and stores nothing', async () => {
    const response = await call(
      {
        method: 'POST',
        url: '/api/requisitions',
        payload: { itemId: MISSING, jobId: MISSING, quantity: 12.5 },
      },
      adminCookie,
    )
    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: 'Forbidden', statusCode: 403 })
    expect(await listRequisitions()).toEqual([])
  })

  test('criterion 7: Operator cancel of an open row returns 200 cancelled and leaves purchases, stock, and movements', async () => {
    const refs = await seedRefs()
    const purchase = await call({
      method: 'POST',
      url: '/api/purchases',
      payload: {
        supplierId: refs.supplier.id,
        itemId: refs.item.id,
        warehouseId: refs.warehouse.id,
        quantity: 1,
      },
    })
    expect(purchase.statusCode).toBe(201)
    const receipt = await call({
      method: 'POST',
      url: `/api/purchases/${(purchase.json() as { id: string }).id}/receipts`,
    })
    expect(receipt.statusCode).toBe(201)
    const created = await openRequisition(refs)
    const purchasesBefore = await listPurchases()
    const stockBefore = (await call({ method: 'GET', url: '/api/stock' })).json()
    const movementsBefore = (await call({ method: 'GET', url: '/api/movements' })).json()

    const response = await call(
      { method: 'POST', url: `/api/requisitions/${created.id}/cancel` },
      operatorCookie,
    )
    expect(response.statusCode).toBe(200)
    const body = response.json() as Requisition
    expect(Object.keys(body).sort()).toEqual(REQUISITION_KEYS)
    expect(body.id).toBe(created.id)
    expect(body.itemId).toBe(created.itemId)
    expect(body.jobId).toBe(created.jobId)
    expect(body.quantity).toBe(12.5)
    expect(body.status).toBe('cancelled')
    expect(body.purchaseId).toBeNull()
    expect(await listPurchases()).toEqual(purchasesBefore)
    expect((await call({ method: 'GET', url: '/api/stock' })).json()).toEqual(stockBefore)
    expect((await call({ method: 'GET', url: '/api/movements' })).json()).toEqual(movementsBefore)
  })

  test('criterion 8: Administrator cancel of a missing id returns 403 and the list stays', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const before = await listRequisitions()

    const response = await call(
      { method: 'POST', url: `/api/requisitions/${MISSING}/cancel` },
      adminCookie,
    )
    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: 'Forbidden', statusCode: 403 })
    expect(await listRequisitions()).toEqual(before)
    expect(before.some((row) => row.id === created.id)).toBe(true)
  })

  test('criterion 9: cancel of cancelled, refused, or converted returns 409 and the row stays', async () => {
    const refs = await seedRefs()
    const cancelled = await openRequisition(refs)
    expect(
      (await call({ method: 'POST', url: `/api/requisitions/${cancelled.id}/cancel` }, operatorCookie))
        .statusCode,
    ).toBe(200)

    const refused = await openRequisition(refs)
    expect(
      (await call({ method: 'POST', url: `/api/requisitions/${refused.id}/refuse` }, adminCookie)).statusCode,
    ).toBe(200)

    const converted = await openRequisition(refs)
    expect(
      (
        await call(
          { method: 'POST', url: `/api/requisitions/${converted.id}/convert`, payload: convertPayload(refs) },
          adminCookie,
        )
      ).statusCode,
    ).toBe(200)

    for (const id of [cancelled.id, refused.id, converted.id]) {
      const before = (await listRequisitions()).find((row) => row.id === id)
      const response = await call({ method: 'POST', url: `/api/requisitions/${id}/cancel` }, operatorCookie)
      expect(response.statusCode).toBe(409)
      expect(response.json()).toEqual({ error: 'Requisition is not open', statusCode: 409 })
      const after = (await listRequisitions()).find((row) => row.id === id)
      expect(after).toEqual(before)
    }
  })

  test('criterion 10: Operator cancel of a missing id returns 404', async () => {
    const response = await call(
      { method: 'POST', url: `/api/requisitions/${MISSING}/cancel` },
      operatorCookie,
    )
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: 'Requisition not found', statusCode: 404 })
  })

  test('criterion 11: DELETE /api/jobs/:id with a Requisition and no Movement or Assignment returns 409 Job has Requisition', async () => {
    const refs = await seedRefs()
    await openRequisition(refs)
    const response = await call({ method: 'DELETE', url: `/api/jobs/${refs.job.id}` })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ error: 'Job has Requisition', statusCode: 409 })
    const jobs = (await call({ method: 'GET', url: '/api/jobs' })).json() as { id: string }[]
    expect(jobs.some((row) => row.id === refs.job.id)).toBe(true)
  })

  test('criterion 12: DELETE /api/jobs/:id with Movement and Requisition returns 409 Job has Movement', async () => {
    const refs = await seedRefs()
    expect(
      (
        await call({
          method: 'POST',
          url: '/api/receipts',
          payload: { warehouseId: refs.warehouse.id, itemId: refs.item.id, quantity: 2 },
        })
      ).statusCode,
    ).toBe(201)
    expect(
      (
        await call({
          method: 'POST',
          url: '/api/issues',
          payload: {
            warehouseId: refs.warehouse.id,
            itemId: refs.item.id,
            jobId: refs.job.id,
            quantity: 2,
          },
        })
      ).statusCode,
    ).toBe(201)
    await openRequisition(refs)
    const response = await call({ method: 'DELETE', url: `/api/jobs/${refs.job.id}` })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ error: 'Job has Movement', statusCode: 409 })
    const jobs = (await call({ method: 'GET', url: '/api/jobs' })).json() as { id: string }[]
    expect(jobs.some((row) => row.id === refs.job.id)).toBe(true)
  })

  test('criterion 13: DELETE /api/jobs/:id with Assignment and Requisition and no Movement returns 409 Job has Assignment', async () => {
    const refs = await seedRefs()
    const staff = (await call({ method: 'POST', url: '/api/staff', payload: { name: 'Ana' } })).json() as {
      id: string
    }
    expect(
      (
        await call({
          method: 'POST',
          url: '/api/assignments',
          payload: {
            staffId: staff.id,
            jobId: refs.job.id,
            startsOn: '2026-09-01',
            endsOn: '2026-09-30',
          },
        })
      ).statusCode,
    ).toBe(201)
    await openRequisition(refs)
    const response = await call({ method: 'DELETE', url: `/api/jobs/${refs.job.id}` })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ error: 'Job has Assignment', statusCode: 409 })
    const jobs = (await call({ method: 'GET', url: '/api/jobs' })).json() as { id: string }[]
    expect(jobs.some((row) => row.id === refs.job.id)).toBe(true)
  })

  test('criterion 14: DELETE /api/items/:id with a Requisition and no Stock returns 409 Item has Requisition', async () => {
    const refs = await seedRefs()
    await openRequisition(refs)
    const response = await call({ method: 'DELETE', url: `/api/items/${refs.item.id}` })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ error: 'Item has Requisition', statusCode: 409 })
    const items = (await call({ method: 'GET', url: '/api/items' })).json() as { id: string }[]
    expect(items.some((row) => row.id === refs.item.id)).toBe(true)
  })

  test('criterion 15: DELETE /api/items/:id with Stock and a Requisition returns 409 Item has Stock', async () => {
    const refs = await seedRefs()
    expect(
      (
        await call({
          method: 'POST',
          url: '/api/receipts',
          payload: { warehouseId: refs.warehouse.id, itemId: refs.item.id, quantity: 2 },
        })
      ).statusCode,
    ).toBe(201)
    await openRequisition(refs)
    const response = await call({ method: 'DELETE', url: `/api/items/${refs.item.id}` })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ error: 'Item has Stock', statusCode: 409 })
    const items = (await call({ method: 'GET', url: '/api/items' })).json() as { id: string }[]
    expect(items.some((row) => row.id === refs.item.id)).toBe(true)
  })

  test('criterion 16: a second open Requisition for the same Item and Job returns 201 and both rows', async () => {
    const refs = await seedRefs()
    const first = await openRequisition(refs)
    const second = await openRequisition(refs)
    expect(second.status).toBe('open')
    expect(second.id).not.toBe(first.id)
    expect(second.purchaseId).toBeNull()
    expect(first.purchaseId).toBeNull()
    const rows = await listRequisitions()
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.id).sort()).toEqual([first.id, second.id].sort())
  })

  test('purchase id unique index rejects a second row with the same purchase id', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const converted = await call(
      { method: 'POST', url: `/api/requisitions/${created.id}/convert`, payload: convertPayload(refs) },
      adminCookie,
    )
    expect(converted.statusCode).toBe(200)
    const purchaseId = (converted.json() as Requisition).purchaseId
    const sqlite = new Database(dbFile)
    expect(() => {
      sqlite
        .query(
          `INSERT INTO requisitions (id, item_id, job_id, quantity, status, purchase_id, created_at)
           VALUES (?, ?, ?, 1, 'converted', ?, ?)`,
        )
        .run(crypto.randomUUID(), refs.item.id, refs.job.id, purchaseId, new Date().toISOString())
    }).toThrow()
    sqlite.close()
  })

  test('criterion 17: two concurrent cancels leave one cancelled row and one 409', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const [first, second] = await Promise.all([
      call({ method: 'POST', url: `/api/requisitions/${created.id}/cancel` }, operatorCookie),
      call({ method: 'POST', url: `/api/requisitions/${created.id}/cancel` }, operatorCookie),
    ])
    expect([first.statusCode, second.statusCode].sort()).toEqual([200, 409])
    const ok = [first, second].find((response) => response.statusCode === 200)
    const conflict = [first, second].find((response) => response.statusCode === 409)
    const body = ok?.json() as Requisition
    expect(body.status).toBe('cancelled')
    expect(body.purchaseId).toBeNull()
    expect(conflict?.json()).toEqual({ error: 'Requisition is not open', statusCode: 409 })
    const row = (await listRequisitions()).find((entry) => entry.id === created.id)
    expect(row?.status).toBe('cancelled')
    expect(row?.purchaseId).toBeNull()
  })

  test('criterion 18: concurrent cancel and convert leave one winner and one 409', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const purchasesBefore = await listPurchases()
    const [cancelResponse, convertResponse] = await Promise.all([
      call({ method: 'POST', url: `/api/requisitions/${created.id}/cancel` }, operatorCookie),
      call(
        {
          method: 'POST',
          url: `/api/requisitions/${created.id}/convert`,
          payload: convertPayload(refs),
        },
        adminCookie,
      ),
    ])
    expect([cancelResponse.statusCode, convertResponse.statusCode].sort()).toEqual([200, 409])
    const ok = [cancelResponse, convertResponse].find((response) => response.statusCode === 200)
    const conflict = [cancelResponse, convertResponse].find((response) => response.statusCode === 409)
    expect(conflict?.json()).toEqual({ error: 'Requisition is not open', statusCode: 409 })
    const body = ok?.json() as Requisition
    const purchases = await listPurchases()
    if (body.status === 'cancelled') {
      expect(body.purchaseId).toBeNull()
      expect(purchases).toEqual(purchasesBefore)
    } else {
      expect(body.status).toBe('converted')
      expect(purchases.some((purchase) => purchase.id === body.purchaseId)).toBe(true)
    }
  })

  test('criterion 24: convert copies quantity 12.5, ignores body quantity 1, and does not write Stock', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const purchasesBefore = await listPurchases()
    const stockBefore = (await call({ method: 'GET', url: '/api/stock' })).json()
    const movementsBefore = (await call({ method: 'GET', url: '/api/movements' })).json()

    const response = await call(
      {
        method: 'POST',
        url: `/api/requisitions/${created.id}/convert`,
        payload: convertPayload(refs),
      },
      adminCookie,
    )
    expect(response.statusCode).toBe(200)
    const body = response.json() as Requisition
    expect(body.status).toBe('converted')
    expect(body.purchaseId).toMatch(UUID)

    const purchases = await listPurchases()
    expect(purchases).toHaveLength(purchasesBefore.length + 1)
    const purchase = purchases.find((row) => row.id === body.purchaseId) as Purchase
    expect(Object.keys(purchase).sort()).toEqual(PURCHASE_KEYS)
    expect(purchase.itemId).toBe(created.itemId)
    expect(purchase.quantity).toBe(12.5)
    expect(purchase.supplierId).toBe(refs.supplier.id)
    expect(purchase.warehouseId).toBe(refs.warehouse.id)
    expect('jobId' in purchase).toBe(false)
    expect((await call({ method: 'GET', url: '/api/stock' })).json()).toEqual(stockBefore)
    expect((await call({ method: 'GET', url: '/api/movements' })).json()).toEqual(movementsBefore)
  })

  test('criterion 25: Operator convert of a missing id returns 403 and purchases stay', async () => {
    const purchasesBefore = await listPurchases()
    const response = await call(
      {
        method: 'POST',
        url: `/api/requisitions/${MISSING}/convert`,
        payload: { supplierId: MISSING, warehouseId: MISSING, quantity: 1 },
      },
      operatorCookie,
    )
    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: 'Forbidden', statusCode: 403 })
    expect(await listPurchases()).toEqual(purchasesBefore)
  })

  test('criterion 26: convert of cancelled, refused, or converted returns 409 and creates no Purchase', async () => {
    const refs = await seedRefs()
    const cancelled = await openRequisition(refs)
    await call({ method: 'POST', url: `/api/requisitions/${cancelled.id}/cancel` }, operatorCookie)
    const refused = await openRequisition(refs)
    await call({ method: 'POST', url: `/api/requisitions/${refused.id}/refuse` }, adminCookie)
    const converted = await openRequisition(refs)
    await call(
      { method: 'POST', url: `/api/requisitions/${converted.id}/convert`, payload: convertPayload(refs) },
      adminCookie,
    )

    for (const id of [cancelled.id, refused.id, converted.id]) {
      const rowBefore = (await listRequisitions()).find((row) => row.id === id)
      const purchasesBefore = await listPurchases()
      const response = await call(
        { method: 'POST', url: `/api/requisitions/${id}/convert`, payload: convertPayload(refs) },
        adminCookie,
      )
      expect(response.statusCode).toBe(409)
      expect(response.json()).toEqual({ error: 'Requisition is not open', statusCode: 409 })
      expect((await listRequisitions()).find((row) => row.id === id)).toEqual(rowBefore)
      expect(await listPurchases()).toEqual(purchasesBefore)
    }
  })

  test('criterion 27: two concurrent converts create one Purchase', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const purchasesBefore = await listPurchases()
    const [first, second] = await Promise.all([
      call(
        { method: 'POST', url: `/api/requisitions/${created.id}/convert`, payload: convertPayload(refs) },
        adminCookie,
      ),
      call(
        { method: 'POST', url: `/api/requisitions/${created.id}/convert`, payload: convertPayload(refs) },
        adminCookie,
      ),
    ])
    expect([first.statusCode, second.statusCode].sort()).toEqual([200, 409])
    const ok = [first, second].find((response) => response.statusCode === 200)
    const conflict = [first, second].find((response) => response.statusCode === 409)
    const body = ok?.json() as Requisition
    expect(body.status).toBe('converted')
    expect(conflict?.json()).toEqual({ error: 'Requisition is not open', statusCode: 409 })
    const purchases = await listPurchases()
    const added = purchases.filter((purchase) => !purchasesBefore.some((before) => before.id === purchase.id))
    expect(added).toHaveLength(1)
    expect(added[0]?.id).toBe(body.purchaseId)
    const row = (await listRequisitions()).find((entry) => entry.id === created.id)
    expect(row?.purchaseId).toBe(added[0]?.id)
  })

  test('criterion 28: Administrator convert of a missing id returns 404', async () => {
    const refs = await seedRefs()
    const response = await call(
      { method: 'POST', url: `/api/requisitions/${MISSING}/convert`, payload: convertPayload(refs) },
      adminCookie,
    )
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: 'Requisition not found', statusCode: 404 })
  })

  test('criterion 29: empty, blank, or missing supplier or warehouse returns 400 and stays open', async () => {
    const refs = await seedRefs()
    const cases = [
      { supplierId: '', warehouseId: refs.warehouse.id },
      { supplierId: '   ', warehouseId: refs.warehouse.id },
      { supplierId: MISSING, warehouseId: refs.warehouse.id },
      { supplierId: refs.supplier.id, warehouseId: '' },
      { supplierId: refs.supplier.id, warehouseId: '   ' },
      { supplierId: refs.supplier.id, warehouseId: MISSING },
    ]
    for (const payload of cases) {
      const created = await openRequisition(refs)
      const purchasesBefore = await listPurchases()
      const response = await call(
        { method: 'POST', url: `/api/requisitions/${created.id}/convert`, payload },
        adminCookie,
      )
      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({ error: 'Supplier or Warehouse not found', statusCode: 400 })
      const row = (await listRequisitions()).find((entry) => entry.id === created.id)
      expect(row?.status).toBe('open')
      expect(await listPurchases()).toEqual(purchasesBefore)
    }
  })

  test('criterion 30: purchaseId is set only on converted and matches a Purchase', async () => {
    const refs = await seedRefs()
    const opened = await openRequisition(refs)
    expect(opened.purchaseId).toBeNull()

    const cancelled = await openRequisition(refs)
    const cancelledBody = (
      await call({ method: 'POST', url: `/api/requisitions/${cancelled.id}/cancel` }, operatorCookie)
    ).json() as Requisition
    expect(cancelledBody.status).toBe('cancelled')
    expect(cancelledBody.purchaseId).toBeNull()

    const refused = await openRequisition(refs)
    const refusedBody = (
      await call({ method: 'POST', url: `/api/requisitions/${refused.id}/refuse` }, adminCookie)
    ).json() as Requisition
    expect(refusedBody.status).toBe('refused')
    expect(refusedBody.purchaseId).toBeNull()

    const converted = await openRequisition(refs)
    const convertedBody = (
      await call(
        { method: 'POST', url: `/api/requisitions/${converted.id}/convert`, payload: convertPayload(refs) },
        adminCookie,
      )
    ).json() as Requisition
    expect(convertedBody.status).toBe('converted')
    const purchases = await listPurchases()
    expect(purchases.some((purchase) => purchase.id === convertedBody.purchaseId)).toBe(true)
  })

  test('criterion 34: Administrator refuse of an open row returns 200 refused and leaves purchases, stock, and movements', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const purchasesBefore = await listPurchases()
    const stockBefore = (await call({ method: 'GET', url: '/api/stock' })).json()
    const movementsBefore = (await call({ method: 'GET', url: '/api/movements' })).json()

    const response = await call({ method: 'POST', url: `/api/requisitions/${created.id}/refuse` }, adminCookie)
    expect(response.statusCode).toBe(200)
    const body = response.json() as Requisition
    expect(body.status).toBe('refused')
    expect(body.purchaseId).toBeNull()
    expect(body.id).toBe(created.id)
    expect(await listPurchases()).toEqual(purchasesBefore)
    expect((await call({ method: 'GET', url: '/api/stock' })).json()).toEqual(stockBefore)
    expect((await call({ method: 'GET', url: '/api/movements' })).json()).toEqual(movementsBefore)
  })

  test('criterion 35: Operator refuse of a missing id returns 403 and the list stays', async () => {
    const refs = await seedRefs()
    await openRequisition(refs)
    const before = await listRequisitions()
    const response = await call(
      { method: 'POST', url: `/api/requisitions/${MISSING}/refuse` },
      operatorCookie,
    )
    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: 'Forbidden', statusCode: 403 })
    expect(await listRequisitions()).toEqual(before)
  })

  test('criterion 36: refuse of cancelled, refused, or converted returns 409 and the row stays', async () => {
    const refs = await seedRefs()
    const cancelled = await openRequisition(refs)
    await call({ method: 'POST', url: `/api/requisitions/${cancelled.id}/cancel` }, operatorCookie)
    const refused = await openRequisition(refs)
    await call({ method: 'POST', url: `/api/requisitions/${refused.id}/refuse` }, adminCookie)
    const converted = await openRequisition(refs)
    await call(
      { method: 'POST', url: `/api/requisitions/${converted.id}/convert`, payload: convertPayload(refs) },
      adminCookie,
    )

    for (const id of [cancelled.id, refused.id, converted.id]) {
      const before = (await listRequisitions()).find((row) => row.id === id)
      const response = await call({ method: 'POST', url: `/api/requisitions/${id}/refuse` }, adminCookie)
      expect(response.statusCode).toBe(409)
      expect(response.json()).toEqual({ error: 'Requisition is not open', statusCode: 409 })
      expect((await listRequisitions()).find((row) => row.id === id)).toEqual(before)
    }
  })

  test('criterion 37: Administrator refuse of a missing id returns 404', async () => {
    const response = await call({ method: 'POST', url: `/api/requisitions/${MISSING}/refuse` }, adminCookie)
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: 'Requisition not found', statusCode: 404 })
  })

  test('criterion 38: two concurrent refuses leave one refused row, one 409, and no Purchase', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const purchasesBefore = await listPurchases()
    const [first, second] = await Promise.all([
      call({ method: 'POST', url: `/api/requisitions/${created.id}/refuse` }, adminCookie),
      call({ method: 'POST', url: `/api/requisitions/${created.id}/refuse` }, adminCookie),
    ])
    expect([first.statusCode, second.statusCode].sort()).toEqual([200, 409])
    const ok = [first, second].find((response) => response.statusCode === 200)
    const conflict = [first, second].find((response) => response.statusCode === 409)
    const body = ok?.json() as Requisition
    expect(body.status).toBe('refused')
    expect(body.purchaseId).toBeNull()
    expect(conflict?.json()).toEqual({ error: 'Requisition is not open', statusCode: 409 })
    const row = (await listRequisitions()).find((entry) => entry.id === created.id)
    expect(row?.status).toBe('refused')
    expect(row?.purchaseId).toBeNull()
    expect(await listPurchases()).toEqual(purchasesBefore)
  })

  test('criterion 39: concurrent convert and refuse leave one winner and one 409', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const purchasesBefore = await listPurchases()
    const [convertResponse, refuseResponse] = await Promise.all([
      call(
        { method: 'POST', url: `/api/requisitions/${created.id}/convert`, payload: convertPayload(refs) },
        adminCookie,
      ),
      call({ method: 'POST', url: `/api/requisitions/${created.id}/refuse` }, adminCookie),
    ])
    expect([convertResponse.statusCode, refuseResponse.statusCode].sort()).toEqual([200, 409])
    const ok = [convertResponse, refuseResponse].find((response) => response.statusCode === 200)
    const conflict = [convertResponse, refuseResponse].find((response) => response.statusCode === 409)
    expect(conflict?.json()).toEqual({ error: 'Requisition is not open', statusCode: 409 })
    const body = ok?.json() as Requisition
    const purchases = await listPurchases()
    if (body.status === 'refused') {
      expect(body.purchaseId).toBeNull()
      expect(purchases).toEqual(purchasesBefore)
    } else {
      expect(body.status).toBe('converted')
      expect(purchases.some((purchase) => purchase.id === body.purchaseId)).toBe(true)
    }
  })

  test('criterion 41: DELETE /api/purchases/:id with a Movement returns 409 Purchase has Movement with or without a Requisition', async () => {
    const refs = await seedRefs()
    const direct = await call({
      method: 'POST',
      url: '/api/purchases',
      payload: {
        supplierId: refs.supplier.id,
        itemId: refs.item.id,
        warehouseId: refs.warehouse.id,
        quantity: 2,
      },
    })
    const directId = (direct.json() as { id: string }).id
    expect((await call({ method: 'POST', url: `/api/purchases/${directId}/receipts` })).statusCode).toBe(201)
    const without = await call({ method: 'DELETE', url: `/api/purchases/${directId}` })
    expect(without.statusCode).toBe(409)
    expect(without.json()).toEqual({ error: 'Purchase has Movement', statusCode: 409 })
    expect((await listPurchases()).some((purchase) => purchase.id === directId)).toBe(true)

    const created = await openRequisition(refs)
    const converted = (
      await call(
        { method: 'POST', url: `/api/requisitions/${created.id}/convert`, payload: convertPayload(refs) },
        adminCookie,
      )
    ).json() as Requisition
    expect(
      (await call({ method: 'POST', url: `/api/purchases/${converted.purchaseId}/receipts` })).statusCode,
    ).toBe(201)
    const withRequisition = await call({ method: 'DELETE', url: `/api/purchases/${converted.purchaseId}` })
    expect(withRequisition.statusCode).toBe(409)
    expect(withRequisition.json()).toEqual({ error: 'Purchase has Movement', statusCode: 409 })
    expect((await listPurchases()).some((purchase) => purchase.id === converted.purchaseId)).toBe(true)
  })

  test('criterion 42: DELETE /api/purchases/:id with a Requisition and no Movement returns 409 Purchase has Requisition', async () => {
    const refs = await seedRefs()
    const created = await openRequisition(refs)
    const converted = (
      await call(
        { method: 'POST', url: `/api/requisitions/${created.id}/convert`, payload: convertPayload(refs) },
        adminCookie,
      )
    ).json() as Requisition
    const response = await call({ method: 'DELETE', url: `/api/purchases/${converted.purchaseId}` })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ error: 'Purchase has Requisition', statusCode: 409 })
    expect((await listPurchases()).some((purchase) => purchase.id === converted.purchaseId)).toBe(true)
    expect((await listRequisitions()).some((row) => row.id === created.id)).toBe(true)
  })

  test('criterion 43: DELETE /api/purchases/:id with no Movement and no Requisition returns 204', async () => {
    const refs = await seedRefs()
    const created = await call({
      method: 'POST',
      url: '/api/purchases',
      payload: {
        supplierId: refs.supplier.id,
        itemId: refs.item.id,
        warehouseId: refs.warehouse.id,
        quantity: 2,
      },
    })
    const id = (created.json() as { id: string }).id
    const response = await call({ method: 'DELETE', url: `/api/purchases/${id}` })
    expect(response.statusCode).toBe(204)
    expect((await listPurchases()).some((purchase) => purchase.id === id)).toBe(false)
  })
})
