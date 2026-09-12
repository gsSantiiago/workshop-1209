import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'

const context = readFileSync(join(import.meta.dir, '../../../CONTEXT.md'), 'utf8')

describe('procurement glossary', () => {
  test('C27 CONTEXT.md defines Supplier and Purchase and Receipt avoids Purchase as this Movement', () => {
    expect(context).toContain('**Supplier**:')
    expect(context).toContain('**Purchase**:')
    expect(context).toMatch(/\*\*Receipt\*\*:[\s\S]*Purchase \(as this Movement\)/)
  })
})
