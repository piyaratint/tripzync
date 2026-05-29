'use client'

import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { useMemo, useState, useEffect } from 'react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ISO A3 → ISO numeric (used by world-atlas TopoJSON)
const ISO_NUM: Record<string, string> = {
  USA:'840',CAN:'124',MEX:'484',BRA:'076',ARG:'032',COL:'170',CHL:'152',PER:'604',
  ECU:'218',BOL:'068',VEN:'862',CUB:'192',JAM:'388',CRI:'188',PAN:'591',URY:'858',
  PRY:'600',GTM:'320',HND:'340',NIC:'558',SLV:'222',DOM:'214',HTI:'332',TTO:'780',
  GBR:'826',FRA:'250',DEU:'276',ITA:'380',ESP:'724',NLD:'528',CHE:'756',AUT:'040',
  PRT:'620',GRC:'300',NOR:'578',SWE:'752',DNK:'208',POL:'616',CZE:'203',FIN:'246',
  BEL:'056',IRL:'372',HUN:'348',ROU:'642',BGR:'100',HRV:'191',SVK:'703',SVN:'705',
  SRB:'688',RUS:'643',UKR:'804',BLR:'112',LTU:'440',LVA:'428',EST:'233',MDA:'498',
  ALB:'008',MKD:'807',BIH:'070',MNE:'499',LUX:'442',MLT:'470',ISL:'352',CYP:'196',
  ZAF:'710',EGY:'818',MAR:'504',KEN:'404',TZA:'834',NGA:'566',GHA:'288',ETH:'231',
  SEN:'686',RWA:'646',BWA:'072',ZWE:'716',MOZ:'508',MWI:'454',ZMB:'894',UGA:'800',
  TUN:'788',DZA:'012',AGO:'024',CMR:'120',CIV:'384',MLI:'466',BFA:'854',NAM:'516',
  MDG:'450',MUS:'480',ARE:'784',SAU:'682',TUR:'792',IRN:'364',JOR:'400',QAT:'634',
  KWT:'414',ISR:'376',LBN:'422',BHR:'048',OMN:'512',IRQ:'368',GEO:'268',ARM:'051',
  AZE:'031',JPN:'392',CHN:'156',IND:'356',THA:'764',IDN:'360',KOR:'410',VNM:'704',
  MYS:'458',SGP:'702',PHL:'608',KHM:'116',LKA:'144',NPL:'524',MMR:'104',LAO:'418',
  MNG:'496',BTN:'064',MDV:'462',KAZ:'398',UZB:'860',BGD:'050',PAK:'586',
  AUS:'036',NZL:'554',FJI:'242',PNG:'598',
}

