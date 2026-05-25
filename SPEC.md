# TripZync® — Product Requirements & Implementation Status

> Last updated: 2026-05-25  
> Production URL: https://tripzync-fresh.vercel.app (Vercel — being migrated)  
> Target deploy: Jelastic cloud server (Node 26, PM2, standalone build)  
> Repository: private GitHub repo (macOS Keychain credentials)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented & deployed to Vercel |
| 🚧 | Partial / in progress |
| ❌ | Not yet started |
| 🔒 | Requires environment variable on server |

---

## 1 · Onboarding Flow (`app/page.tsx`)

The landing / onboarding screen walks a new visitor through 5 steps before creating their trip. All steps run client-side (no auth required until the final save).

### Step 01 — Destination (City Search + World Map)

**Status: ✅ Complete**

- City search input with keyboard-driven autocomplete dropdown
- Dropdown shows up to 8 matches, filters by city name **or** country name (case-insensitive)
- ~200 cities across all continents supported (`COUNTRY_CITIES` lookup)
- Selected cities shown as removable pill tags below the search bar
- Interactive SVG world map rendered via `react-simple-maps` v3 (`WorldMap` component)
  - Countries highlighted in gold when city is selected
  - Auto-zooms & re-centers on the destination country when ≥ 1 city selected
  - City pins + labels rendered when ≥ 2 cities from the same country are added and zoom > 3
  - Scroll-wheel zoom, drag-to-pan (ZoomableGroup)
  - `+` / `−` / `⊙` overlay buttons for programmatic zoom / reset
  - Map state (`center`, `zoom`) synced back via `onMoveEnd` callback
- `WorldMap` is `dynamic()` imported with `ssr: false` (SVG needs DOM)
- TypeScript declaration file at `types/react-simple-maps.d.ts`
- "Next" button disabled until ≥ 1 city selected

**Key constants in `WorldMap.tsx`:**
```
BASE_SCALE = 140          // world-view projection scale
COUNTRY_ZOOM             // per-country { center, scale } lookup (90+ countries)
CITY_COORDS              // ~200 cities [lng, lat]
ISO_NUM                  // ISO A3 → TopoJSON numeric code mapping
```

---

### Step 02 — Travel Mode

**Status: ✅ Complete**

- Card selection: **Solo**, **Couple**, **Group**
- Choice persisted in component state, passed to trip metadata on save

---

### Step 03 — Places (Attractions)

**Status: ✅ Complete**

- Top 10 attractions per selected city fetched from **Google Places API** (via `/api/places`)
- Results cached in `popular_places` DB table (7-day TTL, on-demand refresh)
- Photos served via `/api/hotel-photo` (Google Places photo proxy)
- User selects/deselects individual places; selection persisted per-city in `placesByCity`
- Card grid layout matching design system

---

### Step 04 — Hotels & Loyalty

**Status: ✅ Complete**

- Hotel brand multi-select (IHG, Marriott, Hilton, Hyatt, Accor, Wyndham, BW, Radisson, NH, Okura, Minor, SLH, Shangri-La, Anantara, Rosewood, Aman, etc.)
- "No membership / budget traveller" option (mutually exclusive with brand selection)
- `noMembership` flag: true when `hotelBrands.length === 0` after filtering 'none' entries
- Budget hotels **only** shown if `noMembership === true`
- Loyalty hotels shown for all brand selections

---

### Step 05 — Duration (Dates)

**Status: ✅ Complete**

- Date range picker (start date → end date)
- Validation: end date must be ≥ start date
- On submit: trip saved to DB via `/api/trips` POST + redirect to `/home?tripId=...`

---

## 2 · Home / Trip Dashboard (`app/home/page.tsx`)

The per-trip homepage shown immediately after onboarding and on return visits.

### Hotel Recommendations

**Status: ✅ Complete**

- Calls `/api/hotel-search` with city + hotel brands
- Uses **Google Places API** (`GOOGLE_PLACES_API_KEY`) — searches "hotels near {city}" filtered by brand keywords 🔒
- Returns up to 10 real hotel results with name, rating, address, Google Maps URL
- Hotel photos fetched separately via `/api/hotel-photo` and cached in `hotel_photos` DB table (30-day TTL)
- **Loyalty mode**: shows hotels matching selected brands, hides budget section
- **Budget mode** (`noMembership === true`): shows budget hotels only, hides loyalty section
- Fix applied: `setGoogleBudgetHotels(noMembership ? budget : [])` prevents budget leak

### Google Maps Integration

**Status: ✅ Complete**

