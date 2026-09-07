import { config } from '../config/env'
import { createDb } from './client'

createDb()
console.log(`applied schema to ${config.DB_FILE_NAME}`)
