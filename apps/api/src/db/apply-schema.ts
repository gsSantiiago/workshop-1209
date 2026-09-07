import type { Database } from 'bun:sqlite'

export function applySchema(sqlite: Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS items_sku_unique ON items (sku);
  `)
}
