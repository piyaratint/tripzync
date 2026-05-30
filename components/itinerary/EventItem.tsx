'use client'

import { useState } from 'react'
import { useDeleteEvent } from '@/hooks/useTrip'
import { useUIStore } from '@/store/uiStore'
import { useTripStore } from '@/store/tripStore'
import type { Event } from '@/lib/db/schema'

interface Props {
  tripId: string
  event: Event
  isLast: boolean
}

export function EventItem({ tripId, event: ev, isLast }: Props) {
  const deleteEvent   = useDeleteEvent(tripId)
  const openEditEvent = useUIStore(s => s.openEditEvent)
  const places        = useTripStore(s => s.places)
  const [confirmDel, setConfirmDel] = useState(false)

  const isUserEvent = !ev.isKey && !ev.isSakura
  const cls = ev.isKey ? 'key' : ev.isSakura ? 'sakura' : ''

  const steps = (ev.steps as Array<{ label: string; col: string }> | null) ?? []

  const place = places[ev.act.toLowerCase()]

  return (
    <div className={`event-item ${cls}`}>
      <div className="ev-time">{ev.time ?? ''}</div>

      <div className="ev-track">
        <div className="ev-dot" />
        {!isLast && <div className="ev-line" />}
      </div>

      <div className="ev-body" style={{ borderBottom: isLast ? 'none' : undefined }}>
        <div className="ev-act">{ev.act}</div>
        {ev.sub && <div className="ev-sub">{ev.sub}</div>}
        {(ev.fromPlace || ev.toPlace) && (
          <div className="ev-route">
            {ev.fromPlace && <span className="route-stop">{ev.fromPlace}</span>}
            {ev.fromPlace && ev.toPlace && <span className="route-arrow">→</span>}
            {ev.toPlace && <span className="route-stop">{ev.toPlace}</span>}
          </div>
        )}
        {place && (
          <div className="ev-place-card">
            <img src={place.image} alt={place.name} className="ev-place-img" />
            <div className="ev-place-overlay">
              <span className="ev-place-type">{place.type}</span>
            </div>
          </div>
        )}
      </div>

      <div className="ev-badges">
        {steps.map((s, i) => (
          <span key={i} className={`ev-badge ${s.col}`}>{s.label}</span>
        ))}
      </div>

      {isUserEvent ? (
        <div className="ev-actions">
          {confirmDel ? (
            <>
              <button
                className="ev-act-btn del"
                title="Confirm delete"
                onClick={() => { deleteEvent.mutate(ev.id); setConfirmDel(false) }}
              >✓</button>
              <button
                className="ev-act-btn edit"
                title="Cancel"
                onClick={() => setConfirmDel(false)}
              >✕</button>
            </>
          ) : (
            <>
              <button
                className="ev-act-btn edit"
                title="Edit"
                onClick={() => openEditEvent(ev.id)}
              >✎</button>
              <button
                className="ev-act-btn del"
                title="Delete"
                onClick={() => setConfirmDel(true)}
              >✕</button>
            </>
          )}
        </div>
      ) : (
        <div className="ev-actions" style={{ visibility: 'hidden' }} />
      )}
    </div>
  )
}
