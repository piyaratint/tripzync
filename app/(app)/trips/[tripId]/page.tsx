export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, hotels, events, expenses, flights } from '@/lib/db/schema'
import { eq, and, asc, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { TripClient } from './TripClient'

type Props = { params: Promise<{ tripId: string }> }

export async function generateMetadata({ params }: Props) {
  const { tripId } = await params
  const session = await auth()
  const [trip] = await db.select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, session!.user!.id!)))
  if (!trip) return { title: 'Trip not found' }
  return { title: `${trip.title1} ${trip.title2} — TripZync®` }
}

export default async function TripPage({ params }: Props) {
  const { tripId } = await params
  const session = await auth()

  const [trip] = await db.select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, session!.user!.id!)))

  if (!trip) notFound()

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
    />
  )
}
