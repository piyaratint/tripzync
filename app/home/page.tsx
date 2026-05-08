'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface OnboardingData {
  continent?: string
  countries?: string[]
  cities?: string[]
  places?: string[]
  placesByCity?: Record<string, string[]>
  hotels?: string[]
  destination?: string
  pendingTrip?: {
    destination?: string
    startDate?: string
    endDate?: string
  }
}

interface DayBlock {
  dayNumber: number
  date: string
  places: string[]
}

interface CitySection {
  city: string
  days: DayBlock[]
  startDay: number
}

function computeTotalDays(startDate?: string, endDate?: string): number {
  if (!startDate || !endDate) return 7
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildItinerary(data: OnboardingData): CitySection[] {
  const placesByCity = data.placesByCity || {}
  const cities = Object.keys(placesByCity).filter(c => placesByCity[c]?.length > 0)

  if (cities.length === 0) {
    // Fallback: use flat places list with destination as single city
    const dest = data.destination || data.cities?.[0] || data.countries?.[0] || 'Your Destination'
    const allPlaces = data.places || []
    const totalDays = computeTotalDays(data.pendingTrip?.startDate, data.pendingTrip?.endDate)
    const startDate = data.pendingTrip?.startDate || ''
    const days: DayBlock[] = []
    for (let d = 0; d < totalDays; d++) {
      const chunk = allPlaces.slice(d * 2, d * 2 + 2)
      days.push({
        dayNumber: d + 1,
        date: startDate ? addDays(startDate, d) : `Day ${d + 1}`,
        places: chunk,
      })
    }
    return [{ city: dest, days, startDay: 1 }]
  }

  const totalPlaces = cities.reduce((sum, c) => sum + placesByCity[c].length, 0)
  const totalDays = computeTotalDays(data.pendingTrip?.startDate, data.pendingTrip?.endDate)
  const startDate = data.pendingTrip?.startDate || ''

  // Proportional day allocation — more places = more days
  const rawDays = cities.map(c => (placesByCity[c].length / totalPlaces) * totalDays)
  const floorDays = rawDays.map(d => Math.max(1, Math.floor(d)))
  const remainder = totalDays - floorDays.reduce((s, d) => s + d, 0)

  // Give extra days to cities with largest fractional parts
  const fracs = rawDays.map((d, i) => ({ i, frac: d - Math.floor(d) }))
  fracs.sort((a, b) => b.frac - a.frac)
  for (let k = 0; k < remainder && k < fracs.length; k++) {
    floorDays[fracs[k].i]++
  }

  const sections: CitySection[] = []
  let globalDay = 1
  let globalOffset = 0

  cities.forEach((city, idx) => {
    const cityDays = floorDays[idx]
    const cityPlaces = placesByCity[city]
    const days: DayBlock[] = []

    for (let d = 0; d < cityDays; d++) {
      const chunk = cityPlaces.slice(d * 2, d * 2 + 2)
      days.push({
        dayNumber: globalDay + d,
        date: startDate ? addDays(startDate, globalOffset + d) : `Day ${globalDay + d}`,
        places: chunk,
      })
    }

    sections.push({ city, days, startDay: globalDay })
    globalDay += cityDays
    globalOffset += cityDays
  })

  return sections
}

export default function GuestHomePage() {
  const [data, setData] = useState<OnboardingData | null>(null)
  const [itinerary, setItinerary] = useState<CitySection[]>([])

  useEffect(() => {
    const raw = localStorage.getItem('tripzync_onboarding')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as OnboardingData
        setData(parsed)
        setItinerary(buildItinerary(parsed))
      } catch { /* ignore */ }
    }
  }, [])

  const destination = data?.destination || data?.cities?.[0] || data?.countries?.[0] || 'Your Destination'
  const totalDays = computeTotalDays(data?.pendingTrip?.startDate, data?.pendingTrip?.endDate)
  const dateRange = data?.pendingTrip?.startDate && data?.pendingTrip?.endDate
    ? `${data.pendingTrip.startDate} → ${data.pendingTrip.endDate}`
    : null

  return (
    <div className="ob-home-wrap">
      <nav className="ob-nav">
        <a href="/" className="ob-nav-logo" style={{ textDecoration: 'none' }}>TRIPZYNC</a>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/" className="ob-nav-link">Start Over</a>
          <a href="/login" className="ob-nav-link" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Sign In</a>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 4, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
            Guest Mode · Draft Itinerary
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(40px,8vw,72px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.9, margin: 0 }}>
            YOUR TRIP TO<br />
            <span style={{ color: 'var(--accent)' }}>{destination.toUpperCase()}</span>
          </h1>
          {dateRange && (
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: 'var(--dim)', marginTop: 12, letterSpacing: 1 }}>
              {dateRange} · {totalDays} days
            </div>
          )}
        </div>

        {/* Sign-up banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(0,212,255,.08), rgba(0,212,255,.03))', border: '1px solid rgba(0,212,255,.2)', borderRadius: 16, padding: '24px 28px', marginBottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#fff', marginBottom: 4 }}>
              Save Your Itinerary
            </div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: 'var(--dim)', margin: 0 }}>
              Create a free account to keep this plan and access it from any device.
            </p>
          </div>
          <a href="/login" style={{ display: 'inline-block', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', padding: '12px 28px', background: 'var(--accent)', color: 'var(--bg)', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Sign Up Free →
          </a>
        </div>

        {/* Itinerary sections */}
        {itinerary.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {itinerary.map((section, si) => (
              <div key={section.city}>
                {/* City header */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: si % 2 === 0 ? 'var(--accent)' : 'var(--hi)' }}>
                    {section.city}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    {section.days.length} {section.days.length === 1 ? 'day' : 'days'} · Day {section.startDay}–{section.startDay + section.days.length - 1}
                  </div>
                </div>

                {/* Day blocks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {section.days.map(day => (
                    <div key={day.dayNumber} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      {/* Day label */}
                      <div style={{ minWidth: 72, flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 2, color: si % 2 === 0 ? 'var(--accent)' : 'var(--hi)', textTransform: 'uppercase' }}>
                          Day {day.dayNumber}
                        </div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: 'var(--muted)', letterSpacing: 0.5 }}>
                          {day.date}
                        </div>
                      </div>

                      {/* Place chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
                        {day.places.length > 0 ? day.places.map(place => (
                          <span key={place} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, letterSpacing: 0.5, color: '#fff', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 14px' }}>
                            {place}
                          </span>
                        )) : (
                          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                            Free day — explore at your own pace
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
            No trip data found.{' '}
            <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Start planning →</a>
          </div>
        )}

        {/* Hotels */}
        {data?.hotels && data.hotels.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Hotel Loyalty</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.hotels.map(h => (
                <span key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: 'var(--dim)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 14px' }}>
                  {h.charAt(0).toUpperCase() + h.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 8 }}>
            Ready to make it official?
          </div>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: 'var(--dim)', marginBottom: 24 }}>
            Sign up free to save this itinerary and start building your full trip.
          </p>
          <a href="/login" style={{ display: 'inline-block', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', padding: '14px 40px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'var(--bg)', borderRadius: 8, textDecoration: 'none' }}>
            Create Free Account →
          </a>
        </div>

      </div>
    </div>
  )
}
