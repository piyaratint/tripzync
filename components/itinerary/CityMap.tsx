'use client'

import { useEffect, useState } from 'react'
import type { Event } from '@/lib/db/schema'

interface Coord {
  lat: number
  lng: number
  mapsUrl: string
}

interface Props {
  city: string
  events: Event[]
}

export function CityMap({ city, events }: Props) {
  const [coords, setCoords] = useState<Record<string, Coord>>({})
  const [loading, setLoading] = useState(false)

  const placeNames = events
    .flatMap(e => [e.act, e.fromPlace, e.toPlace].filter(Boolean) as string[])
    .filter((v, i, a) => a.indexOf(v) === i)

  useEffect(() => {
    if (!placeNames.length || !city) return

    const places = placeNames.map(name => ({ name, city }))
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
  }, [placeNames.join(','), city])

  const pins = placeNames
    .filter(name => coords[name])
    .map(name => ({ name, ...coords[name] }))

  if (!pins.length && !loading) return null

  const center = pins.length > 0
    ? { lat: pins.reduce((s, p) => s + p.lat, 0) / pins.length, lng: pins.reduce((s, p) => s + p.lng, 0) / pins.length }
    : null

  const mapQuery = pins.length === 1
    ? encodeURIComponent(pins[0].name + ' ' + city)
    : center
      ? `${center.lat},${center.lng}`
      : encodeURIComponent(city)

  const zoom = pins.length === 1 ? 15 : pins.length <= 3 ? 13 : 12

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

      {pins.length > 0 && (
        <div className="city-map-pins">
          {pins.map(p => (
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
