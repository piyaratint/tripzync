'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { TripZyncLogo } from '@/components/TripZyncLogo'

const WorldMap = dynamic(
  () => import('@/components/WorldMap').then(m => ({ default: m.WorldMap })),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: 320, background: 'rgba(7,10,25,0.95)', borderRadius: 16,
        border: '1px solid rgba(64,224,208,0.18)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Space Mono',monospace", fontSize: 11,
        color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em',
      }}>
        LOADING MAP…
      </div>
    ),
  }
)

// ── TYPES ────────────────────────────────────────────────────────────────────
type Screen = 'hero' | 'mode-select' | 'map' | 'places' | 'hotels' | 'duration'

interface Place {
  name: string
  type: string
  image: string
  rank: number
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

// ISO A3 → Continent
const ISO_CONTINENT: Record<string, string> = {
  // Americas
  USA:'Americas',CAN:'Americas',MEX:'Americas',BRA:'Americas',ARG:'Americas',
  COL:'Americas',CHL:'Americas',PER:'Americas',ECU:'Americas',BOL:'Americas',
  VEN:'Americas',CUB:'Americas',JAM:'Americas',CRI:'Americas',PAN:'Americas',
  URY:'Americas',PRY:'Americas',GTM:'Americas',HND:'Americas',NIC:'Americas',
  SLV:'Americas',DOM:'Americas',HTI:'Americas',TTO:'Americas',GUY:'Americas',
  BLZ:'Americas',BRB:'Americas',LCA:'Americas',VCT:'Americas',GRD:'Americas',
  // Europe
  GBR:'Europe',FRA:'Europe',DEU:'Europe',ITA:'Europe',ESP:'Europe',
  NLD:'Europe',CHE:'Europe',AUT:'Europe',PRT:'Europe',GRC:'Europe',
  NOR:'Europe',SWE:'Europe',DNK:'Europe',POL:'Europe',CZE:'Europe',
  FIN:'Europe',BEL:'Europe',IRL:'Europe',HUN:'Europe',ROU:'Europe',
  BGR:'Europe',HRV:'Europe',SVK:'Europe',SVN:'Europe',SRB:'Europe',
  RUS:'Europe',UKR:'Europe',BLR:'Europe',LTU:'Europe',LVA:'Europe',
  EST:'Europe',MDA:'Europe',ALB:'Europe',MKD:'Europe',BIH:'Europe',
  MNE:'Europe',LUX:'Europe',MLT:'Europe',ISL:'Europe',AND:'Europe',
  MCO:'Europe',SMR:'Europe',LIE:'Europe',CYP:'Europe',
  // Africa
  ZAF:'Africa',EGY:'Africa',MAR:'Africa',KEN:'Africa',TZA:'Africa',
  NGA:'Africa',GHA:'Africa',ETH:'Africa',SEN:'Africa',RWA:'Africa',
  BWA:'Africa',ZWE:'Africa',MOZ:'Africa',MWI:'Africa',ZMB:'Africa',
  UGA:'Africa',TUN:'Africa',DZA:'Africa',LBY:'Africa',SDN:'Africa',
  AGO:'Africa',CMR:'Africa',CIV:'Africa',MLI:'Africa',BFA:'Africa',
  NAM:'Africa',LSO:'Africa',SWZ:'Africa',MDG:'Africa',MUS:'Africa',
  // Middle East
  ARE:'Middle East',SAU:'Middle East',TUR:'Middle East',IRN:'Middle East',
  JOR:'Middle East',QAT:'Middle East',KWT:'Middle East',ISR:'Middle East',
  LBN:'Middle East',BHR:'Middle East',OMN:'Middle East',IRQ:'Middle East',
  GEO:'Middle East',ARM:'Middle East',AZE:'Middle East',
  // Asia
  JPN:'Asia',CHN:'Asia',IND:'Asia',THA:'Asia',IDN:'Asia',
  KOR:'Asia',VNM:'Asia',MYS:'Asia',SGP:'Asia',PHL:'Asia',
  KHM:'Asia',LKA:'Asia',NPL:'Asia',MMR:'Asia',LAO:'Asia',
  MNG:'Asia',BTN:'Asia',MDV:'Asia',KAZ:'Asia',UZB:'Asia',
  TJK:'Asia',KGZ:'Asia',TKM:'Asia',BGD:'Asia',PAK:'Asia',
  // Oceania
  AUS:'Oceania',NZL:'Oceania',FJI:'Oceania',PNG:'Oceania',SLB:'Oceania',
  VUT:'Oceania',WSM:'Oceania',TON:'Oceania',PLW:'Oceania',FSM:'Oceania',
}

// ISO A3 → display name
const ISO_NAME: Record<string, string> = {
  USA:'United States',CAN:'Canada',MEX:'Mexico',BRA:'Brazil',ARG:'Argentina',
  COL:'Colombia',CHL:'Chile',PER:'Peru',ECU:'Ecuador',BOL:'Bolivia',
  VEN:'Venezuela',CUB:'Cuba',JAM:'Jamaica',CRI:'Costa Rica',PAN:'Panama',
  URY:'Uruguay',PRY:'Paraguay',GTM:'Guatemala',
  GBR:'United Kingdom',FRA:'France',DEU:'Germany',ITA:'Italy',ESP:'Spain',
  NLD:'Netherlands',CHE:'Switzerland',AUT:'Austria',PRT:'Portugal',GRC:'Greece',
  NOR:'Norway',SWE:'Sweden',DNK:'Denmark',POL:'Poland',CZE:'Czech Republic',
  FIN:'Finland',BEL:'Belgium',IRL:'Ireland',HUN:'Hungary',ROU:'Romania',
  BGR:'Bulgaria',HRV:'Croatia',SVK:'Slovakia',SVN:'Slovenia',SRB:'Serbia',
  RUS:'Russia',UKR:'Ukraine',LTU:'Lithuania',LVA:'Latvia',EST:'Estonia',
  LUX:'Luxembourg',MLT:'Malta',ISL:'Iceland',CYP:'Cyprus',
  ZAF:'South Africa',EGY:'Egypt',MAR:'Morocco',KEN:'Kenya',TZA:'Tanzania',
  NGA:'Nigeria',GHA:'Ghana',ETH:'Ethiopia',SEN:'Senegal',RWA:'Rwanda',
  BWA:'Botswana',ZWE:'Zimbabwe',UGA:'Uganda',TUN:'Tunisia',DZA:'Algeria',
  MOZ:'Mozambique',NAM:'Namibia',MDG:'Madagascar',MUS:'Mauritius',
  ARE:'UAE',SAU:'Saudi Arabia',TUR:'Turkey',IRN:'Iran',JOR:'Jordan',
  QAT:'Qatar',KWT:'Kuwait',ISR:'Israel',LBN:'Lebanon',BHR:'Bahrain',
  OMN:'Oman',GEO:'Georgia',
  JPN:'Japan',CHN:'China',IND:'India',THA:'Thailand',IDN:'Indonesia',
  KOR:'South Korea',VNM:'Vietnam',MYS:'Malaysia',SGP:'Singapore',PHL:'Philippines',
  KHM:'Cambodia',LKA:'Sri Lanka',NPL:'Nepal',MMR:'Myanmar',LAO:'Laos',
  MNG:'Mongolia',BTN:'Bhutan',MDV:'Maldives',BGD:'Bangladesh',PAK:'Pakistan',
  AUS:'Australia',NZL:'New Zealand',FJI:'Fiji',PNG:'Papua New Guinea',
}

// Continent → ISOs for panel list
const CONTINENT_ISOS: Record<string, string[]> = {
  Americas: ['USA','CAN','MEX','BRA','ARG','COL','CHL','PER','ECU','BOL','VEN','CUB','JAM','CRI','PAN','URY'],
  Europe:   ['GBR','FRA','DEU','ITA','ESP','NLD','CHE','AUT','PRT','GRC','NOR','SWE','DNK','POL','CZE','FIN','BEL','IRL','HUN','ROU','ISL','CYP'],
  Africa:   ['ZAF','EGY','MAR','KEN','TZA','NGA','GHA','ETH','SEN','RWA','BWA','ZWE','UGA','TUN','NAM','MUS'],
  'Middle East': ['ARE','SAU','TUR','JOR','QAT','KWT','ISR','LBN','BHR','OMN','GEO'],
  Asia:     ['JPN','CHN','IND','THA','IDN','KOR','VNM','MYS','SGP','PHL','KHM','LKA','NPL','MDV','BTN'],
  Oceania:  ['AUS','NZL','FJI','PNG'],
}

// Continent colours for map fill
const CONTINENT_COLOR: Record<string, string> = {
  Americas:    '#0D2040',
  Europe:      '#0D1830',
  Africa:      '#1A1020',
  'Middle East':'#1A1520',
  Asia:        '#0D2030',
  Oceania:     '#102030',
}
const CONTINENT_HOVER: Record<string, string> = {
  Americas:    '#1E3D6A',
  Europe:      '#1E3060',
  Africa:      '#3D2050',
  'Middle East':'#3D2840',
  Asia:        '#1E3D60',
  Oceania:     '#1E3D60',
}

const CONTINENT_EMOJI: Record<string, string> = {
  Americas:    '🌎',
  Europe:      '🏰',
  Africa:      '🦁',
  'Middle East':'🕌',
  Asia:        '🏯',
  Oceania:     '🏝️',
}

// Country → top cities
const COUNTRY_CITIES: Record<string, string[]> = {
  // Asia
  JPN: ['Tokyo','Osaka','Kyoto','Sapporo','Fukuoka','Hiroshima','Nara','Yokohama'],
  CHN: ['Beijing','Shanghai','Hong Kong','Chengdu','Xi\'an','Shenzhen','Guilin','Hangzhou'],
  IND: ['Mumbai','Delhi','Jaipur','Agra','Bangalore','Goa','Varanasi','Kolkata'],
  THA: ['Bangkok','Chiang Mai','Phuket','Pattaya','Krabi','Koh Samui','Hua Hin','Ayutthaya'],
  IDN: ['Bali','Jakarta','Yogyakarta','Lombok','Komodo','Raja Ampat'],
  KOR: ['Seoul','Busan','Jeju','Gyeongju','Incheon'],
  VNM: ['Hanoi','Ho Chi Minh City','Hoi An','Da Nang','Halong Bay','Hue','Sapa'],
  MYS: ['Kuala Lumpur','Penang','Langkawi','Kota Kinabalu','Malacca'],
  SGP: ['Singapore'],
  PHL: ['Manila','Cebu','Palawan','Boracay','Siargao','Davao'],
  KHM: ['Phnom Penh','Siem Reap','Sihanoukville','Kampot'],
  LKA: ['Colombo','Kandy','Galle','Sigiriya','Ella'],
  NPL: ['Kathmandu','Pokhara','Chitwan','Lumbini'],
  MDV: ['Malé','Maafushi','Baa Atoll'],
  // Europe
  GBR: ['London','Edinburgh','Manchester','Liverpool','Bath','Oxford','Cambridge','York'],
  FRA: ['Paris','Nice','Lyon','Marseille','Bordeaux','Strasbourg','Cannes','Annecy'],
  DEU: ['Berlin','Munich','Hamburg','Cologne','Frankfurt','Dresden','Heidelberg'],
  ITA: ['Rome','Venice','Florence','Milan','Naples','Amalfi','Cinque Terre','Bologna','Sicily'],
  ESP: ['Barcelona','Madrid','Seville','Granada','Valencia','Malaga','San Sebastian','Ibiza'],
  NLD: ['Amsterdam','Rotterdam','The Hague','Utrecht','Delft'],
  CHE: ['Zurich','Geneva','Interlaken','Lucerne','Bern','Zermatt'],
  AUT: ['Vienna','Salzburg','Innsbruck','Hallstatt','Graz'],
  PRT: ['Lisbon','Porto','Algarve','Sintra','Madeira','Azores'],
  GRC: ['Athens','Santorini','Mykonos','Crete','Rhodes','Corfu'],
  NOR: ['Oslo','Bergen','Tromsø','Flåm','Stavanger'],
  SWE: ['Stockholm','Gothenburg','Malmö','Kiruna'],
  DNK: ['Copenhagen','Aarhus','Odense'],
  POL: ['Warsaw','Krakow','Gdansk','Wroclaw'],
  CZE: ['Prague','Cesky Krumlov','Brno'],
  IRL: ['Dublin','Galway','Cork','Killarney'],
  HUN: ['Budapest','Eger','Pécs'],
  ISL: ['Reykjavik','Akureyri','Vik'],
  // Americas
  USA: ['New York','Los Angeles','Las Vegas','Miami','Chicago','San Francisco','Hawaii','New Orleans','Washington DC','Seattle'],
  CAN: ['Toronto','Vancouver','Montreal','Quebec City','Banff','Calgary'],
  MEX: ['Mexico City','Cancun','Playa del Carmen','Guadalajara','Oaxaca','Tulum','Los Cabos'],
  BRA: ['Rio de Janeiro','São Paulo','Salvador','Manaus','Florianópolis','Iguazu Falls'],
  ARG: ['Buenos Aires','Patagonia','Mendoza','Bariloche','Salta'],
  COL: ['Bogotá','Cartagena','Medellín','Santa Marta'],
  CHL: ['Santiago','Patagonia','Atacama','Valparaíso','Easter Island'],
  PER: ['Lima','Cusco','Machu Picchu','Arequipa','Lake Titicaca'],
  CRI: ['San José','Manuel Antonio','Arenal','Monteverde'],
  CUB: ['Havana','Varadero','Trinidad','Cienfuegos'],
  // Africa
  ZAF: ['Cape Town','Johannesburg','Durban','Kruger','Garden Route','Stellenbosch'],
  EGY: ['Cairo','Luxor','Aswan','Sharm el-Sheikh','Alexandria','Hurghada'],
  MAR: ['Marrakech','Fez','Casablanca','Chefchaouen','Essaouira'],
  KEN: ['Nairobi','Maasai Mara','Amboseli','Mombasa','Diani'],
  TZA: ['Zanzibar','Serengeti','Kilimanjaro','Dar es Salaam','Arusha'],
  MUS: ['Port Louis','Grand Baie','Black River'],
  RWA: ['Kigali','Volcanoes NP'],
  GHA: ['Accra','Cape Coast','Kumasi'],
  // Middle East
  ARE: ['Dubai','Abu Dhabi','Sharjah'],
  SAU: ['Riyadh','Jeddah','AlUla'],
  TUR: ['Istanbul','Cappadocia','Antalya','Bodrum','Ephesus'],
  JOR: ['Amman','Petra','Wadi Rum','Aqaba','Dead Sea'],
  QAT: ['Doha'],
  ISR: ['Tel Aviv','Jerusalem','Haifa','Eilat'],
  OMN: ['Muscat','Salalah','Nizwa'],
  GEO: ['Tbilisi','Batumi','Kazbegi','Sighnaghi'],
  // Oceania
  AUS: ['Sydney','Melbourne','Brisbane','Perth','Cairns','Gold Coast','Adelaide','Uluru'],
  NZL: ['Auckland','Queenstown','Christchurch','Wellington','Rotorua','Milford Sound'],
  FJI: ['Nadi','Suva','Yasawa Islands','Coral Coast'],
}

// Reverse lookup: city name → ISO A3
const CITY_TO_ISO: Record<string, string> = {}
Object.entries(COUNTRY_CITIES).forEach(([iso, cities]) => {
  cities.forEach(city => { CITY_TO_ISO[city] = iso })
})

// Flat sorted list for search autocomplete
interface CityOption { city: string; iso: string; countryName: string }
const ALL_CITIES: CityOption[] = Object.entries(COUNTRY_CITIES)
  .flatMap(([iso, cities]) =>
    cities.map(city => ({ city, iso, countryName: ISO_NAME[iso] || iso }))
  )
  .sort((a, b) => a.city.localeCompare(b.city))

const HOTEL_PROGRAMS = [
  { id: 'marriott', name: 'Marriott Bonvoy', tiers: 'Gold · Platinum · Titanium', emoji: '🏨', logo: '/logos/marriott.svg' },
  { id: 'hilton',   name: 'Hilton Honors',   tiers: 'Gold · Diamond',             emoji: '🏩', logo: '/logos/hilton.svg'   },
  { id: 'ihg',      name: 'IHG One Rewards', tiers: 'Diamond · Royal Ambassador', emoji: '🏪', logo: '/logos/ihg.svg'      },
  { id: 'hyatt',    name: 'World of Hyatt',  tiers: 'Globalist',                  emoji: '🏛️', logo: '/logos/hyatt.svg'    },
  { id: 'accor',    name: 'Accor ALL',        tiers: 'Platinum · Diamond',         emoji: '🏠', logo: '/logos/accor.svg'    },
  { id: 'none',     name: 'No Membership',   tiers: 'Best available deals',       emoji: '🌐', logo: ''                   },
]

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size:  Math.random() * 4 + 2,
  left:  Math.random() * 100,
  delay: Math.random() * 12,
  dur:   Math.random() * 8 + 10,
  color: i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--hi)' : 'rgba(255,255,255,.3)',
}))

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [screen,         setScreen]        = useState<Screen>('hero')
  const [continent,      setContinent]     = useState('')
  const [selectedISOs,   setSelectedISOs]  = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [placesByLocation, setPlacesByLocation] = useState<{ location: string; places: Place[] }[]>([])
  // keyed as "City::PlaceName" to avoid cross-city selection bleed
  const [selPlaceKeys,     setSelPlaceKeys]     = useState<string[]>([])
  const [selHotels,        setSelHotels]        = useState<string[]>([])
  const [loadingPlaces,    setLoadingPlaces]    = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [showGuestModal, setShowGuestModal] = useState(false)
  // ── City search state ──────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('')
  const [showDropdown,  setShowDropdown]  = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    const s = p.get('screen')
    if (s && (['map','places','hotels','duration'] as string[]).includes(s)) setScreen(s as Screen)
  }, [])

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  const goToPlaces = () => {
    // Determine which locations to fetch — cities first, fall back to countries, then continent
    const locations = selectedCities.length > 0
      ? selectedCities
      : selectedISOs.length > 0
        ? selectedISOs.map(iso => ISO_NAME[iso] || iso)
        : [continent]

    setLoadingPlaces(true)
    setSelPlaceKeys([])
    setScreen('places')

    Promise.all(
      locations.map(async loc => {
        try {
          const res = await fetch(`/api/places?country=${encodeURIComponent(loc)}`)
          const data = await res.json()
          return { location: loc, places: (data.places || []) as Place[] }
        } catch {
          return { location: loc, places: [] as Place[] }
        }
      })
    ).then(results => {
      setPlacesByLocation(results)
      setLoadingPlaces(false)
    })
  }

  const handleCountryToggle = (iso: string) => {
    setSelectedISOs(prev => {
      if (prev.includes(iso)) {
        const citiesToRemove = COUNTRY_CITIES[iso] || []
        setSelectedCities(c => c.filter(city => !citiesToRemove.includes(city)))
        return prev.filter(i => i !== iso)
      }
      return [...prev, iso]
    })
  }

  const finishOnboarding = () => {
    const placesByCity: Record<string, string[]> = {}
    for (const key of selPlaceKeys) {
      const sep = key.indexOf('::')
      if (sep === -1) continue
      const loc = key.slice(0, sep)
      const name = key.slice(sep + 2)
      if (!placesByCity[loc]) placesByCity[loc] = []
      placesByCity[loc].push(name)
    }
    const allPlaceNames = selPlaceKeys.map(k => k.slice(k.indexOf('::') + 2))
    const data = {
      continent,
      countries: selectedISOs.map(iso => ISO_NAME[iso] || iso),
      cities: selectedCities,
      places: allPlaceNames,
      placesByCity,
      hotels: selHotels,
      destination: selectedCities.length > 0
        ? selectedCities[0]
        : selectedISOs.length > 0 ? ISO_NAME[selectedISOs[0]] : continent,
      startDate,
      endDate,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripzync_onboarding', JSON.stringify(data))
    }
    window.location.replace('/home')
  }

  // ── City search handlers ──────────────────────────────────────────────────
  const filteredCities: CityOption[] = searchQuery.length < 1
    ? []
    : ALL_CITIES
        .filter(o => o.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     o.countryName.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 8)

  const handleCitySelect = (city: string, iso: string) => {
    if (!selectedCities.includes(city)) {
      setSelectedCities(prev => [...prev, city])
      if (!selectedISOs.includes(iso)) {
        setSelectedISOs(prev => [...prev, iso])
      }
      if (!continent) setContinent(ISO_CONTINENT[iso] || '')
    }
    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleCityRemove = (city: string) => {
    const iso = CITY_TO_ISO[city]
    const newCities = selectedCities.filter(c => c !== city)
    setSelectedCities(newCities)
    // Remove ISO if no remaining cities from that country
    if (iso) {
      const stillHas = newCities.some(c => CITY_TO_ISO[c] === iso)
      if (!stillHas) {
        setSelectedISOs(prev => prev.filter(i => i !== iso))
      }
    }
  }

  const mapNextDisabled = selectedCities.length === 0

  // ── RENDER: HERO ──────────────────────────────────────────────────────────
  if (screen === 'hero') return (
    <div className="ob-screen">
      <div className="ob-grid-bg" />
      <div className="ob-particles">
        {PARTICLES.map(p => (
          <div key={p.id} className="ob-particle" style={{
            width: p.size, height: p.size,
            left: `${p.left}%`,
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>

      <nav className="ob-nav">
        <TripZyncLogo href="/" />
        <a href="/plan" className="ob-nav-link">Already have a plan? Set up your trip ↗</a>
      </nav>

      <div className="ob-hero-content">
        <div className="ob-badge">
          <span className="ob-badge-dot" />
          Your journey starts here
        </div>
        <h1 className="ob-headline">
          THE WORLD<br />
          IS <span className="ob-em">YOURS</span><br />
          TO DISCOVER
        </h1>
        <p className="ob-subtext">Plan smarter · Travel deeper · Live the route</p>
        <button className="ob-cta-btn" onClick={() => setScreen('mode-select')}>
          START PLANNING →
        </button>
      </div>
    </div>
  )

  // ── RENDER: MODE SELECT ───────────────────────────────────────────────────
  if (screen === 'mode-select') return (
    <div className="ob-screen">
      <div className="ob-grid-bg" />
      <div className="ob-particles" style={{ opacity:.4 }}>
        {PARTICLES.slice(0, 10).map(p => (
          <div key={p.id} className="ob-particle" style={{ width:p.size, height:p.size, left:`${p.left}%`, background:p.color, animationDuration:`${p.dur}s`, animationDelay:`${p.delay}s` }} />
        ))}
      </div>

      {/* Guest warning modal */}
      {showGuestModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.82)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div className="ob-auth-card" style={{ maxWidth:440, margin:0 }}>
            <div style={{ fontSize:44, marginBottom:14 }}>⚠️</div>
            <div className="ob-auth-title" style={{ marginBottom:8, color:'#fff' }}>GUEST MODE</div>
            <p className="ob-auth-sub" style={{ marginBottom:20 }}>
              Create a free account to save your trip and access it from any device.
              As a guest, your plan stays on this browser only and will be lost if you clear your data.
            </p>
            <button className="ob-auth-signup" style={{ marginBottom:12, width:'100%' }}
              onClick={() => { setShowGuestModal(false); setScreen('map') }}>
              CONTINUE AS GUEST →
            </button>
            <button className="ob-auth-skip" onClick={() => setShowGuestModal(false)}>
              ← Go back and sign up
            </button>
          </div>
        </div>
      )}

      <nav className="ob-nav">
        <TripZyncLogo href="/" />
        <button className="ob-nav-link" style={{ background:'none', border:'none', cursor:'pointer' }} onClick={() => setScreen('hero')}>← Back</button>
      </nav>

      <div className="ob-hero-content" style={{ alignItems:'center', textAlign:'center' }}>
        <div className="ob-badge"><span className="ob-badge-dot" />Choose how to get started</div>
        <h2 className="ob-headline" style={{ fontSize:'clamp(28px,6vw,52px)', marginBottom:8 }}>
          HOW DO YOU<br />WANT TO <span className="ob-em">PLAN?</span>
        </h2>
        <p className="ob-subtext" style={{ marginBottom:32 }}>Sign up for the full experience or explore as a guest</p>

        <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center' }}>

          {/* Sign up card */}
          <div style={{ background:'rgba(64,224,208,.07)', border:'2px solid var(--accent)', borderRadius:18, padding:'32px 28px', width:230, cursor:'pointer', textAlign:'left', transition:'transform .15s' }}
            onClick={() => { window.location.href = '/login?callbackUrl=%2F%3Fscreen%3Dmap' }}>
            <div style={{ fontSize:40, marginBottom:14 }}>🔐</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:900, textTransform:'uppercase', color:'#fff', marginBottom:8 }}>Sign Up</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.5 }}>
              Save your trip, access from any device, personalised recommendations.
            </div>
            <div style={{ marginTop:18, fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'var(--accent)', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              GOOGLE SIGN IN →
            </div>
          </div>

          {/* Guest card */}
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.14)', borderRadius:18, padding:'32px 28px', width:230, cursor:'pointer', textAlign:'left', transition:'transform .15s' }}
            onClick={() => setShowGuestModal(true)}>
            <div style={{ fontSize:40, marginBottom:14 }}>👤</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:900, textTransform:'uppercase', color:'#fff', marginBottom:8 }}>Guest Mode</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.5 }}>
              Plan without signing up. Your trip stays on this device only.
            </div>
            <div style={{ marginTop:18, fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.45)' }}>
              CONTINUE AS GUEST →
            </div>
          </div>

        </div>
      </div>
    </div>
  )

  // ── RENDER: MAP (city search + world map) ────────────────────────────────
  if (screen === 'map') return (
    <div className="ob-screen" style={{ justifyContent: 'flex-start' }}>
      <div className="ob-grid-bg" />
      <nav className="ob-nav">
        <TripZyncLogo href="/" />
        <a href="/plan" className="ob-nav-link">Already have a plan? Set up your trip ↗</a>
      </nav>

      <div className="ob-screen-content" style={{ paddingBottom: 120 }}>
        <div className="ob-step-num">STEP 01 / 04</div>
        <h2 className="ob-screen-title">WHERE ARE YOU HEADED?</h2>
        <p className="ob-screen-sub">Search for a city, region, or destination</p>

        {/* ── Search bar ── */}
        <div ref={searchRef} style={{ position: 'relative', maxWidth: 520, width: '100%', marginTop: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${showDropdown ? 'var(--accent)' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: showDropdown && filteredCities.length > 0 ? '12px 12px 0 0' : 12,
            padding: '12px 16px',
            transition: 'border-color 0.2s',
          }}>
            {/* Search icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Tokyo, Bangkok, Los Angeles…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true) }}
              onFocus={() => { if (searchQuery.length > 0) setShowDropdown(true) }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#fff', fontFamily: "'Rajdhani', sans-serif",
                fontSize: 16, fontWeight: 500,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowDropdown(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1, padding: 0 }}
              >×</button>
            )}
          </div>

          {/* ── Dropdown ── */}
          {showDropdown && filteredCities.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#0D1528',
              border: '1.5px solid var(--accent)',
              borderTop: '1px solid rgba(64,224,208,0.25)',
              borderRadius: '0 0 12px 12px',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            }}>
              {filteredCities.map((opt, idx) => (
                <button
                  key={`${opt.iso}-${opt.city}`}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleCitySelect(opt.city, opt.iso)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 12, padding: '11px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    borderBottom: idx < filteredCities.length - 1
                      ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(64,224,208,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: 16 }}>📍</span>
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif", fontSize: 15,
                      fontWeight: 600, color: '#fff',
                    }}>{opt.city}</div>
                    <div style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 9,
                      letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase', marginTop: 1,
                    }}>{opt.countryName}</div>
                  </div>
                  {selectedCities.includes(opt.city) && (
                    <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 14 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {showDropdown && searchQuery.length > 1 && filteredCities.length === 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#0D1528', border: '1.5px solid rgba(64,224,208,0.2)',
              borderTop: 'none', borderRadius: '0 0 12px 12px',
              padding: '14px 16px',
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em',
            }}>
              No cities found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* ── Selected city pills ── */}
        {selectedCities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, maxWidth: 520 }}>
            {selectedCities.map(city => {
              const iso = CITY_TO_ISO[city]
              return (
                <div key={city} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'rgba(64,224,208,0.10)',
                  border: '1px solid rgba(64,224,208,0.35)',
                  borderRadius: 20, padding: '6px 12px 6px 10px',
                }}>
                  <span style={{ fontSize: 13 }}>📍</span>
                  <div>
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
                      fontWeight: 600, color: 'var(--accent)',
                    }}>{city}</span>
                    {iso && (
                      <span style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 8,
                        color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
                        letterSpacing: '0.1em', marginLeft: 6,
                      }}>{ISO_NAME[iso] || iso}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCityRemove(city)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)', fontSize: 16,
                      lineHeight: 1, padding: 0, marginLeft: 2,
                    }}
                  >×</button>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Hint text ── */}
        {selectedCities.length === 0 && (
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginTop: 10,
          }}>
            Add one or more cities to see them on the map
          </p>
        )}
        {selectedCities.length > 0 && selectedCities.length <= 2 && (
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginTop: 10,
          }}>
            Add 3+ cities to zoom in &amp; see city pins on the map
          </p>
        )}

        {/* ── World Map ── */}
        <div style={{ marginTop: 24, width: '100%', maxWidth: 700 }}>
          <WorldMap selectedISOs={selectedISOs} selectedCities={selectedCities} />
        </div>
      </div>

      <div className="ob-progress">
        <button className="ob-step-back" onClick={() => setScreen('mode-select')}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="ob-steps">
            <div className="ob-step-dot done" />
            <div className="ob-step-dot active" />
            <div className="ob-step-dot" />
            <div className="ob-step-dot" />
          </div>
          <span className="ob-step-label">Choose destination</span>
        </div>
        <button
          className="ob-step-next"
          disabled={mapNextDisabled}
          onClick={goToPlaces}
        >
          NEXT →
        </button>
      </div>
    </div>
  )

  // ── RENDER: PLACES ────────────────────────────────────────────────────────
  if (screen === 'places') {
    const locationCount = placesByLocation.length
    return (
      <div className="ob-screen" style={{ justifyContent: 'flex-start' }}>
        <div className="ob-grid-bg" />
        <nav className="ob-nav">
          <TripZyncLogo href="/" />
          <a href="/plan" className="ob-nav-link">Already have a plan? Set up your trip ↗</a>
        </nav>

        <div className="ob-screen-content">
          <div className="ob-step-num">STEP 02 / 04</div>
          <h2 className="ob-screen-title">
            {locationCount === 1
              ? `TOP PLACES IN ${placesByLocation[0]?.location.toUpperCase()}`
              : 'TOP PLACES BY CITY'}
          </h2>
          <p className="ob-screen-sub">Select the highlights you want to visit — tap to add to your itinerary</p>

          {loadingPlaces ? (
            <div className="ob-places-loading">
              <div className="ob-spinner" />
              Finding top attractions…
            </div>
          ) : (
            placesByLocation.map(({ location, places }) => (
              <div key={location} className="ob-places-section">
                {locationCount > 1 && (
                  <div className="ob-places-section-head">
                    <div className="ob-places-section-line" />
                    <span className="ob-places-section-label">{location}</span>
                    <div className="ob-places-section-line" />
                  </div>
                )}
                <div className="ob-places-grid">
                  {places.map((p) => {
                    const key = `${location}::${p.name}`
                    const selected = selPlaceKeys.includes(key)
                    return (
                      <div
                        key={key}
                        className={`ob-place-card${selected ? ' selected' : ''}`}
                        onClick={() => setSelPlaceKeys(prev =>
                          selected ? prev.filter(k => k !== key) : [...prev, key]
                        )}
                      >
                        <img
                          className="ob-place-img"
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80` }}
                        />
                        <div className="ob-place-gradient" />
                        <div className="ob-place-rank">#{p.rank} Top Rated</div>
                        <div className="ob-place-check">{selected ? '✓' : ''}</div>
                        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                          <div className="ob-place-name">{p.name}</div>
                          <div className="ob-place-type">{p.type}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          {selPlaceKeys.length > 0 && (
            <div style={{ marginTop: 20, fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase' }}>
              {selPlaceKeys.length} place{selPlaceKeys.length > 1 ? 's' : ''} selected · Will be added to your itinerary
            </div>
          )}
        </div>

        <div className="ob-progress">
          <button className="ob-step-back" onClick={() => setScreen('map')}>← Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="ob-steps">
              <div className="ob-step-dot done" />
              <div className="ob-step-dot done" />
              <div className="ob-step-dot active" />
              <div className="ob-step-dot" />
            </div>
            <span className="ob-step-label">Pick highlights</span>
          </div>
          <button
            className="ob-step-next"
            onClick={() => setScreen('hotels')}
          >
            {selPlaceKeys.length > 0 ? 'NEXT →' : 'SKIP →'}
          </button>
        </div>
      </div>
    )
  }

  // ── RENDER: HOTELS ────────────────────────────────────────────────────────
  if (screen === 'hotels') return (
    <div className="ob-screen" style={{ justifyContent: 'flex-start' }}>
      <div className="ob-grid-bg" />
      <nav className="ob-nav">
        <TripZyncLogo href="/" />
        <a href="/plan" className="ob-nav-link">Already have a plan? Set up your trip ↗</a>
      </nav>

      <div className="ob-screen-content">
        <div className="ob-step-num">STEP 03 / 04</div>
        <h2 className="ob-screen-title">YOUR HOTEL LOYALTY</h2>
        <p className="ob-screen-sub">We'll prioritise hotels that match your programmes — multi-select</p>

        <div className="ob-hotel-grid">
          {HOTEL_PROGRAMS.map(h => (
            <div
              key={h.id}
              className={`ob-hotel-card${selHotels.includes(h.id) ? ' selected' : ''}`}
              onClick={() => setSelHotels(prev =>
                prev.includes(h.id) ? prev.filter(i => i !== h.id) : [...prev, h.id]
              )}
            >
              <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                {h.logo ? (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
                    <img
                      src={h.logo}
                      alt={h.name}
                      style={{ width: 44, height: 44, objectFit: 'contain' }}
                      onError={e => {
                        const wrap = (e.currentTarget as HTMLImageElement).parentElement!
                        wrap.style.display = 'none'
                        const fb = wrap.nextSibling as HTMLElement
                        if (fb) fb.style.display = 'flex'
                      }}
                    />
                  </div>
                ) : null}
                <span style={{ display: 'none', width: 56, height: 56, borderRadius: 12, background: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{h.emoji}</span>
              </div>
              <div className="ob-hotel-logo">{h.name}</div>
              <div className="ob-hotel-tiers">{h.tiers}</div>
              <div className="ob-hotel-check">✓</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ob-progress">
        <button className="ob-step-back" onClick={() => setScreen('places')}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="ob-steps">
            <div className="ob-step-dot done" />
            <div className="ob-step-dot done" />
            <div className="ob-step-dot done" />
            <div className="ob-step-dot" />
          </div>
          <span className="ob-step-label">Loyalty programmes</span>
        </div>
        <button className="ob-step-next" onClick={() => setScreen('duration')}>
          NEXT →
        </button>
      </div>
    </div>
  )

  // ── RENDER: DURATION ─────────────────────────────────────────────────────
  if (screen === 'duration') {
    const todayStr = new Date().toISOString().split('T')[0]
    const durationDays = startDate && endDate
      ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
      : null

    return (
      <div className="ob-screen" style={{ justifyContent:'flex-start' }}>
        <div className="ob-grid-bg" />
        <nav className="ob-nav">
          <TripZyncLogo href="/" />
        </nav>

        <div className="ob-screen-content">
          <div className="ob-step-num">STEP 04 / 04</div>
          <h2 className="ob-screen-title">WHEN ARE YOU GOING?</h2>
          <p className="ob-screen-sub">Set your trip dates to build a day-by-day itinerary</p>

          <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:420 }}>
            <div>
              <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:'.16em', textTransform:'uppercase' as const, color:'#fff', marginBottom:6, display:'block' }}>
                Start Date
              </label>
              <input
                type="date"
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'12px 16px', color:'#fff', fontFamily:'inherit', fontSize:15, outline:'none', boxSizing:'border-box' as const, colorScheme:'dark' }}
                value={startDate}
                min={todayStr}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:'.16em', textTransform:'uppercase' as const, color:'#fff', marginBottom:6, display:'block' }}>
                End Date
              </label>
              <input
                type="date"
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'12px 16px', color:'#fff', fontFamily:'inherit', fontSize:15, outline:'none', boxSizing:'border-box' as const, colorScheme:'dark' }}
                value={endDate}
                min={startDate || todayStr}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            {durationDays && (
              <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(64,224,208,.07)', border:'1px solid rgba(64,224,208,.2)', borderRadius:10, padding:'12px 16px' }}>
                <span style={{ fontSize:24 }}>📅</span>
                <div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, color:'var(--accent)' }}>
                    {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(255,255,255,.5)', textTransform:'uppercase', marginTop:2 }}>
                    Trip duration planned
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ob-progress">
          <button className="ob-step-back" onClick={() => setScreen('hotels')}>← Back</button>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div className="ob-steps">
              <div className="ob-step-dot done" />
              <div className="ob-step-dot done" />
              <div className="ob-step-dot done" />
              <div className="ob-step-dot active" />
            </div>
            <span className="ob-step-label">Trip duration</span>
          </div>
          <button className="ob-step-next" onClick={finishOnboarding}>
            SEE MY TRIP →
          </button>
        </div>
      </div>
    )
  }
}
