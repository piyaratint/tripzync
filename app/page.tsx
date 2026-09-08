'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { TripZyncLogo } from '@/components/TripZyncLogo'
import { DatePicker } from '@/components/ui/DatePicker'

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
type Screen = 'hero' | 'map' | 'places' | 'hotels' | 'duration'

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
  HND:'Honduras',NIC:'Nicaragua',SLV:'El Salvador',DOM:'Dominican Republic',
  HTI:'Haiti',TTO:'Trinidad and Tobago',GUY:'Guyana',BLZ:'Belize',
  BRB:'Barbados',LCA:'Saint Lucia',VCT:'Saint Vincent and the Grenadines',GRD:'Grenada',
  GBR:'United Kingdom',FRA:'France',DEU:'Germany',ITA:'Italy',ESP:'Spain',
  NLD:'Netherlands',CHE:'Switzerland',AUT:'Austria',PRT:'Portugal',GRC:'Greece',
  NOR:'Norway',SWE:'Sweden',DNK:'Denmark',POL:'Poland',CZE:'Czech Republic',
  FIN:'Finland',BEL:'Belgium',IRL:'Ireland',HUN:'Hungary',ROU:'Romania',
  BGR:'Bulgaria',HRV:'Croatia',SVK:'Slovakia',SVN:'Slovenia',SRB:'Serbia',
  RUS:'Russia',UKR:'Ukraine',LTU:'Lithuania',LVA:'Latvia',EST:'Estonia',
  LUX:'Luxembourg',MLT:'Malta',ISL:'Iceland',CYP:'Cyprus',
  BLR:'Belarus',MDA:'Moldova',ALB:'Albania',MKD:'North Macedonia',
  BIH:'Bosnia and Herzegovina',MNE:'Montenegro',AND:'Andorra',MCO:'Monaco',
  SMR:'San Marino',LIE:'Liechtenstein',
  ZAF:'South Africa',EGY:'Egypt',MAR:'Morocco',KEN:'Kenya',TZA:'Tanzania',
  NGA:'Nigeria',GHA:'Ghana',ETH:'Ethiopia',SEN:'Senegal',RWA:'Rwanda',
  BWA:'Botswana',ZWE:'Zimbabwe',UGA:'Uganda',TUN:'Tunisia',DZA:'Algeria',
  MOZ:'Mozambique',NAM:'Namibia',MDG:'Madagascar',MUS:'Mauritius',
  MWI:'Malawi',ZMB:'Zambia',LBY:'Libya',SDN:'Sudan',AGO:'Angola',
  CMR:'Cameroon',CIV:'Ivory Coast',MLI:'Mali',BFA:'Burkina Faso',
  LSO:'Lesotho',SWZ:'Eswatini',
  ARE:'UAE',SAU:'Saudi Arabia',TUR:'Turkey',IRN:'Iran',JOR:'Jordan',
  QAT:'Qatar',KWT:'Kuwait',ISR:'Israel',LBN:'Lebanon',BHR:'Bahrain',
  OMN:'Oman',GEO:'Georgia',IRQ:'Iraq',ARM:'Armenia',AZE:'Azerbaijan',
  JPN:'Japan',CHN:'China',IND:'India',THA:'Thailand',IDN:'Indonesia',
  KOR:'South Korea',VNM:'Vietnam',MYS:'Malaysia',SGP:'Singapore',PHL:'Philippines',
  KHM:'Cambodia',LKA:'Sri Lanka',NPL:'Nepal',MMR:'Myanmar',LAO:'Laos',
  MNG:'Mongolia',BTN:'Bhutan',MDV:'Maldives',BGD:'Bangladesh',PAK:'Pakistan',
  KAZ:'Kazakhstan',UZB:'Uzbekistan',TJK:'Tajikistan',KGZ:'Kyrgyzstan',TKM:'Turkmenistan',
  AUS:'Australia',NZL:'New Zealand',FJI:'Fiji',PNG:'Papua New Guinea',
  SLB:'Solomon Islands',VUT:'Vanuatu',WSM:'Samoa',TON:'Tonga',PLW:'Palau',FSM:'Micronesia',
}

