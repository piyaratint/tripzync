'use client'

import { useState, useEffect } from 'react'
import { useTripStore } from '@/store/tripStore'
import type { Trip, Hotel, Event, Expense, Flight } from '@/lib/db/schema'
import { DayPanel } from '@/components/itinerary/DayPanel'
import { AddEventBar } from '@/components/itinerary/AddEventBar'
import { ExpenseLog } from '@/components/expense/ExpenseLog'
import { EditEventModal } from '@/components/itinerary/EditEventModal'
import { HotelModal } from '@/components/hotel/HotelModal'
import { toISO, fmtShort, getDayTitle, detectCurrency, daysBetween } from '@/lib/utils'
import { EditTripModal } from '@/components/trip/EditTripModal'

interface Props {
  trip: Trip
  hotels: Hotel[]
  events: Event[]
  expenses: Expense[]
  flights: Flight[]
}

// Build the day-by-day itinerary structure from DB data
function buildItinerary(trip: Trip, hotels: Hotel[], events: Event[]) {
  const start = new Date(trip.startDate + 'T00:00:00')
  const total = daysBetween(trip.startDate, trip.endDate)
  const days = []

  for (let i = 0; i < total; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = toISO(d)

    // Which hotel covers this date?
    let hotel = hotels[0]
    for (const h of hotels) {
      if (h.fromDate && h.fromDate <= iso) hotel = h
    }

    // Events for this date, sorted by sortOrder then time
    const dayEvents = events
      .filter(e => e.date === iso)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

    days.push({
      date: iso,
      label: fmtShort(iso),
      title: getDayTitle(i, total),
      hotel: hotel?.name ?? '',
      hotelMapsUrl: hotel?.mapsUrl ?? '',
      events: dayEvents,
    })
  }

  return days
}

