import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

async function run() {
  const envPath = resolve(process.cwd(), '.env.local')
  const env = readFileSync(envPath, 'utf8')
  const dbUrl = env.match(/DATABASE_URL=([^\n]+)/)?.[1]?.trim()
  if (!dbUrl) throw new Error('DATABASE_URL not found in .env.local')

  const sql = neon(dbUrl)
  await sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_meta jsonb`
  console.log('✓ trip_meta column added (or already existed)')
}

run().catch(e => { console.error(e); process.exit(1) })
