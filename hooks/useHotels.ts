'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTripStore } from '@/store/tripStore'
import { tripKeys } from './useTrip'

// ─── ADD HOTEL ────────────────────────────────────────────────────────────────
export function useAddHotel(tripId: string) {
  const qc = useQueryClient()
  const setHotels = useTripStore(s => s.setHotels)
  const hotels = useTripStore(s => s.hotels)

  return useMutation({
    mutationFn: async (input: { name: string; fromDate: string; mapsUrl?: string }) => {
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, ...input }),
      })
      if (!res.ok) throw new Error('Failed to add hotel')
      return res.json()
    },
    onSuccess: (data) => {
      setHotels([...hotels, data.hotel])
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}

// ─── DELETE HOTEL ─────────────────────────────────────────────────────────────
export function useDeleteHotel(tripId: string) {
  const qc = useQueryClient()
  const hotels = useTripStore(s => s.hotels)
  const setHotels = useTripStore(s => s.setHotels)

  return useMutation({
    mutationFn: async (hotelId: string) => {
      const res = await fetch(`/api/hotels?id=${hotelId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete hotel')
    },
    onMutate: (id) => {
      setHotels(hotels.filter(h => h.id !== id))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}