- Place coordinates fetched from `/api/place-coords` (Google Geocoding → cached in `place_coords` table)
- Interactive Google Maps embed with pins for selected places 🔒
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` required client-side

### Places Display

**Status: ✅ Complete**

- Selected attractions shown as cards with real photos (Wikipedia CC / Google Places)
- Grouped by city

### AI Travel Assistant

**Status: ✅ Complete**

- Chat drawer powered by **Anthropic API** (`ANTHROPIC_API_KEY`) via `/api/chat` route 🔒
- Streaming responses via Vercel AI SDK

---

## 3 · Authenticated App (route group `(app)/`)

All routes under `(app)/` are protected — redirect to `/login` if unauthenticated.

### Dashboard (`/dashboard`)

**Status: ✅ Complete**

- Lists all trips for the authenticated user (soft-deleted trips excluded)
- Trip cards with destination, date range, cover colour
- "New Trip" CTA links back to onboarding (`/`)

### Trip Itinerary (`/trips/[tripId]`)

**Status: ✅ Complete**

- Day-by-day timeline (`DayPanel` + `EventItem`)
- Add / edit / delete events (`AddEventBar`, `EditEventModal`)
- Hotel banner per day
- Key event flagging (`isKey`) and seasonal flags (`isSakura`)
- Sort order drag handles
- Flight info panel (outbound + return flights)
- Optimistic UI via Zustand + TanStack Query

### Expense Ledger (`/trips/[tripId]/expenses`)

**Status: ✅ Complete**

- Log expenses by category: Dining, Transport, Entertainment, Accommodation, Others
- Category pill selector (`CategoryPills`)
- Per-trip totals with currency selector (default JPY)
- Receipt URL field (Cloudflare R2 placeholder — not yet wired)

### Logbook (`/trips/[tripId]/logbook`)

**Status: ✅ Complete**

- Trip summary / post-trip reflection view
- Read-only consolidated view of itinerary

### Settings (`/settings`)

**Status: 🚧 Partial**

- Page exists; user profile display
- Edit profile / preferences not yet implemented

---

## 4 · Authentication (`(auth)/`)

**Status: ✅ Complete**

- **Auth.js v5** (NextAuth) with Google OAuth provider
- Login page at `/login` with Google sign-in button
- Server action (`app/actions/auth.ts`) handles sign-in
- Cookie-clear route at `/api/auth/clear` for stale session recovery
- Error page at `/auth/error`
- Auth guard on `(app)/layout.tsx` — server-side session check

**Required OAuth redirect URIs:**
```
http://localhost:3000/api/auth/callback/google   (dev)
https://tripzync-fresh.vercel.app/api/auth/callback/google   (prod)
```

---

## 5 · Shared Trips / Invite

**Status: ✅ Complete**

- Generate invite link for a trip → stores token in `trip_invites` table
- `/invite/[token]` page — validates token, adds authenticated user as `editor` member
- `/api/trips/[tripId]/invite` — POST creates token, GET validates
- `/api/trips/[tripId]/members` — GET lists members

---

## 6 · Legal / Compliance Pages

**Status: ✅ Complete**

- `/privacy` — Privacy Policy (PDPA-aligned)
- `/cookies` — Cookie Policy
- `SiteFooter` component included on all public pages
- `sitemap.ts` — auto-generated XML sitemap
- `robots.ts` — robots.txt with crawl rules

---

## 7 · Database Schema

**ORM:** Drizzle on **Neon** (PostgreSQL serverless)

| Table | Purpose |
|-------|---------|
| `user` | Auth.js users (Google OAuth) |
| `account` | OAuth provider accounts |
| `session` | Auth.js sessions |
| `verificationToken` | Email verification (unused — OAuth only) |
| `users` | App user profile (name, avatar) |
| `trips` | Trip records with soft-delete (90-day retention) |
| `hotels` | Hotels linked to a trip (user-managed) |
| `events` | Itinerary events per trip per day |
| `expenses` | Expense log entries per trip |
| `flights` | Outbound + return flight details |
| `trip_members` | Shared trip membership (role: owner/editor) |
| `trip_invites` | Invite tokens for sharing trips |
| `hotel_photos` | Google Places photo URL cache (30-day TTL) |
| `place_coords` | Geocoded lat/lng cache (permanent) |
| `popular_places` | Google Places top-10 attractions per city (7-day TTL) |

**Migrations:** Drizzle-managed, auto-applied on every deploy via `scripts/server-deploy.sh` (`npm run db:migrate` before `npm run build`).

---

## 8 · API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | Auth.js handler |
| `/api/auth/clear` | GET | Clear stale auth cookies |
| `/api/trips` | GET, POST | List / create trips |
| `/api/trips/[tripId]` | GET, PATCH, DELETE | Single trip CRUD |
| `/api/trips/[tripId]/flights` | GET, POST, PATCH, DELETE | Flight details |
| `/api/trips/[tripId]/invite` | GET, POST | Generate / validate invite |
| `/api/trips/[tripId]/members` | GET | List trip members |
| `/api/events` | GET, POST, PATCH, DELETE | Itinerary events |
| `/api/expenses` | GET, POST, DELETE | Expense entries |
| `/api/me/trip` | GET | Current user's active trip |
| `/api/hotels` | GET | Hotel DB lookup (legacy) |
| `/api/hotel-search` | GET | Google Places hotel search 🔒 |
| `/api/hotel-photo` | GET | Google Places photo proxy + cache 🔒 |
| `/api/places` | GET | Google Places attractions per city + cache 🔒 |
| `/api/place-coords` | GET | Geocode place name → lat/lng + cache 🔒 |
| `/api/chat` | POST | Anthropic AI travel assistant (streaming) 🔒 |

---

## 9 · Environment Variables

### Required — all environments

| Variable | Used by |
|----------|---------|
| `DATABASE_URL` | Neon DB connection (Drizzle) |
| `AUTH_SECRET` | Auth.js session signing |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `NEXTAUTH_URL` | Auth.js — canonical app URL |

### Required — production only

| Variable | Used by |
|----------|---------|
| `GOOGLE_PLACES_API_KEY` | Hotel search, place photos, geocoding (server-side) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps embed with pins (client-side) |
| `ANTHROPIC_API_KEY` | AI travel assistant chat |

### Add to Jelastic server

Set in the **Jelastic dashboard → your Node.js environment → Variables tab**, then redeploy.

Alternatively export them in the server shell before starting PM2:
```bash
export DATABASE_URL="..."
pm2 restart tripzync
```

### GitHub Actions secrets (for CI/CD deploy)

Add these in **GitHub → repo → Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `JELASTIC_HOST` | SSH hostname from Jelastic dashboard |
| `JELASTIC_USER` | SSH username (usually `jelastic`) |
| `JELASTIC_SSH_KEY` | Private key (paste full PEM content) |
| `JELASTIC_PORT` | SSH port (usually `3022` on Jelastic) |
| `JELASTIC_APP_DIR` | Absolute path to app on server (e.g. `/var/www/webroot/ROOT`) |

---

## 10 · Component Library

| Component | Location | Purpose |
|-----------|----------|---------|
| `TripZyncLogo` | `components/TripZyncLogo.tsx` | Brand mark, used globally |
| `SiteFooter` | `components/SiteFooter.tsx` | Footer with legal links |
| `WorldMap` | `components/WorldMap.tsx` | Interactive SVG world map |
| `TopNav` | `components/ui/TopNav.tsx` | Authenticated top navigation |
| `SignOutButton` | `components/ui/SignOutButton.tsx` | Auth.js sign-out |
| `QueryProvider` | `components/ui/QueryProvider.tsx` | TanStack Query client wrapper |
| `Toaster` | `components/ui/Toaster.tsx` | Toast notification system |
| `DayPanel` | `components/itinerary/DayPanel.tsx` | Day header + hotel banner + timeline |
| `EventItem` | `components/itinerary/EventItem.tsx` | Single event row (edit/delete) |
| `EditEventModal` | `components/itinerary/EditEventModal.tsx` | Edit event form modal |
| `AddEventBar` | `components/itinerary/AddEventBar.tsx` | Inline add-event form |
| `ExpenseLog` | `components/expense/ExpenseLog.tsx` | Expense card + add form |
| `CategoryPills` | `components/expense/CategoryPills.tsx` | Category selector buttons |
| `HotelModal` | `components/hotel/HotelModal.tsx` | Hotel detail modal |
| `EditTripModal` | `components/trip/EditTripModal.tsx` | Edit trip name / dates |

---

## 11 · Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js App Router | 16.2.3 (Turbopack dev) |
| Runtime | React | 19 |
| Database | PostgreSQL via Neon | serverless |
| ORM | Drizzle | latest |
| Auth | Auth.js (NextAuth) | v5 |
| State | Zustand + TanStack Query | v5 |
| Map | react-simple-maps + world-atlas | v3.0.0 |
| AI | Anthropic Claude (Vercel AI SDK) | — |
| Styling | Global CSS (`globals.css`) | — |
| Validation | Zod | — |
| Testing | Vitest | — |
| Deploy | Jelastic (Node 26, PM2, standalone) | Self-hosted cloud server |
| CI | GitHub Actions | lint → typecheck → test → build |

---

## 12 · Known Gaps / Backlog

| # | Feature | Priority |
|---|---------|----------|
| 1 | Settings page — edit profile & preferences | Medium |
| 2 | Expense receipt upload (Cloudflare R2 wiring) | Low |
| 3 | Trip colour / cover image customisation | Low |
| 4 | Push notifications for shared trip updates | Low |
| 5 | Offline / PWA support | Low |
| 6 | City search expansion beyond ~200 cities | Medium |
| 7 | Multiple destinations on different countries (multi-country zoom) | Medium |