export function TripClient({ trip, hotels, events, expenses, flights }: Props) {
  const { setTrip, setHotels, setEvents, setExpenses, setFlights, activeDayIndex, setActiveDayIndex } = useTripStore()
  const [hotelModalOpen, setHotelModalOpen] = useState(false)
  const [editTripOpen, setEditTripOpen] = useState(false)

  // Hydrate store from server-fetched data
  useEffect(() => {
    setTrip(trip)
    setHotels(hotels)
    setEvents(events)
    setExpenses(expenses)
    setFlights(flights)
  }, [trip.id]) // eslint-disable-line

  const storeEvents = useTripStore(s => s.events)
  const storeExpenses = useTripStore(s => s.expenses)
  const storeHotels = useTripStore(s => s.hotels)

  const itinerary = buildItinerary(trip, storeHotels, storeEvents)
  const activeDay = itinerary[activeDayIndex] ?? itinerary[0]
  const currency = CURRENCIES.find(c => c.code === trip.currency) || { symbol: "¥", code: "JPY" }
  const expenseTotal = storeExpenses.reduce((sum, e) => sum + parseFloat(String(e.amount)), 0)

  return (
    <>
      {/* Sakura petals canvas */}
      <canvas id="petals-canvas" aria-hidden="true" />

      <div className="page">
        <div className="page-inner">

          {/* ── SIDEBAR ── */}
          <aside className="sidebar">
            <header className="hero">
              <div className="hero-eyebrow">
                <div className="eyebrow-dots"><span /><span className="r" /><span /></div>
                <span className="eyebrow-text">TripZync® · {new Date(trip.startDate + 'T00:00').getFullYear()}</span>
              </div>
              <div className="hero-title-wrap">
                <div className="hero-title">{trip.title1}</div>
                <div className="hero-title"><em className="em">{trip.title2}</em></div>
              </div>
              <p className="hero-subtitle">{trip.subtitle}</p>
              <button onClick={() => setEditTripOpen(true)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,.15)',
                borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,.4)',
                fontFamily: "'Barlow Condensed'", fontSize: 10,
                letterSpacing: '.12em', textTransform: 'uppercase',
                cursor: 'pointer', marginBottom: 8,
              }}>✏️ Edit Trip</button>
              <div className="hero-meta">
                <div className="meta-item">
                  <span className="meta-label">Destination</span>
                  <span className="meta-val">{trip.destCity ?? trip.destination}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Duration</span>
                  <span className="meta-val">{daysBetween(trip.startDate, trip.endDate)} Days</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Dates</span>
                  <span className="meta-val">{fmtShort(trip.startDate)} – {fmtShort(trip.endDate)}</span>
                </div>
                <div className="hotel-chip" onClick={() => setHotelModalOpen(true)} style={{ cursor: 'pointer' }}>
                  <div className="meta-label">Basecamp</div>
                  <div className="meta-val">
                    {storeHotels.length > 0 ? storeHotels[0].name : 'Set hotel'}
                  </div>
                  <div className="edit-hint">tap to edit</div>
                </div>
              </div>
            </header>

            {/* Expense Log */}
            <ExpenseLog
              tripId={trip.id}
              currency={currency}
              expenses={storeExpenses}
              total={expenseTotal}
            />
          </aside>

          {/* ── MAIN COLUMN ── */}
          <main className="main-col">
            {/* Weather widget — client rendered */}
            <WeatherWidget city={trip.destCity ?? ''} />

            <div className="section-head" style={{ marginTop: 0 }}>
              <div className="section-line" />
              <span className="section-label">Trip Schedule</span>
              <div className="section-line" />
            </div>

            {/* Day tabs */}
            <div className="tabs-row">
              {itinerary.map((day, i) => (
                <button
                  key={day.date}
                  className={`tab-btn${i === activeDayIndex ? ' active' : ''}`}
                  onClick={() => setActiveDayIndex(i)}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {/* Day panel */}
            {activeDay && (
              <div className={`day-panel${activeDay.date === toISO(new Date()) ? ' is-today' : ''}`}>
                <DayPanel
                  tripId={trip.id}
                  day={activeDay}
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                />
                <AddEventBar tripId={trip.id} date={activeDay.date} dayIndex={activeDayIndex} />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Edit trip modal */}
      <EditTripModal open={editTripOpen} onClose={() => setEditTripOpen(false)} />

      {/* Hotel modal */}
      <HotelModal
        tripId={trip.id}
        startDate={trip.startDate}
        endDate={trip.endDate}
        open={hotelModalOpen}
        onClose={() => setHotelModalOpen(false)}
      />

      {/* Edit event modal */}
      <EditEventModal tripId={trip.id} />

      {/* AI Fab */}
      <AIDrawer trip={trip} hotels={storeHotels} currency={currency.code} />

      {/* Sakura animation bootstrap */}
      <SakuraPetals />
    </>
  )
}

// ─── WEATHER WIDGET ───────────────────────────────────────────────────────────
function WeatherWidget({ city }: { city: string }) {
  useEffect(() => {
    if (!city) return
    const WX_ICONS: Record<number, string> = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',51:'🌦',61:'🌧',71:'❄️',80:'🌧',95:'⛈' }
    const WX_DESC: Record<number, string> = { 0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',51:'Drizzle',61:'Rain',71:'Snow',80:'Showers',95:'Thunderstorm' }

    async function load() {
      try {
        const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`).then(r => r.json())
        if (!geo.length) return
        const { lat, lon } = geo[0]
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,precipitation_probability,relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=celsius&timezone=auto&forecast_days=7`).then(r => r.json())
        const cur = wx.current
        const el = (id: string) => document.getElementById(id)
        const loc = el('wx-loc'); if (loc) loc.textContent = `📍 ${geo[0].display_name.split(',')[0]}`
        const tmp = el('wx-temp'); if (tmp) tmp.textContent = `${Math.round(cur.temperature_2m)}°`
        const cnd = el('wx-cond'); if (cnd) cnd.textContent = WX_DESC[cur.weathercode] ?? 'Fair'
        const pills = el('wx-pills')
        if (pills) pills.innerHTML = `<span class="w-pill">Wind ${Math.round(cur.windspeed_10m)} km/h</span><span class="w-pill">Rain ${cur.precipitation_probability ?? '--'}%</span><span class="w-pill">Humid ${cur.relativehumidity_2m}%</span>`
        const today = new Date().toISOString().slice(0, 10)
        const days = el('wx-days')
        if (days) days.innerHTML = (wx.daily.time ?? []).map((t: string, i: number) => {
          const dn = new Date(t + 'T00:00').toLocaleDateString('en', { weekday: 'short' })
          return `<div class="wx-day${t === today ? ' today' : ''}"><div class="wx-day-name">${t === today ? 'Today' : dn}</div><div class="wx-day-icon">${WX_ICONS[wx.daily.weathercode[i]] ?? '🌡'}</div><div class="wx-day-hi">${Math.round(wx.daily.temperature_2m_max[i])}°</div><div class="wx-day-lo">${Math.round(wx.daily.temperature_2m_min[i])}°</div><div class="wx-day-rain">${wx.daily.precipitation_probability_max[i] ?? 0}%</div></div>`
        }).join('')
      } catch { /* silent */ }
    }
    load()
  }, [city])

  return (
    <div className="weather-full card" style={{ marginBottom: 20 }}>
      <div className="wx-top-row">
        <div className="wx-current">
          <div className="weather-loc" id="wx-loc">📍 Loading...</div>
          <div className="weather-temp-big" id="wx-temp">--°</div>
          <div className="weather-cond" id="wx-cond">Fetching weather</div>
          <div className="wx-now-pills" id="wx-pills">
            <span className="w-pill">Wind --</span>
            <span className="w-pill">Rain --</span>
            <span className="w-pill">Humid --</span>
          </div>
        </div>
        <div className="wx-forecast">
          <div className="wx-days" id="wx-days" />
        </div>
      </div>
    </div>
  )
}

// ─── AI DRAWER ────────────────────────────────────────────────────────────────
function AIDrawer({ trip, hotels, currency }: { trip: Trip; hotels: Hotel[]; currency: string }) {
  function appendMsg(text: string, role: string) {
    const msgs = document.getElementById('ai-msgs')!
    const div = document.createElement('div')
    div.className = `ai-msg ${role}`
    div.textContent = text
    msgs.appendChild(div)
    msgs.scrollTop = msgs.scrollHeight
    return div
  }

  async function askAI(prompt: string) {
    appendMsg(prompt, 'user')
    const thinking = appendMsg('Thinking...', 'ai thinking')
    const input = document.getElementById('ai-input') as HTMLInputElement
    if (input) input.value = ''
    const hotelNames = hotels.map(h => h.name).join(', ')
    const sys = `You are a helpful travel assistant. Trip: "${trip.title1} ${trip.title2}". Destination: ${trip.destCity ?? trip.destination}. Dates: ${trip.startDate} to ${trip.endDate}. Hotels: ${hotelNames}. Currency: ${currency}. Keep answers concise and travel-focused.`
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: sys, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await resp.json()
      thinking.textContent = data.content?.[0]?.text ?? 'No response.'
      thinking.classList.remove('thinking')
    } catch {
      thinking.textContent = 'Connection error. Please try again.'
      thinking.classList.remove('thinking')
    }
  }

  useEffect(() => {
    const fab = document.getElementById('ai-fab')!
    const drawer = document.getElementById('ai-drawer')!
    const send = document.getElementById('ai-send')!
    const input = document.getElementById('ai-input') as HTMLInputElement

    fab.addEventListener('click', () => {
      const open = drawer.classList.toggle('open')
      fab.classList.toggle('open', open)
      if (open) setTimeout(() => input?.focus(), 300)
    })
    send.addEventListener('click', () => { const v = input.value.trim(); if (v) askAI(v) })
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const v = input.value.trim(); if (v) askAI(v) }
    })
    ;(window as any).sendQuick = (t: string) => askAI(t)
  }, []) // eslint-disable-line

  return (
    <>
      <button className="ai-fab" id="ai-fab">✨</button>
      <div className="ai-drawer" id="ai-drawer">
        <div className="ai-drawer-head">
          <span className="ai-gem">✨</span>
          <div>
            <div className="ai-head-title">AI Travel Assistant</div>
            <div className="ai-head-sub">Powered by Claude</div>
          </div>
        </div>
        <div className="ai-msgs" id="ai-msgs">
          <div className="ai-msg ai">Hi! Ask me anything about your trip — restaurants, transit, packing, local tips. 🌸🏁</div>
        </div>
        <div className="ai-quick-pills">
          <span className="ai-pill" onClick={() => askAI('Best restaurants near my hotel?')}>🍜 Food</span>
          <span className="ai-pill" onClick={() => askAI('Transit tips for getting around?')}>🚌 Transit</span>
          <span className="ai-pill" onClick={() => askAI('What should I pack for this trip?')}>🧳 Packing</span>
          <span className="ai-pill" onClick={() => askAI('Nearby day trip ideas?')}>🗺 Day trips</span>
        </div>
        <div className="ai-input-row">
          <input className="ai-input" id="ai-input" placeholder="Ask about your trip..." autoComplete="off" />
          <button className="ai-send" id="ai-send">➤</button>
        </div>
      </div>
    </>
  )
}

