import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { hotels, trips } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function ownedTrip(tripId: string, userId: string) {
  const [trip] = await db.select({ id: trips.id })
    .from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
  return !!trip
}

// POST /api/hotels
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId, name, fromDate, mapsUrl } = await req.json()
  if (!tripId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (!await ownedTrip(tripId, session.user.id))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [hotel] = await db.insert(hotels).values({ tripId, name, fromDate, mapsUrl }).returning()
  return NextResponse.json({ hotel }, { status: 201 })
}

// DELETE /api/hotels?id=xxx
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const [existing] = await db.select().from(hotels).where(eq(hotels.id, id))
  if (!existing || !await ownedTrip(existing.tripId, session.user.id))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(hotels).where(eq(hotels.id, id))
  return NextResponse.json({ success: true })
}
