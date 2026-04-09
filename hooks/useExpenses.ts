'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTripStore } from '@/store/tripStore'
import type { CreateExpenseInput } from '@/lib/validations'
import type { Expense } from '@/lib/db/schema'
import { tripKeys } from './useTrip'

// ─── FETCH EXPENSES ───────────────────────────────────────────────────────────
export function useExpenses(tripId: string) {
  const setExpenses = useTripStore(s => s.setExpenses)

  return useQuery({
    queryKey: tripKeys.expenses(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/expenses?tripId=${tripId}`)
      if (!res.ok) throw new Error('Failed to fetch expenses')
      const data = await res.json()
      setExpenses(data.expenses)
      return data.expenses
    },
    staleTime: 30_000,
  })
}

// ─── ADD EXPENSE ──────────────────────────────────────────────────────────────
export function useAddExpense(tripId: string) {
  const qc = useQueryClient()
  const addOptimistic    = useTripStore(s => s.addExpenseOptimistic)
  const deleteOptimistic = useTripStore(s => s.deleteExpenseOptimistic)

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, ...input }),
      })
      if (!res.ok) throw new Error('Failed to add expense')
      return res.json()
    },
    onMutate: (input) => {
      const tempExpense = {
        id: `temp-${Date.now()}`,
        tripId,
        receiptUrl: null,
        createdAt: new Date(),
        ...input,
        amount: String(input.amount),
        currency: input.currency ?? 'JPY',
      } as any
      addOptimistic(tempExpense)
      return { tempId: tempExpense.id }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.tempId) deleteOptimistic(ctx.tempId)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tripKeys.expenses(tripId) })
    },
  })
}

// ─── EDIT EXPENSE ────────────────────────────────────────────────────────────
export function useEditExpense(tripId: string) {
  const qc = useQueryClient()
  const updateOptimistic = useTripStore(s => s.updateExpenseOptimistic)

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<Expense, 'id' | 'tripId' | 'createdAt'>> }) => {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to update expense')
      return res.json()
    },
    onMutate: ({ id, patch }) => {
      const prev = useTripStore.getState().expenses.find(e => e.id === id)
      updateOptimistic(id, patch)
      return { prev }
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prev) updateOptimistic(id, ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tripKeys.expenses(tripId) })
    },
  })
}

// ─── DELETE EXPENSE ───────────────────────────────────────────────────────────
export function useDeleteExpense(tripId: string) {
  const qc = useQueryClient()
  const deleteOptimistic = useTripStore(s => s.deleteExpenseOptimistic)

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await fetch(`/api/expenses?id=${expenseId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete expense')
    },
    onMutate: (id) => deleteOptimistic(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tripKeys.expenses(tripId) })
    },
  })
}

// ─── EXPENSE TOTAL ────────────────────────────────────────────────────────────
export function useExpenseTotal(tripId: string) {
  const expenses = useTripStore(s => s.expenses)
  return expenses
    .filter(e => e.tripId === tripId)
    .reduce((sum, e) => sum + parseFloat(String(e.amount)), 0)
}
