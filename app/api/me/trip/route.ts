import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips } from '@/lib/db/schema'
import { eq, isNull, and, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// Returns { loggedIn: boolean, trip: Trip | null }
// Used by the home page on mount to decide:
//   - not logged in → guest mode (use localStorage)
//   - logged in, trip found → load trip from DB
//   - logged in, no trip → redirect to /plan (onboarding)
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ loggedIn: false, trip: null })
  }

  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.userId, session.user.id), isNull(trips.deletedAt)))
    .orderBy(desc(trips.createdAt))
    .limit(1)

  return NextResponse.json({
    loggedIn: true,
    trip: trip ?? null,
    userName: session.user.name ?? null,
  })
}
