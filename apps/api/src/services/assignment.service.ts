import { AssignmentRepository, type AssignmentRecord } from '../repositories/assignment.repository'

export type AssignmentInput = {
  staffId?: string
  jobId?: string
  startsOn?: string
  endsOn?: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export class AssignmentService {
  constructor(private readonly assignments: AssignmentRepository) {}

  list(): Promise<AssignmentRecord[]> | AssignmentRecord[] {
    return this.assignments.list()
  }

  async create(input: AssignmentInput): Promise<AssignmentRecord> {
    const staffId = input.staffId?.trim() ?? ''
    const jobId = input.jobId?.trim() ?? ''
    if (!staffId || !jobId || !(await this.assignments.existsStaff(staffId)) || !(await this.assignments.existsJob(jobId))) {
      throw httpError('Staff or Job not found', 400)
    }

    const startsOn = input.startsOn?.trim() ?? ''
    const endsOn = input.endsOn?.trim() ?? ''
    if (!ISO_DATE.test(startsOn) || !ISO_DATE.test(endsOn)) {
      throw httpError('startsOn and endsOn are required as YYYY-MM-DD', 400)
    }
    if (endsOn < startsOn) {
      throw httpError('endsOn must be on or after startsOn', 400)
    }

    const assignment: AssignmentRecord = {
      id: crypto.randomUUID(),
      staffId,
      jobId,
      startsOn,
      endsOn,
      createdAt: new Date().toISOString(),
    }

    try {
      await this.assignments.create(assignment)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw httpError('Assignment already exists', 409)
      }
      throw error
    }

    return assignment
  }

  async deleteById(id: string): Promise<void> {
    const deleted = await this.assignments.deleteById(id)
    if (!deleted) {
      throw httpError('Assignment not found', 404)
    }
  }
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
