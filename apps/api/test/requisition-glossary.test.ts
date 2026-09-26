import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'

const context = readFileSync(join(import.meta.dir, '../../../CONTEXT.md'), 'utf8')

describe('requisition glossary', () => {
  test('criterion 23: CONTEXT.md defines Requisition and avoids pedido and Purchase as this ask', () => {
    expect(context).toMatch(
      /\*\*Requisition\*\*:[\s\S]*the ask for one Item, one quantity, and one Job\. It does not write Stock\.[\s\S]*pedido[\s\S]*Purchase \(as this ask\)/,
    )
  })
})
