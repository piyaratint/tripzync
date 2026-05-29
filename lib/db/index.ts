import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// postgres.js connects to Neon (or any Postgres) over TCP.
// It is lazy — no socket is opened until the first query runs.
// Works on Vercel (Node.js runtime) and Jelastic alike.
//
// Note: @neondatabase/serverless v0.10 broke the neon-http Drizzle adapter
// (sql() must now be used as a tagged template only). postgres.js avoids this.
const client = postgres(process.env.DATABASE_URL ?? 'postgresql://localhost/build_placeholder', {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? 'require' : false,
})

export const db = drizzle(client, { schema })

export type DB = typeof db
