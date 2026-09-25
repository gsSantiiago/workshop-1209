import { describe, expect, test } from 'bun:test'
import sinon from 'sinon'
import { AssignmentRepository } from '../repositories/assignment.repository'
import { AssignmentService } from './assignment.service'

const valid = {
  staffId: 'staff-1',
  jobId: 'job-1',
  startsOn: '2026-09-01',
  endsOn: '2026-09-30',
}
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function stubRefs(assignments: sinon.SinonStubbedInstance<AssignmentRepository>) {
  assignments.existsStaff.resolves(true)
  assignments.existsJob.resolves(true)
}

function uniqueByCode() {
  return Object.assign(
    new Error('UNIQUE constraint failed: assignments.staff_id, assignments.job_id, assignments.starts_on, assignments.ends_on'),
    { code: 'SQLITE_CONSTRAINT_UNIQUE' },
  )
}

function uniqueByMessage() {
  return new Error(
    'UNIQUE constraint failed: assignments.staff_id, assignments.job_id, assignments.starts_on, assignments.ends_on',
  )
}

function uniqueByCause() {
  return Object.assign(new Error('wrapped'), { cause: uniqueByCode() })
}

describe('AssignmentService', () => {
  test('C8 create persists Assignment with period and does not touch Stock', async () => {
    for (const period of [
      { startsOn: '2026-09-01', endsOn: '2026-09-30' },
      { startsOn: '2026-09-01', endsOn: '2026-09-01' },
    ]) {
      const assignments = sinon.createStubInstance(AssignmentRepository)
      stubRefs(assignments)
      assignments.create.resolves()
      const service = new AssignmentService(assignments)

      const created = await service.create({ ...valid, ...period })

      expect(created.id).toMatch(UUID)
      expect(created.createdAt).toMatch(ISO_8601)
      expect(created.staffId).toBe('staff-1')
      expect(created.jobId).toBe('job-1')
      expect(created.startsOn).toBe(period.startsOn)
      expect(created.endsOn).toBe(period.endsOn)
      expect('quantity' in created).toBe(false)
      expect(assignments.create.calledOnce).toBe(true)
      expect(assignments.create.firstCall.args[0]).toEqual(created)
    }
  })

  test('C10 create with missing or unknown Staff or Job throws 400 and does not call repository.create', async () => {
    const cases = [
      { staffId: '', jobId: 'job-1', staffExists: true, jobExists: true },
      { staffId: 'staff-1', jobId: '', staffExists: true, jobExists: true },
      { staffId: 'staff-1', jobId: 'job-1', staffExists: false, jobExists: true },
      { staffId: 'staff-1', jobId: 'job-1', staffExists: true, jobExists: false },
    ]

    for (const input of cases) {
      const assignments = sinon.createStubInstance(AssignmentRepository)
      assignments.existsStaff.resolves(input.staffExists)
      assignments.existsJob.resolves(input.jobExists)
      const service = new AssignmentService(assignments)

      try {
        await service.create({
          staffId: input.staffId,
          jobId: input.jobId,
          startsOn: valid.startsOn,
          endsOn: valid.endsOn,
        })
        throw new Error(`expected create to throw for ${JSON.stringify(input)}`)
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('Staff or Job not found')
      }

      expect(assignments.create.notCalled).toBe(true)
    }
  })

  test('C11 create with missing or invalid period throws 400 and does not call repository.create', async () => {
    const cases = [
      { startsOn: undefined, endsOn: '2026-09-30' },
      { startsOn: '2026-09-01', endsOn: undefined },
      { startsOn: '', endsOn: '2026-09-30' },
      { startsOn: '2026-09-01', endsOn: '' },
      { startsOn: '   ', endsOn: '2026-09-30' },
      { startsOn: '2026-09-01', endsOn: '   ' },
      { startsOn: '2026-9-01', endsOn: '2026-09-30' },
      { startsOn: '2026-09-01', endsOn: '2026-9-30' },
      { startsOn: '2026/09/01', endsOn: '2026-09-30' },
      { startsOn: '2026-09-01T00:00:00Z', endsOn: '2026-09-30' },
      { startsOn: '09-01-2026', endsOn: '2026-09-30' },
    ]

    for (const period of cases) {
      const assignments = sinon.createStubInstance(AssignmentRepository)
      stubRefs(assignments)
      const service = new AssignmentService(assignments)

      try {
        await service.create({
          staffId: valid.staffId,
          jobId: valid.jobId,
          startsOn: period.startsOn,
          endsOn: period.endsOn,
        })
        throw new Error(`expected create to throw for ${JSON.stringify(period)}`)
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(400)
        expect((error as Error).message).toBe('startsOn and endsOn are required as YYYY-MM-DD')
      }

      expect(assignments.create.notCalled).toBe(true)
    }
  })

  test('C12 create with endsOn before startsOn throws 400 and does not call repository.create', async () => {
    const assignments = sinon.createStubInstance(AssignmentRepository)
    stubRefs(assignments)
    const service = new AssignmentService(assignments)

    try {
      await service.create({
        ...valid,
        startsOn: '2026-09-30',
        endsOn: '2026-09-01',
      })
      throw new Error('expected create to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(400)
      expect((error as Error).message).toBe('endsOn must be on or after startsOn')
    }

    expect(assignments.create.notCalled).toBe(true)
  })

  test('C13 create maps a unique-constraint error to 409 Assignment already exists', async () => {
    const errors = [uniqueByCode(), uniqueByMessage(), uniqueByCause()]

    for (const thrown of errors) {
      const assignments = sinon.createStubInstance(AssignmentRepository)
      stubRefs(assignments)
      assignments.create.rejects(thrown)
      const service = new AssignmentService(assignments)

      try {
        await service.create(valid)
        throw new Error('expected create to throw')
      } catch (error) {
        expect((error as Error & { statusCode: number }).statusCode).toBe(409)
        expect((error as Error).message).toBe('Assignment already exists')
      }
    }
  })

  test('C15 deleteById succeeds when the repository deletes the row', async () => {
    const assignments = sinon.createStubInstance(AssignmentRepository)
    assignments.deleteById.resolves(true)
    const service = new AssignmentService(assignments)
    await service.deleteById('assignment-1')
    expect(assignments.deleteById.calledOnceWith('assignment-1')).toBe(true)
  })

  test('C16 deleteById throws 404 when the repository deletes nothing', async () => {
    const assignments = sinon.createStubInstance(AssignmentRepository)
    assignments.deleteById.resolves(false)
    const service = new AssignmentService(assignments)

    try {
      await service.deleteById('missing')
      throw new Error('expected deleteById to throw')
    } catch (error) {
      expect((error as Error & { statusCode: number }).statusCode).toBe(404)
      expect((error as Error).message).toBe('Assignment not found')
    }
  })
})
