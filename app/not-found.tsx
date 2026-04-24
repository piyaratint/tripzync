import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d0d0d',
      color: '#fff',
      fontFamily: "'Barlow Condensed', sans-serif",
      textAlign: 'center',
      padding: '0 24px',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🌸</div>
      <div style={{
        fontSize: 'clamp(60px, 15vw, 120px)',
        fontWeight: 900,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        lineHeight: 0.85,
        marginBottom: 20,
      }}>
        <span style={{ color: '#fff' }}>4</span>
        <span style={{ color: '#e8001d' }}>0</span>
        <span style={{ color: '#fff' }}>4</span>
      </div>
      <p style={{
        fontSize: 14,
        letterSpacing: '.18em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,.35)',
        marginBottom: 32,
      }}>
        Page not found
      </p>
      <Link href="/dashboard" style={{
        background: 'var(--red, #e8001d)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 24px',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        textDecoration: 'none',
        cursor: 'pointer',
      }}>
        Back to Dashboard
      </Link>
    </div>
  )
}
