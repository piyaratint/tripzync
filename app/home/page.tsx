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

interface HotelSuggestion { name: string; tier: string; price: string; stars: number }
type HotelDB = Record<string, Record<string, HotelSuggestion[]>>

const HOTEL_DB: HotelDB = {
  marriott: {
    Tokyo:         [{ name:'JW Marriott Hotel Tokyo',       tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'The Ritz-Carlton Tokyo',         tier:'Luxury',    price:'$520+/n', stars:5 },{ name:'Sheraton Grande Tokyo Bay',      tier:'Classic',   price:'$180+/n', stars:4 }],
    Kyoto:         [{ name:'JW Marriott Nijo Castle Kyoto', tier:'Luxury',    price:'$420+/n', stars:5 },{ name:'Four Points by Sheraton Kyoto',  tier:'Select',    price:'$140+/n', stars:4 },{ name:'Kyoto Marriott Hotel',           tier:'Classic',   price:'$200+/n', stars:4 }],
    Osaka:         [{ name:'W Osaka',                       tier:'W Hotels',  price:'$340+/n', stars:5 },{ name:'Sheraton Miyako Hotel Osaka',    tier:'Classic',   price:'$160+/n', stars:4 },{ name:'Courtyard Osaka Natural Hot Spa',tier:'Select',    price:'$120+/n', stars:3 }],
    Bangkok:       [{ name:'JW Marriott Bangkok',           tier:'Luxury',    price:'$200+/n', stars:5 },{ name:'W Bangkok',                      tier:'W Hotels',  price:'$220+/n', stars:5 },{ name:'Marriott Marquis Bangkok',       tier:'Premium',   price:'$180+/n', stars:5 }],
    'Chiang Mai':  [{ name:'Le Méridien Chiang Mai',        tier:'Premium',   price:'$90+/n',  stars:5 },{ name:'Renaissance Chiang Mai',         tier:'Premium',   price:'$110+/n', stars:5 },{ name:'Courtyard Chiang Mai',           tier:'Select',    price:'$65+/n',  stars:4 }],
    Seoul:         [{ name:'JW Marriott Seoul',             tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'W Seoul',                        tier:'W Hotels',  price:'$300+/n', stars:5 },{ name:'The Westin Chosun Seoul',        tier:'Premium',   price:'$240+/n', stars:5 }],
    Bali:          [{ name:'The St. Regis Bali Resort',     tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'W Bali – Seminyak',              tier:'W Hotels',  price:'$260+/n', stars:5 },{ name:'Courtyard Bali Seminyak',        tier:'Select',    price:'$120+/n', stars:4 }],
    Paris:         [{ name:'Le Meurice (Dorchester)',       tier:'Luxury',    price:'$800+/n', stars:5 },{ name:'W Paris – Opéra',                tier:'W Hotels',  price:'$480+/n', stars:5 },{ name:'Marriott Paris Champs-Élysées',  tier:'Classic',   price:'$320+/n', stars:5 }],
    London:        [{ name:'W London',                      tier:'W Hotels',  price:'$440+/n', stars:5 },{ name:'The Westin London City',         tier:'Premium',   price:'$320+/n', stars:5 },{ name:'Sheraton Grand London Park Lane',tier:'Classic',   price:'$360+/n', stars:5 }],
    Dubai:         [{ name:'JW Marriott Marquis Dubai',     tier:'Luxury',    price:'$260+/n', stars:5 },{ name:'W Dubai – The Palm',             tier:'W Hotels',  price:'$300+/n', stars:5 },{ name:'Sheraton Grand Hotel Dubai',     tier:'Classic',   price:'$180+/n', stars:5 }],
    'New York':    [{ name:'W New York – Times Square',     tier:'W Hotels',  price:'$380+/n', stars:4 },{ name:'New York Marriott Marquis',      tier:'Classic',   price:'$300+/n', stars:4 },{ name:'The St. Regis New York',         tier:'Luxury',    price:'$820+/n', stars:5 }],
  },
  hilton: {
    Tokyo:         [{ name:'Conrad Tokyo',                  tier:'Luxury',    price:'$360+/n', stars:5 },{ name:'Hilton Tokyo',                   tier:'Classic',   price:'$220+/n', stars:5 },{ name:'DoubleTree by Hilton Tokyo',     tier:'Upper Mid', price:'$140+/n', stars:4 }],
    Kyoto:         [{ name:'DoubleTree by Hilton Kyoto',    tier:'Upper Mid', price:'$130+/n', stars:4 },{ name:'Hilton Kyoto',                   tier:'Classic',   price:'$190+/n', stars:5 },{ name:'Hampton by Hilton Kyoto',        tier:'Midscale',  price:'$80+/n',  stars:3 }],
    Osaka:         [{ name:'Conrad Osaka',                  tier:'Luxury',    price:'$340+/n', stars:5 },{ name:'Hilton Osaka',                   tier:'Classic',   price:'$180+/n', stars:5 },{ name:'DoubleTree Osaka',               tier:'Upper Mid', price:'$130+/n', stars:4 }],
    Bangkok:       [{ name:'Conrad Bangkok',                tier:'Luxury',    price:'$190+/n', stars:5 },{ name:'Hilton Bangkok Grand Asoke',     tier:'Classic',   price:'$160+/n', stars:5 },{ name:'DoubleTree Bangkok',             tier:'Upper Mid', price:'$100+/n', stars:4 }],
    Seoul:         [{ name:'Conrad Seoul',                  tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'Hilton Seoul',                   tier:'Classic',   price:'$220+/n', stars:5 },{ name:'DoubleTree Seoul',               tier:'Upper Mid', price:'$140+/n', stars:4 }],
    Bali:          [{ name:'Conrad Bali',                   tier:'Luxury',    price:'$260+/n', stars:5 },{ name:'Hilton Bali Resort',             tier:'Classic',   price:'$180+/n', stars:5 },{ name:'DoubleTree Bali – Legian Beach', tier:'Upper Mid', price:'$120+/n', stars:4 }],
    Dubai:         [{ name:'Waldorf Astoria Dubai DIFC',    tier:'Luxury',    price:'$380+/n', stars:5 },{ name:'Conrad Dubai',                   tier:'Luxury',    price:'$280+/n', stars:5 },{ name:'Hilton Dubai Al Habtoor City',   tier:'Classic',   price:'$200+/n', stars:5 }],
    Paris:         [{ name:'Waldorf Astoria Paris',         tier:'Luxury',    price:'$900+/n', stars:5 },{ name:'Conrad Paris',                   tier:'Luxury',    price:'$600+/n', stars:5 },{ name:'Hilton Paris Opéra',             tier:'Classic',   price:'$350+/n', stars:4 }],
    London:        [{ name:'Waldorf Astoria London Aldwych',tier:'Luxury',    price:'$700+/n', stars:5 },{ name:'Conrad London St. James',        tier:'Luxury',    price:'$500+/n', stars:5 },{ name:'Hilton London Bankside',         tier:'Classic',   price:'$280+/n', stars:4 }],
    'New York':    [{ name:'Waldorf Astoria New York',      tier:'Luxury',    price:'$900+/n', stars:5 },{ name:'Conrad New York Downtown',       tier:'Luxury',    price:'$500+/n', stars:4 },{ name:'Hilton New York Midtown',        tier:'Classic',   price:'$280+/n', stars:4 }],
  },
  hyatt: {
    Tokyo:         [{ name:'Park Hyatt Tokyo',              tier:'Park Hyatt',price:'$520+/n', stars:5 },{ name:'Grand Hyatt Tokyo',              tier:'Grand Hyatt',price:'$380+/n',stars:5 },{ name:'Hyatt Centric Ginza Tokyo',     tier:'Centric',   price:'$200+/n', stars:4 }],
    Kyoto:         [{ name:'Park Hyatt Kyoto',              tier:'Park Hyatt',price:'$600+/n', stars:5 },{ name:'Andaz Kyoto Higashiyama',        tier:'Andaz',     price:'$420+/n', stars:5 },{ name:'Hyatt Regency Kyoto',           tier:'Regency',   price:'$220+/n', stars:5 }],
    Bangkok:       [{ name:'Park Hyatt Bangkok',            tier:'Park Hyatt',price:'$260+/n', stars:5 },{ name:'Andaz Bangkok',                  tier:'Andaz',     price:'$200+/n', stars:5 },{ name:'Grand Hyatt Erawan Bangkok',    tier:'Grand Hyatt',price:'$240+/n',stars:5 }],
    Bali:          [{ name:'Andaz Bali',                    tier:'Andaz',     price:'$280+/n', stars:5 },{ name:'Grand Hyatt Bali',               tier:'Grand Hyatt',price:'$220+/n',stars:5 },{ name:'Hyatt Regency Bali',            tier:'Regency',   price:'$160+/n', stars:5 }],
    Seoul:         [{ name:'Grand Hyatt Seoul',             tier:'Grand Hyatt',price:'$260+/n',stars:5 },{ name:'Andaz Seoul Gangnam',            tier:'Andaz',     price:'$240+/n', stars:5 },{ name:'Hyatt Regency Seoul',           tier:'Regency',   price:'$190+/n', stars:5 }],
    Dubai:         [{ name:'Park Hyatt Dubai',              tier:'Park Hyatt',price:'$300+/n', stars:5 },{ name:'Grand Hyatt Dubai',              tier:'Grand Hyatt',price:'$220+/n',stars:5 },{ name:'Andaz Dubai The Palm',          tier:'Andaz',     price:'$260+/n', stars:5 }],
    Paris:         [{ name:'Park Hyatt Paris-Vendôme',      tier:'Park Hyatt',price:'$950+/n', stars:5 },{ name:'Hyatt Regency Paris Étoile',    tier:'Regency',   price:'$320+/n', stars:4 },{ name:'Andaz Paris – Pigalle',         tier:'Andaz',     price:'$380+/n', stars:5 }],
    London:        [{ name:'Hyatt Regency London – The Churchill', tier:'Regency',   price:'$360+/n', stars:5 },{ name:'Andaz London Liverpool Street', tier:'Andaz',     price:'$280+/n', stars:5 },{ name:'Hyatt Place London City East',  tier:'Place',     price:'$160+/n', stars:3 }],
    'New York':    [{ name:'Park Hyatt New York',           tier:'Park Hyatt',price:'$740+/n', stars:5 },{ name:'Grand Hyatt New York',           tier:'Grand Hyatt',price:'$280+/n',stars:4 },{ name:'Andaz 5th Avenue',              tier:'Andaz',     price:'$420+/n', stars:5 }],
  },
  ihg: {
    Tokyo:         [{ name:'InterContinental Tokyo Bay',    tier:'InterCont.',price:'$280+/n', stars:5 },{ name:'ANA InterContinental Tokyo',     tier:'InterCont.',price:'$300+/n', stars:5 },{ name:'Kimpton Shinjuku',               tier:'Kimpton',   price:'$160+/n', stars:4 }],
    Bangkok:       [{ name:'InterContinental Bangkok',      tier:'InterCont.',price:'$180+/n', stars:5 },{ name:'Holiday Inn Bangkok Silom',      tier:'Holiday Inn',price:'$80+/n', stars:4 },{ name:'Crowne Plaza Bangkok Lumpini',   tier:'Crowne',    price:'$120+/n', stars:5 }],
    Seoul:         [{ name:'InterContinental Seoul COEX',   tier:'InterCont.',price:'$240+/n', stars:5 },{ name:'Kimpton Seoul',                  tier:'Kimpton',   price:'$200+/n', stars:5 },{ name:'Crowne Plaza Seoul',             tier:'Crowne',    price:'$160+/n', stars:5 }],
    Dubai:         [{ name:'InterContinental Dubai Festival City',tier:'InterCont.',price:'$240+/n',stars:5},{ name:'Crowne Plaza Dubai Marina',    tier:'Crowne',    price:'$160+/n', stars:5 },{ name:'Holiday Inn Dubai Al Barsha',    tier:'Holiday Inn',price:'$90+/n', stars:4 }],
    London:        [{ name:'InterContinental London Park Lane',tier:'InterCont.',price:'$480+/n',stars:5},{ name:'Kimpton Fitzroy London',         tier:'Kimpton',   price:'$360+/n', stars:5 },{ name:'Crowne Plaza London – Battersea',tier:'Crowne',    price:'$240+/n', stars:4 }],
    'New York':    [{ name:'InterContinental New York Times Square',tier:'InterCont.',price:'$320+/n',stars:4},{ name:'Kimpton Hotel Theta',        tier:'Kimpton',   price:'$280+/n', stars:4 },{ name:'Crowne Plaza New York Midtown', tier:'Crowne',    price:'$240+/n', stars:4 }],
  },
  accor: {
    Tokyo:         [{ name:'Sofitel Tokyo Daiba',           tier:'Sofitel',   price:'$220+/n', stars:5 },{ name:'Pullman Tokyo Tamachi',          tier:'Pullman',   price:'$180+/n', stars:5 },{ name:'Novotel Tokyo Shinjuku',         tier:'Novotel',   price:'$120+/n', stars:4 }],
    Bangkok:       [{ name:'Sofitel Bangkok Sukhumvit',     tier:'Sofitel',   price:'$160+/n', stars:5 },{ name:'Pullman Bangkok King Power',     tier:'Pullman',   price:'$130+/n', stars:5 },{ name:'Novotel Bangkok Fenix Silom',    tier:'Novotel',   price:'$70+/n',  stars:4 }],
    'Chiang Mai':  [{ name:'Pullman Chiang Mai Raja Orchid',tier:'Pullman',   price:'$80+/n',  stars:5 },{ name:'Novotel Chiang Mai Nimman',     tier:'Novotel',   price:'$60+/n',  stars:4 },{ name:'ibis Chiang Mai Nimmanhaemin',   tier:'ibis',      price:'$35+/n',  stars:3 }],
    Bali:          [{ name:'Sofitel Bali Nusa Dua',         tier:'Sofitel',   price:'$220+/n', stars:5 },{ name:'Pullman Bali Legian Beach',      tier:'Pullman',   price:'$140+/n', stars:5 },{ name:'Novotel Bali Nusa Dua',          tier:'Novotel',   price:'$90+/n',  stars:5 }],
    Paris:         [{ name:'Sofitel Paris Le Faubourg',     tier:'Sofitel',   price:'$600+/n', stars:5 },{ name:'Pullman Paris Montparnasse',     tier:'Pullman',   price:'$280+/n', stars:4 },{ name:'Novotel Paris Tour Eiffel',      tier:'Novotel',   price:'$220+/n', stars:4 }],
    Dubai:         [{ name:'Sofitel Dubai Jumeirah Beach',  tier:'Sofitel',   price:'$200+/n', stars:5 },{ name:'Pullman Dubai Creek City',       tier:'Pullman',   price:'$140+/n', stars:5 },{ name:'Novotel Dubai Al Barsha',        tier:'Novotel',   price:'$80+/n',  stars:4 }],
  },
}

