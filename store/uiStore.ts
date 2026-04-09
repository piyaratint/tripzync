'use client'

import { create } from 'zustand'

interface UIStore {
  // Modals
  isSetupOpen: boolean
  isEditEventOpen: boolean
  editingEventId: string | null

  // AI drawer
  isAIOpen: boolean

  openSetup:    () => void
  closeSetup:   () => void
  openEditEvent: (eventId: string) => void
  closeEditEvent: () => void
  toggleAI:     () => void
  closeAI:      () => void
}

export const useUIStore = create<UIStore>((set) => ({
  isSetupOpen:      false,
  isEditEventOpen:  false,
  editingEventId:   null,
  isAIOpen:         false,

  openSetup:    () => set({ isSetupOpen: true }),
  closeSetup:   () => set({ isSetupOpen: false }),

  openEditEvent: (eventId) => set({ isEditEventOpen: true, editingEventId: eventId }),
  closeEditEvent: ()       => set({ isEditEventOpen: false, editingEventId: null }),

  toggleAI: () => set(s => ({ isAIOpen: !s.isAIOpen })),
  closeAI:  () => set({ isAIOpen: false }),
}))
