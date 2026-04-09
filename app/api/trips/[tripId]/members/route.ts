import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, tripMembers, authUsers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

type Params = { params: Promise<{ tripId: string }> }

// GET — list members (owner only)
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const [trip] = await db.select({ id: trips.id })
    .from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const members = await db
    .select({
      userId: tripMembers.userId,
      role: tripMembers.role,
      joinedAt: tripMembers.joinedAt,
      name: authUsers.name,
      image: authUsers.image,
    })
    .from(tripMembers)
    .leftJoin(authUsers, eq(tripMembers.userId, authUsers.id))
    .where(eq(tripMembers.tripId, tripId))

  return NextResponse.json({ members })
}

// DELETE ?userId=xxx — remove a member (owner can remove anyone; member can remove themselves)
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get('userId')
  if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const [trip] = await db.select({ id: trips.id, userId: trips.userId })
    .from(trips).where(eq(trips.id, tripId))
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = trip.userId === session.user.id
  const isSelf = targetUserId === session.user.id
  if (!isOwner && !isSelf) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.delete(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, targetUserId)))

  return NextResponse.json({ success: true })
}
