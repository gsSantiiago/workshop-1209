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

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS warehouses_name_unique ON warehouses (name);

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS jobs_name_unique ON jobs (name);

    CREATE TABLE IF NOT EXISTS stock (
      id TEXT PRIMARY KEY NOT NULL,
      warehouse_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS stock_warehouse_item_unique ON stock (warehouse_id, item_id);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
  `)
}
