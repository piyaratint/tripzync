import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, hotels, events, expenses, flights, tripMembers, authUsers } from '@/lib/db/schema'
import { eq, asc, desc, and, or } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { TripClient } from './TripClient'
import { canAccessTrip } from '@/lib/tripAccess'

type Props = { params: Promise<{ tripId: string }> }

export async function generateMetadata({ params }: Props) {
  const { tripId } = await params
  const session = await auth()
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId))
  if (!trip) return { title: 'Trip not found' }
  return { title: `${trip.title1} ${trip.title2} — TripZync®` }
}

export default async function TripPage({ params }: Props) {
  const { tripId } = await params
  const session = await auth()
  const userId = session!.user!.id!

  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId))
  if (!trip) notFound()

  if (!await canAccessTrip(tripId, userId)) notFound()

  const isOwner = trip.userId === userId

  // Fetch members for the invite panel (only owner needs this)
  const members = isOwner
    ? await db
        .select({
          userId: tripMembers.userId,
          name: authUsers.name,
          image: authUsers.image,
          joinedAt: tripMembers.joinedAt,
        })
        .from(tripMembers)
        .leftJoin(authUsers, eq(tripMembers.userId, authUsers.id))
        .where(eq(tripMembers.tripId, tripId))
    : []

  const [hotelRows, eventRows, expenseRows, flightRows] = await Promise.all([
    db.select().from(hotels).where(eq(hotels.tripId, tripId)).orderBy(asc(hotels.sortOrder)),
    db.select().from(events).where(eq(events.tripId, tripId)).orderBy(asc(events.date), asc(events.sortOrder)),
    db.select().from(expenses).where(eq(expenses.tripId, tripId)).orderBy(desc(expenses.createdAt)),
    db.select().from(flights).where(eq(flights.tripId, tripId)),
  ])

  return (
    <TripClient
      trip={trip}
      hotels={hotelRows}
      events={eventRows}
      expenses={expenseRows}
      flights={flightRows}
      isOwner={isOwner}
      members={members}
    />
  )
}
