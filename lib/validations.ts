import { z } from 'zod'

// ─── TRIP ─────────────────────────────────────────────────────────────────────
export const createTripSchema = z.object({
  title1:      z.string().min(1).max(30),
  title2:      z.string().min(1).max(30),
  subtitle:    z.string().max(120).optional(),
  destination: z.string().min(1).max(100),
  destCity:    z.string().max(100).optional(),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  currency:    z.string().length(3).optional(),
  bgColor:     z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export const updateTripSchema = createTripSchema.partial()

// ─── EVENT ────────────────────────────────────────────────────────────────────
export const createEventSchema = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:      z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  act:       z.string().min(1).max(200),
  sub:       z.string().max(300).optional().nullable(),
  fromPlace: z.string().max(100).optional().nullable(),
  toPlace:   z.string().max(100).optional().nullable(),
  isKey:     z.boolean().optional(),
  isSakura:  z.boolean().optional(),
  steps:     z.array(z.object({ label: z.string(), col: z.string() })).optional(),
  sortOrder: z.number().int().optional(),
})

export const updateEventSchema = createEventSchema.partial().omit({ date: true })

// ─── EXPENSE ──────────────────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = ['Dining', 'Transport', 'Entertainment', 'Accommodation', 'Others'] as const
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export const createExpenseSchema = z.object({
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(EXPENSE_CATEGORIES),
  item:     z.string().min(1).max(200),
  amount:   z.number().positive().finite(),
  currency: z.string().length(3).optional(),
})

// ─── FLIGHT ───────────────────────────────────────────────────────────────────
export const upsertFlightSchema = z.object({
  direction:  z.enum(['outbound', 'return']),
  flightNum:  z.string().max(10).optional().nullable(),
  airline:    z.string().max(60).optional().nullable(),
  airlineVal: z.string().max(60).optional().nullable(),
  depAirport: z.string().max(100).optional().nullable(),
  arrAirport: z.string().max(100).optional().nullable(),
  depTime:    z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  arrTime:    z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  flightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

export type CreateTripInput   = z.infer<typeof createTripSchema>
export type UpdateTripInput   = z.infer<typeof updateTripSchema>
export type CreateEventInput  = z.infer<typeof createEventSchema>
export type UpdateEventInput  = z.infer<typeof updateEventSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpsertFlightInput = z.infer<typeof upsertFlightSchema>
