import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// Lazy singleton — postgres() is only called when the first query runs,
// not at module load time (which happens during Next.js build prerendering).
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    const client = postgres(process.env.DATABASE_URL, {
      max: 10,          // max connections in pool
      idle_timeout: 30, // close idle connections after 30s
      connect_timeout: 10,
    })
    _db = drizzle(client, { schema })
  }
  return _db
}

// `db` is a proxy that initialises the real client on first property access.
// This means importing this module never opens a DB connection — safe during build.
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type DB = ReturnType<typeof getDb>
