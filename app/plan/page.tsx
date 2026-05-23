'use client'

import { useState, useEffect } from 'react'
import { TripZyncLogo } from '@/components/TripZyncLogo'

const todayStr = new Date().toISOString().split('T')[0]

export default function PlanPage() {
  const [step, setStep] = useState<'form' | 'auth'>('form')
  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tripzync_onboarding')
      if (!raw) return
      const data = JSON.parse(raw)
      const dest = data.destination || data.countries?.[0] || ''
      if (dest) setForm(f => ({ ...f, destination: dest }))
    } catch { /* ignore */ }
  }, [])

  const handleContinue = () => {
    if (!form.destination) return
    setStep('auth')
  }

  const savePlan = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('tripzync_onboarding') || '{}')
      localStorage.setItem('tripzync_onboarding', JSON.stringify({
        ...existing,
        pendingTrip: form,
        destination: form.destination,
      }))
    } catch { /* ignore */ }
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
        <a href="/login" className="ob-nav-link">Sign in ↗</a>
      </nav>

      <div className="ob-auth-card" style={{ maxWidth: 480, width: '100%' }}>

        {step === 'form' ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✈️</div>
            <div className="ob-auth-title" style={{ marginBottom: 6 }}>PLAN YOUR TRIP</div>
            <p className="ob-auth-sub" style={{ marginBottom: 24 }}>
              No account needed — fill in the details and start exploring.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left', width: '100%' }}>
              <div>
                <label style={labelStyle}>Destination *</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Tokyo, Japan"
                  value={form.destination}
                  onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                />
              </div>

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
            </div>

            <button
              className="ob-auth-signup"
              style={{ marginTop: 24, opacity: form.destination ? 1 : .5 }}
              disabled={!form.destination}
              onClick={handleContinue}
            >
              CONTINUE →
            </button>

            <div style={{ marginTop: 16, fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: '#fff', letterSpacing: 1 }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</a>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🌍</div>
            <div className="ob-auth-title">ALMOST THERE!</div>
            <p className="ob-auth-sub">
              Destination: <strong style={{ color: 'var(--accent)' }}>{form.destination}</strong>
              {form.startDate && form.endDate && (
                <><br />{form.startDate} → {form.endDate}</>
              )}
            </p>

            <div className="ob-guest-warning">
              ⚠️ <strong>Guest mode:</strong> Create a free account to save your trip and access it from any device. Otherwise your plan stays on this browser only.
            </div>

            <button
              className="ob-auth-signup"
              onClick={() => { savePlan(); window.location.replace('/login') }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              CREATE FREE ACCOUNT
            </button>

            <button
              className="ob-auth-skip"
              onClick={() => { savePlan(); window.location.replace('/home') }}
            >
              Continue as guest
            </button>

            <button
              className="ob-step-back"
              style={{ display: 'block', margin: '12px auto 0', background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontFamily: "'Barlow Condensed'", fontSize: 12, letterSpacing: '.1em' }}
              onClick={() => setStep('form')}
            >
              ← Edit details
            </button>
          </>
        )}
      </div>
    </div>
  )
}
