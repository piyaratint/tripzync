'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { softDeleteTrip } from '@/app/actions/trips'
import { fmtDate, daysBetween } from '@/lib/utils'

interface Trip {
  id: string
  title1: string
  title2: string
  destination: string
  startDate: string
  endDate: string
}

interface Props {
  trip: Trip
  shared?: boolean
}

export function TripCard({ trip, shared }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await softDeleteTrip(trip.id)
      setShowConfirm(false)
    })
  }

  return (
    <>
      {/* ── Confirmation modal ─────────────────────────────────────────────── */}
      {showConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{ background: '#111', border: '1px solid rgba(255,255,255,.12)', borderRadius: 18, padding: '32px 28px', maxWidth: 420, width: '100%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 44, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: 10 }}>
              Delete Trip?
            </div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, marginBottom: 8 }}>
              <strong style={{ color: '#fff' }}>{trip.title1} {trip.title2}</strong> will be moved to Trash
              and permanently deleted after <strong style={{ color: '#fff' }}>90 days</strong>.
            </p>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 28 }}>
              You can recover it within 90 days by contacting support.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '11px 0', color: '#fff', fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{ flex: 1, background: '#c0392b', border: 'none', borderRadius: 10, padding: '11px 0', color: '#fff', fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? .6 : 1 }}
              >
                {isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trip card ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <Link href={`/trips/${trip.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${shared ? 'rgba(168,85,247,.25)' : 'var(--border)'}`, borderRadius: 18, padding: 20, minHeight: 160, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', transition: 'border-color .2s', position: 'relative', overflow: 'hidden' }}>
            {shared && (
              <span style={{ position: 'absolute', top: 10, right: 12, fontSize: 9, fontFamily: "'Barlow Condensed'", letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(168,85,247,.7)', background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.2)', borderRadius: 20, padding: '2px 8px' }}>Shared</span>
            )}
            <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 36, opacity: .07 }}>🌸</div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 8, letterSpacing: '.18em', color: 'var(--sakura)', textTransform: 'uppercase' }}>
              {trip.destination}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 28, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
              {trip.title1}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1, color: 'var(--red)' }}>
              {trip.title2}
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
              <div>
                <div className="meta-label">Dates</div>
                <div className="meta-val" style={{ fontSize: 10 }}>
                  {fmtDate(new Date(trip.startDate + 'T00:00:00'))} – {fmtDate(new Date(trip.endDate + 'T00:00:00'))}
                </div>
              </div>
              <div>
                <div className="meta-label">Duration</div>
                <div className="meta-val" style={{ fontSize: 10 }}>
                  {daysBetween(trip.startDate, trip.endDate)} days
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Delete button — outside the Link so clicks don't navigate */}
        {!shared && (
          <button
            onClick={() => setShowConfirm(true)}
            title="Delete trip"
            style={{ position: 'absolute', bottom: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: 'rgba(192,57,43,.12)', border: '1px solid rgba(192,57,43,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, transition: 'background .15s', zIndex: 1 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192,57,43,.28)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(192,57,43,.12)')}
          >
            🗑️
          </button>
        )}
      </div>
    </>
  )
}
