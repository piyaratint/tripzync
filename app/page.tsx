'use client'

import { useState, useEffect, useRef } from 'react'

// ── TYPES ────────────────────────────────────────────────────────────────────
type Screen = 'hero' | 'map' | 'places' | 'hotels' | 'auth-choice'

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

const HOTEL_PROGRAMS = [
  { id: 'marriott', name: 'Marriott Bonvoy', tiers: 'Gold · Platinum · Titanium', emoji: '🏨' },
  { id: 'hilton',   name: 'Hilton Honors',   tiers: 'Gold · Diamond',             emoji: '🏩' },
  { id: 'ihg',      name: 'IHG One Rewards', tiers: 'Diamond · Royal Ambassador', emoji: '🏪' },
  { id: 'hyatt',    name: 'World of Hyatt',  tiers: 'Globalist',                  emoji: '🏛️' },
  { id: 'accor',    name: 'Accor ALL',        tiers: 'Platinum · Diamond',         emoji: '🏠' },
  { id: 'none',     name: 'No Membership',   tiers: 'Best available deals',       emoji: '🌐' },
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
  const [screen,         setScreen]         = useState<Screen>('hero')
  const [continent,      setContinent]      = useState('')
  const [selectedISOs,   setSelectedISOs]   = useState<string[]>([])
  const [showPanel,      setShowPanel]      = useState(false)
  const [panelContinent, setPanelContinent] = useState('')
  const [places,         setPlaces]         = useState<Place[]>([])
  const [selPlaces,      setSelPlaces]      = useState<string[]>([])
  const [selHotels,      setSelHotels]      = useState<string[]>([])
  const [loadingPlaces,  setLoadingPlaces]  = useState(false)

  const mapRef        = useRef<HTMLDivElement>(null)
  const mapInstance   = useRef<any>(null)
  const geoLayer      = useRef<any>(null)
  const mapReady      = useRef(false)
  const selISOsRef    = useRef<string[]>([])

  // keep ref in sync with state (needed for Leaflet event closures)
  useEffect(() => { selISOsRef.current = selectedISOs }, [selectedISOs])

  // ── LEAFLET MAP INIT ──────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'map') return
    if (mapReady.current) return

    const loadLeaflet = () => {
      if ((window as any).L) { initMap(); return }
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      script.onload = initMap
      document.head.appendChild(script)
    }

    const initMap = () => {
      if (mapReady.current || !mapRef.current) return
      mapReady.current = true
      const L = (window as any).L

      const map = L.map('ob-map', {
        center: [20, 15], zoom: 2,
        minZoom: 1.5, maxZoom: 5,
        scrollWheelZoom: false,
        worldCopyJump: false,
        maxBounds: [[-85,-220],[85,220]],
        zoomControl: false,
        attributionControl: false,
      })
      mapInstance.current = map

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map)

      const styleFor = (iso: string, hover = false, selected = false) => {
        const cont = ISO_CONTINENT[iso] || null
        if (!cont) return { fillColor: '#0a0b12', fillOpacity: 0.6, color: '#1a1b28', weight: 0.4 }
        if (selected) return { fillColor: '#0D3060', fillOpacity: 0.95, color: '#00D4FF', weight: 2 }
        if (hover)    return { fillColor: CONTINENT_HOVER[cont] || '#1E2A6A', fillOpacity: 0.92, color: '#00D4FF', weight: 1.2 }
        return { fillColor: CONTINENT_COLOR[cont] || '#1A2050', fillOpacity: 0.85, color: '#2A3470', weight: 0.6 }
      }

      // Load GeoJSON
      const urls = [
        'https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson',
        'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
      ]
      const loadGeo = (idx = 0) => {
        fetch(urls[idx])
          .then(r => r.json())
          .then(data => {
            const layer = L.geoJSON(data, {
              style: (feature: any) => {
                const props = feature.properties
                const isoKey = ['ISO_A3','iso_a3','ADM0_A3','ISO3'].find(k => props[k]?.length === 3)
                const iso = isoKey ? props[isoKey] : null
                return styleFor(iso, false, selISOsRef.current.includes(iso))
              },
              onEachFeature: (feature: any, lyr: any) => {
                const props = feature.properties
                const isoKey = ['ISO_A3','iso_a3','ADM0_A3','ISO3'].find(k => props[k]?.length === 3)
                const iso = isoKey ? props[isoKey] : null
                const cont = iso ? ISO_CONTINENT[iso] : null
                if (!cont) return

                lyr.on('mouseover', () => {
                  if (!selISOsRef.current.includes(iso))
                    lyr.setStyle(styleFor(iso, true, false))
                })
                lyr.on('mouseout', () => {
                  lyr.setStyle(styleFor(iso, false, selISOsRef.current.includes(iso)))
                })
                lyr.on('click', () => {
                  setPanelContinent(cont)
                  setShowPanel(true)
                })
              },
            })
            geoLayer.current = layer
            layer.addTo(map)
          })
          .catch(() => { if (idx < urls.length - 1) loadGeo(idx + 1) })
      }
      loadGeo()
    }

    setTimeout(loadLeaflet, 50)
  }, [screen])

  // Refresh map layer styles when selectedISOs changes
  useEffect(() => {
    if (!geoLayer.current) return
    const L = (window as any).L
    if (!L) return
    geoLayer.current.eachLayer((lyr: any) => {
      const props = lyr.feature?.properties
      if (!props) return
      const isoKey = ['ISO_A3','iso_a3','ADM0_A3','ISO3'].find(k => props[k]?.length === 3)
      const iso = isoKey ? props[isoKey] : null
      if (!iso) return
      const cont = ISO_CONTINENT[iso]
      if (!cont) return
      const selected = selectedISOs.includes(iso)
      lyr.setStyle(
        selected
          ? { fillColor: '#0D3060', fillOpacity: 0.95, color: '#00D4FF', weight: 2 }
          : { fillColor: CONTINENT_COLOR[cont] || '#1A2050', fillOpacity: 0.85, color: '#2A3470', weight: 0.6 }
      )
    })
  }, [selectedISOs])

  // ── PLACES FETCH ──────────────────────────────────────────────────────────
  const fetchPlaces = async (country: string) => {
    setLoadingPlaces(true)
    try {
      const res = await fetch(`/api/places?country=${encodeURIComponent(country)}`)
      const data = await res.json()
      setPlaces(data.places || [])
    } catch {
      setPlaces([])
    } finally {
      setLoadingPlaces(false)
    }
  }

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  const goToPlaces = () => {
    const country = selectedISOs.length > 0 ? (ISO_NAME[selectedISOs[0]] || selectedISOs[0]) : continent
    fetchPlaces(country)
    setScreen('places')
  }

  const handleCountryToggle = (iso: string) => {
    setSelectedISOs(prev =>
      prev.includes(iso) ? prev.filter(i => i !== iso) : [...prev, iso]
    )
  }

  const saveAndRedirect = (action: 'signup' | 'skip') => {
    const data = {
      continent,
      countries: selectedISOs.map(iso => ISO_NAME[iso] || iso),
      places: selPlaces,
      hotels: selHotels,
      destination: selectedISOs.length > 0 ? ISO_NAME[selectedISOs[0]] : continent,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripzync_onboarding', JSON.stringify(data))
    }
    window.location.href = action === 'signup' ? '/login' : '/home'
  }

  const mapNextDisabled  = selectedISOs.length === 0
  const placeNextDisabled = false // no minimum for places

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
        <span className="ob-nav-logo">TRIPZYNC</span>
        <a href="/dashboard" className="ob-nav-link">Already have a plan? Jump to dashboard ↗</a>
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
        <button className="ob-cta-btn" onClick={() => setScreen('map')}>
          START PLANNING →
        </button>
      </div>
    </div>
  )

  // ── RENDER: MAP ───────────────────────────────────────────────────────────
  if (screen === 'map') return (
    <div className="ob-screen" style={{ justifyContent: 'flex-start' }}>
      <div className="ob-grid-bg" />
      <nav className="ob-nav">
        <span className="ob-nav-logo">TRIPZYNC</span>
        <a href="/dashboard" className="ob-nav-link">Already have a plan? Jump to dashboard ↗</a>
      </nav>

      <div className="ob-screen-content">
        <div className="ob-step-num">STEP 01 / 03</div>
        <h2 className="ob-screen-title">WHERE ARE YOU HEADED?</h2>
        <p className="ob-screen-sub">Click a region to expand countries · Select one or more</p>

        <div className="ob-map-wrap">
          <div id="ob-map" ref={mapRef} />

          {/* Country side panel */}
          <div className={`ob-country-panel${showPanel ? ' open' : ''}`}>
            <div className="ob-panel-head">
              {panelContinent || 'Select a region'}
              <div className="ob-panel-sub">
                {selectedISOs.filter(i => ISO_CONTINENT[i] === panelContinent).length} selected
              </div>
            </div>
            <div className="ob-country-list">
              {(CONTINENT_ISOS[panelContinent] || []).map(iso => (
                <button
                  key={iso}
                  className={`ob-country-btn${selectedISOs.includes(iso) ? ' selected' : ''}`}
                  onClick={() => {
                    handleCountryToggle(iso)
                    if (!continent) setContinent(panelContinent)
                  }}
                >
                  {selectedISOs.includes(iso) ? '✓ ' : ''}{ISO_NAME[iso] || iso}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedISOs.length > 0 && (
          <div style={{ marginTop: 16, fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase' }}>
            Selected: {selectedISOs.map(i => ISO_NAME[i] || i).join(' · ')}
          </div>
        )}
      </div>

      <div className="ob-progress">
        <button className="ob-step-back" onClick={() => setScreen('hero')}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="ob-steps">
            <div className="ob-step-dot done" />
            <div className="ob-step-dot active" />
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
    const displayCountry = selectedISOs.length > 0 ? (ISO_NAME[selectedISOs[0]] || selectedISOs[0]) : continent
    return (
      <div className="ob-screen" style={{ justifyContent: 'flex-start' }}>
        <div className="ob-grid-bg" />
        <nav className="ob-nav">
          <span className="ob-nav-logo">TRIPZYNC</span>
          <a href="/dashboard" className="ob-nav-link">Already have a plan? Jump to dashboard ↗</a>
        </nav>

        <div className="ob-screen-content">
          <div className="ob-step-num">STEP 02 / 03</div>
          <h2 className="ob-screen-title">TOP PLACES IN {displayCountry.toUpperCase()}</h2>
          <p className="ob-screen-sub">Select the highlights you want to visit — tap to add to your itinerary</p>

          {loadingPlaces ? (
            <div className="ob-places-loading">
              <div className="ob-spinner" />
              Finding top attractions…
            </div>
          ) : (
            <div className="ob-places-grid">
              {places.map((p, i) => (
                <div
                  key={p.name}
                  className={`ob-place-card${selPlaces.includes(p.name) ? ' selected' : ''}`}
                  onClick={() => setSelPlaces(prev =>
                    prev.includes(p.name) ? prev.filter(n => n !== p.name) : [...prev, p.name]
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
                  <div className="ob-place-check">{selPlaces.includes(p.name) ? '✓' : ''}</div>
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                    <div className="ob-place-name">{p.name}</div>
                    <div className="ob-place-type">{p.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selPlaces.length > 0 && (
            <div style={{ marginTop: 20, fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase' }}>
              {selPlaces.length} place{selPlaces.length > 1 ? 's' : ''} selected · Will be added to your itinerary
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
            </div>
            <span className="ob-step-label">Pick highlights</span>
          </div>
          <button
            className="ob-step-next"
            onClick={() => setScreen('hotels')}
          >
            {selPlaces.length > 0 ? 'NEXT →' : 'SKIP →'}
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
        <span className="ob-nav-logo">TRIPZYNC</span>
        <a href="/dashboard" className="ob-nav-link">Already have a plan? Jump to dashboard ↗</a>
      </nav>

      <div className="ob-screen-content">
        <div className="ob-step-num">STEP 03 / 03</div>
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
              <div style={{ fontSize: 28, marginBottom: 4 }}>{h.emoji}</div>
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
          </div>
          <span className="ob-step-label">Loyalty programmes</span>
        </div>
        <button className="ob-step-next" onClick={() => setScreen('auth-choice')}>
          FINISH →
        </button>
      </div>
    </div>
  )

  // ── RENDER: AUTH CHOICE ───────────────────────────────────────────────────
  const destName = selectedISOs.length > 0 ? ISO_NAME[selectedISOs[0]] : continent
  return (
    <div className="ob-screen">
      <div className="ob-grid-bg" />
      <div className="ob-particles" style={{ opacity: .4 }}>
        {PARTICLES.slice(0, 10).map(p => (
          <div key={p.id} className="ob-particle" style={{
            width: p.size, height: p.size, left: `${p.left}%`,
            background: p.color, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>

      <div className="ob-auth-card">
        <div style={{ fontSize: 40, marginBottom: 16 }}>🌍</div>
        <div className="ob-auth-title">READY TO GO!</div>
        <p className="ob-auth-sub">
          Your trip to <strong style={{ color: 'var(--accent)' }}>{destName}</strong> is planned.<br />
          Save your itinerary to access it anywhere.
        </p>

        <div className="ob-guest-warning">
          ⚠️ <strong>Guest mode:</strong> If you skip sign-up, all your preferences and selected places will not be stored after you leave. Create a free account to save your plan.
        </div>

        <button className="ob-auth-signup" onClick={() => saveAndRedirect('signup')}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          SIGN UP WITH GOOGLE
        </button>

        <button className="ob-auth-skip" onClick={() => saveAndRedirect('skip')}>
          Skip for now — continue as guest
        </button>

        <div className="ob-auth-summary">
          <div>Destination: <span>{selectedISOs.map(i => ISO_NAME[i] || i).join(', ')}</span></div>
          {selPlaces.length > 0 && <div>Places: <span>{selPlaces.length} selected</span></div>}
          {selHotels.length > 0 && <div>Loyalty: <span>{selHotels.map(h => HOTEL_PROGRAMS.find(p => p.id === h)?.name).join(', ')}</span></div>}
        </div>
      </div>
    </div>
  )
}
