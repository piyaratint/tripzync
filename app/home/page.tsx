'use client'

import { useEffect, useState, useRef } from 'react'

interface OnboardingData {
  continent?: string
  countries?: string[]
  cities?: string[]
  places?: string[]
  placesByCity?: Record<string, string[]>
  hotels?: string[]
  destination?: string
  pendingTrip?: { destination?: string; startDate?: string; endDate?: string }
}

interface DayBlock { dayNumber: number; date: string; places: string[] }
interface CitySection { city: string; days: DayBlock[]; startDay: number }
interface Tooltip { name: string; image: string; x: number; y: number }

function computeTotalDays(s?: string, e?: string) {
  if (!s || !e) return 7
  const diff = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000)
  return Math.max(1, diff + 1)
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDate(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()
}

function buildItinerary(data: OnboardingData): CitySection[] {
  const placesByCity = data.placesByCity || {}
  const cities = Object.keys(placesByCity).filter(c => placesByCity[c]?.length > 0)
  const totalDays = computeTotalDays(data.pendingTrip?.startDate, data.pendingTrip?.endDate)
  const startDate = data.pendingTrip?.startDate || ''

  if (cities.length === 0) {
    const dest = data.destination || data.cities?.[0] || data.countries?.[0] || 'Your Destination'
    const allPlaces = data.places || []
    const days: DayBlock[] = Array.from({ length: totalDays }, (_, d) => ({
      dayNumber: d + 1,
      date: startDate ? addDays(startDate, d) : `Day ${d + 1}`,
      places: allPlaces.slice(d * 2, d * 2 + 2),
    }))
    return [{ city: dest, days, startDay: 1 }]
  }

  const totalPlaces = cities.reduce((s, c) => s + placesByCity[c].length, 0)
  const rawDays = cities.map(c => (placesByCity[c].length / totalPlaces) * totalDays)
  const floorDays = rawDays.map(d => Math.max(1, Math.floor(d)))
  const remainder = totalDays - floorDays.reduce((s, d) => s + d, 0)
  rawDays.map((d, i) => ({ i, frac: d - Math.floor(d) }))
    .sort((a, b) => b.frac - a.frac)
    .slice(0, remainder)
    .forEach(({ i }) => floorDays[i]++)

  const sections: CitySection[] = []
  let globalDay = 1; let globalOffset = 0
  cities.forEach((city, idx) => {
    const cityDays = floorDays[idx]
    const cityPlaces = placesByCity[city]
    const days: DayBlock[] = Array.from({ length: cityDays }, (_, d) => ({
      dayNumber: globalDay + d,
      date: startDate ? addDays(startDate, globalOffset + d) : `Day ${globalDay + d}`,
      places: cityPlaces.slice(d * 2, d * 2 + 2),
    }))
    sections.push({ city, days, startDay: globalDay })
    globalDay += cityDays; globalOffset += cityDays
  })
  return sections
}

