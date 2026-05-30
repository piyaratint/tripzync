'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trip, Hotel, Event, Expense, Flight } from '@/lib/db/schema'

// ─── LOCAL UI STATE (fast, optimistic) ───────────────────────────────────────
// This mirrors what was in tripState / localStorage.
// On load it hydrates from the server; mutations are optimistic.

export interface PlaceInfo {
  name: string
  type: string
  image: string
  rank: number
}

interface TripStore {
  // Active trip
  trip: Trip | null
  hotels: Hotel[]
  events: Event[]     // flat list, keyed by date on render
  expenses: Expense[]
  flights: Flight[]

  // Places cache (keyed by lowercase place name)
  places: Record<string, PlaceInfo>
  placesLoaded: boolean

  // UI state
  activeDayIndex: number
  isSidebarOpen: boolean

  // Actions
  setTrip: (trip: Trip) => void
  setHotels: (hotels: Hotel[]) => void
  setEvents: (events: Event[]) => void
  setExpenses: (expenses: Expense[]) => void
  setFlights: (flights: Flight[]) => void
  setPlaces: (places: PlaceInfo[]) => void
  resetPlaces: () => void
  setActiveDayIndex: (i: number) => void

  // Optimistic event mutations
  addEventOptimistic: (event: Event) => void
  updateEventOptimistic: (id: string, patch: Partial<Event>) => void
  deleteEventOptimistic: (id: string) => void

  // Optimistic expense mutations
  addExpenseOptimistic: (expense: Expense) => void
  updateExpenseOptimistic: (id: string, patch: Partial<Expense>) => void
  deleteExpenseOptimistic: (id: string) => void

  expenseTotal: () => number
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trip: null,
      hotels: [],
      events: [],
      expenses: [],
      flights: [],
      places: {},
      placesLoaded: false,
      activeDayIndex: 0,
      isSidebarOpen: false,

      setTrip:     (trip)     => set({ trip }),
      setHotels:   (hotels)   => set({ hotels }),
      setEvents:   (events)   => set({ events }),
      setExpenses: (expenses) => set({ expenses }),
      setFlights:  (flights)  => set({ flights }),
      setPlaces:   (list)     => set({
        placesLoaded: true,
        places: Object.fromEntries(list.map(p => [p.name.toLowerCase(), p])),
      }),
      resetPlaces: ()         => set({ places: {}, placesLoaded: false }),
      setActiveDayIndex: (i)  => set({ activeDayIndex: i }),

      addEventOptimistic: (event) =>
        set(s => ({ events: [...s.events, event] })),

      updateEventOptimistic: (id, patch) =>
        set(s => ({
          events: s.events.map(e => e.id === id ? { ...e, ...patch } : e),
        })),

      deleteEventOptimistic: (id) =>
        set(s => ({ events: s.events.filter(e => e.id !== id) })),

      addExpenseOptimistic: (expense) =>
        set(s => ({ expenses: [...s.expenses, expense] })),

      updateExpenseOptimistic: (id, patch) =>
        set(s => ({ expenses: s.expenses.map(e => e.id === id ? { ...e, ...patch } : e) })),

      deleteExpenseOptimistic: (id) =>
        set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),

      expenseTotal: () =>
        get().expenses.reduce((sum, e) => sum + parseFloat(String(e.amount)), 0),
    }),
    {
      name: 'tripzync-trip-store',
      // Only persist the active trip ID + day index — full data refetched from server
      partialize: (s) => ({
        activeDayIndex: s.activeDayIndex,
      }),
    },
  ),
)
