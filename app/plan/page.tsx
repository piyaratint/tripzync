'use client'

import { useState, useEffect } from 'react'
import { TripZyncLogo } from '@/components/TripZyncLogo'

const todayStr = new Date().toISOString().split('T')[0]

const HOTEL_NAMES: Record<string, string> = {
  marriott: 'Marriott Bonvoy',
  hilton:   'Hilton Honors',
  ihg:      'IHG One Rewards',
  hyatt:    'World of Hyatt',
  accor:    'Accor ALL',
}

export default function PlanPage() {
  const [form, setForm] = useState({ startDate: '', endDate: '' })
  const [tripSummary, setTripSummary] = useState<{
    destination: string
    cities: string[]
    hotels: string[]
  }>({ destination: '', cities: [], hotels: [] })
  const [saved, setSaved] = useState(false)

  // Pre-fill from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tripzync_onboarding')
      if (!raw) return
      const data = JSON.parse(raw)
      setForm({
        startDate: data.startDate || data.pendingTrip?.startDate || '',
        endDate:   data.endDate   || data.pendingTrip?.endDate   || '',
      })
      setTripSummary({
        destination: data.destination || data.cities?.[0] || data.countries?.[0] || '',
        cities:      data.cities  || [],
        hotels:      (data.hotels || []).filter((h: string) => h && h !== 'none'),
      })
    } catch { /* ignore */ }
  }, [])

  const durationDays = form.startDate && form.endDate
    ? Math.max(1, Math.round(
        (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000
      ) + 1)
    : null

  const handleSave = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('tripzync_onboarding') || '{}')
      localStorage.setItem('tripzync_onboarding', JSON.stringify({
        ...existing,
        startDate: form.startDate,
        endDate:   form.endDate,
        pendingTrip: {
          ...(existing.pendingTrip || {}),
          startDate: form.startDate,
          endDate:   form.endDate,
        },
      }))
    } catch { /* ignore */ }
    setSaved(true)
    setTimeout(() => window.location.replace('/home'), 600)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box' as const,
    colorScheme: 'dark' as const,
  }

  const labelStyle = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 10,
    letterSpacing: '.16em',
    textTransform: 'uppercase' as const,
    color: '#fff',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div className="ob-screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="ob-grid-bg" />

      <nav className="ob-nav">
        <TripZyncLogo href="/" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/?screen=duration" className="ob-nav-link">← Step 04</a>
          <a href="/home" className="ob-nav-link">My Trip →</a>
        </div>
      </nav>

      <div className="ob-auth-card" style={{ maxWidth: 480, width: '100%' }}>

        <div style={{ fontSize: 36, marginBottom: 12 }}>✈️</div>
        <div className="ob-auth-title" style={{ marginBottom: 6 }}>EDIT YOUR TRIP</div>

        {/* Destination chip */}
        {tripSummary.destination && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(64,224,208,.08)', border: '1px solid rgba(64,224,208,.2)',
            borderRadius: 20, padding: '4px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12,
              fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              color: 'var(--accent)',
            }}>
              {tripSummary.cities.length > 1
                ? tripSummary.cities.join(' · ')
                : tripSummary.destination}
            </span>
          </div>
        )}

        <p className="ob-auth-sub" style={{ marginBottom: 24 }}>
          Update your travel dates or go back to any step to change your cities, places, or hotels.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left', width: '100%' }}>

          {/* Date pickers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.startDate}
                min={todayStr}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.endDate}
                min={form.startDate || todayStr}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Duration badge */}
          {durationDays && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(64,224,208,.07)', border: '1px solid rgba(64,224,208,.2)',
              borderRadius: 10, padding: '12px 16px',
            }}>
              <span style={{ fontSize: 20 }}>📅</span>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>
                  {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', marginTop: 2 }}>
                  Trip duration
                </div>
              </div>
            </div>
          )}

          {/* Loyalty programmes summary */}
          {tripSummary.hotels.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 6 }}>
                Loyalty programmes
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tripSummary.hotels.map(h => (
                  <span key={h} style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10,
                    fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                    background: 'rgba(255,201,71,.1)', border: '1px solid rgba(255,201,71,.25)',
                    borderRadius: 20, padding: '2px 10px', color: '#FFC947',
                  }}>
                    {HOTEL_NAMES[h] || h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick-edit step links */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Cities',  href: '/?screen=map' },
            { label: 'Places',  href: '/?screen=places' },
            { label: 'Hotels',  href: '/?screen=hotels' },
            { label: 'Dates',   href: '/?screen=duration' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9,
              fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              color: 'rgba(255,255,255,.5)', textDecoration: 'none',
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 20, padding: '4px 12px',
            }}>
              Edit {label}
            </a>
          ))}
        </div>

        <button
          className="ob-auth-signup"
          style={{ marginTop: 24, opacity: saved ? .7 : 1 }}
          disabled={saved}
          onClick={handleSave}
        >
          {saved ? '✓ SAVED — RETURNING TO TRIP' : 'SAVE & BACK TO MY TRIP →'}
        </button>

        <div style={{ marginTop: 16, fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: '#fff', letterSpacing: 1 }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</a>
        </div>

      </div>
    </div>
  )
}
