'use client'
import { useState } from 'react'
import { useTripStore } from '@/store/tripStore'
import { useAddHotel, useDeleteHotel } from '@/hooks/useHotels'

interface Props {
  tripId: string
  startDate: string
  endDate: string
  open: boolean
  onClose: () => void
}

export function HotelModal({ tripId, startDate, endDate, open, onClose }: Props) {
  const hotels = useTripStore(s => s.hotels)
  const addHotel = useAddHotel(tripId)
  const deleteHotel = useDeleteHotel(tripId)

  const [name, setName] = useState('')
  const [fromDate, setFromDate] = useState(startDate)

  if (!open) return null

  function getMapsUrl(hotelName: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelName)}`
  }

  async function handleAdd() {
    if (!name.trim()) return
    await addHotel.mutateAsync({
      name: name.trim(),
      fromDate,
      mapsUrl: getMapsUrl(name.trim()),
    })
    setName('')
    setFromDate(startDate)
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
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
      />

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
        zIndex: 101,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
            🏨 Hotels
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Existing hotels */}
        {hotels.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...hotels].sort((a, b) => (a.fromDate ?? '') < (b.fromDate ?? '') ? -1 : 1).map(h => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 10, padding: '10px 14px',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    <a
                      href={h.mapsUrl ?? getMapsUrl(h.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#f4a7c0', textDecoration: 'none' }}
                    >
                      {h.name} 📍
                    </a>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>
                    From {h.fromDate ?? startDate}
                  </div>
                </div>
                <button
                  onClick={() => deleteHotel.mutate(h.id)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: 16 }}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new hotel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: hotels.length > 0 ? '1px solid rgba(255,255,255,.07)' : 'none', paddingTop: hotels.length > 0 ? 16 : 0 }}>
          {hotels.length > 0 && (
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>
              Add Hotel
            </div>
          )}

          <div>
            <label style={labelStyle}>Hotel Name *</label>
            <input
              style={inputStyle}
              placeholder="e.g. Shinjuku Granbell Hotel"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            {/* Preview maps link */}
            {name.trim() && (
              <a
                href={getMapsUrl(name.trim())}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#f4a7c0', textDecoration: 'none', marginTop: 6, display: 'block' }}
              >
                📍 Preview on Google Maps →
              </a>
            )}
          </div>

          <div>
            <label style={labelStyle}>Check-in Date *</label>
            <input
              type="date"
              style={inputStyle}
              value={fromDate}
              min={startDate}
              max={endDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={addHotel.isPending || !name.trim()}
            style={{
              padding: '10px 0',
              background: 'var(--red)',
              border: 'none', borderRadius: 8,
              color: '#fff',
              fontFamily: "'Barlow Condensed'",
              fontSize: 13, letterSpacing: '.1em',
              textTransform: 'uppercase',
              cursor: addHotel.isPending || !name.trim() ? 'not-allowed' : 'pointer',
              opacity: addHotel.isPending || !name.trim() ? .5 : 1,
            }}>
            {addHotel.isPending ? 'Adding...' : '+ Add Hotel'}
          </button>
        </div>
      </div>
    </>
  )
}
