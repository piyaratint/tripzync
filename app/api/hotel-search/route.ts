import { NextRequest, NextResponse } from 'next/server'

// ── Brand keyword matching ────────────────────────────────────────────────────
const BRAND_KEYWORDS: Record<string, string[]> = {
  hilton:   ['hilton', 'doubletree', 'hampton inn', 'hampton by hilton', 'waldorf astoria', 'waldorf', 'conrad', 'embassy suites', 'home2', 'homewood', 'canopy by hilton', 'tru by hilton', 'curio', 'lxr'],
  marriott: ['marriott', 'westin', 'sheraton', 'w hotel', 'w hotels', 'st. regis', 'st regis', 'ritz-carlton', 'ritz carlton', 'renaissance', 'courtyard', 'fairfield', 'residence inn', 'springhill', 'autograph collection', 'delta hotels', 'le méridien', 'le meridien', 'moxy', 'aloft', 'four points', 'element by westin', 'ac hotel', 'tribute portfolio'],
  hyatt:    ['hyatt', 'park hyatt', 'andaz', 'grand hyatt', 'alila', 'thompson hotel', 'caption by hyatt', 'joie de vivre', 'dream hotel', 'tommie'],
  ihg:      ['intercontinental', 'holiday inn', 'crowne plaza', 'kimpton', 'hotel indigo', 'indigo hotel', 'avid hotel', 'voco', 'regent hotel', 'six senses', 'staybridge', 'candlewood'],
  accor:    ['sofitel', 'novotel', 'ibis', 'pullman', 'mercure', 'mgallery', 'swissôtel', 'swissotel', 'fairmont', 'raffles', 'mama shelter', 'tribe hotel', 'emblems', 'handwritten'],
}

// ── Interfaces ────────────────────────────────────────────────────────────────
interface ClusterDef {
  city: string
  lat: number
  lng: number
  radiusMeters: number
}

interface HotelCandidate {
  name: string
  placeId: string
  lat: number
  lng: number
  priceLevel?: string
  travelSecs?: number   // driving seconds to cluster center; undefined = unknown
}

export interface GoogleHotel {
  name: string
  tier: string
  price: string
  stars: number
  mapsUrl: string
  travelMins: number   // rounded travel minutes to cluster center
  lat: number
  lng: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectBrand(name: string): string | null {
  const lower = name.toLowerCase()
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return brand
  }
  return null
}

function isAirportHotel(name: string): boolean {
  return /airport|aerocity|aeroport/i.test(name)
}

// Filter obviously non-hotel places that Google Places may return
function isRealHotel(name: string): boolean {
  return !/pickup.?location|shuttle|^universal.?studio[s]?$|spa\s*$/i.test(name)
}

function mapPriceLevel(priceLevel?: string): { tier: string; price: string; stars: number } {
  switch (priceLevel) {
    case 'PRICE_LEVEL_INEXPENSIVE':    return { tier: 'Midscale',  price: '$80+/n',   stars: 3 }
    case 'PRICE_LEVEL_MODERATE':       return { tier: 'Upper Mid', price: '$130+/n',  stars: 4 }
    case 'PRICE_LEVEL_EXPENSIVE':      return { tier: 'Premium',   price: '$220+/n',  stars: 5 }
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return { tier: 'Luxury',    price: '$380+/n',  stars: 5 }
    default:                           return { tier: 'Classic',   price: '$160+/n',  stars: 4 }
  }
}

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// Estimate urban driving time: straight-line × 1.4 detour factor at 30 km/h average
function estimateTravelMins(hotelLat: number, hotelLng: number, destLat: number, destLng: number): number {
  const km = haversineKm(hotelLat, hotelLng, destLat, destLng)
  return Math.round(km * 1.4 / 30 * 60)
}

// ── Google Places: searchNearby ───────────────────────────────────────────────
async function searchNearbyHotels(
  lat: number,
  lng: number,
  radiusMeters: number,
  apiKey: string,
): Promise<HotelCandidate[]> {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Goog-Api-Key':   apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.priceLevel',
      },
      body: JSON.stringify({
        includedTypes:       ['hotel', 'motel', 'resort_hotel', 'extended_stay_hotel'],
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: Math.min(radiusMeters, 50000),
          },
        },
        maxResultCount: 20,
        rankPreference: 'POPULARITY',
        languageCode:   'en',
      }),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.places ?? [])
      .filter((p: any) => p.displayName?.text && p.location)
      .map((p: any): HotelCandidate => ({
        name:       p.displayName.text,
        placeId:    p.id ?? '',
        lat:        p.location.latitude,
        lng:        p.location.longitude,
        priceLevel: p.priceLevel,
      }))
  } catch {
    return []
  }
}

// ── Google Distance Matrix: batch travel-time lookup ─────────────────────────
// Origins: hotel coordinates (pipe-separated).
// Destination: cluster center (single point).
// Returns map of index → driving seconds (undefined if route not found).
async function getTravelTimes(
  hotels: HotelCandidate[],
  destLat: number,
  destLng: number,
  apiKey: string,
): Promise<Map<number, number>> {
  const result = new Map<number, number>()
  if (!hotels.length) return result

  // Distance Matrix accepts up to 25 origins per request
  const CHUNK = 25
  for (let i = 0; i < hotels.length; i += CHUNK) {
    const chunk = hotels.slice(i, i + CHUNK)
    const origins = chunk.map(h => `${h.lat},${h.lng}`).join('|')
    const destination = `${destLat},${destLng}`

    try {
      const url =
        `https://maps.googleapis.com/maps/api/distancematrix/json` +
        `?origins=${encodeURIComponent(origins)}` +
        `&destinations=${encodeURIComponent(destination)}` +
        `&mode=driving` +
        `&key=${apiKey}`

      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) { console.log('[hotel-search] Distance Matrix HTTP error:', res.status); continue }
      const data = await res.json()
      if (data.status !== 'OK') console.log('[hotel-search] Distance Matrix API status:', data.status, data.error_message ?? '')

      ;(data.rows ?? []).forEach((row: any, j: number) => {
        const el = row.elements?.[0]
        if (el?.status === 'OK' && el.duration?.value != null) {
          result.set(i + j, el.duration.value) // seconds
        }
      })
    } catch (err) { console.log('[hotel-search] Distance Matrix exception:', err) }
  }
  return result
}

