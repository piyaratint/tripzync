import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, tripMembers } from '@/lib/db/schema'
import { eq, desc, inArray, isNull, and } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { fmtDate, daysBetween } from '@/lib/utils'
import { TripCard } from './TripCard'
import { PendingTripSaver } from '@/components/PendingTripSaver'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const ownedTrips = await db
    .select()
    .from(trips)
    .where(and(eq(trips.userId, userId), isNull(trips.deletedAt)))
    .orderBy(desc(trips.createdAt))

  const memberships = await db
    .select({ tripId: tripMembers.tripId })
    .from(tripMembers)
    .where(eq(tripMembers.userId, userId))

  const sharedTrips = memberships.length > 0
    ? await db
        .select()
        .from(trips)
        .where(and(
          inArray(trips.id, memberships.map(m => m.tripId)),
          isNull(trips.deletedAt),
        ))
        .orderBy(desc(trips.createdAt))
    : []

  return (
    <div className="page">
      <PendingTripSaver />
      <header style={{ padding: '32px 0 28px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
        <div className="hero-eyebrow">
          <div className="eyebrow-dots"><span /><span className="r" /><span /></div>
          <span className="eyebrow-text">TripZync® · Dashboard</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 'clamp(40px,8vw,72px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.9, marginTop: 8 }}>
          My <em style={{ color: 'var(--red)' }}>Trips</em>
        </h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        <Link href="/trips/new" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.15)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 160, cursor: 'pointer', transition: 'border-color .2s' }}>
            <span style={{ fontSize: 28, opacity: .5 }}>+</span>
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#fff' }}>New Trip</span>
          </div>
        </Link>

        {ownedTrips.map(trip => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

      {ownedTrips.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#fff' }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>🌸</div>
          <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            No trips yet
          </p>
          <p style={{ fontFamily: "'Noto Sans JP'", fontSize: 12, color: '#fff' }}>
            Tap <strong style={{ color: '#fff' }}>+ New Trip</strong> above to plan your first adventure.
          </p>
        </div>
      )}

      {sharedTrips.length > 0 && (
        <>
          <div style={{ margin: '40px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: '#fff' }}>Shared With Me</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {sharedTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} shared />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