export default function GuestHomePage() {
  const [data, setData] = useState<OnboardingData | null>(null)
  const [itinerary, setItinerary] = useState<CitySection[]>([])
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({})
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [activeDay, setActiveDay] = useState(1)
  const [addingTo, setAddingTo] = useState<{ si: number; di: number } | null>(null)
  const [addVal, setAddVal] = useState('')
  const tabsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raw = localStorage.getItem('tripzync_onboarding')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as OnboardingData
      setData(parsed)
      const it = buildItinerary(parsed)
      setItinerary(it)
      if (it.length > 0) setActiveDay(it[0].days[0]?.dayNumber ?? 1)

      const cities = Object.keys(parsed.placesByCity || {})
      if (!cities.length && parsed.destination) cities.push(parsed.destination)
      Promise.all(cities.map(city =>
        fetch(`/api/places?country=${encodeURIComponent(city)}`)
          .then(r => r.json()).then(d => ({ places: (d.places || []) as { name: string; image: string }[] }))
          .catch(() => ({ places: [] }))
      )).then(results => {
        const map: Record<string, string> = {}
        results.forEach(({ places }) => places.forEach(p => { if (p.name && p.image) map[p.name] = p.image }))
        setPhotoMap(map)
      })
    } catch { /* ignore */ }
  }, [])

  const allDays = itinerary.flatMap(s => s.days)
  const activeDayBlock = allDays.find(d => d.dayNumber === activeDay) ?? null
  const activeSectionIdx = itinerary.findIndex(s => s.days.some(d => d.dayNumber === activeDay))
  const activeCitySection = itinerary[activeSectionIdx] ?? null

  const removePlace = (si: number, di: number, place: string) =>
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : {
      ...sec, days: sec.days.map((day, d) => d !== di ? day : { ...day, places: day.places.filter(p => p !== place) })
    }))

  const addPlace = (si: number, di: number) => {
    const name = addVal.trim(); if (!name) return
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : {
      ...sec, days: sec.days.map((day, d) => d !== di ? day : { ...day, places: [...day.places, name] })
    }))
    setAddVal(''); setAddingTo(null)
  }

  const removeDay = (si: number, dayNum: number) => {
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : { ...sec, days: sec.days.filter(d => d.dayNumber !== dayNum) }))
    const idx = allDays.findIndex(d => d.dayNumber === dayNum)
    const next = allDays[idx - 1] ?? allDays[idx + 1]
    if (next) setActiveDay(next.dayNumber)
  }

  const addDay = (si: number) => {
    setItinerary(prev => prev.map((sec, s) => {
      if (s !== si) return sec
      const last = sec.days[sec.days.length - 1]
      const num = last ? last.dayNumber + 1 : sec.startDay
      const startDate = data?.pendingTrip?.startDate || ''
      const newDay: DayBlock = { dayNumber: num, date: startDate ? addDays(startDate, num - 1) : `Day ${num}`, places: [] }
      setTimeout(() => setActiveDay(num), 50)
      return { ...sec, days: [...sec.days, newDay] }
    }))
  }

  const destination = data?.destination || data?.cities?.[0] || data?.countries?.[0] || 'Your Trip'
  const destWords = destination.toUpperCase().split(' ')
  const totalDays = computeTotalDays(data?.pendingTrip?.startDate, data?.pendingTrip?.endDate)
  const year = data?.pendingTrip?.startDate ? new Date(data.pendingTrip.startDate).getFullYear() : new Date().getFullYear()

  const activeDayInSection = activeCitySection?.days.findIndex(d => d.dayNumber === activeDay) ?? -1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff' }}>

      {/* Nav */}
      <nav className="ob-nav">
        <a href="/" className="ob-nav-logo" style={{ textDecoration: 'none' }}>TRIPZYNC</a>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/plan" className="ob-nav-link">← Back</a>
          <a href="/login" className="ob-nav-link" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Sign In</a>
        </div>
      </nav>

      <div className="page-inner" style={{ paddingTop: 64 }}>

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <header className="hero">
            <div className="hero-title-wrap">
              <div className="hero-title">{destWords[0]}</div>
              <div className="hero-title"><em className="em">{destWords.slice(1).join(' ') || String(year)}</em></div>
            </div>

            {/* Guest badge */}
            <div style={{ display: 'inline-block', fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', background: 'rgba(0,212,255,.08)', border: '1px solid rgba(0,212,255,.2)', borderRadius: 6, padding: '4px 10px', marginBottom: 12 }}>
              Guest Mode · Draft Itinerary
            </div>

            <div className="hero-meta">
              <div className="meta-item">
                <span className="meta-label">Destination</span>
                <span className="meta-val">{destination}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-val">{totalDays} Days</span>
              </div>
              {data?.pendingTrip?.startDate && data?.pendingTrip?.endDate && (
                <div className="meta-item">
                  <span className="meta-label">Dates</span>
                  <span className="meta-val">{fmtDate(data.pendingTrip.startDate)} – {fmtDate(data.pendingTrip.endDate)}</span>
                </div>
              )}
            </div>
          </header>

          {/* City summary cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {itinerary.map((sec, si) => (
              <div key={sec.city} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => { const d = sec.days[0]; if (d) setActiveDay(d.dayNumber) }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: si % 2 === 0 ? 'var(--accent)' : 'var(--hi)' }}>
                  {sec.city}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
                  {sec.days.length} {sec.days.length === 1 ? 'day' : 'days'} · Day {sec.startDay}–{sec.startDay + sec.days.length - 1}
                </div>
                <button onClick={e => { e.stopPropagation(); addDay(si) }} style={{ marginTop: 8, background: 'none', border: '1px dashed var(--border2)', borderRadius: 6, padding: '3px 10px', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
                  + Add Day
                </button>
              </div>
            ))}
          </div>

          {/* Hotel loyalty */}
          {data?.hotels && data.hotels.filter(h => h !== 'none').length > 0 && (
            <div className="hotel-chip" style={{ marginBottom: 16, cursor: 'default' }}>
              <div className="meta-label">Hotel Loyalty</div>
              <div className="meta-val" style={{ fontSize: 13 }}>
                {data.hotels.filter(h => h !== 'none').map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(', ')}
              </div>
            </div>
          )}

          {/* Sign-up CTA */}
          <div style={{ background: 'linear-gradient(135deg,rgba(0,212,255,.08),rgba(0,212,255,.03))', border: '1px solid rgba(0,212,255,.2)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Save Your Plan</div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, marginBottom: 14 }}>Create a free account to keep this itinerary and access it anywhere.</p>
            <a href="/login" style={{ display: 'block', textAlign: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', padding: '10px', background: 'var(--accent)', color: 'var(--bg)', borderRadius: 8, textDecoration: 'none' }}>
              Sign Up Free →
            </a>
          </div>
        </aside>

        {/* ── MAIN COLUMN ── */}
        <main className="main-col">

          {/* Section header */}
          <div className="section-head" style={{ marginTop: 0 }}>
            <div className="section-line" />
            <span className="section-label">Trip Schedule</span>
            <div className="section-line" />
          </div>

          {/* Day tabs */}
          <div ref={tabsRef} className="tabs-row" style={{ marginBottom: 20 }}>
            {allDays.map(day => (
              <button
                key={day.dayNumber}
                className={`tab-btn${activeDay === day.dayNumber ? ' active' : ''}`}
                onClick={() => {
                  setActiveDay(day.dayNumber)
                  setAddingTo(null); setAddVal('')
                }}
              >
                {day.date}
              </button>
            ))}
          </div>

          {/* Active day panel */}
          {activeDayBlock && activeCitySection ? (
            <div className="day-panel">
              {/* Day header */}
              <div className="day-panel-head">
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
                    {activeCitySection.city}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: .6 }}>
                    {activeDayBlock.date}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, fontStyle: 'italic', lineHeight: 1 }}>
                    DAY {activeDayBlock.dayNumber}
                  </div>
                </div>
                <button
                  onClick={() => removeDay(activeSectionIdx, activeDayBlock.dayNumber)}
                  style={{ background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.25)', color: '#ff6060', borderRadius: 6, padding: '4px 10px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Remove Day
                </button>
              </div>

              {/* Place chips */}
              <div style={{ padding: '16px 14px' }}>
                {activeDayBlock.places.length === 0 && addingTo === null ? (
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontStyle: 'italic', opacity: .7, marginBottom: 12 }}>
                    Free day — explore at your own pace
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                    {activeDayBlock.places.map(place => (
                      <div
                        key={place}
                        style={{ position: 'relative', display: 'inline-block' }}
                        onMouseEnter={e => {
                          const img = photoMap[place]
                          if (!img) return
                          const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setTooltip({ name: place, image: img, x: r.left + r.width / 2, y: r.top - 10 })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--card2)', border: '1px solid var(--border2)', borderRadius: 20, padding: '5px 10px 5px 6px', cursor: 'default' }}>
                          {photoMap[place] ? (
                            <img src={photoMap[place]} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border2)' }} />
                          ) : (
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                          )}
                          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>{place}</span>
                          <button
                            onClick={() => removePlace(activeSectionIdx, activeDayInSection, place)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 2, display: 'flex', alignItems: 'center' }}
                          >×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add place input */}
                {addingTo?.si === activeSectionIdx && addingTo?.di === activeDayInSection ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      autoFocus
                      value={addVal}
                      onChange={e => setAddVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') addPlace(activeSectionIdx, activeDayInSection)
                        if (e.key === 'Escape') { setAddingTo(null); setAddVal('') }
                      }}
                      placeholder="Type a place name..."
                      style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 12px', color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: 14, outline: 'none' }}
                    />
                    <button onClick={() => addPlace(activeSectionIdx, activeDayInSection)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'var(--bg)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
                      Add
                    </button>
                    <button onClick={() => { setAddingTo(null); setAddVal('') }} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo({ si: activeSectionIdx, di: activeDayInSection })}
                    style={{ background: 'transparent', border: '1px dashed var(--border2)', borderRadius: 8, padding: '6px 14px', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    + Add Place
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: .5 }}>
              No trip data found.{' '}
              <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Start planning →</a>
            </div>
          )}

          {/* All days overview */}
          {itinerary.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div className="section-head">
                <div className="section-line" />
                <span className="section-label">Full Itinerary</span>
                <div className="section-line" />
              </div>
              {itinerary.map((sec, si) => (
                <div key={sec.city} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: si % 2 === 0 ? 'var(--accent)' : 'var(--hi)' }}>{sec.city}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: .7 }}>{sec.days.length} days</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sec.days.map(day => (
                      <div key={day.dayNumber} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, background: activeDay === day.dayNumber ? 'rgba(0,212,255,.05)' : 'transparent', border: `1px solid ${activeDay === day.dayNumber ? 'rgba(0,212,255,.15)' : 'transparent'}`, transition: 'all .15s' }}
                        onClick={() => setActiveDay(day.dayNumber)}>
                        <div style={{ minWidth: 64, flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: 2, color: si % 2 === 0 ? 'var(--accent)' : 'var(--hi)', textTransform: 'uppercase' }}>Day {day.dayNumber}</div>
                          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, opacity: .7 }}>{day.date}</div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {day.places.length > 0 ? day.places.map(place => (
                            <span key={place} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Rajdhani', sans-serif", fontSize: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px 3px 5px' }}>
                              {photoMap[place] && <img src={photoMap[place]} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />}
                              {place}
                            </span>
                          )) : (
                            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontStyle: 'italic', opacity: .5 }}>Free day</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Photo tooltip flash card */}
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)', zIndex: 9999, pointerEvents: 'none', background: 'var(--card2)', border: '1px solid var(--border2)', borderRadius: 12, overflow: 'hidden', width: 220, boxShadow: '0 12px 40px rgba(0,0,0,.7)' }}>
          <img src={tooltip.image} alt={tooltip.name} style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div style={{ padding: '8px 12px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            {tooltip.name}
          </div>
        </div>
      )}
    </div>
  )
}
