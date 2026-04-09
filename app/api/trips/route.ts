import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips } from '@/lib/db/schema'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title1, title2, subtitle, destination, destCity, startDate, endDate, currency } = body

  if (!destination || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [trip] = await db.insert(trips).values({
    userId: session.user.id,
    title1,
    title2,
    subtitle,
    destination,
    destCity,
    startDate,
    endDate,
    currency,
  }).returning()

  return NextResponse.json(trip)
}