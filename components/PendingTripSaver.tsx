'use client'

import { useEffect, useState } from 'react'
import { saveTrip } from '@/app/actions/trips'

interface DayBlock  { dayNumber: number; date: string; places: string[] }
interface CitySection { city: string; days: DayBlock[]; startDay: number }
interface OnboardingData {
  continent?: string
  countries?: string[]
  cities?: string[]
  places?: string[]
  placesByCity?: Record<string, string[]>
  hotels?: string[]
  destination?: string
  startDate?: string
  endDate?: string
  pendingTrip?: { destination?: string; startDate?: string; endDate?: string }
}

export function PendingTripSaver() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    const raw = localStorage.getItem('tripzync_pending_trip')
    if (!raw) return

    let pending: { meta: OnboardingData; itinerary: CitySection[] }
    try {
      pending = JSON.parse(raw)
    } catch {
      localStorage.removeItem('tripzync_pending_trip')
      return
    }

    if (!pending.meta || !pending.itinerary) {
      localStorage.removeItem('tripzync_pending_trip')
      return
    }

    // Auto-save the trip
    setStatus('saving')
    saveTrip(null, pending.meta, pending.itinerary)
      .then(() => {
        localStorage.removeItem('tripzync_pending_trip')
        // Also clear onboarding data since the trip is now saved
        localStorage.removeItem('tripzync_onboarding')
        setStatus('saved')
        // Reload to show the new trip in the dashboard
        setTimeout(() => window.location.reload(), 1500)
      })
      .catch((err) => {
        console.error('Failed to save pending trip:', err)
        setStatus('error')
      })
  }, [])

  if (status === 'idle') return null

  return (
    <div style={{
      position: 'fixed',
      top: 60,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      padding: '12px 24px',
      borderRadius: 10,
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      animation: 'fadeUp 0.3s ease',
      ...(status === 'saving' ? {
        background: 'var(--card)',
        border: '1px solid var(--accent)',
        color: 'var(--text)',
      } : status === 'saved' ? {
        background: 'rgba(62,207,120,0.1)',
        border: '1px solid rgba(62,207,120,0.3)',
        color: '#3ecf78',
      } : {
        background: 'rgba(247,110,110,0.1)',
        border: '1px solid rgba(247,110,110,0.3)',
        color: '#f76e6e',
      }),
    }}>
      {status === 'saving' && '✈️ Saving your trip…'}
      {status === 'saved' && '✅ Trip saved to your dashboard!'}
      {status === 'error' && '⚠️ Could not save trip — try again from the home page'}
    </div>
  )
}
