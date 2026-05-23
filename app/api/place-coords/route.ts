import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { placeCoords } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

interface PlaceInput {
  name: string
  city: string
}

interface CoordResult {
  lat: number
  lng: number
  mapsUrl: string  // Google Maps link — ready for directions / route planning
}

// Fetch lat/lng for a single place from Google Places API (New).
// Uses text search: "{place name} {city}" — returns only location field (cheapest SKU).
async function fetchCoordsFromGoogle(
  name: string,
  city: string,
  apiKey: string
): Promise<{ lat: number; lng: number; placeId: string } | null> {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Goog-Api-Key':   apiKey,
        'X-Goog-FieldMask': 'places.id,places.location',
      },
      body: JSON.stringify({
        textQuery:      `${name} ${city}`,
        maxResultCount: 1,
        languageCode:   'en',
      }),
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place?.location) return null

    return {
      lat:     place.location.latitude,
      lng:     place.location.longitude,
      placeId: place.id ?? '',
    }
  } catch {
    return null
  }
}

// POST /api/place-coords
// Body: { places: Array<{ name: string, city: string }> }
// Returns: { coords: Record<string, { lat: number, lng: number }> }
//
// Logic:
// 1. Look up all place names in DB (permanent cache — coords never change)
// 2. For any place not in DB, call Google Places API and store the result
// 3. Return a map of { [placeName]: { lat, lng } } for all found places
export async function POST(req: NextRequest) {
  const body = await req.json()
  const places: PlaceInput[] = body.places ?? []

  if (!places.length) {
    return NextResponse.json({ coords: {} })
  }

  const result: Record<string, CoordResult> = {}

  // Normalise keys for DB lookup
  const nameKeys = places.map(p => p.name.toLowerCase())

  // Step 1 — fetch all cached rows in one DB query
  const cached = await db
    .select()
    .from(placeCoords)
    .where(inArray(placeCoords.nameKey, nameKeys))

  cached.forEach(row => {
    const lat = parseFloat(String(row.lat))
    const lng = parseFloat(String(row.lng))
    const mapsUrl = row.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${row.placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    result[row.name] = { lat, lng, mapsUrl }
  })

  // Step 2 — find which places are missing from cache
  const cachedKeys = new Set(cached.map(r => r.nameKey))
  const missing = places.filter(p => !cachedKeys.has(p.name.toLowerCase()))

  if (missing.length > 0) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (apiKey) {
      // Fetch all missing places in parallel
      const fetched = await Promise.all(
        missing.map(async p => {
          const coords = await fetchCoordsFromGoogle(p.name, p.city, apiKey)
          return { place: p, coords }
        })
      )

      // Insert found coords into DB and add to result
      const toInsert = fetched
        .filter(f => f.coords !== null)
        .map(f => ({
          nameKey:  f.place.name.toLowerCase(),
          name:     f.place.name,
          lat:      String(f.coords!.lat),
          lng:      String(f.coords!.lng),
          placeId:  f.coords!.placeId,
          cachedAt: new Date(),
        }))

      if (toInsert.length > 0) {
        await db
          .insert(placeCoords)
          .values(toInsert)
          .onConflictDoNothing() // safe if two requests race
      }

      toInsert.forEach(r => {
        const lat = parseFloat(r.lat)
        const lng = parseFloat(r.lng)
        const mapsUrl = r.placeId
          ? `https://www.google.com/maps/place/?q=place_id:${r.placeId}`
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        result[r.name] = { lat, lng, mapsUrl }
      })
    }
  }

  return NextResponse.json({ coords: result })
}
