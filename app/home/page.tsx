'use client'

import { useEffect, useState, useRef } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────
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
interface DayBlock  { dayNumber: number; date: string; places: string[] }
interface CitySection { city: string; days: DayBlock[]; startDay: number }
interface Tooltip   { name: string; image: string; x: number; y: number }

// ── Helpers ──────────────────────────────────────────────────────────────────
const WX_ICONS: Record<number, string> = {0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',51:'🌦',61:'🌧',71:'❄️',80:'🌧',95:'⛈'}
const WX_DESC:  Record<number, string> = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',51:'Drizzle',61:'Rain',71:'Snow',80:'Showers',95:'Thunderstorm'}

const HOTEL_NAMES: Record<string,string> = {
  marriott:'Marriott Bonvoy', hilton:'Hilton Honors', ihg:'IHG One Rewards',
  hyatt:'World of Hyatt', accor:'Accor ALL', none:'No membership',
}

function computeTotalDays(s?: string, e?: string) {
  if (!s || !e) return 7
  return Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1)
}
function shiftDate(dateStr: string, n: number) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtDateLabel(s?: string) {
  if (!s) return ''
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { day:'2-digit', month:'short' }).toUpperCase()
}

function buildItinerary(data: OnboardingData): CitySection[] {
  const placesByCity = data.placesByCity || {}
  const cities = Object.keys(placesByCity).filter(c => placesByCity[c]?.length > 0)
  const totalDays = computeTotalDays(data.pendingTrip?.startDate, data.pendingTrip?.endDate)
  const startDate = data.pendingTrip?.startDate || ''

  if (cities.length === 0) {
    const dest = data.destination || data.cities?.[0] || data.countries?.[0] || 'Your Destination'
    const all = data.places || []
    return [{ city: dest, startDay: 1, days: Array.from({ length: totalDays }, (_, d) => ({
      dayNumber: d + 1, date: startDate ? shiftDate(startDate, d) : `Day ${d+1}`,
      places: all.slice(d * 2, d * 2 + 2),
    }))}]
  }

  const totalPlaces = cities.reduce((s, c) => s + placesByCity[c].length, 0)
  const rawDays = cities.map(c => (placesByCity[c].length / totalPlaces) * totalDays)
  const floorDays = rawDays.map(d => Math.max(1, Math.floor(d)))
  const rem = totalDays - floorDays.reduce((s, d) => s + d, 0)
  rawDays.map((d, i) => ({ i, frac: d - Math.floor(d) }))
    .sort((a, b) => b.frac - a.frac).slice(0, rem).forEach(({ i }) => floorDays[i]++)

  const sections: CitySection[] = []
  let gDay = 1, gOff = 0
  cities.forEach((city, idx) => {
    const n = floorDays[idx]
    const cp = placesByCity[city]
    sections.push({ city, startDay: gDay, days: Array.from({ length: n }, (_, d) => ({
      dayNumber: gDay + d, date: startDate ? shiftDate(startDate, gOff + d) : `Day ${gDay+d}`,
      places: cp.slice(d * 2, d * 2 + 2),
    }))})
    gDay += n; gOff += n
  })
  return sections
}

