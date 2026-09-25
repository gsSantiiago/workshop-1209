import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { assignments, jobs, staff } from '../db/schema'

export type AssignmentRecord = {
  id: string
  staffId: string
  jobId: string
  startsOn: string
  endsOn: string
  createdAt: string
}

export class AssignmentRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<AssignmentRecord[]> {
    const rows = await this.db.select().from(assignments)
    return rows.map(toAssignment)
  }

  async existsStaff(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: staff.id })
      .from(staff)
      .where(eq(staff.id, id))
      .limit(1)
    return rows.length > 0
  }

  async existsJob(id: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1)
    return rows.length > 0
  }

  async create(assignment: AssignmentRecord): Promise<void> {
    await this.db.insert(assignments).values({
      id: assignment.id,
      staffId: assignment.staffId,
      jobId: assignment.jobId,
      startsOn: assignment.startsOn,
      endsOn: assignment.endsOn,
      createdAt: assignment.createdAt,
    })
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(assignments)
      .where(eq(assignments.id, id))
      .returning({ id: assignments.id })
    return deleted.length > 0
  }
}

function toAssignment(row: typeof assignments.$inferSelect): AssignmentRecord {
  return {
    id: row.id,
    staffId: row.staffId,
    jobId: row.jobId,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    createdAt: row.createdAt,
  }
}
