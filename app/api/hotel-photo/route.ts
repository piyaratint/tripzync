import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hotelPhotos } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

// 30-day TTL — hotel photos rarely change
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

interface HotelInput {
  name: string
  city: string
}

function nameKey(name: string, city: string) {
  return `${name.toLowerCase()}|${city.toLowerCase()}`
}

async function fetchPhotoFromGoogle(
  name: string,
  city: string,
  apiKey: string
): Promise<{ photoUrl: string; placeId: string } | null> {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Goog-Api-Key':   apiKey,
        'X-Goog-FieldMask': 'places.id,places.photos',
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
    if (!place?.photos?.[0]?.name) return null

    // Follow the redirect to get the final CDN URL (lh3.googleusercontent.com/...)
    // so the browser can load it directly without API key or referrer issues
    const mediaUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=600&maxHeightPx=300&key=${apiKey}`
    const mediaRes = await fetch(mediaUrl, { redirect: 'follow' })
    const photoUrl = mediaRes.url // final CDN URL after redirect

    return { photoUrl, placeId: place.id ?? '' }
  } catch {
    return null
  }
}

// POST /api/hotel-photo
// Body: { hotels: Array<{ name: string, city: string }> }
// Returns: { photos: Record<string, string> }  — key = hotel name, value = photo URL
export async function POST(req: NextRequest) {
  const body = await req.json()
  const hotels: HotelInput[] = body.hotels ?? []

  if (!hotels.length) return NextResponse.json({ photos: {} })

  const result: Record<string, string> = {}
  const since = new Date(Date.now() - CACHE_TTL_MS)
  const keys = hotels.map(h => nameKey(h.name, h.city))

  // Step 1 — fetch all valid cached rows in one query
  const cached = await db
    .select()
    .from(hotelPhotos)
    .where(inArray(hotelPhotos.nameKey, keys))

  cached.forEach(row => {
    // Only use if within TTL
    if (row.cachedAt >= since) result[row.name] = row.photoUrl
  })

  // Step 2 — find missing or stale hotels
  const cachedKeys = new Set(
    cached.filter(r => r.cachedAt >= since).map(r => r.nameKey)
  )
  const missing = hotels.filter(h => !cachedKeys.has(nameKey(h.name, h.city)))

  if (missing.length > 0) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (apiKey) {
      const fetched = await Promise.all(
        missing.map(async h => {
          const photo = await fetchPhotoFromGoogle(h.name, h.city, apiKey)
          return { hotel: h, photo }
        })
      )

      const toUpsert = fetched
        .filter(f => f.photo !== null)
        .map(f => ({
          nameKey:  nameKey(f.hotel.name, f.hotel.city),
          name:     f.hotel.name,
          city:     f.hotel.city,
          photoUrl: f.photo!.photoUrl,
          placeId:  f.photo!.placeId,
          cachedAt: new Date(),
        }))

      if (toUpsert.length > 0) {
        await db
          .insert(hotelPhotos)
          .values(toUpsert)
          .onConflictDoUpdate({
            target: hotelPhotos.nameKey,
            set: { photoUrl: hotelPhotos.photoUrl, cachedAt: hotelPhotos.cachedAt },
          })

        toUpsert.forEach(r => { result[r.name] = r.photoUrl })
      }
    }
  }

  return NextResponse.json({ photos: result })
}
