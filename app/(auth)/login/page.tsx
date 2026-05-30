import { googleSignIn } from '@/app/actions/auth'
import { TripZyncLogo } from '@/components/TripZyncLogo'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
      }}>

        <div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <TripZyncLogo href="/" />
          </div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(48px,10vw,80px)',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            lineHeight: 0.9,
            color: 'var(--text, #fff)',
          }}>
            Your<br />
            <em style={{ color: 'var(--red)' }}>Travel Logbook</em>
          </div>
        </div>

        <form action={googleSignIn}>
          <button
            type="submit"
            style={{
              background: '#ffffff',
              color: '#111',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 12,
              padding: '14px 32px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 9,
          letterSpacing: '.14em',
          color: 'var(--muted, rgba(255,255,255,.35))',
          textTransform: 'uppercase',
        }}>
          Your trips, your data.
        </p>
      </div>
    </div>
  )
}
