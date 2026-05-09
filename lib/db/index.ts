import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Cache HTTP connections to reduce Neon cold-start latency
neonConfig.fetchConnectionCache = true

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

export type DB = typeof db
