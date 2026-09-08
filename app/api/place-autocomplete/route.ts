import { NextRequest, NextResponse } from 'next/server'

// GET /api/place-autocomplete?q=<query>&city=<city>&types=cities
// Proxies Google Places Autocomplete (New) to return location suggestions.
// Pass types=cities to bias results toward cities/regions/countries (destination search)
// rather than arbitrary points of interest (the default, used by the in-trip places search).
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const city = req.nextUrl.searchParams.get('city')?.trim() || ''
  const types = req.nextUrl.searchParams.get('types')?.trim() || ''
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: `${query} ${city}`,
        languageCode: 'en',
        ...(types === 'cities' && {
          includedPrimaryTypes: ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country'],
        }),
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] })
    }

    const data = await res.json()
    const suggestions = (data.suggestions ?? [])
      .filter((s: any) => s.placePrediction)
      .slice(0, 8)
      .map((s: any) => ({
        name: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? '',
        description: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
        placeId: s.placePrediction.placeId ?? '',
      }))

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
