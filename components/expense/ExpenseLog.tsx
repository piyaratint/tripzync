'use client'

import { useState } from 'react'
import { useAddExpense, useDeleteExpense, useEditExpense } from '@/hooks/useExpenses'
import type { Expense } from '@/lib/db/schema'
import { CategoryPills } from './CategoryPills'
import type { ExpenseCategory } from '@/lib/validations'
import { EXPENSE_CATEGORIES } from '@/lib/validations'
import { toISO } from '@/lib/utils'

interface Props {
  tripId: string
  currency: { symbol: string; code: string }
  expenses: Expense[]
  total: number
}

const CAT_COLORS: Record<string, string> = {
  Dining:        'rgba(255,140,50,.22)',
  Transport:     'rgba(30,160,220,.2)',
  Entertainment: 'rgba(168,85,247,.2)',
  Accommodation: 'rgba(244,167,192,.15)',
  Others:        'rgba(255,255,255,.08)',
}
const CAT_TEXT: Record<string, string> = {
  Dining:        '#ffaa55',
  Transport:     '#65d0f7',
  Entertainment: '#d09bf7',
  Accommodation: '#f4a7c0',
  Others:        'rgba(255,255,255,.7)',
}

interface EditState {
  id: string
  item: string
  amount: string
  category: ExpenseCategory
}

export function ExpenseLog({ tripId, currency, expenses, total }: Props) {
  const addExpense  = useAddExpense(tripId)
  const deleteExpense = useDeleteExpense(tripId)
  const editExpense = useEditExpense(tripId)

  const [item,     setItem]     = useState('')
  const [amount,   setAmount]   = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Dining')
  const [status,   setStatus]   = useState<'idle' | 'syncing' | 'ok' | 'err'>('idle')
  const [showList, setShowList] = useState(true)
  const [editing,  setEditing]  = useState<EditState | null>(null)

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

  function startEdit(e: Expense) {
    setEditing({
      id: e.id,
      item: e.item,
      amount: String(parseFloat(String(e.amount))),
      category: e.category as ExpenseCategory,
    })
  }

  async function handleSaveEdit() {
    if (!editing) return
    const parsed = parseFloat(editing.amount)
    if (!editing.item.trim() || !parsed || isNaN(parsed)) return

    await editExpense.mutateAsync({
      id: editing.id,
      patch: { item: editing.item.trim(), amount: String(parsed), category: editing.category },
    })
    setEditing(null)
  }

  function handleCancelEdit() {
    setEditing(null)
  }

  return (
    <div className="card card-expense">
      <div className="card-title">Expense Log</div>

      <div className="total-row">
        <span className="total-num">
          <span>{currency.symbol}</span>
          <span>{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="total-badge">{currency.code}</span>
          {expenses.length > 0 && (
            <button
              className="exp-toggle-btn"
              onClick={() => setShowList(v => !v)}
              title={showList ? 'Hide list' : 'Show list'}
            >
              {showList ? '▲' : '▼'} {expenses.length}
            </button>
          )}
        </div>
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

      {/* Expense list */}
      {showList && expenses.length > 0 && (
        <div className="exp-list">
          {expenses.map(e => (
            <div key={e.id} className="exp-list-row">
              {editing?.id === e.id ? (
                /* ── inline edit mode ── */
                <div className="exp-edit-form">
                  <input
                    className="exp-input"
                    type="text"
                    value={editing.item}
                    onChange={ev => setEditing(s => s && { ...s, item: ev.target.value })}
                    onKeyDown={ev => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }}
                    autoFocus
                  />
                  <input
                    className="exp-input narrow"
                    type="number"
                    value={editing.amount}
                    onChange={ev => setEditing(s => s && { ...s, amount: ev.target.value })}
                    onKeyDown={ev => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') handleCancelEdit() }}
                  />
                  <select
                    className="exp-input exp-cat-select"
                    value={editing.category}
                    onChange={ev => setEditing(s => s && { ...s, category: ev.target.value as ExpenseCategory })}
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="exp-edit-actions">
                    <button className="exp-act-btn save" onClick={handleSaveEdit} disabled={editExpense.isPending}>✓</button>
                    <button className="exp-act-btn cancel" onClick={handleCancelEdit}>✕</button>
                  </div>
                </div>
              ) : (
                /* ── display mode ── */
                <>
                  <div className="exp-list-info">
                    <span
                      className="exp-list-cat-badge"
                      style={{ background: CAT_COLORS[e.category] ?? 'rgba(255,255,255,.08)', color: CAT_TEXT[e.category] ?? '#fff' }}
                    >
                      {e.category}
                    </span>
                    <span className="exp-list-item">{e.item}</span>
                  </div>
                  <div className="exp-list-right">
                    <span className="exp-list-amount">
                      {currency.symbol}{parseFloat(String(e.amount)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <button className="exp-act-btn edit" onClick={() => startEdit(e)} title="Edit">✎</button>
                    <button
                      className="exp-act-btn delete"
                      onClick={() => deleteExpense.mutate(e.id)}
                      disabled={deleteExpense.isPending}
                      title="Delete"
                    >✕</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
