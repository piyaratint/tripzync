// Shared logo component — matches the nav bar in the screenshot:
//   ●  ●  ●   TRIPZYNC® · 2026
//  dim teal teal
//
// Use wherever you need the TripZync brand mark.

interface Props {
  href?: string      // defaults to '/'
  className?: string
  style?: React.CSSProperties
}

export function TripZyncLogo({ href = '/', className, style }: Props) {
  const year = new Date().getFullYear()
  return (
    <a
      href={href}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        ...style,
      }}
    >
      {/* Three dots — dim · teal · teal */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: 'var(--border2, rgba(255,255,255,.18))' }} />
        <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent, #40E0D0)' }} />
        <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent, #40E0D0)' }} />
      </div>

      {/* Wordmark */}
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        color: 'var(--text, #fff)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        TripZync® · {year}
      </span>
    </a>
  )
}
