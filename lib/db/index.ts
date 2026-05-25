import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Neon serverless driver — uses HTTP, optimised for Vercel's serverless runtime.
// For Jelastic (self-hosted), switch to the prod branch which uses postgres.js.
neonConfig.fetchConnectionCache = true

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

export type DB = typeof db
