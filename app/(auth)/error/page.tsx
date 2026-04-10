export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams?.error ?? 'Unknown'

  const messages: Record<string, string> = {
    Configuration: 'AUTH_SECRET or database env var is missing/wrong.',
    AccessDenied: 'Access denied by Google.',
    Verification: 'Token expired or already used.',
    OAuthCallback: 'Google OAuth callback failed — check redirect URI in Google Cloud Console.',
    OAuthSignin: 'Could not start Google sign-in.',
    OAuthCreateAccount: 'Could not create account — database error.',
    Callback: 'Error during callback — check DATABASE_URL and AUTH_SECRET.',
    Default: 'An unexpected error occurred.',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', fontFamily: 'monospace', color: '#fff' }}>
      <div style={{ maxWidth: 480, padding: 32, border: '1px solid rgba(255,0,0,.3)', borderRadius: 16, textAlign: 'center' }}>
        <div style={{ color: '#e8001d', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 12 }}>Auth Error</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Error code: <span style={{ color: '#e8001d' }}>{error}</span></div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 24 }}>{messages[error] ?? messages.Default}</div>
        <a href="/login" style={{ color: '#fff', background: '#e8001d', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Try again
        </a>
      </div>
    </div>
  )
}
