'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface OnboardingData {
  continent: string
  countries: string[]
  places: string[]
  hotels: string[]
  destination: string
}

export default function GuestHomePage() {
  const [data, setData] = useState<OnboardingData | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('tripzync_onboarding')
    if (raw) {
      try { setData(JSON.parse(raw)) } catch { /* ignore */ }
    }
  }, [])

  const destination = data?.destination || data?.countries?.[0] || 'Your Destination'

  return (
    <div className="ob-home-wrap">
      {/* Nav */}
      <nav className="ob-nav">
        <span className="ob-nav-logo">TRIPZYNC</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/" className="ob-nav-link">Start Over</Link>
          <Link href="/login" className="ob-nav-link" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="ob-home-header" style={{ paddingTop: 100 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 4, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>
          Guest Mode · Data Not Saved
        </div>
        <h1 className="ob-home-title">
          YOUR TRIP TO<br />
          <span className="ob-home-dest">{destination.toUpperCase()}</span>
        </h1>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16, color: 'var(--dim)', marginTop: 12, letterSpacing: 1 }}>
          You're browsing as a guest. Sign up to save your plan and access it anywhere.
        </p>
      </div>

      {/* Sign-up banner */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div className="ob-home-signup-banner">
          <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 28, letterSpacing: 4, color: 'var(--white)', marginBottom: 8 }}>
            SAVE YOUR TRIP PLAN
          </div>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: 'var(--dim)', marginBottom: 20 }}>
            Create a free account to keep your selected places, hotel preferences, and full itinerary — accessible from any device, anytime.
          </p>
          <Link href="/login" style={{
            display: 'inline-block',
            fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
            fontSize: 16, letterSpacing: 4, padding: '14px 40px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: 'var(--bg)', borderRadius: 8, textDecoration: 'none',
            transition: 'opacity .2s',
          }}>
            SIGN UP FREE →
          </Link>
        </div>

        {/* Trip summary */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 48 }}>

            {/* Destination card */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Destination</div>
              <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 28, letterSpacing: 3, color: 'var(--white)' }}>
                {data.countries?.join(', ') || destination}
              </div>
              {data.continent && (
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: 'var(--dim)', marginTop: 4 }}>
                  {data.continent}
                </div>
              )}
            </div>

            {/* Places card */}
            {data.places?.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 3, color: 'var(--hi)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Must-See Places ({data.places.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.places.map((p, i) => (
                    <div key={p} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: 'var(--text)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: 'var(--hi)', fontFamily: "'Space Mono', monospace", fontSize: 10 }}>#{i + 1}</span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotels card */}
            {data.hotels?.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 3, color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Hotel Loyalty
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.hotels.map(h => (
                    <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: 'var(--text)' }}>
                      {h.charAt(0).toUpperCase() + h.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!data && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
            No trip data found. <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Start planning →</Link>
          </div>
        )}

        {/* CTA to create trip after sign up */}
        <div style={{ textAlign: 'center', paddingBottom: 80 }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: 'var(--dim)', marginBottom: 16 }}>
            Already have an account?
          </p>
          <Link href="/login" style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 3,
            color: 'var(--accent)', textDecoration: 'none', textTransform: 'uppercase',
          }}>
            Sign In → Access Your Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