// ── WeatherWidget (self-contained, uses DOM IDs) ──────────────────────────────
function WeatherWidget({ city }: { city: string }) {
  useEffect(() => {
    if (!city) return
    async function load() {
      try {
        const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`).then(r => r.json())
        if (!geo.length) return
        const { lat, lon } = geo[0]
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,precipitation_probability,relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=celsius&timezone=auto&forecast_days=7`).then(r => r.json())
        const cur = wx.current
        const el = (id: string) => document.getElementById(id)
        const loc = el('h-wx-loc'); if (loc) loc.textContent = `📍 ${geo[0].display_name.split(',')[0]}`
        const tmp = el('h-wx-tmp'); if (tmp) tmp.textContent = `${Math.round(cur.temperature_2m)}°`
        const cnd = el('h-wx-cnd'); if (cnd) cnd.textContent = WX_DESC[cur.weathercode] ?? 'Fair'
        const pills = el('h-wx-pills')
        if (pills) pills.innerHTML = `<span class="w-pill">Wind ${Math.round(cur.windspeed_10m)} km/h</span><span class="w-pill">Rain ${cur.precipitation_probability ?? '--'}%</span><span class="w-pill">Humid ${cur.relativehumidity_2m}%</span>`
        const today = new Date().toISOString().slice(0,10)
        const days = el('h-wx-days')
        if (days) days.innerHTML = (wx.daily.time ?? []).map((t: string, i: number) => {
          const dn = new Date(t+'T00:00').toLocaleDateString('en',{month:'short',day:'numeric'})
          return `<div class="wx-day${t===today?' today':''}"><div class="wx-day-name">${t===today?'Today':dn}</div><div class="wx-day-icon">${WX_ICONS[wx.daily.weathercode[i]]??'🌡'}</div><div class="wx-day-hi">${Math.round(wx.daily.temperature_2m_max[i])}°</div><div class="wx-day-lo">${Math.round(wx.daily.temperature_2m_min[i])}°</div><div class="wx-day-rain">${wx.daily.precipitation_probability_max[i]??0}%</div></div>`
        }).join('')
      } catch { /* silent */ }
    }
    load()
  }, [city])

  return (
    <div className="weather-full card" style={{ marginBottom: 20 }}>
      <div className="wx-top-row">
        <div className="wx-current">
          <div className="weather-loc" id="h-wx-loc">📍 Loading…</div>
          <div className="weather-temp-big" id="h-wx-tmp">--°</div>
          <div className="weather-cond" id="h-wx-cnd">Fetching weather</div>
          <div className="wx-now-pills" id="h-wx-pills">
            <span className="w-pill">Wind --</span>
            <span className="w-pill">Rain --</span>
            <span className="w-pill">Humid --</span>
          </div>
        </div>
        <div className="wx-forecast">
          <div className="wx-days" id="h-wx-days" />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GuestHomePage() {
  const [data,        setData]        = useState<OnboardingData | null>(null)
  const [itinerary,   setItinerary]   = useState<CitySection[]>([])
  const [photoMap,    setPhotoMap]    = useState<Record<string, string>>({})
  const [tooltip,     setTooltip]     = useState<Tooltip | null>(null)
  const [addingTo,    setAddingTo]    = useState<{ si: number; di: number } | null>(null)
  const [addVal,      setAddVal]      = useState('')
  const [activeDay,   setActiveDay]   = useState(1)
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({})

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
          .then(r => r.json()).then(d => (d.places || []) as {name:string;image:string}[])
          .catch(() => [] as {name:string;image:string}[])
      )).then(results => {
        const map: Record<string, string> = {}
        results.flat().forEach(p => { if (p.name && p.image) map[p.name] = p.image })
        setPhotoMap(map)
      })
    } catch { /* ignore */ }
  }, [])

  // ── Edit helpers ────────────────────────────────────────────────────────────
  const removePlace = (si: number, di: number, place: string) =>
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : {
      ...sec, days: sec.days.map((day, d) => d !== di ? day : {
        ...day, places: day.places.filter(p => p !== place) })
    }))

  const addPlace = (si: number, di: number) => {
    const name = addVal.trim(); if (!name) return
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : {
      ...sec, days: sec.days.map((day, d) => d !== di ? day : {
        ...day, places: [...day.places, name] })
    }))
    setAddVal(''); setAddingTo(null)
  }

  const removeDay = (si: number, dayNum: number) => {
    const allDays = itinerary.flatMap(s => s.days)
    const idx = allDays.findIndex(d => d.dayNumber === dayNum)
    const next = allDays[idx - 1] ?? allDays[idx + 1]
    if (next) setActiveDay(next.dayNumber)
    setItinerary(prev => prev.map((sec, s) => s !== si ? sec : {
      ...sec, days: sec.days.filter(d => d.dayNumber !== dayNum) }))
  }

  const addDay = (si: number) => {
    setItinerary(prev => prev.map((sec, s) => {
      if (s !== si) return sec
      const last = sec.days[sec.days.length - 1]
      const num = last ? last.dayNumber + 1 : sec.startDay
      const sd = data?.pendingTrip?.startDate || ''
      const newDay: DayBlock = { dayNumber: num, date: sd ? shiftDate(sd, num - 1) : `Day ${num}`, places: [] }
      return { ...sec, days: [...sec.days, newDay] }
    }))
  }

  const scrollToDay = (dayNum: number) => {
    setActiveDay(dayNum)
    setTimeout(() => {
      dayRefs.current[dayNum]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const destination = data?.destination || data?.cities?.[0] || data?.countries?.[0] || 'Your Trip'
  const destWords   = destination.toUpperCase().split(' ')
  const totalDays   = computeTotalDays(data?.pendingTrip?.startDate, data?.pendingTrip?.endDate)
  const year        = data?.pendingTrip?.startDate ? new Date(data.pendingTrip.startDate).getFullYear() : new Date().getFullYear()
  const allDays     = itinerary.flatMap(s => s.days)
  const hotelNames  = (data?.hotels || []).filter(h => h && h !== 'none').map(h => HOTEL_NAMES[h] || h)

  // city for weather — first city or first selected country
  const weatherCity = data?.cities?.[0] || data?.countries?.[0] || destination

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

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <div className="page-inner" style={{ paddingTop: 64 }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="sidebar">
          <header className="hero">
            <div className="hero-title-wrap">
              <div className="hero-title">{destWords[0]}</div>
              <div className="hero-title"><em className="em">{destWords.slice(1).join(' ') || String(year)}</em></div>
            </div>

            <div style={{ display:'inline-block', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:3, color:'var(--accent)', textTransform:'uppercase', background:'rgba(0,212,255,.08)', border:'1px solid rgba(0,212,255,.2)', borderRadius:6, padding:'4px 10px', marginBottom:14 }}>
              Guest Mode · Draft
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
                  <span className="meta-val">{fmtDateLabel(data.pendingTrip.startDate)} – {fmtDateLabel(data.pendingTrip.endDate)}</span>
                </div>
              )}
            </div>
          </header>

          {/* City cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {itinerary.map((sec, si) => (
              <div key={sec.city} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', color: si % 2 === 0 ? 'var(--accent)' : 'var(--hi)' }}>
                  {sec.city}
                </div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, textTransform:'uppercase', marginTop:2 }}>
                  {sec.days.length} {sec.days.length === 1 ? 'day' : 'days'} · Day {sec.startDay}–{sec.startDay + sec.days.length - 1}
                </div>
                <div style={{ display:'flex', gap:6, marginTop:8 }}>
                  <button onClick={() => scrollToDay(sec.days[0]?.dayNumber ?? sec.startDay)}
                    style={{ flex:1, background:'none', border:'1px solid var(--border2)', borderRadius:6, padding:'3px 8px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                    Go →
                  </button>
                  <button onClick={() => addDay(si)}
                    style={{ flex:1, background:'none', border:'1px dashed var(--border2)', borderRadius:6, padding:'3px 8px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                    + Day
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Hotel loyalty */}
          {hotelNames.length > 0 && (
            <div className="hotel-chip" style={{ marginBottom:16, cursor:'default' }}>
              <div className="meta-label">Hotel Loyalty</div>
              <div className="meta-val" style={{ fontSize:13, lineHeight:1.5 }}>
                {hotelNames.join(', ')}
              </div>
              <div className="edit-hint">from your preferences</div>
            </div>
          )}

          {/* Sign-up CTA */}
          <div style={{ background:'linear-gradient(135deg,rgba(0,212,255,.08),rgba(0,212,255,.03))', border:'1px solid rgba(0,212,255,.2)', borderRadius:12, padding:'18px 20px' }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, letterSpacing:3, textTransform:'uppercase', marginBottom:6 }}>Save Your Plan</div>
            <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, marginBottom:14 }}>
              Create a free account to keep this itinerary and access it anywhere.
            </p>
            <a href="/login" style={{ display:'block', textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:3, textTransform:'uppercase', padding:'10px', background:'var(--accent)', color:'var(--bg)', borderRadius:8, textDecoration:'none' }}>
              Sign Up Free →
            </a>
          </div>
        </aside>

        {/* ── MAIN COLUMN ─────────────────────────────────────────────────── */}
        <main className="main-col">

          {/* Weather */}
          <WeatherWidget city={weatherCity} />

          {/* Section header */}
          <div className="section-head" style={{ marginTop:0 }}>
            <div className="section-line" />
            <span className="section-label">Trip Schedule</span>
            <div className="section-line" />
          </div>

          {/* Day tabs — show ~7 at a time, scroll for the rest */}
          <div style={{ overflowX: 'auto', maxWidth: 660, marginBottom: 16, scrollbarWidth: 'thin', scrollbarColor: 'var(--border2) transparent', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <div className="tabs-row" style={{ marginBottom: 0, width: 'max-content', maxWidth: 'none' }}>
              {allDays.map(day => (
                <button key={day.dayNumber}
                  className={`tab-btn${activeDay === day.dayNumber ? ' active' : ''}`}
                  style={{ minWidth: 88 }}
                  onClick={() => scrollToDay(day.dayNumber)}>
                  {day.date}
                </button>
              ))}
            </div>
          </div>

          {/* ── Bounded scrollable itinerary ─────────────────────────────── */}
          {itinerary.length > 0 ? (
            <div style={{ maxHeight:'62vh', overflowY:'auto', overflowX:'hidden', borderRadius:16, border:'1px solid var(--border)', scrollbarWidth:'thin', scrollbarColor:'var(--border2) transparent' }}>
              {itinerary.map((sec, si) => (
                <div key={sec.city}>
                  {/* City header */}
                  <div style={{ position:'sticky', top:0, zIndex:10, display:'flex', alignItems:'baseline', gap:12, padding:'12px 18px 10px', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', color: si % 2 === 0 ? 'var(--accent)' : 'var(--hi)' }}>
                      {sec.city}
                    </span>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:3, textTransform:'uppercase', opacity:.7 }}>
                      {sec.days.length} {sec.days.length === 1 ? 'day' : 'days'}
                    </span>
                    <button onClick={() => addDay(si)} style={{ marginLeft:'auto', background:'none', border:'1px dashed var(--border2)', borderRadius:6, padding:'3px 10px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                      + Add Day
                    </button>
                  </div>

                  {/* Day rows */}
                  {sec.days.map((day, di) => (
                    <div
                      key={day.dayNumber}
                      ref={el => { dayRefs.current[day.dayNumber] = el }}
                      style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', background: activeDay === day.dayNumber ? 'rgba(0,212,255,.04)' : 'transparent', transition:'background .2s' }}
                    >
                      {/* Day label row */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <div>
                          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, color: si % 2 === 0 ? 'var(--accent)' : 'var(--hi)', textTransform:'uppercase' }}>
                            Day {day.dayNumber}
                          </span>
                          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, opacity:.7, marginLeft:8 }}>
                            {day.date}
                          </span>
                        </div>
                        <button onClick={() => removeDay(si, day.dayNumber)}
                          style={{ background:'none', border:'none', color:'rgba(255,100,100,.6)', cursor:'pointer', fontSize:12, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1, textTransform:'uppercase', padding:'2px 6px' }}>
                          Remove
                        </button>
                      </div>

                      {/* Place chips */}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom: (addingTo?.si === si && addingTo?.di === di) ? 10 : 0 }}>
                        {day.places.length === 0 && !(addingTo?.si === si && addingTo?.di === di) && (
                          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontStyle:'italic', opacity:.5 }}>
                            Free day — explore at your own pace
                          </span>
                        )}
                        {day.places.map(place => (
                          <div key={place}
                            style={{ position:'relative' }}
                            onMouseEnter={e => {
                              const img = photoMap[place]; if (!img) return
                              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setTooltip({ name: place, image: img, x: r.left + r.width / 2, y: r.top - 10 })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:20, padding:'5px 10px 5px 6px', cursor:'default' }}>
                              {photoMap[place]
                                ? <img src={photoMap[place]} alt="" style={{ width:22, height:22, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'1px solid var(--border2)' }} />
                                : <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--border)', flexShrink:0 }} />
                              }
                              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:600, letterSpacing:.5 }}>{place}</span>
                              <button onClick={() => removePlace(si, di, place)}
                                style={{ background:'none', border:'none', color:'rgba(255,255,255,.5)', cursor:'pointer', fontSize:16, lineHeight:1, padding:'0 0 0 2px', display:'flex', alignItems:'center' }}>
                                ×
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Inline add button at end of chip row */}
                        {!(addingTo?.si === si && addingTo?.di === di) && (
                          <button onClick={() => { setAddingTo({ si, di }); setAddVal('') }}
                            style={{ background:'transparent', border:'1px dashed var(--border2)', borderRadius:20, padding:'5px 12px', color:'rgba(255,255,255,.6)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                            + Add
                          </button>
                        )}
                      </div>

                      {/* Add place input — inline below chips */}
                      {addingTo?.si === si && addingTo?.di === di && (
                        <div style={{ display:'flex', gap:8, marginTop:8 }}>
                          <input
                            autoFocus
                            value={addVal}
                            onChange={e => setAddVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') addPlace(si, di)
                              if (e.key === 'Escape') { setAddingTo(null); setAddVal('') }
                            }}
                            placeholder="Place name…"
                            style={{ flex:1, background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:8, padding:'7px 12px', color:'#fff', fontFamily:"'Rajdhani',sans-serif", fontSize:14, outline:'none' }}
                          />
                          <button onClick={() => addPlace(si, di)}
                            style={{ background:'var(--accent)', border:'none', borderRadius:8, padding:'7px 16px', color:'var(--bg)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
                            Add
                          </button>
                          <button onClick={() => { setAddingTo(null); setAddVal('') }}
                            style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:8, padding:'7px 12px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, cursor:'pointer' }}>
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'48px 0', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:'uppercase', opacity:.5 }}>
              No trip data.{' '}
              <a href="/" style={{ color:'var(--accent)', textDecoration:'none' }}>Start planning →</a>
            </div>
          )}
        </main>
      </div>
      </div>

      {/* Photo tooltip flash card */}
      {tooltip && (
        <div style={{ position:'fixed', left:tooltip.x, top:tooltip.y, transform:'translate(-50%, -100%)', zIndex:9999, pointerEvents:'none', background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:12, overflow:'hidden', width:220, boxShadow:'0 12px 40px rgba(0,0,0,.8)' }}>
          <img src={tooltip.image} alt={tooltip.name} style={{ width:'100%', height:130, objectFit:'cover', display:'block' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
          <div style={{ padding:'8px 12px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
            {tooltip.name}
          </div>
        </div>
      )}
    </div>
  )
}
