import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { flights, trips } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const [trip] = await db.select().from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { direction, flightNum, airline, depAirport, arrAirport, depTime, arrTime, flightDate } = await req.json()

  // Upsert: delete existing for this direction then insert
  await db.delete(flights).where(and(eq(flights.tripId, tripId), eq(flights.direction, direction)))
  await db.insert(flights).values({ tripId, direction, flightNum, airline, depAirport, arrAirport, depTime, arrTime, flightDate })

  const updatedFlights = await db.select().from(flights).where(eq(flights.tripId, tripId))
  return NextResponse.json({ flights: updatedFlights })
}
