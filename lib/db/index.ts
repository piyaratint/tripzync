import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// Standard postgres.js connection — works with any PostgreSQL server
// (Neon, Supabase, Jelastic, self-hosted, etc.)
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,          // max connections in pool
  idle_timeout: 30, // close idle connections after 30s
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })

export type DB = typeof db