// ─── SAKURA PETALS ────────────────────────────────────────────────────────────
function SakuraPetals() {
  useEffect(() => {
    const c = document.getElementById('petals-canvas') as HTMLCanvasElement
    if (!c) return
    const ctx = c.getContext('2d')!
    let W: number, H: number
    const COLS = ['#f4a7c0','#e8839f','#fde8f0','#f2b4ca','#eba3b8']
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', resize); resize()

    class Petal {
      x=Math.random()*W; y=Math.random()*H
      r=3+Math.random()*4.5; vx=(Math.random()-.5)*.7
      vy=.5+Math.random()*.7; rot=Math.random()*Math.PI*2
      vr=(Math.random()-.5)*.035; a=.45+Math.random()*.55
      color=COLS[Math.floor(Math.random()*COLS.length)]
      update() { this.x+=this.vx+Math.sin(this.y*.018)*.25; this.y+=this.vy; this.rot+=this.vr; if(this.y>H+20){this.y=-20;this.x=Math.random()*W} }
      draw() { ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.rot); ctx.globalAlpha=this.a; ctx.fillStyle=this.color; ctx.beginPath(); ctx.ellipse(0,0,this.r,this.r*.58,0,0,Math.PI*2); ctx.fill(); ctx.restore() }
    }

    const petals = Array.from({ length: 60 }, () => new Petal())
    let raf: number
    const loop = () => { ctx.clearRect(0,0,W,H); petals.forEach(p=>{p.update();p.draw()}); raf=requestAnimationFrame(loop) }
    loop()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return null
}
