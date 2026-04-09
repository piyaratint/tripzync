import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { createEventSchema, updateEventSchema } from '@/lib/validations'
import { z } from 'zod'
import { canAccessTrip } from '@/lib/tripAccess'

// GET /api/events?tripId=xxx
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tripId = searchParams.get('tripId')
  if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 })

  if (!await canAccessTrip(tripId, session.user.id))
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

    if (!await canAccessTrip(tripId, session.user.id))
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

  const [existing] = await db.select().from(events).where(eq(events.id, id))
  if (!existing || !await canAccessTrip(existing.tripId, session.user.id))
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
  if (!existing || !await canAccessTrip(existing.tripId, session.user.id))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(events).where(eq(events.id, id))
  return NextResponse.json({ success: true })
}