// Country center + scale for zoom-in mode (>2 cities, single country)
// Centers are tuned to the densest city cluster for each country
const COUNTRY_ZOOM: Record<string, { center: [number, number]; scale: number }> = {
  JPN:{ center:[136.5,35],   scale:1600 },  // centred on Honshu (Tokyo/Osaka/Kyoto belt)
  CHN:{ center:[104,35],     scale:480  },
  IND:{ center:[78.9,20.6],  scale:650  },
  THA:{ center:[101,13],     scale:1400 },
  IDN:{ center:[118,-2.5],   scale:650  },
  KOR:{ center:[127.5,36.5], scale:2800 },
  VNM:{ center:[106,16],     scale:1800 },
  MYS:{ center:[109,3.5],    scale:1400 },
  SGP:{ center:[103.8,1.3],  scale:9000 },
  PHL:{ center:[122,12],     scale:1400 },
  KHM:{ center:[104.9,12.5], scale:3500 },
  LKA:{ center:[80.7,7.9],   scale:4000 },
  NPL:{ center:[84,28],      scale:4000 },
  MDV:{ center:[73.5,3.5],   scale:7000 },
  GBR:{ center:[-2,54],      scale:2500 },
  FRA:{ center:[2.5,46.2],   scale:2000 },
  DEU:{ center:[10.4,51.1],  scale:2200 },
  ITA:{ center:[12.6,42.5],  scale:1800 },
  ESP:{ center:[-3.7,40.4],  scale:1800 },
  NLD:{ center:[5.3,52.3],   scale:6000 },
  CHE:{ center:[8.2,46.8],   scale:5500 },
  AUT:{ center:[14.1,47.6],  scale:4000 },
  PRT:{ center:[-8,39.5],    scale:3000 },
  GRC:{ center:[22.5,39.1],  scale:2800 },
  NOR:{ center:[15,65],      scale:900  },
  SWE:{ center:[18,62],      scale:1100 },
  DNK:{ center:[10,56],      scale:4000 },
  POL:{ center:[19.4,52],    scale:2000 },
  CZE:{ center:[15.5,49.8],  scale:4500 },
  IRL:{ center:[-8,53.2],    scale:4000 },
  HUN:{ center:[19,47],      scale:4000 },
  ISL:{ center:[-18.5,65],   scale:2500 },
  USA:{ center:[-98,38],     scale:470  },
  CAN:{ center:[-96,60],     scale:340  },
  MEX:{ center:[-102,23.6],  scale:900  },
  BRA:{ center:[-51.9,-14.2],scale:360  },
  ARG:{ center:[-65.2,-35.4],scale:580  },
  COL:{ center:[-74,4],      scale:1400 },
  CHL:{ center:[-70,-35],    scale:650  },
  PER:{ center:[-76,-9],     scale:900  },
  CRI:{ center:[-84,9.9],    scale:5000 },
  CUB:{ center:[-79.5,22],   scale:2800 },
  ZAF:{ center:[25.1,-29],   scale:900  },
  EGY:{ center:[30,26.8],    scale:900  },
  MAR:{ center:[-5.4,31.8],  scale:1500 },
  KEN:{ center:[37.9,0],     scale:1800 },
  TZA:{ center:[34.9,-6],    scale:1500 },
  MUS:{ center:[57.5,-20.2], scale:12000},
  RWA:{ center:[29.9,-1.9],  scale:8000 },
  GHA:{ center:[-1.1,7.9],   scale:2500 },
  ARE:{ center:[54,24],      scale:5000 },
  SAU:{ center:[45,24],      scale:650  },
  TUR:{ center:[35,39],      scale:1200 },
  JOR:{ center:[37,31],      scale:3500 },
  QAT:{ center:[51.2,25.3],  scale:10000},
  ISR:{ center:[34.8,31.5],  scale:6000 },
  OMN:{ center:[57.6,21.5],  scale:1500 },
  GEO:{ center:[43.4,42.3],  scale:5000 },
  AUS:{ center:[134,-25.3],  scale:310  },
  NZL:{ center:[172,-42],    scale:1500 },
  FJI:{ center:[177.5,-18],  scale:5000 },
}

