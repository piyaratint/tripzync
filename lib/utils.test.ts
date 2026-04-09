import { describe, it, expect } from 'vitest'
import { toISO, fmtDate, daysBetween, getDayTitle, detectCurrency, isDarkColor } from '@/lib/utils'

describe('toISO', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toISO(new Date(2026, 2, 26))).toBe('2026-03-26')
  })
  it('zero-pads single-digit month and day', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('daysBetween', () => {
  it('returns 1 for same day', () => {
    expect(daysBetween('2026-03-26', '2026-03-26')).toBe(1)
  })
  it('counts both endpoints inclusive', () => {
    expect(daysBetween('2026-03-26', '2026-03-31')).toBe(6)
  })
})

describe('getDayTitle', () => {
  it('labels first day as Arrival Day', () => {
    expect(getDayTitle(0, 6)).toBe('Arrival Day')
  })
  it('labels last day as Departure Day', () => {
    expect(getDayTitle(5, 6)).toBe('Departure Day')
  })
  it('labels middle days numerically', () => {
    expect(getDayTitle(2, 6)).toBe('Day 3')
  })
})

describe('detectCurrency', () => {
  it('detects JPY for nagoya', () => {
    expect(detectCurrency('nagoya')).toEqual({ symbol: '¥', code: 'JPY' })
  })
  it('detects THB for Bangkok', () => {
    expect(detectCurrency('Bangkok')).toEqual({ symbol: '฿', code: 'THB' })
  })
  it('defaults to JPY for unknown city', () => {
    expect(detectCurrency('atlantis')).toEqual({ symbol: '¥', code: 'JPY' })
  })
})

describe('isDarkColor', () => {
  it('treats black as dark', () => {
    expect(isDarkColor('#0d0d0d')).toBe(true)
  })
  it('treats white as light', () => {
    expect(isDarkColor('#f5f4f2')).toBe(false)
  })
})
