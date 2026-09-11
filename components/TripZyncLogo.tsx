// Shared logo component — quiet editorial wordmark:
//   Maren
// Use wherever you need the Maren brand mark.

interface Props {
  href?: string      // defaults to '/'
  className?: string
  style?: React.CSSProperties
}

export function TripZyncLogo({ href = '/', className, style }: Props) {
  return (
    <a
      href={href}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 8,
        textDecoration: 'none',
        ...style,
      }}
    >
      {/* Wordmark */}
      <span style={{
        fontFamily: "'Schibsted Grotesk', -apple-system, sans-serif",
        fontStyle: 'normal',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: 'var(--text, #F4EEE3)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        Maren
      </span>
      <span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: 'var(--accent, #C6A876)', transform: 'translateY(-1px)' }} />
    </a>
  )
}
