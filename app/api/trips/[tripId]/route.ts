import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, hotels } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { updateTripSchema } from '@/lib/validations'
import { z } from 'zod'

type Params = { params: Promise<{ tripId: string }> }

async function getTripOrFail(tripId: string, userId: string) {
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
  return trip ?? null
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const trip = await getTripOrFail(tripId, session.user.id)
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const hotelRows = await db
    .select()
    .from(hotels)
    .where(eq(hotels.tripId, tripId))
    .orderBy(hotels.sortOrder)

  return NextResponse.json({ trip, hotels: hotelRows })
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const trip = await getTripOrFail(tripId, session.user.id)
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const input = updateTripSchema.parse(body)

    const [updated] = await db
      .update(trips)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(trips.id, tripId))
      .returning()

    // Sync hotels array if provided
    if (Array.isArray(body.hotels)) {
      await db.delete(hotels).where(eq(hotels.tripId, tripId))
      if (body.hotels.length > 0) {
        await db.insert(hotels).values(
          body.hotels.map((h: { name: string; fromDate?: string }, i: number) => ({
            tripId,
            name: h.name,
            fromDate: h.fromDate ?? null,
            sortOrder: i,
          }))
        )
      }
    }

    return NextResponse.json({ trip: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 422 })
    }
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const trip = await getTripOrFail(tripId, session.user.id)
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Cascades to hotels, events, expenses, flights via FK
  await db.delete(trips).where(eq(trips.id, tripId))
  return NextResponse.json({ success: true })
}
