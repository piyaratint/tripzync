export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { fmtDate, daysBetween } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await auth()
  const userTrips = await db
    .select()
    .from(trips)
    .where(eq(trips.userId, session!.user!.id!))
    .orderBy(desc(trips.createdAt))

  return (
    <div className="page">
      <header style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
        <div className="hero-eyebrow">
          <div className="eyebrow-dots"><span /><span className="r" /><span /></div>
          <span className="eyebrow-text">TripZync® · Dashboard</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 'clamp(40px,8vw,72px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.9, marginTop: 8 }}>
          My <em style={{ color: 'var(--red)' }}>Trips</em>
        </h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {/* New trip card */}
        <Link href="/trips/new" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.15)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 160, cursor: 'pointer', transition: 'border-color .2s' }}>
            <span style={{ fontSize: 28, opacity: .5 }}>+</span>
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>New Trip</span>
          </div>
        </Link>

        {userTrips.map(trip => (
          <Link key={trip.id} href={`/trips/${trip.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, minHeight: 160, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', transition: 'border-color .2s', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 36, opacity: .07 }}>🌸</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--sakura)', textTransform: 'uppercase' }}>
                {trip.destination}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 28, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
                {trip.title1}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1, color: 'var(--red)' }}>
                {trip.title2}
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                <div>
                  <div className="meta-label">Dates</div>
                  <div className="meta-val" style={{ fontSize: 10 }}>
                    {fmtDate(new Date(trip.startDate + 'T00:00:00'))} – {fmtDate(new Date(trip.endDate + 'T00:00:00'))}
                  </div>
                </div>
                <div>
                  <div className="meta-label">Duration</div>
                  <div className="meta-val" style={{ fontSize: 10 }}>
                    {daysBetween(trip.startDate, trip.endDate)} days
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
