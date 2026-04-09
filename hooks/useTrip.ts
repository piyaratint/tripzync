'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTripStore } from '@/store/tripStore'
import type { CreateEventInput, UpdateEventInput } from '@/lib/validations'

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const tripKeys = {
  all:      ['trips'] as const,
  detail:   (id: string) => ['trips', id] as const,
  events:   (id: string) => ['trips', id, 'events'] as const,
  expenses: (id: string) => ['trips', id, 'expenses'] as const,
  flights:  (id: string) => ['trips', id, 'flights'] as const,
}

// ─── FETCH TRIP ───────────────────────────────────────────────────────────────
export function useTrip(tripId: string) {
  const setTrip   = useTripStore(s => s.setTrip)
  const setHotels = useTripStore(s => s.setHotels)

  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`)
      if (!res.ok) throw new Error('Failed to fetch trip')
      const data = await res.json()
      setTrip(data.trip)
      setHotels(data.hotels)
      return data
    },
    staleTime: 60_000, // 1 minute
  })
}

// ─── FETCH EVENTS ─────────────────────────────────────────────────────────────
export function useEvents(tripId: string) {
  const setEvents = useTripStore(s => s.setEvents)

  return useQuery({
    queryKey: tripKeys.events(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/events?tripId=${tripId}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      const data = await res.json()
      setEvents(data.events)
      return data.events
    },
    staleTime: 30_000,
  })
}

// ─── ADD EVENT ────────────────────────────────────────────────────────────────
export function useAddEvent(tripId: string) {
  const qc = useQueryClient()
  const addOptimistic    = useTripStore(s => s.addEventOptimistic)
  const deleteOptimistic = useTripStore(s => s.deleteEventOptimistic)

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, ...input }),
      })
      if (!res.ok) throw new Error('Failed to add event')
      return res.json()
    },
    onMutate: async (input) => {
      // Optimistic insert with a temp ID
      const tempEvent = { id: `temp-${Date.now()}`, tripId, ...input } as any
      addOptimistic(tempEvent)
      return { tempId: tempEvent.id }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.tempId) deleteOptimistic(ctx.tempId)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tripKeys.events(tripId) })
    },
  })
}

// ─── UPDATE EVENT ─────────────────────────────────────────────────────────────
export function useUpdateEvent(tripId: string) {
  const qc = useQueryClient()
  const updateOptimistic = useTripStore(s => s.updateEventOptimistic)

  return useMutation({
    mutationFn: async ({ eventId, patch }: { eventId: string; patch: UpdateEventInput }) => {
      const res = await fetch(`/api/events?id=${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to update event')
      return res.json()
    },
    onMutate: ({ eventId, patch }) => updateOptimistic(eventId, patch as any),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tripKeys.events(tripId) })
    },
  })
}

// ─── DELETE EVENT ─────────────────────────────────────────────────────────────
export function useDeleteEvent(tripId: string) {
  const qc = useQueryClient()
  const deleteOptimistic = useTripStore(s => s.deleteEventOptimistic)

  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events?id=${eventId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete event')
    },
    onMutate: (eventId) => deleteOptimistic(eventId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tripKeys.events(tripId) })
    },
  })
}
