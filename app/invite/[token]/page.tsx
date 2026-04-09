import { auth, signIn } from '@/lib/auth'
import { db } from '@/lib/db'
import { tripInvites, trips, tripMembers, authUsers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { redirect } from 'next/navigation'

type Props = { params: Promise<{ token: string }> }

export default async function InvitePage({ params }: Props) {
  const { token } = await params

  const [invite] = await db.select().from(tripInvites).where(eq(tripInvites.token, token))
  if (!invite) return <ErrorPage message="This invite link is invalid or has been reset." />

  const [trip] = await db.select().from(trips).where(eq(trips.id, invite.tripId))
  if (!trip) return <ErrorPage message="The trip no longer exists." />

  const [owner] = await db
    .select({ name: authUsers.name })
    .from(authUsers)
    .where(eq(authUsers.id, trip.userId))

  const session = await auth()

  if (!session?.user?.id) {
    return <InviteLanding trip={trip} ownerName={owner?.name ?? null} token={token} />
  }

  const userId = session.user.id

  // Already the owner
  if (trip.userId === userId) redirect(`/trips/${trip.id}`)

  // Already a member
  const [existing] = await db.select({ id: tripMembers.id })
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, trip.id), eq(tripMembers.userId, userId)))
  if (existing) redirect(`/trips/${trip.id}`)

  // Join the trip
  await db.insert(tripMembers).values({ tripId: trip.id, userId, role: 'editor' })
  redirect(`/trips/${trip.id}`)
}

// ── Landing page (not logged in) ──────────────────────────────────────────────
function InviteLanding({
  trip,
  ownerName,
  token,
}: {
  trip: { title1: string; title2: string; destination: string; startDate: string; endDate: string }
  ownerName: string | null
  token: string
}) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif",
    }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 360, padding: '0 24px' }}>
        <div style={{ fontSize: 40 }}>🌸</div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.2em', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', marginBottom: 8 }}>
            {ownerName ?? 'Someone'} invited you to
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: .88 }}>
            {trip.title1}
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: .88, color: '#e8001d' }}>
            {trip.title2}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 12, letterSpacing: '.06em' }}>
            {trip.destination} · {trip.startDate} – {trip.endDate}
          </div>
        </div>

        <form action={async () => {
          'use server'
          await signIn('google', { redirectTo: `/invite/${token}` })
        }}>
          <button type="submit" style={{
            background: '#fff', color: '#111', border: 'none', borderRadius: 12,
            padding: '13px 28px', fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google to Join
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Error page ────────────────────────────────────────────────────────────────
function ErrorPage({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase' }}>Invalid Link</h1>
        <p style={{ color: 'rgba(255,255,255,.5)', marginTop: 8, fontSize: 14 }}>{message}</p>
        <a href="/dashboard" style={{
          display: 'inline-block', marginTop: 24, padding: '10px 24px',
          background: '#e8001d', color: '#fff', borderRadius: 8, textDecoration: 'none',
          fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700,
        }}>Go to Dashboard</a>
      </div>
    </div>
  )
}
