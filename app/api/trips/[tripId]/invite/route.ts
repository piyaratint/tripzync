import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, tripInvites } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

type Params = { params: Promise<{ tripId: string }> }

function baseUrl() {
  return (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
}

// GET — return existing invite link (if any)
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const [trip] = await db.select({ id: trips.id })
    .from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [invite] = await db.select().from(tripInvites).where(eq(tripInvites.tripId, tripId))
  if (!invite) return NextResponse.json({ token: null, url: null })

  return NextResponse.json({ token: invite.token, url: `${baseUrl()}/invite/${invite.token}` })
}

// POST — generate (or replace) invite link
export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const [trip] = await db.select({ id: trips.id })
    .from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(tripInvites).where(eq(tripInvites.tripId, tripId))
  const token = randomUUID()
  await db.insert(tripInvites).values({ tripId, token, createdBy: session.user.id })

  return NextResponse.json({ token, url: `${baseUrl()}/invite/${token}` })
}
