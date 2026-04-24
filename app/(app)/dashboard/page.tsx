import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, tripMembers } from '@/lib/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { fmtDate, daysBetween } from '@/lib/utils'
import { SignOutButton } from '@/components/ui/SignOutButton'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id
  const user = session.user

  const ownedTrips = await db
    .select()
    .from(trips)
    .where(eq(trips.userId, userId))
    .orderBy(desc(trips.createdAt))

  const memberships = await db
    .select({ tripId: tripMembers.tripId })
    .from(tripMembers)
    .where(eq(tripMembers.userId, userId))

  const sharedTrips = memberships.length > 0
    ? await db
        .select()
        .from(trips)
        .where(inArray(trips.id, memberships.map(m => m.tripId)))
        .orderBy(desc(trips.createdAt))
    : []

  return (
    <div className="page">
      <header style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="hero-eyebrow">
            <div className="eyebrow-dots"><span /><span className="r" /><span /></div>
            <span className="eyebrow-text">TripZync® · Dashboard</span>
          </div>
          {/* User info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? ''}
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,.15)' }}
              />
            )}
            {!user.image && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(232,0,29,.25)', border: '1px solid rgba(232,0,29,.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, color: 'var(--red)',
              }}>
                {(user.name ?? user.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: '.1em', color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name ?? user.email}
            </span>
            <SignOutButton style={{
              background: 'none', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,.35)',
              fontFamily: "'Barlow Condensed'", fontSize: 10,
              letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
            }} />
          </div>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 'clamp(40px,8vw,72px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.9, marginTop: 8 }}>
          My <em style={{ color: 'var(--red)' }}>Trips</em>
        </h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        <Link href="/trips/new" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.15)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 160, cursor: 'pointer', transition: 'border-color .2s' }}>
            <span style={{ fontSize: 28, opacity: .5 }}>+</span>
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>New Trip</span>
          </div>
        </Link>

        {ownedTrips.map(trip => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

      {/* Empty state */}
      {ownedTrips.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,.25)' }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>🌸</div>
          <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            No trips yet
          </p>
          <p style={{ fontFamily: "'Noto Sans JP'", fontSize: 12, color: 'rgba(255,255,255,.18)' }}>
            Tap <strong style={{ color: 'rgba(255,255,255,.3)' }}>+ New Trip</strong> above to plan your first adventure.
          </p>
        </div>
      )}

      {sharedTrips.length > 0 && (
        <>
          <div style={{ margin: '40px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Shared With Me</span>
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

function TripCard({ trip, shared }: { trip: { id: string; title1: string; title2: string; destination: string; startDate: string; endDate: string }; shared?: boolean }) {
  return (
    <Link href={`/trips/${trip.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${shared ? 'rgba(168,85,247,.25)' : 'var(--border)'}`, borderRadius: 18, padding: 20, minHeight: 160, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', transition: 'border-color .2s', position: 'relative', overflow: 'hidden' }}>
        {shared && (
          <span style={{ position: 'absolute', top: 10, right: 12, fontSize: 9, fontFamily: "'Barlow Condensed'", letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(168,85,247,.7)', background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.2)', borderRadius: 20, padding: '2px 8px' }}>Shared</span>
        )}
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
  )
}