// Country display name (lowercased) → ISO A3, for resolving live Places results.
// Google Places often returns a different label than our ISO_NAME (e.g. "USA" not
// "United States", "Czechia" not "Czech Republic") — aliases below cover the common ones.
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  ...Object.fromEntries(Object.entries(ISO_NAME).map(([iso, name]) => [name.toLowerCase(), iso])),
  usa: 'USA', 'united states of america': 'USA',
  uk: 'GBR',
  uae: 'ARE', 'united arab emirates': 'ARE',
  czechia: 'CZE',
  'ivory coast': 'CIV', "côte d'ivoire": 'CIV', 'cote d\'ivoire': 'CIV',
  'macedonia': 'MKD',
  'myanmar (burma)': 'MMR', burma: 'MMR',
  swaziland: 'SWZ',
  'republic of korea': 'KOR',
  türkiye: 'TUR',
}
// Best-effort: match a Places "description" string (e.g. "Texas, USA") to a known ISO A3
function resolveIsoFromDescription(description: string): string {
  const parts = description.split(',').map(p => p.trim().toLowerCase())
  for (const part of parts.reverse()) {
    if (COUNTRY_NAME_TO_ISO[part]) return COUNTRY_NAME_TO_ISO[part]
  }
  const lower = description.toLowerCase()
  for (const [name, iso] of Object.entries(COUNTRY_NAME_TO_ISO)) {
    if (lower.includes(name)) return iso
  }
  return ''
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
  MMR: ['Yangon','Bagan','Mandalay','Inle Lake'],
  LAO: ['Vientiane','Luang Prabang','Vang Vieng'],
  MNG: ['Ulaanbaatar','Gobi Desert'],
  BTN: ['Thimphu','Paro','Punakha'],
  BGD: ['Dhaka','Cox\'s Bazar','Sylhet'],
  PAK: ['Karachi','Lahore','Islamabad','Hunza Valley'],
  KAZ: ['Almaty','Astana'],
  UZB: ['Samarkand','Tashkent','Bukhara'],
  TJK: ['Dushanbe','Pamir Highway'],
  KGZ: ['Bishkek','Issyk-Kul'],
  TKM: ['Ashgabat','Darvaza Gas Crater'],
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
  FIN: ['Helsinki','Rovaniemi','Turku','Lapland'],
  POL: ['Warsaw','Krakow','Gdansk','Wroclaw'],
  CZE: ['Prague','Cesky Krumlov','Brno'],
  BEL: ['Brussels','Bruges','Ghent','Antwerp'],
  IRL: ['Dublin','Galway','Cork','Killarney'],
  HUN: ['Budapest','Eger','Pécs'],
  ISL: ['Reykjavik','Akureyri','Vik'],
  ROU: ['Bucharest','Brasov','Sibiu','Transylvania'],
  BGR: ['Sofia','Plovdiv','Varna','Veliko Tarnovo'],
  HRV: ['Dubrovnik','Split','Zagreb','Hvar','Plitvice Lakes'],
  SVK: ['Bratislava','Košice','High Tatras'],
  SVN: ['Ljubljana','Lake Bled','Piran'],
  SRB: ['Belgrade','Novi Sad'],
  RUS: ['Moscow','Saint Petersburg','Kazan','Sochi'],
  UKR: ['Kyiv','Lviv','Odesa'],
  LTU: ['Vilnius','Kaunas','Klaipėda'],
  LVA: ['Riga','Jurmala'],
  EST: ['Tallinn','Tartu'],
  LUX: ['Luxembourg City'],
  MLT: ['Valletta','Gozo','Sliema'],
  CYP: ['Larnaca','Paphos','Nicosia','Ayia Napa'],
  BLR: ['Minsk','Brest'],
  MDA: ['Chișinău','Orheiul Vechi'],
  ALB: ['Tirana','Saranda','Berat'],
  MKD: ['Skopje','Ohrid'],
  BIH: ['Sarajevo','Mostar'],
  MNE: ['Kotor','Budva','Podgorica'],
  AND: ['Andorra la Vella'],
  MCO: ['Monte Carlo'],
  SMR: ['San Marino City'],
  LIE: ['Vaduz'],
  // Americas
  USA: ['New York','Los Angeles','Las Vegas','Miami','Orlando','Chicago','San Francisco','Hawaii','New Orleans','Washington DC','Seattle'],
  CAN: ['Toronto','Vancouver','Montreal','Quebec City','Banff','Calgary'],
  MEX: ['Mexico City','Cancun','Playa del Carmen','Guadalajara','Oaxaca','Tulum','Los Cabos'],
  BRA: ['Rio de Janeiro','São Paulo','Salvador','Manaus','Florianópolis','Iguazu Falls'],
  ARG: ['Buenos Aires','Patagonia','Mendoza','Bariloche','Salta'],
  COL: ['Bogotá','Cartagena','Medellín','Santa Marta'],
  CHL: ['Santiago','Patagonia','Atacama','Valparaíso','Easter Island'],
  PER: ['Lima','Cusco','Machu Picchu','Arequipa','Lake Titicaca'],
  CRI: ['San José','Manuel Antonio','Arenal','Monteverde'],
  CUB: ['Havana','Varadero','Trinidad','Cienfuegos'],
  ECU: ['Quito','Guayaquil','Cuenca','Galápagos Islands','Baños'],
  BOL: ['La Paz','Uyuni Salt Flats','Sucre','Santa Cruz','Potosí'],
  VEN: ['Caracas','Los Roques','Mérida','Canaima'],
  JAM: ['Kingston','Montego Bay','Negril','Ocho Rios'],
  PAN: ['Panama City','Bocas del Toro','San Blas Islands','Boquete'],
  URY: ['Montevideo','Punta del Este','Colonia del Sacramento'],
  PRY: ['Asunción','Ciudad del Este','Encarnación'],
  GTM: ['Antigua','Guatemala City','Lake Atitlán','Tikal'],
  HND: ['Roatán','Tegucigalpa','Copán','Utila'],
  NIC: ['Granada','Managua','San Juan del Sur','Ometepe Island'],
  SLV: ['San Salvador','El Tunco','Santa Ana','Suchitoto'],
  DOM: ['Punta Cana','Santo Domingo','Puerto Plata','Samaná'],
  HTI: ['Port-au-Prince','Cap-Haïtien','Jacmel'],
  TTO: ['Port of Spain','Tobago'],
  GUY: ['Georgetown','Kaieteur Falls'],
  BLZ: ['Belize City','Ambergris Caye','Caye Caulker','San Ignacio'],
  BRB: ['Bridgetown'],
  LCA: ['Castries','Soufrière'],
  VCT: ['Kingstown','Bequia'],
  GRD: ['St. George\'s','Grand Anse'],
  // Africa
  ZAF: ['Cape Town','Johannesburg','Durban','Kruger','Garden Route','Stellenbosch'],
  EGY: ['Cairo','Luxor','Aswan','Sharm el-Sheikh','Alexandria','Hurghada'],
  MAR: ['Marrakech','Fez','Casablanca','Chefchaouen','Essaouira'],
  KEN: ['Nairobi','Maasai Mara','Amboseli','Mombasa','Diani'],
  TZA: ['Zanzibar','Serengeti','Kilimanjaro','Dar es Salaam','Arusha'],
  MUS: ['Port Louis','Grand Baie','Black River'],
  RWA: ['Kigali','Volcanoes NP'],
  GHA: ['Accra','Cape Coast','Kumasi'],
  NGA: ['Lagos','Abuja','Port Harcourt'],
  ETH: ['Addis Ababa','Lalibela','Gondar'],
  SEN: ['Dakar','Saint-Louis','Gorée Island'],
  BWA: ['Gaborone','Okavango Delta','Chobe'],
  ZWE: ['Victoria Falls','Harare','Hwange'],
  UGA: ['Kampala','Bwindi','Jinja'],
  TUN: ['Tunis','Sousse','Djerba','Sidi Bou Said'],
  DZA: ['Algiers','Oran','Constantine'],
  MOZ: ['Maputo','Bazaruto Archipelago'],
  NAM: ['Windhoek','Sossusvlei','Etosha'],
  MDG: ['Antananarivo','Nosy Be'],
  MWI: ['Lilongwe','Lake Malawi'],
  ZMB: ['Lusaka','Livingstone','South Luangwa'],
  LBY: ['Tripoli','Benghazi'],
  SDN: ['Khartoum'],
  AGO: ['Luanda'],
  CMR: ['Yaoundé','Douala'],
  CIV: ['Abidjan','Yamoussoukro'],
  MLI: ['Bamako','Timbuktu'],
  BFA: ['Ouagadougou'],
  LSO: ['Maseru'],
  SWZ: ['Mbabane','Ezulwini Valley'],
  // Middle East
  ARE: ['Dubai','Abu Dhabi','Sharjah'],
  SAU: ['Riyadh','Jeddah','AlUla'],
  TUR: ['Istanbul','Cappadocia','Antalya','Bodrum','Ephesus'],
  JOR: ['Amman','Petra','Wadi Rum','Aqaba','Dead Sea'],
  QAT: ['Doha'],
  ISR: ['Tel Aviv','Jerusalem','Haifa','Eilat'],
  OMN: ['Muscat','Salalah','Nizwa'],
  GEO: ['Tbilisi','Batumi','Kazbegi','Sighnaghi'],
  IRN: ['Tehran','Isfahan','Shiraz','Yazd'],
  KWT: ['Kuwait City'],
  LBN: ['Beirut','Byblos','Baalbek'],
  BHR: ['Manama'],
  IRQ: ['Baghdad','Erbil'],
  ARM: ['Yerevan','Lake Sevan'],
  AZE: ['Baku','Gabala'],
  // Oceania
  AUS: ['Sydney','Melbourne','Brisbane','Perth','Cairns','Gold Coast','Adelaide','Uluru'],
  NZL: ['Auckland','Queenstown','Christchurch','Wellington','Rotorua','Milford Sound'],
  FJI: ['Nadi','Suva','Yasawa Islands','Coral Coast'],
  PNG: ['Port Moresby','Tufi'],
  SLB: ['Honiara'],
  VUT: ['Port Vila'],
  WSM: ['Apia'],
  TON: ['Nukuʻalofa'],
  PLW: ['Koror'],
  FSM: ['Pohnpei','Chuuk'],
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

// Deterministic PRNG (mulberry32) so server- and client-rendered particles match — using
// Math.random() here would differ between SSR and hydration and trigger a hydration mismatch.
function seededRandom(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const particleRandom = seededRandom(42)
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size:  particleRandom() * 4 + 2,
  left:  particleRandom() * 100,
  delay: particleRandom() * 12,
  dur:   particleRandom() * 8 + 10,
  color: i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--hi)' : 'rgba(255,255,255,.3)',
}))