// ── POST /api/hotel-search ────────────────────────────────────────────────────
// Body: { clusters: Array<{ city, lat, lng, radiusMeters }> }
// Returns: {
//   brands:   Array<{ city, brand, hotels: GoogleHotel[] }>,  // sorted by travelMins ↑
//   mapsUrls: Record<string, string>,
// }
//
// Pipeline:
//   searchNearby (geo-locked)
//   → Distance Matrix (≤ 45 min driving filter)
//   → group ALL hotels by detected brand ('independent' when no brand matches)
//   → sort by travelMins ascending within each brand group
export async function POST(req: NextRequest) {
  const body     = await req.json()
  const clusters: ClusterDef[] = body.clusters ?? []

  console.log('[hotel-search] clusters:', JSON.stringify(clusters))

  if (!clusters.length) {
    console.log('[hotel-search] ❌ no clusters — returning empty')
    return NextResponse.json({ brands: [], mapsUrls: {} })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.log('[hotel-search] ❌ GOOGLE_PLACES_API_KEY not set')
    return NextResponse.json({ brands: [], mapsUrls: {} })
  }

  const MAX_TRAVEL_MINS = 45 // 45-minute driving cutoff

  const brands: { city: string; brand: string; hotels: GoogleHotel[] }[] = []
  const mapsUrls: Record<string, string> = {}

  await Promise.all(clusters.map(async cluster => {
    // Step 1 — find candidate hotels within the cluster radius
    const candidates = await searchNearbyHotels(cluster.lat, cluster.lng, cluster.radiusMeters, apiKey)
    console.log(`[hotel-search] cluster "${cluster.city}" (r=${cluster.radiusMeters}m) → ${candidates.length} candidates:`, candidates.map(c => c.name))
    if (!candidates.length) return

    // Step 2 — get driving time from each hotel to the cluster center
    const travelMap = await getTravelTimes(candidates, cluster.lat, cluster.lng, apiKey)
    console.log(`[hotel-search] travelMap size: ${travelMap.size} / ${candidates.length}`)

    // Step 3 — attach travel time, filter > 45 min, enrich with display data
    const enriched: (GoogleHotel & { detectedBrand: string; travelSecs: number })[] = []

    candidates.forEach((c, idx) => {
      if (!isRealHotel(c.name)) return

      const dmSecs = travelMap.get(idx)
      const travelMins = dmSecs !== undefined
        ? Math.round(dmSecs / 60)
        : estimateTravelMins(c.lat, c.lng, cluster.lat, cluster.lng)

      if (travelMins > MAX_TRAVEL_MINS) return

      const travelSecs = dmSecs !== undefined ? dmSecs : travelMins * 60
      const { tier, price, stars } = mapPriceLevel(c.priceLevel)
      const mapsUrl = c.placeId
        ? `https://www.google.com/maps/place/?q=place_id:${c.placeId}`
        : `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`

      mapsUrls[c.name] = mapsUrl
      enriched.push({
        name: c.name, tier, price, stars, mapsUrl, travelMins,
        lat: c.lat, lng: c.lng,
        detectedBrand: detectBrand(c.name) ?? 'independent',
        travelSecs,
      })
    })

    // Step 4 — sort all hotels by proximity ascending
    enriched.sort((a, b) => a.travelSecs - b.travelSecs)

    // Step 5 — group into brand buckets (preserving proximity order)
    const brandBuckets: Record<string, GoogleHotel[]> = {}
    for (const h of enriched) {
      const { travelSecs: _, detectedBrand, ...hotel } = h
      if (!brandBuckets[detectedBrand]) brandBuckets[detectedBrand] = []
      // cap each brand at 5 properties
      if (brandBuckets[detectedBrand].length < 5) {
        const cityCenter = brandBuckets[detectedBrand].filter(x => !isAirportHotel(x.name))
        // prefer non-airport when we already have 2+ city-center picks
        if (isAirportHotel(hotel.name) && cityCenter.length >= 2) return
        brandBuckets[detectedBrand].push(hotel)
      }
    }

    // Step 6 — push brand groups: known chains first, then independents
    const knownOrder = ['marriott', 'hilton', 'hyatt', 'ihg', 'accor']
    const sorted = [
      ...knownOrder.filter(b => brandBuckets[b]),
      ...Object.keys(brandBuckets).filter(b => !knownOrder.includes(b) && b !== 'independent'),
      ...(brandBuckets['independent'] ? ['independent'] : []),
    ]
    for (const brand of sorted) {
      brands.push({ city: cluster.city, brand, hotels: brandBuckets[brand] })
    }
  }))

  console.log(`[hotel-search] ✅ returning ${brands.length} brand groups`)
  return NextResponse.json({ brands, mapsUrls })
}
