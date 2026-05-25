import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// postgres.js is lazy — calling postgres() sets up pool config but does NOT
// open any TCP connections until the first query runs. It is safe to call at
// module load time even during Next.js build prerendering.
//
// We fall back to a placeholder URL when DATABASE_URL is absent (build-time
// static analysis) so the module loads without throwing. Any actual query
// attempted without a real URL will fail at runtime — but with
// dynamic = 'force-dynamic' on the auth layout, no queries run at build time.
const client = postgres(process.env.DATABASE_URL ?? 'postgresql://localhost/build_placeholder', {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
})

// Real Drizzle instance — passes DrizzleAdapter's instanceof PgDatabase check
export const db = drizzle(client, { schema })

export type DB = typeof db