// ── SAMPLE DASHBOARD (demo data — shown pre-signup to inspire trip planning) ──
// Dates are computed from today rather than hardcoded, so the sample never looks
// stale/past-dated. Lead time (~10 weeks) matches the average international leisure
// booking window (~73-80 days out per 2025 travel-industry booking data).
const SAMPLE_LEAD_DAYS = 70
const SAMPLE_TRIP_NIGHTS = 6
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DOW_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const IMG_FALLBACK = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=200&q=80'

function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}
function fmtDayMonthUpper(d: Date) { return `${d.getDate()} ${MONTH_ABBR[d.getMonth()].toUpperCase()}` }
function fmtHotelRange(a: Date, b: Date) {
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTH_ABBR[a.getMonth()]}`
    : `${a.getDate()} ${MONTH_ABBR[a.getMonth()]} – ${b.getDate()} ${MONTH_ABBR[b.getMonth()]}`
}

function buildSampleTrip() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = addDays(today, SAMPLE_LEAD_DAYS)
  const end = addDays(start, SAMPLE_TRIP_NIGHTS)
  const stayIcons = ['☀️', '🌤', '⛅', '⛅', '☁️', '🌤', '☀️']
  const stayHi = [27, 26, 25, 24, 23, 25, 27]
  const stayLo = [20, 19, 19, 18, 18, 19, 20]

  return {
    city: 'Tokyo',
    dates: `${fmtDayMonthUpper(start)} – ${fmtDayMonthUpper(end)} ${end.getFullYear()}`,
    forecast: Array.from({ length: 7 }, (_, i) => ({
      name: DOW_ABBR[addDays(today, i).getDay()],
      icon: stayIcons[i], hi: stayHi[i], lo: stayLo[i], today: i === 0,
    })),
    flight: { from: 'BKK', to: 'NRT', airline: 'Thai Airways', num: 'TG 641', depTime: '08:30', arrTime: '16:10' },
    hotels: [
      { name: 'JW Marriott Hotel Tokyo', nights: fmtHotelRange(start, addDays(start, 2)) },
      { name: 'The Ritz-Carlton Tokyo', nights: fmtHotelRange(addDays(start, 2), addDays(start, 4)) },
      { name: 'Park Hyatt Tokyo', nights: fmtHotelRange(addDays(start, 4), end) },
    ],
    // One card per calendar day of the trip, matching SAMPLE_TRIP_NIGHTS + 1 days.
    days: [
      { tag: 'DAY 1', name: 'Senso-ji & Skytree', sub: 'Asakusa', img: 'https://images.unsplash.com/photo-1573455494060-c5595004fb6c?auto=format&fit=crop&w=500&q=80' },
      { tag: 'DAY 2', name: 'Tokyo Disneyland', sub: 'Urayasu', img: 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&w=500&q=80' },
      { tag: 'DAY 3', name: 'Shibuya & Meiji Shrine', sub: 'Shibuya', img: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=500&q=80' },
      { tag: 'DAY 4', name: 'Mount Fuji Day Trip', sub: 'Kawaguchiko', img: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=500&q=80' },
      { tag: 'DAY 5', name: 'TeamLab Planets', sub: 'Odaiba', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/At_teamLab_Planets_(48277798316).jpg?width=500' },
      { tag: 'DAY 6', name: 'Harajuku & Omotesando', sub: 'Shibuya', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Takeshita_Street_in_December_2018.jpg?width=500' },
      { tag: 'DAY 7', name: 'Ginza Send-off Stroll', sub: 'Chuo', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Street_at_Ginza_Tokyo.jpg?width=500' },
    ],
    toEat: [
      { text: 'Sushi breakfast at Toyosu Market', img: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=400&q=80' },
      { text: 'Bowl of ramen at Ichiran', img: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=400&q=80' },
      { text: 'Omakase counter in Ginza', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chef_Ishikawa_Cutting_Fish_(12007739074).jpg?width=400' },
      { text: 'Wagyu yakiniku night out', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/090906_yakiniku.jpg?width=400' },
      { text: 'Konbini snack crawl', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Hot_drinks_in_Japanese_Convenience_Store_(13539630815).jpg?width=400' },
    ],
  }
}

const SAMPLE_TRIP = buildSampleTrip()

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
  const [liveSuggestions, setLiveSuggestions] = useState<{ name: string; description: string; placeId: string }[]>([])
  const [resolvedISOByCity, setResolvedISOByCity] = useState<Record<string, string>>({})
  const searchRef = useRef<HTMLDivElement>(null)
  const sampleDashRef = useRef<HTMLDivElement>(null)
  const daysScrollRef = useRef<HTMLDivElement>(null)

  // Live, worldwide destination search — the static COUNTRY_CITIES list only covers a
  // curated set of countries/cities, so anything outside it comes from Google Places.
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setLiveSuggestions([]); return }
    const controller = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/place-autocomplete?q=${encodeURIComponent(searchQuery)}&types=cities`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => setLiveSuggestions(data.suggestions || []))
        .catch(() => {})
    }, 300)
    return () => { clearTimeout(t); controller.abort() }
  }, [searchQuery])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    const s = p.get('screen')
    if (!s || !(['map','places','hotels','duration'] as string[]).includes(s)) return

    // Restore full onboarding state from localStorage so the user can
    // continue editing (e.g. coming back from /home via ← Back) without
    // losing their selections.
    try {
      const raw = localStorage.getItem('tripzync_onboarding')
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>
        // Restore date pickers
        if (typeof saved.startDate === 'string') setStartDate(saved.startDate)
        if (typeof saved.endDate   === 'string') setEndDate(saved.endDate)
        // Restore map / city selections
        if (typeof saved.continent === 'string') setContinent(saved.continent)
        if (Array.isArray(saved.cities)) setSelectedCities(saved.cities as string[])
        if (Array.isArray(saved.hotels)) setSelHotels(saved.hotels as string[])
        // Rebuild ISO selections from saved countries list
        if (Array.isArray(saved.countries)) {
          const nameToISO = Object.fromEntries(Object.entries(ISO_NAME).map(([k,v]) => [v, k]))
          setSelectedISOs((saved.countries as string[]).map(n => nameToISO[n] || n).filter(Boolean))
        }
        // Rebuild selPlaceKeys from placesByCity map
        if (saved.placesByCity && typeof saved.placesByCity === 'object') {
          const keys: string[] = []
          for (const [city, places] of Object.entries(saved.placesByCity as Record<string,string[]>)) {
            for (const name of (places as string[])) keys.push(`${city}::${name}`)
          }
          setSelPlaceKeys(keys)
        }
      }
    } catch { /* ignore */ }

    setScreen(s as Screen)
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

  // Live Places results not already covered by the curated list above, worldwide fallback
  const knownCityNames = new Set(filteredCities.map(o => o.city.toLowerCase()))
  const liveOnlySuggestions = liveSuggestions
    .filter(s => s.name && !knownCityNames.has(s.name.toLowerCase()) && !selectedCities.includes(s.name))
    .slice(0, 6)

  const handleCitySelect = (city: string, iso: string) => {
    if (!selectedCities.includes(city)) {
      setSelectedCities(prev => [...prev, city])
      if (iso) {
        if (!selectedISOs.includes(iso)) setSelectedISOs(prev => [...prev, iso])
        if (!CITY_TO_ISO[city]) setResolvedISOByCity(prev => ({ ...prev, [city]: iso }))
        if (!continent) setContinent(ISO_CONTINENT[iso] || '')
      }
    }
    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleLiveCitySelect = (suggestion: { name: string; description: string }) => {
    handleCitySelect(suggestion.name, resolveIsoFromDescription(suggestion.description))
  }

  const handleCityRemove = (city: string) => {
    const iso = CITY_TO_ISO[city] || resolvedISOByCity[city]
    const newCities = selectedCities.filter(c => c !== city)
    setSelectedCities(newCities)
    // Remove ISO if no remaining cities from that country
    if (iso) {
      const stillHas = newCities.some(c => (CITY_TO_ISO[c] || resolvedISOByCity[c]) === iso)
      if (!stillHas) {
        setSelectedISOs(prev => prev.filter(i => i !== iso))
      }
    }
  }

  const mapNextDisabled = selectedCities.length === 0

  // ── RENDER: HERO ──────────────────────────────────────────────────────────
  if (screen === 'hero') return (
    <>
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
        <button className="ob-cta-btn" onClick={() => sampleDashRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          START PLANNING →
        </button>
      </div>
    </div>

    {/* ── SAMPLE DASHBOARD — same scroll, no click gate ── */}
    <div className="ob-screen" style={{ justifyContent: 'flex-start' }} ref={sampleDashRef}>
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

      <div className="ob-sample-wrap">
        <div style={{ textAlign:'center', marginBottom: 40 }}>
          <div className="ob-badge" style={{ justifyContent:'center' }}><span className="ob-badge-dot" />Your next trip, already taking shape</div>
          <h2 className="ob-headline" style={{ fontSize:'clamp(28px,5vw,46px)', marginBottom:8 }}>
            IMAGINE <span className="ob-em">YOUR TRIP</span>, THIS BEAUTIFULLY PLANNED
          </h2>
          <p className="ob-subtext" style={{ marginBottom:0 }}>One free account and it's yours to build</p>
        </div>

        {/* ── Sample dashboard preview ── */}
        <div className="ob-sample-frame">
          <div className="ob-sample-badge"><span className="ob-sample-badge-dot" />Sample Itinerary</div>

          <div className="ob-sample-dash">
            {/* Trip title */}
            <div className="ob-sample-card ob-sample-title-card">
              <div className="ob-sample-title-eyebrow">Destination</div>
              <div className="ob-sample-title-city">{SAMPLE_TRIP.city}</div>
              <div className="ob-sample-title-dates">{SAMPLE_TRIP.dates}</div>
            </div>

            {/* Forecast */}
            <div className="ob-sample-card ob-sample-forecast-card">
              <div className="ob-sample-forecast-head">7-Day Forecast</div>
              <div className="ob-sample-forecast-days">
                {SAMPLE_TRIP.forecast.map(d => (
                  <div key={d.name} className={`ob-sample-wx-day${d.today ? ' today' : ''}`}>
                    <div className="ob-sample-wx-name">{d.today ? 'Today' : d.name}</div>
                    <div className="ob-sample-wx-icon">{d.icon}</div>
                    <div className="ob-sample-wx-hi">{d.hi}°</div>
                    <div className="ob-sample-wx-lo">{d.lo}°</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flight + Hotel (left stack) */}
            <div className="ob-sample-side">
              <div className="ob-sample-card ob-sample-flight-card">
                <div className="ob-sample-card-label">✈ Flight</div>
                <div className="ob-sample-flight-route">
                  <div className="ob-sample-flight-port">{SAMPLE_TRIP.flight.from}</div>
                  <span className="ob-sample-flight-plane">✈</span>
                  <div className="ob-sample-flight-port">{SAMPLE_TRIP.flight.to}</div>
                </div>
                <div className="ob-sample-flight-time">{SAMPLE_TRIP.flight.depTime} → {SAMPLE_TRIP.flight.arrTime}</div>
                <span className="ob-sample-flight-chip">{SAMPLE_TRIP.flight.airline} · {SAMPLE_TRIP.flight.num}</span>
              </div>
              <div className="ob-sample-card ob-sample-hotel-card">
                <div className="ob-sample-card-label">🏨 Hotels</div>
                {SAMPLE_TRIP.hotels.map(h => (
                  <div key={h.name} className="ob-sample-hotel-row">
                    <span className="ob-sample-hotel-check">✓</span>
                    <span className="ob-sample-hotel-name">{h.name}</span>
                    <span className="ob-sample-hotel-nights">{h.nights}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day cards */}
            <div className="ob-sample-days-wrap">
              <div className="ob-sample-days-scroll" ref={daysScrollRef}>
                {SAMPLE_TRIP.days.map(d => (
                  <div key={d.tag} className="ob-sample-card ob-sample-day-card">
                    <img className="ob-sample-day-img" src={d.img} alt={d.name} loading="lazy" />
                    <div className="ob-sample-day-gradient" />
                    <div className="ob-sample-day-tag">{d.tag}</div>
                    <div className="ob-sample-day-body">
                      <div className="ob-sample-day-name">{d.name}</div>
                      <div className="ob-sample-day-sub">{d.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ob-sample-days-fade" />
              <button
                type="button"
                className="ob-sample-days-arrow left"
                aria-label="Scroll to earlier days"
                onClick={() => daysScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
              >‹</button>
              <button
                type="button"
                className="ob-sample-days-arrow right"
                aria-label="Scroll to more days"
                onClick={() => daysScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
              >›</button>
            </div>

            {/* What to eat — full-width photo strip (day cards above already cover "what to do") */}
            <div className="ob-sample-card ob-sample-note-card eat">
              <div className="ob-sample-note-head">✦ What To Eat</div>
              <div className="ob-sample-eat-strip">
                {SAMPLE_TRIP.toEat.map(item => (
                  <div key={item.text} className="ob-sample-eat-card">
                    <img
                      className="ob-sample-eat-img"
                      src={item.img}
                      alt={item.text}
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = IMG_FALLBACK }}
                    />
                    <div className="ob-sample-eat-gradient" />
                    <div className="ob-sample-eat-name">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA under the dashboard ── */}
        <div className="ob-sample-cta">
          <p className="ob-sample-cta-lead">Ready to plan your own?</p>
          <div className="ob-sample-cta-buttons">
            <button className="ob-cta-btn" style={{ padding:'16px 44px', fontSize:15 }}
              onClick={() => { window.location.href = '/login?callbackUrl=%2F%3Fscreen%3Dmap' }}>
              PLAN MY TRIP →
            </button>
            <button className="ob-sample-guest-link" onClick={() => setShowGuestModal(true)}>
              Guest
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
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
            background: 'var(--card)',
            border: `1.5px solid ${showDropdown ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: showDropdown && filteredCities.length > 0 ? '12px 12px 0 0' : 12,
            padding: '12px 16px',
            transition: 'border-color 0.2s',
          }}>
            {/* Search icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
              <circle cx="11" cy="11" r="7" stroke="var(--muted, white)" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="var(--muted, white)" strokeWidth="2" strokeLinecap="round"/>
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
                color: 'var(--text, #fff)', fontFamily: "'Rajdhani', sans-serif",
                fontSize: 16, fontWeight: 500,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowDropdown(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted, rgba(255,255,255,0.4))', fontSize: 18, lineHeight: 1, padding: 0 }}
              >×</button>
            )}
          </div>

          {/* ── Dropdown ── */}
          {showDropdown && (filteredCities.length > 0 || liveOnlySuggestions.length > 0) && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--card)',
              border: '1.5px solid var(--accent)',
              borderTop: '1px solid var(--border)',
              borderRadius: '0 0 12px 12px',
              overflow: 'hidden',
              maxHeight: 320, overflowY: 'auto',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
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
                    borderBottom: (idx < filteredCities.length - 1 || liveOnlySuggestions.length > 0)
                      ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(64,224,208,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: 16 }}>📍</span>
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif", fontSize: 15,
                      fontWeight: 600, color: 'var(--text, #fff)',
                    }}>{opt.city}</div>
                    <div style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 9,
                      letterSpacing: '0.1em', color: 'var(--muted, rgba(255,255,255,0.4))',
                      textTransform: 'uppercase', marginTop: 1,
                    }}>{opt.countryName}</div>
                  </div>
                  {selectedCities.includes(opt.city) && (
                    <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 14 }}>✓</span>
                  )}
                </button>
              ))}
              {liveOnlySuggestions.map((s, idx) => (
                <button
                  key={s.placeId || s.name}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleLiveCitySelect(s)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 12, padding: '11px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    borderBottom: idx < liveOnlySuggestions.length - 1
                      ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(64,224,208,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: 16 }}>🌍</span>
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif", fontSize: 15,
                      fontWeight: 600, color: 'var(--text, #fff)',
                    }}>{s.name}</div>
                    <div style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 9,
                      letterSpacing: '0.1em', color: 'var(--muted, rgba(255,255,255,0.4))',
                      textTransform: 'uppercase', marginTop: 1,
                    }}>{s.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {showDropdown && searchQuery.length > 1 && filteredCities.length === 0 && liveOnlySuggestions.length === 0 && (
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
        {selectedCities.length > 1 && selectedISOs.length > 1 && (
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginTop: 10,
          }}>
            Multiple countries selected — world view shown
          </p>
        )}

        {/* ── World Map ── */}
        <div style={{ marginTop: 24, width: '100%', maxWidth: 700 }}>
          <WorldMap selectedISOs={selectedISOs} selectedCities={selectedCities} />
        </div>
      </div>

      <div className="ob-progress">
        <button className="ob-step-back" onClick={() => setScreen('hero')}>← Back</button>
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
              <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:'.16em', textTransform:'uppercase' as const, color:'var(--text, #fff)', marginBottom:6, display:'block' }}>
                Start Date
              </label>
              <DatePicker
                value={startDate}
                min={todayStr}
                onChange={setStartDate}
                placeholder="Pick start date"
              />
            </div>
            <div>
              <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:'.16em', textTransform:'uppercase' as const, color:'var(--text, #fff)', marginBottom:6, display:'block' }}>
                End Date
              </label>
              <DatePicker
                value={endDate}
                min={startDate || todayStr}
                onChange={setEndDate}
                placeholder="Pick end date"
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
