import { NextResponse } from 'next/server'

// Clears all NextAuth / authjs cookies so stale encrypted state never
// blocks a fresh login attempt.  Called once before redirecting to Google.
export function GET() {
  const cookieNames = [
    '__Secure-authjs.session-token',
    '__Secure-authjs.callback-url',
    '__Secure-authjs.pkce.code_verifier',
    '__Secure-authjs.state',
    '__Secure-authjs.nonce',
    '__Host-authjs.csrf-token',
    // non-secure variants (localhost / http)
    'authjs.session-token',
    'authjs.callback-url',
    'authjs.pkce.code_verifier',
    'authjs.state',
    'authjs.nonce',
    'authjs.csrf-token',
    // legacy next-auth names
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    '__Secure-next-auth.pkce.code_verifier',
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.pkce.code_verifier',
  ]

  const res = NextResponse.redirect(new URL('/login', process.env.AUTH_URL ?? 'https://tripzync-fresh.vercel.app'))

  for (const name of cookieNames) {
    res.cookies.set(name, '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    })
  }

  return res
}
