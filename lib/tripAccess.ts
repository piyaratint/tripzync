import { db } from '@/lib/db'
import { trips, tripMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/** True if userId is trip owner OR an accepted member */
export async function canAccessTrip(tripId: string, userId: string): Promise<boolean> {
  const [tripRow] = await db
    .select({ id: trips.id, userId: trips.userId })
    .from(trips)
    .where(eq(trips.id, tripId))
  if (!tripRow) return false
  if (tripRow.userId === userId) return true

  const [member] = await db
    .select({ id: tripMembers.id })
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)))
  return !!member
}

/** True only if userId is the trip owner */
export async function isOwnerTrip(tripId: string, userId: string): Promise<boolean> {
  const [tripRow] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
  return !!tripRow
}
