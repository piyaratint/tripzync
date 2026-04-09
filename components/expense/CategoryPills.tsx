'use client'

import type { ExpenseCategory } from '@/lib/validations'

const CATS: { label: string; cat: ExpenseCategory }[] = [
  { label: '🍜 Dining',     cat: 'Dining' },
  { label: '🚌 Transport',  cat: 'Transport' },
  { label: '🎟 Fun',        cat: 'Entertainment' },
  { label: '🏨 Hotel',      cat: 'Accommodation' },
  { label: '· Others',      cat: 'Others' },
]

interface Props {
  value: ExpenseCategory
  onChange: (cat: ExpenseCategory) => void
}

export function CategoryPills({ value, onChange }: Props) {
  return (
    <div className="exp-cat-row">
      {CATS.map(({ label, cat }) => (
        <button
          key={cat}
          className={`exp-cat-btn${value === cat ? ' active' : ''}`}
          data-cat={cat}
          onClick={() => onChange(cat)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
