'use client'

import { useState } from 'react'
import { useAddExpense, useDeleteExpense, useEditExpense } from '@/hooks/useExpenses'
import type { Expense } from '@/lib/db/schema'
import { CategoryPills } from './CategoryPills'
import type { ExpenseCategory } from '@/lib/validations'
import { EXPENSE_CATEGORIES } from '@/lib/validations'
import { toISO } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

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
  Others:        'rgba(255,255,255,.6)',
}
const CAT_SOLID: Record<string, string> = {
  Dining:        '#ffaa55',
  Transport:     '#65d0f7',
  Entertainment: '#d09bf7',
  Accommodation: '#f4a7c0',
  Others:        '#888',
}

interface EditState {
  id: string
  item: string
  amount: string
  category: ExpenseCategory
}

// ─── PIE CHART ────────────────────────────────────────────────────────────────
function PieChart({ expenses, total, currency }: { expenses: Expense[]; total: number; currency: { symbol: string } }) {
  if (expenses.length === 0 || total === 0) return null

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + parseFloat(String(e.amount))
    return acc
  }, {})
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  const CX = 55, CY = 55, R = 50, IR = 30

  // Pre-compute arc slices
  let angle = -Math.PI / 2
  const slices = entries.map(([cat, amt]) => {
    const sweep = (amt / total) * Math.PI * 2
    const start = angle
    angle += sweep
    return { cat, amt, start, end: angle, sweep }
  })

  const paths = slices.map(({ cat, start, end, sweep }) => {
    if (sweep >= Math.PI * 2 - 0.001) {
      // Full circle (single category) — draw as two circles (donut)
      return (
        <g key={cat}>
          <circle cx={CX} cy={CY} r={R} fill={CAT_SOLID[cat] ?? '#888'} />
          <circle cx={CX} cy={CY} r={IR} fill="#111" />
        </g>
      )
    }
    const x1 = CX + R * Math.cos(start), y1 = CY + R * Math.sin(start)
    const x2 = CX + R * Math.cos(end),   y2 = CY + R * Math.sin(end)
    const ix1 = CX + IR * Math.cos(start), iy1 = CY + IR * Math.sin(start)
    const ix2 = CX + IR * Math.cos(end),   iy2 = CY + IR * Math.sin(end)
    const large = sweep > Math.PI ? 1 : 0
    const d = `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${IR} ${IR} 0 ${large} 0 ${ix1} ${iy1}Z`
    return <path key={cat} d={d} fill={CAT_SOLID[cat] ?? '#888'} />
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0 4px' }}>
      <svg width={110} height={110} viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
        {paths}
        {/* Background ring gap */}
        <circle cx={CX} cy={CY} r={IR - 1} fill="#111" />
        {/* Center label */}
        <text x={CX} y={CY - 3} textAnchor="middle" fill="#fff" fontSize={10} fontFamily="Barlow Condensed, sans-serif" fontWeight="700" fontStyle="italic">
          {currency.symbol}{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fill="rgba(255,255,255,.35)" fontSize={6} fontFamily="Barlow Condensed, sans-serif" letterSpacing="1.5">
          TOTAL
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {entries.map(([cat, amt]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: CAT_SOLID[cat] ?? '#888', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cat}
            </span>
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, fontWeight: 700, color: CAT_TEXT[cat] ?? '#fff' }}>
              {Math.round((amt / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
function exportCSV(expenses: Expense[], tripId: string, currencyCode: string) {
  const header = 'Date,Category,Item,Amount,Currency'
  const rows = expenses.map(e =>
    [
      e.date,
      e.category,
      `"${e.item.replace(/"/g, '""')}"`,
      parseFloat(String(e.amount)).toFixed(2),
      currencyCode,
    ].join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${tripId}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function ExpenseLog({ tripId, currency, expenses, total }: Props) {
  const addExpense    = useAddExpense(tripId)
  const deleteExpense = useDeleteExpense(tripId)
  const editExpense   = useEditExpense(tripId)
  const { toast }     = useToast()

  const [item,       setItem]       = useState('')
  const [amount,     setAmount]     = useState('')
  const [category,   setCategory]   = useState<ExpenseCategory>('Dining')
  const [status,     setStatus]     = useState<'idle' | 'syncing' | 'ok' | 'err'>('idle')
  const [showList,   setShowList]   = useState(true)
  const [editing,    setEditing]    = useState<EditState | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const statusMsg = {
    idle:    'Ready',
    syncing: 'Syncing...',
    ok:      `${expenses.length} item${expenses.length !== 1 ? 's' : ''} · live`,
    err:     'Sync error',
  }[status]

  async function handleAdd() {
    const parsed = parseFloat(amount)
    if (!item.trim() || !parsed || isNaN(parsed) || parsed <= 0) {
      toast('Please enter a valid item and amount', 'error')
      return
    }
    setStatus('syncing')
    try {
      await addExpense.mutateAsync({
        date: toISO(new Date()), category,
        item: item.trim(), amount: parsed, currency: currency.code,
      })
      setItem(''); setAmount('')
      setStatus('ok')
      toast('Expense added')
    } catch {
      setStatus('err')
      toast('Failed to add expense', 'error')
    }
  }

  function startEdit(e: Expense) {
    setEditing({ id: e.id, item: e.item, amount: String(parseFloat(String(e.amount))), category: e.category as ExpenseCategory })
  }

  async function handleSaveEdit() {
    if (!editing) return
    const parsed = parseFloat(editing.amount)
    if (!editing.item.trim() || !parsed || isNaN(parsed) || parsed <= 0) {
      toast('Please enter a valid item and amount', 'error')
      return
    }
    try {
      await editExpense.mutateAsync({ id: editing.id, patch: { item: editing.item.trim(), amount: String(parsed), category: editing.category } })
      setEditing(null)
      toast('Expense updated')
    } catch {
      toast('Failed to update expense', 'error')
    }
  }

  return (
    <div className="card card-expense">
      {/* Header row: title + export button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Expense Log</div>
        {expenses.length > 0 && (
          <button
            onClick={() => exportCSV(expenses, tripId, currency.code)}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '3px 9px', color: 'rgba(255,255,255,.4)', fontFamily: "'Barlow Condensed'", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s' }}
            title="Export as CSV"
          >
            ↓ Export CSV
          </button>
        )}
      </div>

      <div className="total-row">
        <span className="total-num">
          <span>{currency.symbol}</span>
          <span>{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="total-badge">{currency.code}</span>
          <button className="exp-toggle-btn" onClick={() => setShowList(v => !v)} title={showList ? 'Hide list' : 'Show list'}>
            {showList ? '▲ Hide' : '▼ Show'}
          </button>
        </div>
      </div>

      {/* Pie chart — always visible when there are expenses */}
      {expenses.length > 0 && (
        <>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', marginTop: 4 }} />
          <PieChart expenses={expenses} total={total} currency={currency} />
          <div style={{ borderBottom: '1px solid rgba(255,255,255,.05)', marginBottom: 4 }} />
        </>
      )}

      <CategoryPills value={category} onChange={setCategory} />

      <div className="exp-form">
        <input className="exp-input" type="text" value={item} onChange={e => setItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Description" />
        <input className="exp-input narrow" type="number" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="0" />
        <button className="btn-add" onClick={handleAdd} disabled={addExpense.isPending}>{addExpense.isPending ? '...' : 'ADD'}</button>
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
                <div className="exp-edit-form">
                  <input className="exp-input" type="text" value={editing.item} onChange={ev => setEditing(s => s && { ...s, item: ev.target.value })} onKeyDown={ev => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') setEditing(null) }} autoFocus />
                  <input className="exp-input narrow" type="number" value={editing.amount} onChange={ev => setEditing(s => s && { ...s, amount: ev.target.value })} onKeyDown={ev => { if (ev.key === 'Enter') handleSaveEdit(); if (ev.key === 'Escape') setEditing(null) }} />
                  <select className="exp-input exp-cat-select" value={editing.category} onChange={ev => setEditing(s => s && { ...s, category: ev.target.value as ExpenseCategory })}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="exp-edit-actions">
                    <button className="exp-act-btn save" onClick={handleSaveEdit} disabled={editExpense.isPending}>✓</button>
                    <button className="exp-act-btn cancel" onClick={() => setEditing(null)}>✕</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="exp-list-info">
                    <span className="exp-list-cat-badge" style={{ background: CAT_COLORS[e.category] ?? 'rgba(255,255,255,.08)', color: CAT_TEXT[e.category] ?? '#fff' }}>
                      {e.category}
                    </span>
                    <span className="exp-list-item">{e.item}</span>
                  </div>
                  <div className="exp-list-right">
                    <span className="exp-list-amount">
                      {currency.symbol}{parseFloat(String(e.amount)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    {confirmDel === e.id ? (
                      <>
                        <button className="exp-act-btn save" title="Confirm" onClick={() => { deleteExpense.mutate(e.id); setConfirmDel(null); toast('Expense deleted') }}>✓</button>
                        <button className="exp-act-btn cancel" title="Cancel" onClick={() => setConfirmDel(null)}>✕</button>
                      </>
                    ) : (
                      <>
                        <button className="exp-act-btn edit" onClick={() => startEdit(e)} title="Edit">✎</button>
                        <button className="exp-act-btn delete" onClick={() => setConfirmDel(e.id)} title="Delete">✕</button>
                      </>
                    )}
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
