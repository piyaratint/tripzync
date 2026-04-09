'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTripPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    color: 'rgba(255,255,255,.4)',
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
            <input type="date" style={inputStyle} value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>End Date *</label>
            <input type="date" style={inputStyle} value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
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

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={() => router.back()}
            style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, color: 'rgba(255,255,255,.5)', fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
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
