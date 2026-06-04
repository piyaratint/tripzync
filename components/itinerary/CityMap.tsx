'use client'

import { useEffect, useState } from 'react'
import type { Event, Hotel } from '@/lib/db/schema'

interface Coord {
  lat: number
  lng: number
  mapsUrl: string
}

interface MyAccom {
  name: string
  address: string
  mapsUrl: string
}

interface Props {
  city: string
  events: Event[]
  hotels?: Hotel[]
  myAccommodation?: MyAccom | null
}

export function CityMap({ city, events, hotels = [], myAccommodation }: Props) {
  const [coords, setCoords] = useState<Record<string, Coord>>({})
  const [loading, setLoading] = useState(false)

  const placeNames = events
    .flatMap(e => [e.act, e.fromPlace, e.toPlace].filter(Boolean) as string[])
    .filter((v, i, a) => a.indexOf(v) === i)

  const hotelNames = hotels.map(h => h.name).filter((v, i, a) => a.indexOf(v) === i)
  const accomName = myAccommodation?.name
  const allPlaceNames = [...new Set([
    ...placeNames,
    ...hotelNames,
    ...(accomName ? [accomName + (myAccommodation?.address ? ' ' + myAccommodation.address : '')] : []),
  ])]

  useEffect(() => {
    if (!allPlaceNames.length || !city) return

    const places = allPlaceNames.map(name => ({ name, city }))
    setLoading(true)
    fetch('/api/place-coords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ places }),
    })
      .then(r => r.json())
      .then(d => setCoords(d.coords ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [allPlaceNames.join(','), city])

  const eventPins = placeNames
    .filter(name => coords[name])
    .map(name => ({ name, ...coords[name], type: 'event' as const }))

  const hotelPins = hotelNames
    .filter(name => coords[name])
    .map(name => ({ name, ...coords[name], type: 'hotel' as const }))

  const accomKey = accomName ? accomName + (myAccommodation?.address ? ' ' + myAccommodation.address : '') : ''
  const accomPins = accomKey && coords[accomKey]
    ? [{ name: myAccommodation!.name, ...coords[accomKey], mapsUrl: myAccommodation!.mapsUrl, type: 'myaccom' as const }]
    : []

  const allPins = [...accomPins, ...hotelPins, ...eventPins]

  if (!allPins.length && !loading) return null

  const center = allPins.length > 0
    ? { lat: allPins.reduce((s, p) => s + p.lat, 0) / allPins.length, lng: allPins.reduce((s, p) => s + p.lng, 0) / allPins.length }
    : null

  const mapQuery = allPins.length === 1
    ? encodeURIComponent(allPins[0].name + ' ' + city)
    : center
      ? `${center.lat},${center.lng}`
      : encodeURIComponent(city)

  const zoom = allPins.length === 1 ? 15 : allPins.length <= 3 ? 13 : 12

  return (
    <div className="city-map-section">
      <div className="section-head">
        <div className="section-line" />
        <span className="section-label">City Map</span>
        <div className="section-line" />
      </div>

      {loading && <div className="city-map-loading">Loading map pins...</div>}

      <div className="city-map-container">
        <iframe
          className="city-map-iframe"
          src={`https://maps.google.com/maps?q=${mapQuery}&z=${zoom}&output=embed`}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {allPins.length > 0 && (
        <div className="city-map-pins">
          {accomPins.map(p => (
            <a
              key={'accom-' + p.name}
              className="city-map-pin-chip accom-pin"
              href={p.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="pin-dot pin-dot-accom" />
              {p.name}
            </a>
          ))}
          {hotelPins.map(p => (
            <a
              key={'hotel-' + p.name}
              className="city-map-pin-chip hotel-pin"
              href={p.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="pin-dot pin-dot-hotel" />
              {p.name}
            </a>
          ))}
          {eventPins.map(p => (
            <a
              key={p.name}
              className="city-map-pin-chip"
              href={p.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="pin-dot" />
              {p.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
