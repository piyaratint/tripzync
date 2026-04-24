'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTripStore } from '@/store/tripStore'

interface Props {
  open: boolean
  onClose: () => void
}

export function EditTripModal({ open, onClose }: Props) {
  const router = useRouter()
  const trip = useTripStore(s => s.trip)
  const setTrip = useTripStore(s => s.setTrip)

  const [form, setForm] = useState({
    title1: trip?.title1 ?? '',
    title2: trip?.title2 ?? '',
    subtitle: trip?.subtitle ?? '',
    destination: trip?.destination ?? '',
    destCity: trip?.destCity ?? '',
    startDate: trip?.startDate ?? '',
    endDate: trip?.endDate ?? '',
    currency: trip?.currency ?? 'JPY',
  })
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const datesChanged = trip && (form.startDate !== trip.startDate || form.endDate !== trip.endDate)

  if (!open || !trip) return null

  async function handleSave() {
    if (!trip) return
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setTrip(data.trip)
        onClose()
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!trip) return
    setLoading(true)
    try {
      await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' })
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontFamily: "'Barlow Condensed'",
    fontSize: 10,
    letterSpacing: '.14em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,.4)',
    marginBottom: 4,
    display: 'block',
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 16,
        padding: 24,
        width: 'min(480px, 90vw)',
        maxHeight: '90vh',
        overflowY: 'auto',
        zIndex: 101,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
            ✏️ Edit Trip
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <label style={labelStyle}>Subtitle</label>
          <input style={inputStyle} value={form.subtitle ?? ''}
            onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
        </div>

        <div>
          <label style={labelStyle}>Destination</label>
          <input style={inputStyle} value={form.destination}
            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
        </div>

        <div>
          <label style={labelStyle}>City (for weather)</label>
          <input style={inputStyle} value={form.destCity ?? ''}
            onChange={e => setForm(f => ({ ...f, destCity: e.target.value }))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type="date" style={inputStyle} value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>End Date</label>
            <input type="date" style={inputStyle} value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Currency</label>
          <select style={inputStyle} value={form.currency ?? 'JPY'}
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

        {/* Date range warning */}
        {datesChanged && (
          <div style={{ background: 'rgba(255,180,0,.08)', border: '1px solid rgba(255,180,0,.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'rgba(255,200,60,.75)', fontFamily: "'Noto Sans JP'", lineHeight: 1.5 }}>
            ⚠️ Events scheduled outside the new date range will be hidden but not deleted.
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px 0',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 8, color: 'rgba(255,255,255,.5)',
            fontFamily: "'Barlow Condensed'", fontSize: 13,
            letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{
            flex: 2, padding: '10px 0',
            background: 'var(--red)', border: 'none',
            borderRadius: 8, color: '#fff',
            fontFamily: "'Barlow Condensed'", fontSize: 13,
            letterSpacing: '.1em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? .6 : 1,
          }}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>

        {/* Delete zone */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 16, marginTop: 4 }}>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} style={{
              background: 'none', border: 'none',
              color: 'rgba(255,80,80,.5)', fontSize: 12,
              cursor: 'pointer', fontFamily: "'Barlow Condensed'",
              letterSpacing: '.1em', textTransform: 'uppercase',
            }}>🗑 Delete this trip</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
                ⚠️ This will permanently delete the trip and all its data.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowDelete(false)} style={{
                  flex: 1, padding: '8px 0',
                  background: 'transparent', border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: 8, color: 'rgba(255,255,255,.4)',
                  fontFamily: "'Barlow Condensed'", fontSize: 12,
                  cursor: 'pointer', textTransform: 'uppercase',
                }}>Cancel</button>
                <button onClick={handleDelete} disabled={loading} style={{
                  flex: 1, padding: '8px 0',
                  background: 'rgba(255,50,50,.8)', border: 'none',
                  borderRadius: 8, color: '#fff',
                  fontFamily: "'Barlow Condensed'", fontSize: 12,
                  cursor: 'pointer', textTransform: 'uppercase',
                }}>Confirm Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
