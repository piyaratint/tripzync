'use client'

import { useState, useRef, useEffect } from 'react'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
  value: string
  onChange: (date: string) => void
  min?: string
  max?: string
  placeholder?: string
  style?: React.CSSProperties
  className?: string
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function DatePicker({ value, onChange, min, max, placeholder = 'Select date', style, className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = value ? parseDate(value) : null
  const [viewDate, setViewDate] = useState(() => selected ?? new Date())

  useEffect(() => {
    if (value) setViewDate(parseDate(value))
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const minDate = min ? parseDate(min) : null
  const maxDate = max ? parseDate(max) : null

  function isDisabled(d: Date) {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  function selectDay(d: Date) {
    if (isDisabled(d)) return
    onChange(toISO(d))
    setOpen(false)
  }

  function formatDisplay(v: string) {
    if (!v) return ''
    const d = parseDate(v)
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }

  const cells: { date: Date; current: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), current: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month, i), current: true })
  }
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ date: new Date(year, month + 1, i), current: false })
  }

  const today = toISO(new Date())

  return (
    <div className={`dp-wrap ${className ?? ''}`} ref={ref} style={style}>
      <button
        type="button"
        className="dp-trigger"
        onClick={() => setOpen(v => !v)}
      >
        <span className={value ? 'dp-value' : 'dp-placeholder'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <span className="dp-icon">📅</span>
      </button>

      {open && (
        <div className="dp-dropdown">
          <div className="dp-header">
            <button type="button" className="dp-nav" onClick={prevMonth}>‹</button>
            <span className="dp-month-label">{MONTHS[month]} {year}</span>
            <button type="button" className="dp-nav" onClick={nextMonth}>›</button>
          </div>

          <div className="dp-day-names">
            {DAYS.map(d => <span key={d} className="dp-day-name">{d}</span>)}
          </div>

          <div className="dp-grid">
            {cells.map(({ date, current }, i) => {
              const iso = toISO(date)
              const disabled = isDisabled(date)
              const isSelected = value === iso
              const isToday = iso === today
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    'dp-cell',
                    !current && 'dp-other',
                    disabled && 'dp-disabled',
                    isSelected && 'dp-selected',
                    isToday && !isSelected && 'dp-today',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectDay(date)}
                  disabled={disabled}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="dp-footer">
            <button
              type="button"
              className="dp-today-btn"
              onClick={() => { const t = new Date(); setViewDate(t); selectDay(t) }}
              disabled={minDate ? new Date() < minDate : false}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
