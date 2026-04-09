# TripZync®

Personal travel logbook — Next.js 15 + PostgreSQL (Neon) + Drizzle ORM + Auth.js

## Stack

| Layer      | Choice                        | Why                                              |
|------------|-------------------------------|--------------------------------------------------|
| Framework  | Next.js 15 (App Router)       | RSC, ISR, Route Handlers, edge-ready             |
| Database   | PostgreSQL via Neon            | Serverless, scales to zero, free tier            |
| ORM        | Drizzle                       | Type-safe SQL, schema-first, fast migrations     |
| Auth       | Auth.js v5                    | Google OAuth, adapter for Drizzle, middleware    |
| State      | Zustand + TanStack Query v5   | Local optimistic UI + server sync                |
| Styling    | Global CSS (globals.css)      | Pixel-perfect port of original HTML design       |
| Validation | Zod                           | Shared types between client and API              |
| Deploy     | Vercel                        | Zero-config Next.js, PR previews, Edge Network   |
| CI         | GitHub Actions                | Lint → type check → tests → build on every PR   |

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/you/tripzync
cd tripzync
npm install

# 2. Copy env template and fill in values
cp .env.local .env.local   # already provided — fill in secrets

# 3. Run DB migrations (creates all tables on Neon)
npm run db:migrate

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```bash
DATABASE_URL          # Neon connection string
AUTH_SECRET           # openssl rand -base64 32
AUTH_GOOGLE_ID        # Google OAuth client ID
AUTH_GOOGLE_SECRET    # Google OAuth client secret
ANTHROPIC_API_KEY     # For AI travel assistant
```

## Database

```bash
npm run db:generate   # Generate SQL from schema changes
npm run db:migrate    # Apply pending migrations to DB
npm run db:studio     # Open Drizzle Studio (visual DB browser)
```

## Project Structure

```
tripzync/
├── app/
│   ├── (auth)/login/          # Google OAuth login page
│   ├── (app)/
│   │   ├── layout.tsx         # Auth guard — redirects to /login
│   │   ├── dashboard/         # All trips overview
│   │   └── trips/[tripId]/
│   │       ├── page.tsx       # Itinerary view (server → TripClient)
│   │       ├── TripClient.tsx # Full UI: tabs, timeline, weather, AI
│   │       ├── expenses/      # Full expense ledger page
│   │       └── logbook/       # Trip summary / post-trip view
│   └── api/
│       ├── auth/[...nextauth] # Auth.js handler
│       ├── trips/             # GET all, POST create
│       ├── trips/[tripId]/    # GET, PATCH, DELETE
│       ├── events/            # GET, POST, PATCH, DELETE
│       └── expenses/          # GET, POST, DELETE
├── components/
│   ├── ui/QueryProvider.tsx   # TanStack Query client wrapper
│   ├── itinerary/
│   │   ├── DayPanel.tsx       # Day header + hotel banner + timeline
│   │   ├── EventItem.tsx      # Single event row with edit/delete
│   │   ├── EditEventModal.tsx # Edit modal (React state, not DOM)
│   │   └── AddEventBar.tsx    # Add event form
│   └── expense/
│       ├── ExpenseLog.tsx     # Expense card with add form
│       └── CategoryPills.tsx  # Category selector buttons
├── lib/
│   ├── db/schema.ts           # Drizzle schema — single source of truth
│   ├── db/index.ts            # Neon + Drizzle client
│   ├── auth.ts                # Auth.js config
│   ├── validations.ts         # Zod schemas for all API inputs
│   └── utils.ts               # Dates, currency, colour helpers
├── store/
│   ├── tripStore.ts           # Zustand — trip data + optimistic mutations
│   └── uiStore.ts             # Zustand — modals, AI drawer
├── hooks/
│   ├── useTrip.ts             # TanStack Query — events CRUD
│   └── useExpenses.ts         # TanStack Query — expenses CRUD
└── drizzle/
    └── migrations/            # Auto-generated SQL migration files
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Add environment variables to Vercel
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add AUTH_GOOGLE_ID
vercel env add AUTH_GOOGLE_SECRET

# Deploy
vercel --prod
```

The `vercel.json` runs `db:migrate` before every build so migrations stay in sync automatically.

## Migrating from TripZync_v3.html

Your `localStorage` data can be exported with this snippet in the browser console on the old HTML file:

```js
console.log(JSON.stringify(JSON.parse(localStorage.getItem('f1trip2')), null, 2))
```

Copy the output and use it to seed the database via Drizzle Studio or a one-off import script.

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Authorised redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Add `https://yourdomain.com/api/auth/callback/google` for production
