import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { config } from '../config/env'
import * as schema from './schema'

export function createDb() {
  mkdirSync(dirname(config.DB_FILE_NAME), { recursive: true })
  const sqlite = new Database(config.DB_FILE_NAME, { create: true })
  sqlite.exec('PRAGMA journal_mode = WAL;')
  sqlite.exec('PRAGMA foreign_keys = ON;')
  return drizzle({ client: sqlite, schema })
}

export type AppDatabase = ReturnType<typeof createDb>
