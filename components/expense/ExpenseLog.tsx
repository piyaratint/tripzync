'use client'

import { useState } from 'react'
import { useAddExpense } from '@/hooks/useExpenses'
import type { Expense } from '@/lib/db/schema'
import { CategoryPills } from './CategoryPills'
import type { ExpenseCategory } from '@/lib/validations'
import { toISO } from '@/lib/utils'

interface Props {
  tripId: string
  currency: { symbol: string; code: string }
  expenses: Expense[]
  total: number
}

export function ExpenseLog({ tripId, currency, expenses, total }: Props) {
  const addExpense = useAddExpense(tripId)
  const [item,     setItem]     = useState('')
  const [amount,   setAmount]   = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Dining')
  const [status,   setStatus]   = useState<'idle' | 'syncing' | 'ok' | 'err'>('idle')

  const statusMsg = {
    idle: 'Ready',
    syncing: 'Syncing...',
    ok: `${expenses.length} item${expenses.length !== 1 ? 's' : ''} · live`,
    err: 'Sync error',
  }[status]

  async function handleAdd() {
    const parsed = parseFloat(amount)
    if (!item.trim() || !parsed || isNaN(parsed)) return

    setStatus('syncing')
    try {
      await addExpense.mutateAsync({
        date: toISO(new Date()),
        category,
        item: item.trim(),
        amount: parsed,
        currency: currency.code,
      })
      setItem(''); setAmount('')
      setStatus('ok')
    } catch {
      setStatus('err')
    }
  }

  return (
    <div className="card card-expense">
      <div className="card-title">Expense Log</div>

      <div className="total-row">
        <span className="total-num">
          <span>{currency.symbol}</span>
          <span>{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </span>
        <span className="total-badge">{currency.code}</span>
      </div>

      <CategoryPills value={category} onChange={setCategory} />

      <div className="exp-form">
        <input
          className="exp-input"
          type="text"
          value={item}
          onChange={e => setItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Description"
        />
        <input
          className="exp-input narrow"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="0"
        />
        <button className="btn-add" onClick={handleAdd} disabled={addExpense.isPending}>
          {addExpense.isPending ? '...' : 'ADD'}
        </button>
      </div>

      <div className="sheet-sync-row">
        <div className={`sheet-sync-dot${status !== 'idle' ? ' ' + status : ''}`} />
        <span className="sheet-sync-label">{statusMsg}</span>
      </div>
    </div>
  )
}
