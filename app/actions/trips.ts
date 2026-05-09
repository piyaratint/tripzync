'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trips, events } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function softDeleteTrip(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db
    .update(trips)
    .set({ deletedAt: new Date() })
    .where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))

  revalidatePath('/dashboard')
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface OnboardingData {
  continent?: string
  countries?: string[]
  cities?: string[]
  places?: string[]
  placesByCity?: Record<string, string[]>
  hotels?: string[]
  destination?: string
  startDate?: string
  endDate?: string
  pendingTrip?: { destination?: string; startDate?: string; endDate?: string }
}
interface DayBlock  { dayNumber: number; date: string; places: string[] }
interface CitySection { city: string; days: DayBlock[]; startDay: number }

function toISO(startDate: string, dayNumber: number): string {
  const d = new Date(startDate)
  d.setDate(d.getDate() + dayNumber - 1)
  return d.toISOString().slice(0, 10)
}

// ── saveTrip ──────────────────────────────────────────────────────────────────
// Creates a new trip or updates an existing one and stores the full itinerary
// as events (sub='_place') so it can be reloaded on the home page.
export async function saveTrip(
  existingTripId: string | null,
  data: OnboardingData,
  itinerary: CitySection[],
): Promise<{ tripId: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const dest      = data.destination || data.cities?.[0] || data.countries?.[0] || 'My Trip'
  const words     = dest.toUpperCase().split(/\s+/)
  const startDate = data.startDate || data.pendingTrip?.startDate || new Date().toISOString().slice(0, 10)
  const endDate   = data.endDate   || data.pendingTrip?.endDate   || startDate

  const meta = {
    continent:    data.continent,
    countries:    data.countries,
    cities:       data.cities,
    places:       data.places,
    placesByCity: data.placesByCity,
    hotels:       data.hotels,
    startDate,
    endDate,
    destination:  dest,
    pendingTrip:  data.pendingTrip,
  }

  let tripId = existingTripId

  if (tripId) {
    // Update existing trip
    await db.update(trips)
      .set({
        title1:      words[0] || 'MY',
        title2:      words.slice(1).join(' ') || 'TRIP',
        destination: dest,
        startDate,
        endDate,
        tripMeta:    meta,
        updatedAt:   new Date(),
      })
      .where(eq(trips.id, tripId))

    // Remove old auto-generated place events before re-inserting
    await db.delete(events)
      .where(and(eq(events.tripId, tripId), eq(events.sub, '_place')))
  } else {
    // Create new trip
    const [newTrip] = await db.insert(trips).values({
      userId:      session.user.id,
      title1:      words[0] || 'MY',
      title2:      words.slice(1).join(' ') || 'TRIP',
      destination: dest,
      startDate,
      endDate,
      tripMeta:    meta,
    }).returning({ id: trips.id })

    tripId = newTrip.id
  }

  // Insert one event per place per day
  const eventsToInsert = itinerary.flatMap(sec =>
    sec.days.flatMap((day, _di) =>
      day.places.map((place, idx) => ({
        tripId:    tripId!,
        date:      toISO(startDate, day.dayNumber),
        act:       place,
        fromPlace: sec.city,
        sub:       '_place' as string,
        sortOrder: idx,
        isKey:     false as const,
        isSakura:  false as const,
      }))
    )
  )

  if (eventsToInsert.length > 0) {
    await db.insert(events).values(eventsToInsert)
  }

  revalidatePath('/dashboard')
  return { tripId: tripId! }
}
