import { createDb } from '../db/client'
import { container, tokens } from './container'

export function registerServices(): void {
  container.register(tokens.db, () => createDb())
}
