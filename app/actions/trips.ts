'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function softDeleteTrip(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db
    .update(trips)
    .set({ deletedAt: new Date() })
    .where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))

  revalidatePath('/dashboard')
}
