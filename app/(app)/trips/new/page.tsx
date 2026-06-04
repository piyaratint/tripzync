'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DatePicker } from '@/components/ui/DatePicker'

const todayStr = new Date().toISOString().split('T')[0]

export default function NewTripPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [onboardingPlaces, setOnboardingPlaces] = useState<string[]>([])
  const [form, setForm] = useState({
    title1: 'MY',
    title2: 'TRIP',
    subtitle: '',
    destination: '',
    destCity: '',
    startDate: '',
    endDate: '',
    currency: 'JPY',
  })

  // Pre-fill from onboarding data if available
  useEffect(() => {
    const raw = localStorage.getItem('tripzync_onboarding')
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      const dest = data.destination || data.countries?.[0] || ''
      if (dest) {
        setForm(f => ({
          ...f,
          destination: dest,
          title2: dest.toUpperCase().split(' ')[0] || 'TRIP',
        }))
      }
      if (data.places?.length > 0) {
        setOnboardingPlaces(data.places)
      }
    } catch { /* ignore */ }
  }, [])

  const handleSubmit = async () => {
    if (!form.destination || !form.startDate || !form.endDate) return
    setLoading(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/trips/${data.id}`)
      }
    } catch (err) {
      console.error('fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontFamily: "'Barlow Condensed'",
    fontSize: 10,
    letterSpacing: '.16em',
    textTransform: 'uppercase' as const,
    color: '#fff',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div className="page">
      <header style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
        <div className="hero-eyebrow">
          <div className="eyebrow-dots"><span /><span className="r" /><span /></div>
          <span className="eyebrow-text">TripZync® · New Trip</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 'clamp(40px,8vw,72px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.9, marginTop: 8 }}>
          New <em style={{ color: 'var(--red)' }}>Trip</em>
        </h1>
      </header>

      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Title Line 1</label>
            <input style={inputStyle} value={form.title1}
              onChange={e => setForm(f => ({ ...f, title1: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Title Line 2</label>
            <input style={inputStyle} value={form.title2}
              onChange={e => setForm(f => ({ ...f, title2: e.target.value }))} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Destination *</label>
          <input style={inputStyle} placeholder="e.g. Tokyo, Japan" value={form.destination}
            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
        </div>

        <div>
          <label style={labelStyle}>City (for weather)</label>
          <input style={inputStyle} placeholder="e.g. Tokyo" value={form.destCity}
            onChange={e => setForm(f => ({ ...f, destCity: e.target.value }))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Start Date *</label>
            <DatePicker
              value={form.startDate}
              min={todayStr}
              onChange={v => setForm(f => ({ ...f, startDate: v }))}
              placeholder="Pick start date"
            />
          </div>
          <div>
            <label style={labelStyle}>End Date *</label>
            <DatePicker
              value={form.endDate}
              min={form.startDate || todayStr}
              onChange={v => setForm(f => ({ ...f, endDate: v }))}
              placeholder="Pick end date"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Currency</label>
          <select style={inputStyle} value={form.currency}
            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
            <option value="JPY">JPY — Japanese Yen</option>
            <option value="THB">THB — Thai Baht</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="KRW">KRW — Korean Won</option>
            <option value="SGD">SGD — Singapore Dollar</option>
          </select>
        </div>

        {/* Onboarding places preview */}
        {onboardingPlaces.length > 0 && (
          <div style={{ background: 'rgba(64,224,208,.05)', border: '1px solid rgba(64,224,208,.2)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(64,224,208,.8)', marginBottom: 8 }}>
              ✓ {onboardingPlaces.length} places from your plan will be added to your itinerary
            </div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: '#fff', lineHeight: 1.6 }}>
              {onboardingPlaces.join(' · ')}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={() => router.back()}
            style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, color: '#fff', fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex: 2, padding: '12px 0', background: 'var(--red)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1 }}>
            {loading ? 'Creating...' : 'Create Trip →'}
          </button>
        </div>

      </div>
    </div>
  )
}
