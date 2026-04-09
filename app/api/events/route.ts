import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { events, trips } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { createEventSchema, updateEventSchema } from '@/lib/validations'
import { z } from 'zod'

// Verify trip ownership
async function ownedTrip(tripId: string, userId: string) {
  const [trip] = await db.select({ id: trips.id })
    .from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
  return !!trip
}

// GET /api/events?tripId=xxx[&date=YYYY-MM-DD]
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tripId = searchParams.get('tripId')
  if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 })

  if (!await ownedTrip(tripId, session.user.id))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = await db
    .select()
    .from(events)
    .where(eq(events.tripId, tripId))
    .orderBy(asc(events.date), asc(events.sortOrder), asc(events.time))

  return NextResponse.json({ events: rows })
}

// POST /api/events
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { tripId, ...input } = body
    const parsed = createEventSchema.parse(input)

    if (!await ownedTrip(tripId, session.user.id))
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [event] = await db
      .insert(events)
      .values({ tripId, ...parsed })
      .returning()

    return NextResponse.json({ event }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 422 })
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

// PATCH /api/events?id=xxx
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Verify ownership via trip join
  const [existing] = await db.select().from(events).where(eq(events.id, id))
  if (!existing || !await ownedTrip(existing.tripId, session.user.id))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const patch = updateEventSchema.parse(body)

    const [updated] = await db
      .update(events)
      .set(patch)
      .where(eq(events.id, id))
      .returning()

    return NextResponse.json({ event: updated })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 422 })
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/events?id=xxx
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const [existing] = await db.select().from(events).where(eq(events.id, id))
  if (!existing || !await ownedTrip(existing.tripId, session.user.id))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(events).where(eq(events.id, id))
  return NextResponse.json({ success: true })
}
