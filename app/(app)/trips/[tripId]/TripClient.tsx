'use client'

import { useState, useEffect, useRef } from 'react'
import { useTripStore } from '@/store/tripStore'
import type { Trip, Hotel, Event, Expense, Flight } from '@/lib/db/schema'
import { DayPanel } from '@/components/itinerary/DayPanel'
import { AddEventBar } from '@/components/itinerary/AddEventBar'
import { ExpenseLog } from '@/components/expense/ExpenseLog'
import { EditEventModal } from '@/components/itinerary/EditEventModal'
import { HotelModal } from '@/components/hotel/HotelModal'
import { toISO, fmtShort, getDayTitle, detectCurrency, daysBetween } from '@/lib/utils'
import { EditTripModal } from '@/components/trip/EditTripModal'

interface Member { userId: string; name: string | null; image: string | null; joinedAt: Date }

interface Props {
  trip: Trip
  hotels: Hotel[]
  events: Event[]
  expenses: Expense[]
  flights: Flight[]
  isOwner: boolean
  members: Member[]
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

export function TripClient({ trip, hotels, events, expenses, flights, isOwner, members }: Props) {
  const { setTrip, setHotels, setEvents, setExpenses, setFlights, activeDayIndex, setActiveDayIndex } = useTripStore()
  const [hotelModalOpen, setHotelModalOpen] = useState(false)
  const [editTripOpen, setEditTripOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

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
  const currency = detectCurrency(trip.destCity ?? trip.destination ?? '') || { symbol: '¥', code: 'JPY' }
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 16 }}>
                <p className="hero-subtitle" style={{ margin: 0, flex: 1 }}>{trip.subtitle}</p>
                <div className="hotel-chip" onClick={() => setHotelModalOpen(true)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <div className="meta-label">Basecamp</div>
                  <div className="meta-val">
                    {storeHotels.length > 0 ? storeHotels[0].name : 'Set hotel'}
                  </div>
                  <div className="edit-hint">tap to edit</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {isOwner && (
                  <button onClick={() => setEditTripOpen(true)} style={{
                    background: 'none', border: '1px solid rgba(255,255,255,.15)',
                    borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,.4)',
                    fontFamily: "'Barlow Condensed'", fontSize: 10,
                    letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>✏️ Edit Trip</button>
                )}
                {isOwner && (
                  <button onClick={() => setInviteOpen(true)} style={{
                    background: 'none', border: '1px solid rgba(168,85,247,.35)',
                    borderRadius: 6, padding: '4px 10px', color: 'rgba(168,85,247,.8)',
                    fontFamily: "'Barlow Condensed'", fontSize: 10,
                    letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>👥 Invite</button>
                )}
                <button className="print-btn" onClick={() => window.print()} style={{
                  background: 'none', border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,.4)',
                  fontFamily: "'Barlow Condensed'", fontSize: 10,
                  letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
                }}>🖨 Print / PDF</button>
                {!isOwner && (
                  <span style={{
                    display: 'inline-block', border: '1px solid rgba(168,85,247,.25)',
                    borderRadius: 6, padding: '4px 10px', color: 'rgba(168,85,247,.6)',
                    fontFamily: "'Barlow Condensed'", fontSize: 10,
                    letterSpacing: '.12em', textTransform: 'uppercase',
                  }}>👥 Shared Trip</span>
                )}
              </div>
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

            {/* Day panels — all rendered, inactive ones hidden via CSS (visible on print) */}
            {itinerary.map((day, i) => (
              <div
                key={day.date}
                className={`day-panel${day.date === toISO(new Date()) ? ' is-today' : ''}${i !== activeDayIndex ? ' day-panel-hidden' : ''}`}
              >
                <DayPanel
                  tripId={trip.id}
                  day={day}
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                />
                <AddEventBar tripId={trip.id} date={day.date} dayIndex={i} />
              </div>
            ))}
          </main>
        </div>
      </div>

      {/* Edit trip modal */}
      {isOwner && <EditTripModal open={editTripOpen} onClose={() => setEditTripOpen(false)} />}

      {/* Invite modal */}
      {isOwner && <InviteModal tripId={trip.id} open={inviteOpen} onClose={() => setInviteOpen(false)} initialMembers={members} />}

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

// ─── INVITE MODAL ─────────────────────────────────────────────────────────────
function InviteModal({
  tripId,
  open,
  onClose,
  initialMembers,
}: {
  tripId: string
  open: boolean
  onClose: () => void
  initialMembers: Member[]
}) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState<Member[]>(initialMembers)

  useEffect(() => {
    if (!open) return
    fetch(`/api/trips/${tripId}/invite`)
      .then(r => r.json())
      .then(d => { if (d.url) setInviteUrl(d.url) })
  }, [open, tripId])

  async function generateLink() {
    setLoading(true)
    const res = await fetch(`/api/trips/${tripId}/invite`, { method: 'POST' })
    const data = await res.json()
    setInviteUrl(data.url)
    setLoading(false)
  }

  async function copyLink() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function removeMember(userId: string) {
    await fetch(`/api/trips/${tripId}/members?userId=${userId}`, { method: 'DELETE' })
    setMembers(prev => prev.filter(m => m.userId !== userId))
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box invite-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontSize: 16 }}>👥</span>
          <div>
            <div className="modal-title">Invite to Trip</div>
            <div className="modal-sub">Share a link — anyone who opens it can join</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="invite-link-section">
          {inviteUrl ? (
            <>
              <div className="invite-url-row">
                <input className="invite-url-input" value={inviteUrl} readOnly />
                <button className="invite-copy-btn" onClick={copyLink}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <button className="invite-regen-btn" onClick={generateLink} disabled={loading}>
                {loading ? 'Generating…' : '↺ Reset link'}
              </button>
            </>
          ) : (
            <button className="invite-gen-btn" onClick={generateLink} disabled={loading}>
              {loading ? 'Generating…' : '🔗 Generate Invite Link'}
            </button>
          )}
        </div>

        {members.length > 0 && (
          <div className="invite-members">
            <div className="invite-members-label">Members</div>
            {members.map(m => (
              <div key={m.userId} className="invite-member-row">
                <div className="invite-avatar">
                  {m.image
                    ? <img src={m.image} alt={m.name ?? ''} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    : <span>{(m.name ?? '?')[0].toUpperCase()}</span>
                  }
                </div>
                <span className="invite-member-name">{m.name ?? 'Unknown'}</span>
                <button className="invite-remove-btn" onClick={() => removeMember(m.userId)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
          const dn = new Date(t + 'T00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })
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
interface AIMessage { role: 'user' | 'ai'; text: string; thinking?: boolean }

interface TransportField { label: string; value: string }
interface TransportOption { title: string; badge?: string; badgeColor?: string; fields: TransportField[]; note?: string }
interface TransportData { __type: 'transport_options'; route: string; options: TransportOption[]; proTip?: string }

function parseTransport(text: string): TransportData | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    const raw = match ? match[1] : text
    const parsed = JSON.parse(raw.trim())
    if (parsed.__type === 'transport_options') return parsed
  } catch {}
  return null
}

function TransportCard({ data }: { data: TransportData }) {
  return (
    <div className="tc-wrap">
      <div className="tc-route">{data.route}</div>
      {data.options.map((opt, i) => (
        <div key={i} className="tc-option">
          <div className="tc-option-head">
            <span className="tc-num">{i + 1}</span>
            <span className="tc-title">{opt.title}</span>
            {opt.badge && (
              <span className="tc-badge" style={opt.badgeColor ? { color: opt.badgeColor, borderColor: opt.badgeColor } : {}}>
                {opt.badge}
              </span>
            )}
          </div>
          <div className="tc-fields">
            {opt.fields.map((f, j) => (
              <div key={j} className="tc-field">
                <div className="tc-field-label">{f.label}</div>
                <div className="tc-field-value">{f.value}</div>
              </div>
            ))}
          </div>
          {opt.note && <div className="tc-note">{opt.note}</div>}
        </div>
      ))}
      {data.proTip && <div className="tc-protip">Pro tip — {data.proTip}</div>}
    </div>
  )
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="ai-md-h3">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="ai-md-h2">{line.slice(3)}</h2>)
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={i} className="ai-md-bold">{line.slice(2, -2)}</p>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('• '))) {
        items.push(lines[i].replace(/^[-•] /, ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="ai-md-ul">
          {items.map((it, j) => <li key={j}>{inlineFormat(it)}</li>)}
        </ul>
      )
      continue
    } else if (line.trim()) {
      elements.push(<p key={i} className="ai-md-p">{inlineFormat(line)}</p>)
    }
    i++
  }
  return <div className="ai-md">{elements}</div>
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p
  )
}

function AIDrawer({ trip, hotels, currency }: { trip: Trip; hotels: Hotel[]; currency: string }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'ai', text: 'Hi! Ask me anything about your trip — restaurants, transit, packing, local tips. 🌸🏁' },
  ])
  const [loading, setLoading] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages])

  async function askAI(prompt: string, systemOverride?: string) {
    if (!prompt.trim() || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: prompt }, { role: 'ai', text: 'Thinking...', thinking: true }])
    setLoading(true)

    const hotelNames = hotels.map(h => h.name).join(', ')
    const system = systemOverride ?? `You are a helpful travel assistant. Trip: "${trip.title1} ${trip.title2}". Destination: ${trip.destCity ?? trip.destination}. Dates: ${trip.startDate} to ${trip.endDate}. Hotels: ${hotelNames}. Currency: ${currency}. Keep answers concise and travel-focused.`

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, system }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error ?? 'AI error')
      setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: data.text || 'No response.' }])
    } catch (err: any) {
      setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: err?.message ?? 'Connection error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function askTransit() {
    const hotelNames = hotels.map(h => h.name).join(', ')
    const dest = trip.destCity ?? trip.destination
    const system = `You are a travel assistant. Return ONLY a JSON object (no markdown, no prose) with this exact shape:
{"__type":"transport_options","route":"<ORIGIN> → <DESTINATION>","options":[{"title":"...","badge":"...","badgeColor":"#hex","fields":[{"label":"...","value":"..."}],"note":"..."}],"proTip":"..."}
Rules: include 2-4 transport options from airport/station to the hotel, each with 3 fields (e.g. Bus no./Type/Route, Cost, Duration). badge is optional short label like "Recommended" or "Most convenient". proTip is one short sentence. Respond with raw JSON only.`
    askAI(`How do I get from the main airport to my hotel (${hotelNames}) in ${dest}? Provide transport options.`, system)
  }

  return (
    <>
      <button className={`ai-fab${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)}>✨</button>
      <div className={`ai-drawer${open ? ' open' : ''}`}>
        <div className="ai-drawer-head">
          <span className="ai-gem">✨</span>
          <div>
            <div className="ai-head-title">AI Travel Assistant</div>
            <div className="ai-head-sub">Powered by Gemini</div>
          </div>
        </div>
        <div className="ai-msgs" ref={msgsRef}>
          {messages.map((m, i) => {
            if (m.thinking) return <div key={i} className="ai-msg ai thinking">{m.text}</div>
            if (m.role === 'user') return <div key={i} className="ai-msg user">{m.text}</div>
            const transport = parseTransport(m.text)
            if (transport) return <div key={i} className="ai-msg ai no-pad"><TransportCard data={transport} /></div>
            return <div key={i} className="ai-msg ai"><SimpleMarkdown text={m.text} /></div>
          })}
        </div>
        <div className="ai-quick-pills">
          <span className="ai-pill" onClick={() => askAI('Best restaurants near my hotel?')}>🍜 Food</span>
          <span className="ai-pill" onClick={askTransit}>🚌 Transit</span>
          <span className="ai-pill" onClick={() => askAI('What should I pack for this trip?')}>🧳 Packing</span>
          <span className="ai-pill" onClick={() => askAI('Nearby day trip ideas?')}>🗺 Day trips</span>
        </div>
        <div className="ai-input-row">
          <input
            className="ai-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askAI(input) } }}
            placeholder="Ask about your trip..."
            autoComplete="off"
            disabled={loading}
          />
          <button className="ai-send" onClick={() => askAI(input)} disabled={loading}>➤</button>
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
