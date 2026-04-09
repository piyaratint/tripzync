import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, events, expenses, hotels } from '@/lib/db/schema'
import { eq, and, asc, sum, count } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { detectCurrency, fmtDate, daysBetween } from '@/lib/utils'

type Props = { params: Promise<{ tripId: string }> }

export default async function LogbookPage({ params }: Props) {
  const { tripId } = await params
  const session = await auth()

  const [trip] = await db.select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, session!.user!.id!)))
  if (!trip) notFound()

  const [eventRows, expenseRows, hotelRows] = await Promise.all([
    db.select().from(events).where(eq(events.tripId, tripId)).orderBy(asc(events.date), asc(events.sortOrder)),
    db.select().from(expenses).where(eq(expenses.tripId, tripId)),
    db.select().from(hotels).where(eq(hotels.tripId, tripId)).orderBy(hotels.sortOrder),
  ])

  const [totRow] = await db
    .select({ total: sum(expenses.amount) })
    .from(expenses)
    .where(eq(expenses.tripId, tripId))

  const currency = detectCurrency(trip.destCity ?? trip.destination)
  const grandTotal = parseFloat(String(totRow?.total ?? 0))
  const numDays = daysBetween(trip.startDate, trip.endDate)
  const start = new Date(trip.startDate + 'T00:00:00')
  const end = new Date(trip.endDate + 'T00:00:00')

  // Group events by date for the day-by-day log
  const byDate = eventRows.reduce<Record<string, typeof eventRows>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <header style={{ padding: '40px 0 32px', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <Link href={`/trips/${tripId}`} style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: '.16em', color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          ← Back to Logbook
        </Link>

        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: '.2em', color: 'var(--sakura)', textTransform: 'uppercase', marginBottom: 8 }}>
          Trip Summary
        </div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 'clamp(40px,8vw,72px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: .9, color: '#fff', marginBottom: 16 }}>
          {trip.title1}<br /><em style={{ color: 'var(--red)' }}>{trip.title2}</em>
        </div>
        <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, fontWeight: 300, letterSpacing: '.12em', color: 'var(--sakura)' }}>
          {trip.subtitle}
        </p>
      </header>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Days',         val: numDays },
          { label: 'Activities',   val: eventRows.filter(e => !e.isKey).length },
          { label: 'Transactions', val: expenseRows.length },
          { label: 'Total Spent',  val: `${currency.symbol}${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 900, fontStyle: 'italic', color: '#fff', lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Trip details */}
      <div style={{ marginBottom: 32, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 3 }}>Dates</div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: 'rgba(255,255,255,.8)' }}>{fmtDate(start)} – {fmtDate(end)}</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 3 }}>Destination</div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: 'rgba(255,255,255,.8)' }}>{trip.destination}</div>
        </div>
        {hotelRows.map(h => (
          <div key={h.id}>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 3 }}>
              {h.fromDate ? `Hotel from ${h.fromDate}` : 'Hotel'}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: 'rgba(255,255,255,.8)' }}>{h.name}</div>
          </div>
        ))}
      </div>

      {/* Day-by-day log */}
      <div style={{ marginBottom: 12 }}>
        <div className="section-head">
          <div className="section-line" />
          <span className="section-label">Day-by-Day</span>
          <div className="section-line" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(byDate).map(([date, dayEvents]) => {
          const d = new Date(date + 'T00:00:00')
          const dn = d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })
          return (
            <div key={date} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff' }}>{dn}</div>
              </div>
              <div style={{ padding: '4px 0' }}>
                {dayEvents.map((ev, i) => (
                  <div key={ev.id} style={{ padding: '8px 16px', borderBottom: i < dayEvents.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, color: 'var(--muted)', width: 36, flexShrink: 0, paddingTop: 2 }}>{ev.time ?? ''}</span>
                    <div>
                      <div style={{ fontFamily: "'Noto Sans JP'", fontSize: 11, color: 'rgba(255,255,255,.85)', marginBottom: 2 }}>{ev.act}</div>
                      {ev.sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)' }}>{ev.sub}</div>}
                      {(ev.fromPlace || ev.toPlace) && (
                        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase', marginTop: 3 }}>
                          {ev.fromPlace}{ev.fromPlace && ev.toPlace ? ' → ' : ''}{ev.toPlace}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center', fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: '.16em', color: 'rgba(255,255,255,.15)', textTransform: 'uppercase' }}>
        TripZync® · {trip.title1} {trip.title2}
      </div>
    </div>
  )
}
