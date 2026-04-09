import { signIn } from '@/lib/auth'

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: '.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            TripZync®
          </div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 'clamp(48px,10vw,80px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: .9, color: '#fff' }}>
            Your<br /><em style={{ color: 'var(--red)' }}>Travel Logbook</em>
          </div>
        </div>

        <form action={async () => {
          'use server'
          await signIn('google', { redirectTo: '/dashboard' })
        }}>
          <button type="submit" style={{ background: '#fff', color: '#111', border: 'none', borderRadius: 12, padding: '13px 28px', fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: '.12em', color: 'rgba(255,255,255,.2)', textTransform: 'uppercase' }}>
          Your trips, your data.
        </p>
      </div>
    </div>
  )
}
