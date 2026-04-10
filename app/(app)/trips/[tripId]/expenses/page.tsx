import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, expenses } from '@/lib/db/schema'
import { eq, and, desc, sum } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { detectCurrency } from '@/lib/utils'
import Link from 'next/link'

type Props = { params: Promise<{ tripId: string }> }

const CAT_COLORS: Record<string, string> = {
  Dining:        'rgba(255,140,50,.22)',
  Transport:     'rgba(30,160,220,.2)',
  Entertainment: 'rgba(168,85,247,.2)',
  Accommodation: 'rgba(244,167,192,.15)',
  Others:        'rgba(255,255,255,.08)',
}
const CAT_TEXT: Record<string, string> = {
  Dining:        '#ffaa55',
  Transport:     '#65d0f7',
  Entertainment: '#d09bf7',
  Accommodation: '#f4a7c0',
  Others:        'rgba(255,255,255,.7)',
}

export default async function ExpensesPage({ params }: Props) {
  const { tripId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [trip] = await db.select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
  if (!trip) notFound()

  const rows = await db.select()
    .from(expenses)
    .where(eq(expenses.tripId, tripId))
    .orderBy(desc(expenses.createdAt))

  const [totRow] = await db
    .select({ total: sum(expenses.amount) })
    .from(expenses)
    .where(eq(expenses.tripId, tripId))

  const grandTotal = parseFloat(String(totRow?.total ?? 0))
  const currency = detectCurrency(trip.destCity ?? trip.destination)

  // Group by category for summary
  const byCategory = rows.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + parseFloat(String(e.amount))
    return acc
  }, {})

  return (
    <div className="page">
      <header style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
        <Link href={`/trips/${tripId}`} style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: '.16em', color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          ← Back to Logbook
        </Link>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: '.18em', color: 'var(--sakura)', textTransform: 'uppercase', marginBottom: 6 }}>
          {trip.destination}
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 'clamp(36px,7vw,64px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: .9, color: '#fff' }}>
          Expense <em style={{ color: 'var(--red)' }}>Ledger</em>
        </h1>
      </header>

      {/* Grand total + category breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.2em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Grand Total</div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 40, fontWeight: 900, fontStyle: 'italic', lineHeight: 1, color: '#fff' }}>
            {currency.symbol}{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>
            {rows.length} transactions
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, padding: '2px 8px', borderRadius: 20, background: CAT_COLORS[cat] ?? 'rgba(255,255,255,.08)', color: CAT_TEXT[cat] ?? '#fff', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                {cat}
              </span>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((amt / grandTotal) * 100)}%`, background: CAT_TEXT[cat] ?? '#fff', borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)', minWidth: 60, textAlign: 'right' }}>
                {currency.symbol}{amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Full transaction list */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12 }}>
          <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--muted)', textTransform: 'uppercase' }}>Description</span>
          <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--muted)', textTransform: 'uppercase' }}>Category</span>
          <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</span>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: '.1em', color: 'rgba(255,255,255,.2)', textTransform: 'uppercase' }}>
            No expenses yet
          </div>
        )}
        {rows.map((e, i) => (
          <div key={e.id} style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
            <div>
              <div style={{ fontFamily: "'Noto Sans JP'", fontSize: 11, color: 'rgba(255,255,255,.85)', marginBottom: 2 }}>{e.item}</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>{e.date}</div>
            </div>
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, padding: '2px 8px', borderRadius: 20, background: CAT_COLORS[e.category] ?? 'rgba(255,255,255,.08)', color: CAT_TEXT[e.category] ?? '#fff', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {e.category}
            </span>
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, fontStyle: 'italic', color: '#fff', textAlign: 'right', whiteSpace: 'nowrap' }}>
              {currency.symbol}{parseFloat(String(e.amount)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
