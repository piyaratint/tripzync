'use client'

import { toISO } from '@/lib/utils'
import { EventItem } from './EventItem'
import type { Event } from '@/lib/db/schema'

interface Day {
  date: string
  label: string
  title: string
  hotel: string
  events: Event[]
}

interface Props {
  tripId: string
  day: Day
  startDate: string
  endDate: string
}

export function DayPanel({ tripId, day, startDate, endDate }: Props) {
  const today = toISO(new Date())

  let flag = ''
  if (day.date === today)
    flag = '<span class="event-flag flag-race">📅 Today</span>'
  else if (day.date === startDate)
    flag = '<span class="event-flag flag-sakura">✈️ Arrival</span>'
  else if (day.date === endDate)
    flag = '<span class="event-flag flag-race">🏠 Departure</span>'

  return (
    <>
      <div className="day-panel-head">
        <div>
          <div className="day-date">{day.label} · {day.date.slice(0, 4)}</div>
          <div className="day-title">{day.title}</div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: flag }} />
      </div>

      {day.hotel && (
        <div className="hotel-banner">
          🏨 {day.hotel}{' '}
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(day.hotel)}`} target="_blank" rel="noopener noreferrer">📍</a>
        </div>
      )}

      <div className="timeline">
        {day.events.length === 0 ? (
          <div className="empty-day"><p>No events yet — add below</p></div>
        ) : (
          day.events.map((ev, i) => (
            <EventItem key={ev.id} tripId={tripId} event={ev} isLast={i === day.events.length - 1} />
          ))
        )}
      </div>
    </>
  )
}