// City → [longitude, latitude]
const CITY_COORDS: Record<string, [number, number]> = {
  // Japan
  'Tokyo':[139.69,35.69],'Osaka':[135.50,34.69],'Kyoto':[135.77,35.01],
  'Sapporo':[141.35,43.06],'Fukuoka':[130.40,33.58],'Hiroshima':[132.46,34.39],
  'Nara':[135.83,34.68],'Yokohama':[139.64,35.44],
  // China
  'Beijing':[116.40,39.90],'Shanghai':[121.47,31.23],'Hong Kong':[114.17,22.32],
  'Chengdu':[104.07,30.67],"Xi'an":[108.93,34.26],'Shenzhen':[114.06,22.55],
  'Guilin':[110.29,25.28],'Hangzhou':[120.15,30.27],
  // India
  'Mumbai':[72.88,19.07],'Delhi':[77.21,28.61],'Jaipur':[75.79,26.90],
  'Agra':[78.00,27.18],'Bangalore':[77.59,12.97],'Goa':[73.83,15.49],
  'Varanasi':[82.97,25.32],'Kolkata':[88.36,22.57],
  // Thailand
  'Bangkok':[100.52,13.76],'Chiang Mai':[98.99,18.78],'Phuket':[98.39,7.89],
  'Pattaya':[100.88,12.93],'Krabi':[98.92,8.09],'Koh Samui':[100.06,9.54],
  'Hua Hin':[99.96,12.57],'Ayutthaya':[100.56,14.35],
  // Indonesia
  'Bali':[115.22,-8.41],'Jakarta':[106.83,-6.21],'Yogyakarta':[110.36,-7.80],
  'Lombok':[116.32,-8.65],'Komodo':[119.48,-8.55],'Raja Ampat':[130.77,-0.52],
  // South Korea
  'Seoul':[126.98,37.57],'Busan':[129.07,35.18],'Jeju':[126.53,33.50],
  'Gyeongju':[129.21,35.85],'Incheon':[126.70,37.46],
  // Vietnam
  'Hanoi':[105.85,21.03],'Ho Chi Minh City':[106.66,10.82],'Hoi An':[108.33,15.88],
  'Da Nang':[108.22,16.07],'Halong Bay':[107.08,20.95],'Hue':[107.60,16.46],
  'Sapa':[103.84,22.34],
  // Malaysia
  'Kuala Lumpur':[101.69,3.14],'Penang':[100.33,5.41],'Langkawi':[99.85,6.35],
  'Kota Kinabalu':[116.07,5.98],'Malacca':[102.25,2.19],
  // Singapore
  'Singapore':[103.82,1.35],
  // Philippines
  'Manila':[120.98,14.60],'Cebu':[123.89,10.32],'Palawan':[119.50,9.84],
  'Boracay':[121.95,11.97],'Siargao':[126.05,9.83],'Davao':[125.61,7.07],
  // Cambodia
  'Phnom Penh':[104.92,11.56],'Siem Reap':[103.86,13.36],
  'Sihanoukville':[103.52,10.62],'Kampot':[104.18,10.61],
  // Sri Lanka
  'Colombo':[79.86,6.92],'Kandy':[80.63,7.29],'Galle':[80.22,6.03],
  'Sigiriya':[80.76,7.95],'Ella':[81.05,6.87],
  // Nepal
  'Kathmandu':[85.32,27.71],'Pokhara':[83.99,28.21],
  'Chitwan':[84.50,27.53],'Lumbini':[83.28,27.49],
  // Maldives
  'Malé':[73.51,4.18],'Maafushi':[73.47,3.93],'Baa Atoll':[72.97,5.03],
  // UK
  'London':[-0.12,51.51],'Edinburgh':[-3.19,55.95],'Manchester':[-2.24,53.48],
  'Liverpool':[-2.99,53.41],'Bath':[-2.36,51.38],'Oxford':[-1.26,51.75],
  'Cambridge':[0.12,52.20],'York':[-1.09,53.96],
  // France
  'Paris':[2.35,48.86],'Nice':[7.26,43.71],'Lyon':[4.83,45.76],
  'Marseille':[5.37,43.30],'Bordeaux':[-0.57,44.84],'Strasbourg':[7.75,48.58],
  'Cannes':[7.02,43.55],'Annecy':[6.13,45.90],
  // Germany
  'Berlin':[13.41,52.52],'Munich':[11.58,48.14],'Hamburg':[9.99,53.55],
  'Cologne':[6.96,50.94],'Frankfurt':[8.68,50.11],'Dresden':[13.74,51.05],
  'Heidelberg':[8.69,49.40],
  // Italy
  'Rome':[12.49,41.89],'Venice':[12.33,45.44],'Florence':[11.25,43.77],
  'Milan':[9.19,45.46],'Naples':[14.27,40.85],'Amalfi':[14.60,40.63],
  'Cinque Terre':[9.68,44.12],'Bologna':[11.34,44.49],'Sicily':[14.27,37.60],
  // Spain
  'Barcelona':[2.17,41.39],'Madrid':[-3.70,40.42],'Seville':[-5.99,37.39],
  'Granada':[-3.60,37.18],'Valencia':[-0.38,39.47],'Malaga':[-4.42,36.72],
  'San Sebastian':[-1.98,43.32],'Ibiza':[1.43,38.91],
  // Netherlands
  'Amsterdam':[4.90,52.37],'Rotterdam':[4.48,51.92],'The Hague':[4.30,52.08],
  'Utrecht':[5.12,52.09],'Delft':[4.36,52.01],
  // Switzerland
  'Zurich':[8.54,47.38],'Geneva':[6.14,46.20],'Interlaken':[7.86,46.68],
  'Lucerne':[8.31,47.05],'Bern':[7.44,46.95],'Zermatt':[7.75,46.02],
  // Austria
  'Vienna':[16.37,48.21],'Salzburg':[13.04,47.80],'Innsbruck':[11.39,47.27],
  'Hallstatt':[13.65,47.56],'Graz':[15.44,47.07],
  // Portugal
  'Lisbon':[-9.14,38.72],'Porto':[-8.61,41.15],'Algarve':[-8.10,37.10],
  'Sintra':[-9.39,38.79],'Madeira':[-16.92,32.65],'Azores':[-28.73,38.72],
  // Greece
  'Athens':[23.73,37.98],'Santorini':[25.43,36.39],'Mykonos':[25.33,37.45],
  'Crete':[24.80,35.24],'Rhodes':[28.22,36.43],'Corfu':[19.92,39.62],
  // Norway
  'Oslo':[10.75,59.91],'Bergen':[5.32,60.39],'Tromsø':[18.96,69.65],
  'Flåm':[7.11,60.86],'Stavanger':[5.73,58.97],
  // Sweden
  'Stockholm':[18.07,59.33],'Gothenburg':[11.97,57.71],
  'Malmö':[13.00,55.60],'Kiruna':[20.23,67.86],
  // Denmark
  'Copenhagen':[12.57,55.68],'Aarhus':[10.21,56.16],'Odense':[10.40,55.40],
  // Poland
  'Warsaw':[21.01,52.23],'Krakow':[19.94,50.06],'Gdansk':[18.65,54.35],
  'Wroclaw':[17.04,51.11],
  // Czech Republic
  'Prague':[14.42,50.08],'Cesky Krumlov':[14.32,48.81],'Brno':[16.61,49.20],
  // Ireland
  'Dublin':[-6.26,53.35],'Galway':[-9.05,53.27],'Cork':[-8.47,51.90],
  'Killarney':[-9.51,52.06],
  // Hungary
  'Budapest':[19.04,47.50],'Eger':[20.37,47.90],'Pécs':[18.23,46.07],
  // Iceland
  'Reykjavik':[-21.93,64.14],'Akureyri':[-18.11,65.68],'Vik':[-18.99,63.42],
  // USA
  'New York':[-74.01,40.71],'Los Angeles':[-118.24,34.05],'Las Vegas':[-115.14,36.17],
  'Miami':[-80.19,25.77],'Chicago':[-87.63,41.85],'San Francisco':[-122.42,37.77],
  'Hawaii':[-157.82,21.31],'New Orleans':[-90.07,29.95],'Washington DC':[-77.04,38.91],
  'Seattle':[-122.33,47.60],
  // Canada
  'Toronto':[-79.38,43.65],'Vancouver':[-123.12,49.28],'Montreal':[-73.57,45.50],
  'Quebec City':[-71.21,46.81],'Banff':[-115.57,51.18],'Calgary':[-114.07,51.05],
  // Mexico
  'Mexico City':[-99.13,19.43],'Cancun':[-86.85,21.16],
  'Playa del Carmen':[-87.08,20.63],'Guadalajara':[-103.35,20.67],
  'Oaxaca':[-96.72,17.06],'Tulum':[-87.46,20.21],'Los Cabos':[-109.92,22.89],
  // Brazil
  'Rio de Janeiro':[-43.18,-22.91],'São Paulo':[-46.63,-23.55],
  'Salvador':[-38.52,-12.97],'Manaus':[-60.02,-3.10],
  'Florianópolis':[-48.55,-27.59],'Iguazu Falls':[-54.44,-25.69],
  // Argentina
  'Buenos Aires':[-58.40,-34.60],'Patagonia':[-68.52,-43.30],
  'Mendoza':[-68.83,-32.89],'Bariloche':[-71.31,-41.13],'Salta':[-65.41,-24.79],
  // Colombia
  'Bogotá':[-74.08,4.71],'Cartagena':[-75.51,10.40],
  'Medellín':[-75.57,6.25],'Santa Marta':[-74.21,11.24],
  // Chile
  'Santiago':[-70.67,-33.45],'Valparaíso':[-71.63,-33.05],
  'Easter Island':[-109.37,-27.11],'Atacama':[-68.17,-23.65],
  // Peru
  'Lima':[-77.04,-12.05],'Cusco':[-71.97,-13.53],'Machu Picchu':[-72.54,-13.16],
  'Arequipa':[-71.54,-16.41],'Lake Titicaca':[-69.33,-15.84],
  // Costa Rica
  'San José':[-84.09,9.93],'Manuel Antonio':[-84.14,9.39],
  'Arenal':[-84.70,10.46],'Monteverde':[-84.82,10.31],
  // Cuba
  'Havana':[-82.36,23.14],'Varadero':[-81.25,23.16],
  'Trinidad':[-79.98,21.80],'Cienfuegos':[-80.44,22.15],
  // South Africa
  'Cape Town':[18.42,-33.93],'Johannesburg':[28.04,-26.20],'Durban':[31.00,-29.86],
  'Kruger':[31.50,-24.50],'Garden Route':[22.46,-33.98],'Stellenbosch':[18.86,-33.93],
  // Egypt
  'Cairo':[31.25,30.06],'Luxor':[32.64,25.69],'Aswan':[32.90,24.09],
  'Sharm el-Sheikh':[34.13,27.91],'Alexandria':[29.92,31.20],'Hurghada':[33.81,27.26],
  // Morocco
  'Marrakech':[-7.99,31.63],'Fez':[-5.00,34.03],'Casablanca':[-7.59,33.59],
  'Chefchaouen':[-5.26,35.17],'Essaouira':[-9.77,31.51],
  // Kenya
  'Nairobi':[36.82,-1.29],'Maasai Mara':[35.23,-1.51],'Amboseli':[37.26,-2.65],
  'Mombasa':[39.67,-4.05],'Diani':[39.58,-4.27],
  // Tanzania
  'Zanzibar':[39.20,-6.17],'Serengeti':[34.84,-2.33],'Kilimanjaro':[37.35,-3.07],
  'Dar es Salaam':[39.29,-6.79],'Arusha':[36.68,-3.37],
  // Mauritius
  'Port Louis':[57.50,-20.16],'Grand Baie':[57.59,-20.01],'Black River':[57.37,-20.34],
  // Rwanda
  'Kigali':[30.06,-1.94],'Volcanoes NP':[29.51,-1.48],
  // Ghana
  'Accra':[-0.19,5.56],'Cape Coast':[-1.24,5.10],'Kumasi':[-1.62,6.69],
  // UAE
  'Dubai':[55.27,25.20],'Abu Dhabi':[54.37,24.45],'Sharjah':[55.38,25.36],
  // Saudi Arabia
  'Riyadh':[46.72,24.69],'Jeddah':[39.19,21.49],'AlUla':[37.92,26.62],
  // Turkey
  'Istanbul':[28.97,41.02],'Cappadocia':[34.84,38.69],'Antalya':[30.71,36.91],
  'Bodrum':[27.43,37.03],'Ephesus':[27.34,37.94],
  // Jordan
  'Amman':[35.93,31.96],'Petra':[35.44,30.33],'Wadi Rum':[36.60,29.58],
  'Aqaba':[35.00,29.53],'Dead Sea':[35.49,31.52],
  // Qatar
  'Doha':[51.54,25.29],
  // Israel
  'Tel Aviv':[34.78,32.08],'Jerusalem':[35.22,31.77],
  'Haifa':[34.99,32.82],'Eilat':[34.95,29.56],
  // Oman
  'Muscat':[58.59,23.61],'Salalah':[54.09,17.02],'Nizwa':[57.54,22.93],
  // Georgia
  'Tbilisi':[44.83,41.69],'Batumi':[41.64,41.64],
  'Kazbegi':[44.65,42.66],'Sighnaghi':[45.73,41.62],
  // Australia
  'Sydney':[151.21,-33.87],'Melbourne':[144.96,-37.81],'Brisbane':[153.03,-27.47],
  'Perth':[115.86,-31.95],'Cairns':[145.77,-16.92],'Gold Coast':[153.43,-28.00],
  'Adelaide':[138.60,-34.93],'Uluru':[131.03,-25.34],
  // New Zealand
  'Auckland':[174.76,-36.87],'Queenstown':[168.66,-45.03],
  'Christchurch':[172.64,-43.53],'Wellington':[174.78,-41.29],
  'Rotorua':[176.25,-38.14],'Milford Sound':[167.93,-44.67],
  // Fiji
  'Nadi':[177.44,-17.80],'Suva':[178.44,-18.14],
  'Yasawa Islands':[177.53,-17.04],'Coral Coast':[177.78,-18.14],
}

