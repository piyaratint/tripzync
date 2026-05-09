'use server'

import { signIn, signOut } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function googleSignIn() {
  // Pre-warm the Neon connection BEFORE redirecting to Google.
  // Neon serverless databases suspend after inactivity; the first query
  // after a cold start takes 1-3 s and causes the OAuth callback to time
  // out (shown as "Configuration" error).  By firing SELECT 1 here, the
  // connection is warm for the ~5-10 s Google round-trip takes, so the
  // callback succeeds on the very first attempt.
  try {
    await db.execute(sql`SELECT 1`)
  } catch {
    // Ignore — if the ping fails we still try to sign in
  }

  await signIn('google', { redirectTo: '/dashboard' })
}

export async function googleSignOut() {
  await signOut({ redirectTo: '/' })
}
