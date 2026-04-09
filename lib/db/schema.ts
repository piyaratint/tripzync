import {
  pgTable, uuid, text, timestamp,
  numeric, integer, boolean, jsonb, index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').notNull().unique(),
  name:      text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── TRIPS ───────────────────────────────────────────────────────────────────
export const trips = pgTable('trips', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title1:      text('title1').notNull().default('MY'),
  title2:      text('title2').notNull().default('TRIP'),
  subtitle:    text('subtitle').default(''),
  destination: text('destination').notNull(),  // display name
  destCity:    text('dest_city'),              // for weather geocoding
  startDate:   text('start_date').notNull(),   // 'YYYY-MM-DD'
  endDate:     text('end_date').notNull(),
  currency:    text('currency').default('JPY'),
  bgColor:     text('bg_color').default('#0d0d0d'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
}, t => ({
  userIdx: index('trips_user_idx').on(t.userId),
}))

// ─── HOTELS ──────────────────────────────────────────────────────────────────
export const hotels = pgTable('hotels', {
  id:       uuid('id').primaryKey().defaultRandom(),
  tripId:   uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  name:     text('name').notNull(),
  fromDate: text('from_date'),   // 'YYYY-MM-DD' — when this hotel starts
  mapsUrl:  text('maps_url'),
  sortOrder: integer('sort_order').default(0),
}, t => ({
  tripIdx: index('hotels_trip_idx').on(t.tripId),
}))

// ─── EVENTS (itinerary) ───────────────────────────────────────────────────────
export const events = pgTable('events', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tripId:    uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  date:      text('date').notNull(),        // 'YYYY-MM-DD'
  time:      text('time'),                  // 'HH:MM' or null
  act:       text('act').notNull(),         // activity name
  sub:       text('sub'),                   // note / transport
  fromPlace: text('from_place'),
  toPlace:   text('to_place'),
  isKey:     boolean('is_key').default(false),
  isSakura:  boolean('is_sakura').default(false),
  steps:     jsonb('steps').$type<Array<{ label: string; col: string }>>().default([]),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({
  tripDateIdx: index('events_trip_date_idx').on(t.tripId, t.date),
}))

// ─── EXPENSES ────────────────────────────────────────────────────────────────
export const expenses = pgTable('expenses', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tripId:    uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  date:      text('date').notNull(),        // 'YYYY-MM-DD'
  category:  text('category').notNull(),   // 'Dining' | 'Transport' | 'Entertainment' | 'Accommodation' | 'Others'
  item:      text('item').notNull(),
  amount:    numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency:  text('currency').default('JPY'),
  receiptUrl: text('receipt_url'),         // R2 object key (optional)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({
  tripIdx:  index('expenses_trip_idx').on(t.tripId),
  dateIdx:  index('expenses_date_idx').on(t.tripId, t.date),
}))

// ─── FLIGHTS ─────────────────────────────────────────────────────────────────
export const flights = pgTable('flights', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tripId:      uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  direction:   text('direction').notNull(),    // 'outbound' | 'return'
  flightNum:   text('flight_num'),
  airline:     text('airline'),
  airlineVal:  text('airline_val'),            // raw select value e.g. 'Thai Airways|TG'
  depAirport:  text('dep_airport'),
  arrAirport:  text('arr_airport'),
  depTime:     text('dep_time'),               // 'HH:MM'
  arrTime:     text('arr_time'),
  flightDate:  text('flight_date'),            // 'YYYY-MM-DD'
}, t => ({
  tripIdx: index('flights_trip_idx').on(t.tripId),
}))

// ─── RELATIONS ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  trips: many(trips),
}))

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user:     one(users, { fields: [trips.userId], references: [users.id] }),
  hotels:   many(hotels),
  events:   many(events),
  expenses: many(expenses),
  flights:  many(flights),
}))

export const hotelsRelations = relations(hotels, ({ one }) => ({
  trip: one(trips, { fields: [hotels.tripId], references: [trips.id] }),
}))

export const eventsRelations = relations(events, ({ one }) => ({
  trip: one(trips, { fields: [events.tripId], references: [trips.id] }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  trip: one(trips, { fields: [expenses.tripId], references: [trips.id] }),
}))

export const flightsRelations = relations(flights, ({ one }) => ({
  trip: one(trips, { fields: [flights.tripId], references: [trips.id] }),
}))

// ─── TYPE EXPORTS ─────────────────────────────────────────────────────────────
export type User     = typeof users.$inferSelect
export type Trip     = typeof trips.$inferSelect
export type Hotel    = typeof hotels.$inferSelect
export type Event    = typeof events.$inferSelect
export type Expense  = typeof expenses.$inferSelect
export type Flight   = typeof flights.$inferSelect

export type NewTrip    = typeof trips.$inferInsert
export type NewHotel   = typeof hotels.$inferInsert
export type NewEvent   = typeof events.$inferInsert
export type NewExpense = typeof expenses.$inferInsert
export type NewFlight  = typeof flights.$inferInsert

// ─── AUTH TABLES (required by Auth.js) ───────────────────────────────────────
export const accounts = pgTable('account', {
  userId:            text('userId').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  type:              text('type').notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
})

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId:       text('userId').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  expires:      timestamp('expires').notNull(),
})

export const authUsers = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name'),
  email:         text('email').unique(),
  emailVerified: timestamp('emailVerified'),
  image:         text('image'),
})

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires').notNull(),
})