const BRAND_ACCENT: Record<string, string> = {
  marriott:'#B5924C', hilton:'#003087', hyatt:'#7B2D8B', ihg:'#003F87', accor:'#C8102E',
}
function getHotelSuggestions(brands: string[], cities: string[]): { brand: string; city: string; hotels: HotelSuggestion[] }[] {
  const results: { brand: string; city: string; hotels: HotelSuggestion[] }[] = []
  for (const brand of brands) {
    const db = HOTEL_DB[brand]
    if (!db) continue
    for (const city of cities) {
      const exact = db[city]
      if (exact?.length) { results.push({ brand, city, hotels: exact.slice(0, 3) }); continue }
      // fuzzy: first city key that includes the search city or vice versa
      const key = Object.keys(db).find(k => k.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(k.toLowerCase()))
      if (key) results.push({ brand, city, hotels: db[key].slice(0, 3) })
    }
  }
  return results
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
  const hotelNames      = (data?.hotels || []).filter(h => h && h !== 'none').map(h => HOTEL_NAMES[h] || h)
  const hotelBrands     = (data?.hotels || []).filter(h => h && h !== 'none')
  const tripCities      = Object.keys(data?.placesByCity || {}).filter(c => (data?.placesByCity?.[c]?.length ?? 0) > 0)
  const suggestCities   = tripCities.length > 0 ? tripCities : (data?.cities || [data?.destination || '']).filter(Boolean)
  const hotelSuggestions = getHotelSuggestions(hotelBrands, suggestCities)

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

          {/* Hotel suggestions */}
          {hotelSuggestions.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {hotelSuggestions.map(({ brand, city, hotels }) => {
                const accent = BRAND_ACCENT[brand] || 'var(--accent)'
                return (
                  <div key={`${brand}-${city}`} style={{ background:'var(--card)', border:`1px solid ${accent}33`, borderRadius:12, overflow:'hidden' }}>
                    {/* Brand header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:`${accent}18`, borderBottom:`1px solid ${accent}33` }}>
                      <div>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:900, letterSpacing:3, textTransform:'uppercase', color: accent }}>
                          {HOTEL_NAMES[brand]}
                        </div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, textTransform:'uppercase', color:'#fff', opacity:.6, marginTop:1 }}>
                          {city}
                        </div>
                      </div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, letterSpacing:2, textTransform:'uppercase', color: accent, background:`${accent}22`, border:`1px solid ${accent}44`, borderRadius:20, padding:'3px 8px' }}>
                        Recommended
                      </div>
                    </div>

                    {/* Hotel list */}
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      {hotels.map((h, i) => (
                        <div key={h.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom: i < hotels.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          {/* Star icon */}
                          <div style={{ width:32, height:32, borderRadius:8, background:`${accent}22`, border:`1px solid ${accent}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14 }}>
                            {'★'.repeat(Math.min(h.stars, 3))}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {h.name}
                            </div>
                            <div style={{ display:'flex', gap:6, marginTop:3, alignItems:'center' }}>
                              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, letterSpacing:2, textTransform:'uppercase', color: accent, background:`${accent}18`, border:`1px solid ${accent}33`, borderRadius:20, padding:'1px 6px' }}>
                                {h.tier}
                              </span>
                              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color: h.stars === 5 ? '#f5a623' : h.stars === 4 ? '#f0c040' : '#aaa', letterSpacing:1 }}>
                                {'★'.repeat(h.stars)}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:1, color:'#fff', textAlign:'right', flexShrink:0 }}>
                            {h.price}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer nudge */}
                    <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)', background:'rgba(255,255,255,.02)', textAlign:'center' }}>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.4)' }}>
                        Points eligible · Sign in to book
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
