import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'

const context = readFileSync(join(import.meta.dir, '../../../CONTEXT.md'), 'utf8')

describe('staff glossary', () => {
  test('C22 CONTEXT.md defines Staff and Assignment and User remains not Staff', () => {
    expect(context).toContain('**Staff**:')
    expect(context).toContain('**Assignment**:')
    expect(context).toMatch(/\*\*User\*\*:[\s\S]*Not Staff/)
  })
})
