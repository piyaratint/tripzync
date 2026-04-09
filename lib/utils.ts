import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

export function fmtShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}`
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
}

export function getDayTitle(index: number, total: number): string {
  if (index === 0) return 'Arrival Day'
  if (index === total - 1) return 'Departure Day'
  return `Day ${index + 1}`
}

// ─── CURRENCY DETECTION (ported from HTML) ────────────────────────────────────
const COUNTRY_CURRENCY: Record<string, { symbol: string; code: string }> = {
  JP: { symbol: '¥',  code: 'JPY' }, TH: { symbol: '฿',  code: 'THB' },
  US: { symbol: '$',  code: 'USD' }, GB: { symbol: '£',  code: 'GBP' },
  EU: { symbol: '€',  code: 'EUR' }, KR: { symbol: '₩',  code: 'KRW' },
  SG: { symbol: 'S$', code: 'SGD' }, MY: { symbol: 'RM', code: 'MYR' },
  ID: { symbol: 'Rp', code: 'IDR' }, CN: { symbol: '¥',  code: 'CNY' },
  AU: { symbol: 'A$', code: 'AUD' }, IN: { symbol: '₹',  code: 'INR' },
  AE: { symbol: 'AED',code: 'AED' }, CH: { symbol: 'CHF',code: 'CHF' },
}

const CITY_COUNTRY: Record<string, string> = {
  nagoya:'JP', tokyo:'JP', osaka:'JP', kyoto:'JP', fukuoka:'JP', sapporo:'JP',
  bangkok:'TH', 'chiang mai':'TH', phuket:'TH', pattaya:'TH',
  'new york':'US', 'los angeles':'US', chicago:'US', miami:'US',
  london:'GB', manchester:'GB', edinburgh:'GB',
  paris:'FR', berlin:'DE', rome:'IT', madrid:'ES',
  seoul:'KR', busan:'KR', singapore:'SG',
  'kuala lumpur':'MY', penang:'MY', bali:'ID', jakarta:'ID',
  beijing:'CN', shanghai:'CN', 'hong kong':'CN',
  sydney:'AU', melbourne:'AU', dubai:'AE', zurich:'CH',
  mumbai:'IN', delhi:'IN',
}

export function detectCurrency(city: string) {
  const key = city.toLowerCase().trim()
  const country = CITY_COUNTRY[key]
  return (country && COUNTRY_CURRENCY[country]) ?? { symbol: '¥', code: 'JPY' }
}

// ─── COLOUR HELPERS ───────────────────────────────────────────────────────────
export function hexToRgb(hex: string) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const n = parseInt(hex, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const s = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  return 0.2126 * s(r) + 0.7152 * s(g) + 0.0722 * s(b)
}

export function isDarkColor(hex: string): boolean {
  return luminance(hexToRgb(hex)) < 0.3
}
