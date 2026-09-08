# TripZync® — Product Requirements & Implementation Status

> Spec version: **v1.2** (previous: v1.1, 2026-08-28) — see [CHANGELOG.md](./CHANGELOG.md) for the full version history  
> Last updated: 2026-09-08 (local HEAD `ffc48c3` — 🚧 **10 commits ahead of `origin/main`, not pushed / not deployed**; see CHANGELOG v1.2 for what's pending review)  
> Production URL: https://tripzync-fresh.vercel.app (Vercel — being migrated) — **still serving the v1.1 behavior described below as "Step 02 (deployed)"**  
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

### Step 02 — Travel Mode / Sample Dashboard

**Status: ✅ Complete on production (deployed) — 🚧 Superseded locally, pending review (not deployed)**

**Currently live on Vercel:** card selection — **Solo**, **Couple**, **Group** — choice persisted in component state, passed to trip metadata on save.

*(Note found during the 2026-09-08 session: by the time that session started, production had already diverged from this — the deployed screen was actually a "Sign Up vs. Guest Mode" choice, not Solo/Couple/Group. Documenting both here since it's unclear which was last verified against a real deploy; whoever pushes v1.2 should confirm current production behavior first.)*

**Built locally, not yet pushed (see [CHANGELOG.md v1.2](./CHANGELOG.md#v12--2026-09-08--not-deployed-local-commits-only-pending-review) for full rationale and diff):** the Travel Mode / choice-card step is removed entirely. The hero and a new **Sample Dashboard** section render as one continuous scroll instead of two gated screens — "START PLANNING →" smooth-scrolls to the dashboard rather than switching screens. The dashboard shows a fictional, fully-styled 7-day Tokyo itinerary (destination + dynamically-computed dates, weather forecast, flight, hotels, one scrollable day-card per calendar day, a "What To Eat" photo strip) intended to prove the product's value before asking for a decision. Sign Up / Continue as Guest ("Guest") now sit as CTAs *underneath* the sample dashboard rather than as the gate in front of it.

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
- Selection saved to `hotels[]` in localStorage onboarding data

---

### Step 05 — Duration (Dates)

**Status: ✅ Complete**

- Date range picker (start date → end date) via the custom `DatePicker` dropdown component (`components/ui/DatePicker.tsx`) — a dark-themed floating calendar matching the design system, replacing the previous native `<input type="date">`
- Validation: end date must be ≥ start date
- On submit: saves full trip data to localStorage → redirect to `/home`
- **Back-navigation support:** landing on `/?screen=duration` restores all state (cities, places, hotels, dates) from localStorage so the user can continue editing without losing selections

---

## 2 · Home / Trip Dashboard (`app/home/page.tsx`)

The per-trip homepage shown immediately after onboarding and on return visits.

### Hotel Recommendations

**Status: ✅ Complete**

- Calls `/api/hotel-search` with city clusters (lat/lng/radius) — no brand filter
- Uses **Google Places API** `searchNearby` 🔒
- Pipeline: `searchNearby` → Distance Matrix (≤ 45 min filter) → group by brand → sort by proximity
- **All hotels shown** regardless of user's loyalty membership
- Grouped by detected chain: Marriott → Hilton → Hyatt → IHG → Accor → other → Independent
- Up to 5 properties per brand; airport hotels suppressed when 2+ city-center picks exist
- Sort toggle: **Nearest** (default, by `travelMins`) or **Price**
- **On Map / Hidden** toggle per brand (controls Google Maps pins)
- Hotel photos fetched via `/api/hotel-photo` → cached in `hotel_photos` DB table (30-day TTL)
- Hotel map pin coordinates come directly from `searchNearby` response (no secondary geocoding call)

### Google Maps Integration

**Status: ✅ Complete**

- Place coordinates fetched from `/api/place-coords` (Google Geocoding → cached in `place_coords` table)
- Interactive Google Maps embed with pins for selected places and hotel brand logo pins 🔒
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` required client-side
- Hotel lat/lng carried from `/api/hotel-search` response — no redundant `/api/place-coords` call for hotels

### Places Display & Editing

**Status: ✅ Complete**

- Selected attractions shown as place chips with real photos (Wikipedia CC / Google Places)
- Grouped by city
- **Places Autocomplete** — +ADD input queries Google Places Autocomplete API (`/api/place-autocomplete`) with 300ms debounce, showing two sections: curated "Top Places" with photo thumbnails and "Search Results" from Google with location descriptions
- **Drag-and-drop** — place chips are draggable between days; drop target highlights with teal border/glow; uses native HTML5 Drag and Drop API (no library)
- Custom-added places fetch photos from Wikipedia API as fallback

### AI Travel Assistant

**Status: ✅ Complete**

- Chat drawer powered by **Anthropic API** (`ANTHROPIC_API_KEY`) via `/api/chat` route 🔒
- Streaming responses via Vercel AI SDK

---

## 2b · Edit Trip Page (`/plan`)

**Status: ✅ Complete (rewritten as edit page)**

Accessible from the homepage nav and from Step 04 back-navigation.  
Purpose: let the user update their trip dates or jump to any step to change selections.

- **Destination field removed** — destination shown as a read-only chip (city/cities from localStorage)
- Dates pre-filled from `tripzync_onboarding` localStorage on mount, editable via the same custom `DatePicker` dropdown
- Duration badge recalculates live
- Loyalty programme summary shown as gold pills (read-only)
- **Quick-edit links:** Edit Cities (`/?screen=map`) · Edit Places (`/?screen=places`) · Edit Hotels (`/?screen=hotels`) · Edit Dates (`/?screen=duration`)
- CTA: "SAVE & BACK TO MY TRIP →" — merges updated dates into localStorage → `window.location.replace('/home')`
- No auth step (user has already completed onboarding)

**Navigation from `/home`:**
- `← Back` button (guest nav) → `/?screen=duration` (Step 04 with state restored from localStorage)

---

## 3 · Authenticated App (route group `(app)/`)

All routes under `(app)/` are protected — redirect to `/login` if unauthenticated.

### Dashboard (`/dashboard`)

**Status: ✅ Complete**

- Lists all trips for the authenticated user (soft-deleted trips excluded)
- Trip cards with destination, date range, cover colour
- "+ New Trip" CTA links to the dedicated trip-creation page (`/trips/new`), not back to onboarding

### New Trip Creation (`/trips/new`)

**Status: ✅ Complete**

- Standalone form for creating additional trips without repeating full onboarding: title, subtitle, destination, dates (via `DatePicker`), currency
- Pre-fills destination and places from `tripzync_onboarding` localStorage if present
- Used both from the Dashboard "+ New Trip" CTA and reachable independently

### Trip Itinerary (`/trips/[tripId]`)

**Status: ✅ Complete**

- **Unified single-column layout** — sidebar/main-column split removed; everything (hero, accommodation, flights, weather, places, map, timeline) scrolls as one page
- **My Accommodation card** — for users who booked their own hotel/Airbnb outside the loyalty-brand hotel picks; shows name + address, editable inline, links out to Google Maps; rendered as a **green pin** on the City Map (loyalty-brand hotel picks remain **blue pins**)
- **Flight info panel** — moved from the old sidebar into the main flow, directly below the hero (above weather)
- Day-by-day timeline (`DayPanel` + `EventItem`)
- Add / edit / delete events (`AddEventBar`, `EditEventModal`)
- **Place dropdown** — AddEventBar shows searchable dropdown of curated places for the destination city (fetched from `/api/places` via Zustand store); dropdown uses `createPortal` to escape `overflow:hidden` clipping
- **Place photo cards** — events matching a known place show a photo card with type label (e.g. Temple, Park) in the timeline (`EventItem`)
- **City Map** — embedded Google Maps iframe below the schedule showing pins for the active day's events, hotel picks, and My Accommodation; pins fetched from `/api/place-coords`; clickable pin chips link to Google Maps
- Hotel banner per day
- Key event flagging (`isKey`) and seasonal flags (`isSakura`)
- Sort order drag handles
- Optimistic UI via Zustand + TanStack Query

### Expense Ledger (`/trips/[tripId]/expenses`)

**Status: 🚧 Partial — no longer linked from the trip itinerary page**

- Route and full functionality still exist (log expenses by category: Dining, Transport, Entertainment, Accommodation, Others; `CategoryPills`; per-trip totals with currency selector; Receipt URL field)
- As of the June 4 layout rework, `ExpenseLog` was removed from `TripClient.tsx` — the trip page no longer links here
- Product intent per commit message: gate this behind a future in-app purchase (not yet implemented — currently just unlinked, reachable only by direct URL)

### Logbook (`/trips/[tripId]/logbook`)

**Status: ✅ Complete**

- Trip summary / post-trip reflection view
- Read-only consolidated view of itinerary

### Settings (`/settings`)

**Status: 🚧 Partial**

- Page exists; user profile display
- Theme picker (Midnight, Obsidian, Ember, Arctic, Forest, Neon Rave)
- Edit profile / preferences not yet implemented

---

## 3b · Light Mode (Arctic Theme)

**Status: ✅ Complete**

- Full light mode using the `t-arctic` CSS class on `<body>`
- Color palette: `gray-50` (`#F9FAFB`) background, white (`#FFFFFF`) card surfaces, `gray-900` (`#111827`) primary text, `gray-500` (`#6B7280`) secondary text
- Cyan accent (`#40E0D0`) preserved from default theme — all accent buttons use black text for contrast
- ~270 lines of `body.t-arctic` CSS overrides in `globals.css` covering:
  - All hardcoded `color: #fff` and `color: var(--bg)` inline styles (via CSS attribute selectors with `!important`)
  - Top nav, hero, weather, cards, expense, flight, day panels, timeline, modals, AI drawer, footer
  - Progress bar, date pickers (`color-scheme: light`), onboarding screens
- `WorldMap` component detects light theme via `MutationObserver` on `body.className` — renders gray country fills (`#D1D5DB`), white controls, light map background
- Onboarding search dropdown uses `var(--card)` / `var(--text)` / `var(--border)` instead of hardcoded dark colors
- Hero title accent text (e.g. "2026") has a crisp hard shadow for readability on light backgrounds
- Google sign-in button always white with dark text (brand-compliant in both themes)

### Theme Toggle (`ThemeToggle` component)

- Fixed-position pill button next to logo in nav area (`☀️ Light` / `🌙 Dark`)
- Available on every page (rendered in root `layout.tsx`)
- Persists choice to `localStorage` key `tripzync_theme`
- Inline `<script>` in `<body>` applies theme before React hydrates (no flash of wrong theme)
- Hover: border + text animate to accent color

### Guest Trip Save on Sign-Up (`PendingTripSaver` component)

- "Sign Up Free →" button on `/home` saves full trip data (meta + itinerary) to `localStorage` key `tripzync_pending_trip` before redirecting to `/login?callbackUrl=/dashboard`
- `PendingTripSaver` client component on `/dashboard` detects pending trip after login
- Auto-calls `saveTrip()` server action → clears localStorage → shows success toast → reloads dashboard
- Trip appears on dashboard with all cities, places, dates, and itinerary intact

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
| `/api/hotel-search` | POST | Google Places hotel search — all brands, grouped by chain, sorted by proximity 🔒 |
| `/api/hotel-photo` | GET | Google Places photo proxy + cache 🔒 |
| `/api/places` | GET | Google Places attractions per city + cache 🔒 |
| `/api/place-coords` | POST | Geocode place names → lat/lng + cache (key: `name\|city`) 🔒 |
| `/api/place-autocomplete` | GET | Google Places Autocomplete proxy — typeahead search 🔒 |
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
| `ThemeToggle` | `components/ui/ThemeToggle.tsx` | Light/dark mode toggle (☀️/🌙) |
| `DatePicker` | `components/ui/DatePicker.tsx` | Custom dropdown calendar — replaces all native `<input type="date">` across onboarding, `/plan`, `/trips/new`, `EditTripModal`, `HotelModal` |
| `PendingTripSaver` | `components/PendingTripSaver.tsx` | Auto-saves guest trip after sign-up |
| `DayPanel` | `components/itinerary/DayPanel.tsx` | Day header + hotel banner + timeline |
| `EventItem` | `components/itinerary/EventItem.tsx` | Single event row (edit/delete) |
| `EditEventModal` | `components/itinerary/EditEventModal.tsx` | Edit event form modal |
| `AddEventBar` | `components/itinerary/AddEventBar.tsx` | Inline add-event form with place dropdown |
| `CityMap` | `components/itinerary/CityMap.tsx` | Embedded Google Maps with event pins |
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
| Styling | Global CSS (`globals.css`) + theme system (6 themes, light/dark) | — |
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
