import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { eq, sum, desc } from 'drizzle-orm'
import { createExpenseSchema } from '@/lib/validations'
import { z } from 'zod'
import { canAccessTrip } from '@/lib/tripAccess'

// GET /api/expenses?tripId=xxx
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
    .from(expenses)
    .where(eq(expenses.tripId, tripId))
    .orderBy(desc(expenses.createdAt))

  const [totRow] = await db
    .select({ total: sum(expenses.amount) })
    .from(expenses)
    .where(eq(expenses.tripId, tripId))

  return NextResponse.json({
    expenses: rows,
    grandTotal: parseFloat(String(totRow?.total ?? 0)),
    count: rows.length,
  })
}

// POST /api/expenses
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { tripId, ...input } = body
    const parsed = createExpenseSchema.parse(input)

    if (!await canAccessTrip(tripId, session.user.id))
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [expense] = await db
      .insert(expenses)
      .values({ tripId, ...parsed, amount: String(parsed.amount) })
      .returning()

    const [totRow] = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(eq(expenses.tripId, tripId))

    return NextResponse.json({
      expense,
      grandTotal: parseFloat(String(totRow?.total ?? 0)),
      success: true,
    }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 422 })
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 })
  }
}

// PATCH /api/expenses?id=xxx
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const [existing] = await db.select().from(expenses).where(eq(expenses.id, id))
  if (!existing || !await canAccessTrip(existing.tripId, session.user.id))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    if (body.amount !== undefined) body.amount = parseFloat(body.amount)
    const parsed = createExpenseSchema.partial().parse(body)

    const { amount: parsedAmount, ...parsedRest } = parsed
    const [updated] = await db
      .update(expenses)
      .set({ ...parsedRest, ...(parsedAmount !== undefined ? { amount: String(parsedAmount) } : {}) })
      .where(eq(expenses.id, id))
      .returning()

    return NextResponse.json({ expense: updated, success: true })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 422 })
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE /api/expenses?id=xxx
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const [existing] = await db.select().from(expenses).where(eq(expenses.id, id))
  if (!existing || !await canAccessTrip(existing.tripId, session.user.id))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(expenses).where(eq(expenses.id, id))
  return NextResponse.json({ success: true })
}
