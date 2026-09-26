import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { config } from '../config/env'
import { applySchema } from './apply-schema'
import * as schema from './schema'

export function createDb() {
  mkdirSync(dirname(config.DB_FILE_NAME), { recursive: true })
  const sqlite = new Database(config.DB_FILE_NAME, { create: true })
  sqlite.exec('PRAGMA journal_mode = WAL;')
  sqlite.exec('PRAGMA foreign_keys = ON;')
  sqlite.exec('PRAGMA busy_timeout = 5000;')
  applySchema(sqlite)
  return drizzle({ client: sqlite, schema })
}

export type AppDatabase = ReturnType<typeof createDb>