// Base projection scale — ZoomableGroup multiplies on top of this
const BASE_SCALE = 140

interface WorldMapProps {
  selectedISOs: string[]
  selectedCities: string[]
}

export function WorldMap({ selectedISOs, selectedCities }: WorldMapProps) {
  const selectedNums = useMemo(
    () => new Set(selectedISOs.map(iso => ISO_NUM[iso]).filter(Boolean)),
    [selectedISOs]
  )

  // ── Zoom/pan state ────────────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 15])
  const [mapZoom,   setMapZoom]   = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  // Show pins as soon as any city is selected
  const showDots  = selectedCities.length > 0
  // Zoom to country as soon as first city is picked (single country only)
  // Multi-country: stay on world view so all countries are visible
  const singleISO  = selectedISOs.length === 1
  const zoomConfig = singleISO ? COUNTRY_ZOOM[selectedISOs[0]] ?? null : null

  // When selected country changes, fly to it (or reset to world view)
  useEffect(() => {
    if (zoomConfig) {
      setMapCenter(zoomConfig.center)
      setMapZoom(Math.round(zoomConfig.scale / BASE_SCALE))
    } else {
      setMapCenter([0, 15])
      setMapZoom(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISOs.join(',')])

  const handleZoomIn  = () => setMapZoom(z => Math.min(z * 1.6, 40))
  const handleZoomOut = () => setMapZoom(z => Math.max(z / 1.6, 1))
  const handleReset   = () => { setMapCenter([0, 15]); setMapZoom(1) }

  // Label: show dots in zoomed mode OR when user has zoomed in manually
  const isZoomedIn = mapZoom > 3
  const showLabels = isZoomedIn && showDots

  // Dot size inversely scales so pins stay readable at any zoom
  const dotR = isZoomedIn ? Math.max(3, 6 / Math.sqrt(mapZoom / 8)) : 3.5

  const statusLabel = selectedCities.length > 0
    ? `${selectedISOs.length} countr${selectedISOs.length > 1 ? 'ies' : 'y'} · ${selectedCities.length} cit${selectedCities.length > 1 ? 'ies' : 'y'}`
    : null

  return (
    <div style={{
      width: '100%',
      height: 400,
      background: 'rgba(7,10,25,0.95)',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(64,224,208,0.18)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      position: 'relative',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
    }}>

      {/* ── Status label ── */}
      {statusLabel && (
        <div style={{
          position: 'absolute', top: 12, left: 16, zIndex: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--accent)', opacity: 0.8,
          background: 'rgba(7,10,25,0.85)',
          padding: '4px 8px', borderRadius: 6,
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
        }}>
          {statusLabel}
        </div>
      )}

      {/* ── Zoom controls ── */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[
          { label: '+', title: 'Zoom in',    onClick: handleZoomIn  },
          { label: '−', title: 'Zoom out',   onClick: handleZoomOut },
          { label: '⊙', title: 'Reset view', onClick: handleReset   },
        ].map(({ label, title, onClick }) => (
          <button
            key={label}
            title={title}
            onClick={onClick}
            style={{
              width: 32, height: 32,
              background: 'rgba(7,10,25,0.90)',
              border: '1px solid rgba(64,224,208,0.30)',
              borderRadius: 8,
              color: 'var(--accent)',
              fontSize: label === '⊙' ? 16 : 20,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(64,224,208,0.15)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(7,10,25,0.90)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(64,224,208,0.30)'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Scroll hint (shown only on world view) ── */}
      {mapZoom === 1 && (
        <div style={{
          position: 'absolute', bottom: 14, left: 16, zIndex: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
          pointerEvents: 'none',
        }}>
          scroll to zoom · drag to pan
        </div>
      )}

      {/* ── Map ── */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: BASE_SCALE, center: [0, 15] }}
        width={800}
        height={400}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ZoomableGroup
          center={mapCenter}
          zoom={mapZoom}
          minZoom={1}
          maxZoom={40}
          onMoveStart={() => setIsDragging(true)}
          onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => {
            setIsDragging(false)
            setMapCenter(coordinates)
            setMapZoom(zoom)
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const isSelected = selectedNums.has(String(geo.id))
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isSelected ? 'rgba(64,224,208,0.32)' : '#0B1830'}
                    stroke={isSelected ? '#40E0D0' : '#162540'}
                    strokeWidth={isSelected ? 1.0 / mapZoom : 0.4 / mapZoom}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: isSelected ? 'rgba(64,224,208,0.45)' : '#12203a' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {/* City dots */}
          {showDots && selectedCities.map(city => {
            const coords = CITY_COORDS[city]
            if (!coords) return null
            return (
              <Marker key={city} coordinates={coords}>
                <circle
                  r={dotR / mapZoom}
                  fill="#FFC947"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={1.2 / mapZoom}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,201,71,0.9))' }}
                />
                {showLabels && (
                  <text
                    textAnchor="middle"
                    y={-9 / mapZoom}
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 10 / mapZoom,
                      fontWeight: 700,
                      fill: '#ffffff',
                      pointerEvents: 'none',
                    }}
                  >
                    {city}
                  </text>
                )}
              </Marker>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
