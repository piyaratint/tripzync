# TripZync® — Changelog

> Living document — updated every time the app's features or flow change.  
> Each entry compares **Previous vs. Current** so you can see exactly what shipped between spec versions.  
> Full current feature status lives in [SPEC.md](./SPEC.md); this file is the history of how it got there.

---

## Unreleased — 2026-09-11 — Rebrand preview (TripZync → Marenn)

**Branch:** `rebrand/maren` (PR [#1](https://github.com/piyaratint/tripzync/pull/1)) — **not merged to `main`, not deployed to production.** This is a design preview only; see "Known follow-ups" below for what's blocking a real ship decision.

**Why:** "TripZync" collides with existing brands and needed a new name before public launch. Marketing ran a naming session (documented separately) and landed on a "luxury minimal" identity direction (Aesop/Rimowa/Aman reference), rejecting ~25+ other candidate names along the way for either real trademark/domain collisions or not fitting the target user (someone who wants a *planned, controlled* trip, not a spontaneous one).

| # | Area | Type | Previous | Current |
|---|------|------|----------|---------|
| 1 | Site name | Rebrand | TripZync | **Marenn** — chosen after the first choice, "Maren," was found to collide with `maren.com`, owned by a real US healthcare provider (Maren Medical Group). "Marenn" (double n) clears that domain but is a known trade-off: reads a little more "startup" (double-letter naming, cf. Fiverr/Tumblr) than pure quiet-luxury |
| 2 | Default color theme (`app/globals.css` `:root`) | Style | "Midnight" — near-black + neon teal/cyan/violet/gold gradient accents | "Graphite" — warm-neutral dark palette, single deep forest-green accent (`#5C8368` dark-mode / `#3F6B4F` light-mode). No more multi-color gradients |
| 3 | Default theme mode (`app/layout.tsx`, `components/ui/ThemeToggle.tsx`) | App Change | Dark only; a light "arctic" theme existed but had to be manually toggled every visit (not persisted for first-time visitors) | **Light theme is now the site-wide default** for new visitors. Dark is still available via the toggle and persists correctly once chosen |
| 4 | Light theme palette (`body.t-arctic` block) | Style | Cool grey (`#F9FAFB`) bg, same old teal/gold accents as dark mode | Warm "stone" bg (`#F2F0EA`), same forest-green accent family as dark mode, warm ink text instead of cool grey |
| 5 | Display typography (hero/headline moments only — `.hero-title`, `.ob-headline`, `.ob-screen-title`, `/login` headline, `.policy-page h1`) | Style | Bebas Neue / Barlow Condensed, bold italic, uppercase | **Schibsted Grotesk**, normal case, weight 600. Went through 4 rejected fonts first (Fraunces italic → "hard to read", Newsreader → still hard to read, Manrope → "too plain", Bricolage Grotesque → "too childish") before this one landed. Structural/label text (nav links, buttons, eyebrows, meta) intentionally still uses Barlow Condensed — only the big brand-voice headlines changed |
| 6 | Logo (`components/TripZyncLogo.tsx`) | Style | Three status-dots + "TRIPZYNC® · {year}" in Barlow Condensed uppercase | Plain "Marenn" wordmark in Schibsted Grotesk, no ® mark, no dot motif. **Component/file name intentionally left as `TripZyncLogo`** to avoid touching every import site — only what it renders changed |
| 7 | User-visible "TripZync" text, app-wide | Copy | — | Replaced with "Marenn" everywhere it's shown to a user (nav, footer, page titles, meta tags, policy pages). Internal-only identifiers were **deliberately left alone**: `localStorage` keys (`tripzync_theme`, `tripzync_onboarding`, `tripzync-petals`, etc.), the `TripClient.tsx`/`TripZyncLogo.tsx` file and component names, and the `tripzync.vercel.app` / `tripzync-fresh.vercel.app` deployment URLs — renaming those would either lose existing users' saved data or require an actual Vercel project rename, neither of which is a "swap the brand text" change |
| 8 | Privacy/Cookie policy contact email (`app/privacy/page.tsx`, `app/cookies/page.tsx`, and the Wikipedia-image-fetch User-Agent string in `app/api/places/route.ts`) | Copy | `privacy@tripzync.com` | `privacy@marenn.com` — **placeholder, not a live inbox.** Explicit product call: change the visible text now, wire up a real inbox later |
| 9 | Button/badge text contrast on accent-colored backgrounds (7 spots in `app/home/page.tsx`, `.ob-cta-btn`/`.ob-auth-signup`/`.ob-step-next` in `app/globals.css`, save button in `components/trip/EditTripModal.tsx`) | Bug Fix | Text color was `var(--bg)` (auto-inverts to match the *background* token) — worked by accident on the old dark-only default, but produced unreadable dark-on-dark-green text once light became the default theme | Hardcoded to `#fff`, with a new shared class `.btn-on-accent` added to the light-theme override allowlist so it isn't force-flipped back to dark text by the existing `body.t-arctic` contrast-correction system |

**Known follow-ups (not yet done):**

| # | Item | Note |
|---|------|------|
| 1 | Trademark / domain / WHOIS verification | Everything above was checked with informal web search only, not a real registrar or trademark search. Do not treat "Marenn" as final until this is done |
| 2 | Vercel preview deployment is failing | Root cause found: the `tripzync` Vercel project's env vars (`DATABASE_URL` etc.) are scoped to "Production" only, so Preview builds (this PR) can't see them and `drizzle-kit migrate` fails before the build even starts. Fix is in Vercel dashboard → Settings → Environment Variables → edit each var → add "Preview" to its environment scope. Also note this repo's Vercel project may be a different/stale project than `tripzync-fresh`, which looks like the real production deployment — worth confirming the Git↔Vercel project link is correct |
| 3 | Deeper app screens not fully audited | Landing page, all 4 onboarding steps, `/login`, `/privacy`, `/cookies`, and the guest-mode `/home` trip dashboard were checked directly. Logged-in-only screens (`/dashboard`, `/settings`, `/trips/[tripId]`, `/trips/new`) had their hardcoded old-teal/gold literals swapped programmatically but were **not visually spot-checked**, since they require auth to reach |
| 4 | Placeholder email | `privacy@marenn.com` needs a real inbox before this can go live — it's on the PDPA/GDPR compliance pages |

---

## v1.2.1 — 2026-09-09 — Hotfix

**Reported by PM:** after clicking "Sign Up" (or "Plan My Trip"), the persistent TripZync logo/header seen on every other page disappeared on the page that loaded next.

| # | Area | Type | Previous (v1.2) | Current (v1.2.1) |
|---|------|------|------------------|------------------|
| 1 | Login page (`app/(auth)/login/page.tsx`) — reached via "Sign Up" (`/home`) and "Plan My Trip" (`app/page.tsx`), both of which route to `/login` | Bug Fix | No persistent header — only a centered logo above the hero headline, so the top-left nav bar every other page has was absent here | Added the same fixed `ob-nav` bar + `TripZyncLogo` used on the landing/onboarding pages, so `/login` now matches the site-wide header pattern |

---

## v1.2 — 2026-09-08 — ✅ DEPLOYED 2026-09-09 (pushed to `origin/main`, PM sign-off given)

**Design rationale:** the onboarding flow gated its strongest selling point — proof of what TripZync actually produces — behind a click on a "Sign Up vs. Guest Mode" choice screen that a cold visitor had no reason yet to engage with. Team call (PM + UX/UI + Business Dev, working session 2026-09-08) was to remove that gate entirely: show a fully-styled sample itinerary immediately, let the hero and the proof live on one continuous scroll, and move the sign-up/guest decision to *after* the visitor has seen the payoff, not before.

Audited against local HEAD `ffc48c3` (12 commits ahead of `origin/main` @ `f126f60` at the time). Pushed 2026-09-09: `origin/main` now at `9a61269` (`f126f60..9a61269`).

| # | Area | Type | Previous (v1.1) | Current (v1.2) |
|---|------|------|------------------|------------------|
| 1 | Onboarding Step 02 "Travel Mode" (`app/page.tsx`) | App Change | Solo / Couple / Group card selection *(spec said this; actual shipped code at the time was a "Sign Up vs. Guest Mode" choice screen — spec was already stale here before this change)* | **Removed entirely.** Hero and a new **Sample Dashboard** section now render as one continuous scroll under a single `screen==='hero'` state; "START PLANNING →" smooth-scrolls down to it instead of switching screens |
| 2 | Sample Dashboard | App Change | Did not exist | Fictional 7-day Tokyo itinerary styled as a grid: destination + dates (dynamically computed as ~10 weeks from today, matching average international-leisure booking lead time — recalculates on every load so it never shows a past date), 7-day weather forecast, flight card, 3-hotel stay list (date ranges include month, e.g. "17–19 Nov"), one day-card per calendar day of the trip (horizontally scrollable strip with visible ‹ › arrow buttons, not just a hidden-scrollbar swipe), and a "What To Eat" full-width photo strip |
| 3 | "What To Do" section | App Change | N/A (didn't exist until this session) | Built, then **removed** — team call was that the day-cards above already function as trip highlights, so a separate checklist was redundant (2 of 5 items literally duplicated Day 1/Day 3 photos) |
| 4 | CTA copy | Copy | "Sign Up" / "Guest Mode" choice cards | Reframed around ownership: badge "Your next trip, already taking shape", headline "Imagine **your trip**, this beautifully planned", primary button "PLAN MY TRIP →", secondary reduced to one word, "Guest" |
| 5 | Sample Itinerary badge | Style | N/A | Solid `--accent2` fill, plain drop shadow, no animation — an earlier bright-gradient/pulsing version was toned down after review ("too neon / not comfortable to look at") |
| 6 | Trip photos (day cards + What To Eat) | Content | N/A | Sourced from Unsplash/Wikimedia Commons; each one downloaded and visually verified against its caption before use (not just checked for a 200 response) — caught and replaced a skincare-bottle photo mislabeled as a destination, and later a mismatched Omakase/Yakiniku pair flagged in review |

**Known follow-ups (not yet done):**

| # | Item | Note |
|---|------|------|
| 1 | ~~Push to `origin/main` / deploy to Vercel~~ | **Done 2026-09-09** — PM approved, pushed `f126f60..9a61269`. Confirm Vercel build succeeds and spot-check the live site. |
| 2 | Full spec audit of Steps 01/03/04/05 | This session only touched Step 02; the rest of Section 1 may have its own pre-existing staleness (see row 1 above) not yet investigated |
| 3 | Photo pipeline | Sample Dashboard images are hand-picked stock photos, not pulled from the real Google Places pipeline used elsewhere in the app — fine for a static marketing sample, worth knowing if this pattern gets reused |
| 4 | Hydration warning in `PARTICLES` (hero background) | Pre-existing bug found during this work, unrelated to it — flagged separately, not fixed here |

---

## v1.1 — 2026-08-28

Audited against HEAD `f126f60` (2026-06-04). "App Change" rows are real behavior changes shipped in that commit range; "Doc Correction" rows fix things the spec had wrong even before then.

| # | Area | Type | Previous (v1.0) | Current (v1.1) |
|---|------|------|------------------|------------------|
| 1 | Date inputs (onboarding Step 05, `/plan`, `/trips/new`, Edit Trip, Hotel Modal) | App Change | Native browser `<input type="date">` | Custom `DatePicker` dropdown component — dark-themed floating calendar matching the design system |
| 2 | Trip Itinerary page layout | App Change | Sidebar + main-column split | Unified single-column layout — everything scrolls as one page |
| 3 | Flight info panel | App Change | Rendered in the sidebar | Moved into the main flow, directly below the hero (above weather) |
| 4 | My Accommodation | App Change | Did not exist | New card for self-booked hotel/Airbnb; shows as a **green** map pin (loyalty-brand hotel picks stay **blue**) |
| 5 | City Map pins | App Change | Active day's events only | Also plots hotel picks and My Accommodation |
| 6 | Expense Ledger | App Change | ✅ Complete, linked from the trip page | 🚧 Partial — route/functionality intact, but no longer linked from the trip page (product intent: gate behind a future in-app purchase) |
| 7 | Dashboard "New Trip" CTA | Doc Correction | Spec said it links back to onboarding (`/`) | Actually links to a dedicated `/trips/new` creation page — was already true, just undocumented |
| 8 | `/trips/new` page | Doc Correction | Not documented at all | Added as its own subsection (destination/dates/currency form, pre-fills from onboarding localStorage) |
| 9 | Component Library table | Doc Correction | No `DatePicker` entry | Added `DatePicker` row |

**Known bugs found during this audit (not yet fixed):**

| # | Bug | Where |
|---|-----|-------|
| 1 | Editing a trip's Start Date past the existing End Date isn't blocked — can silently empty the whole itinerary | `components/trip/EditTripModal.tsx` |
| 2 | DatePicker's "Today" shortcut silently fails when `max` is set to today | `components/ui/DatePicker.tsx` |
| 3 | Removing "My Accommodation" leaves the deleted data sitting in the form fields | `app/(app)/trips/[tripId]/TripClient.tsx` |

---

## v1.0 — 2026-05-31

Baseline spec — initial documented state of the app. No prior version to compare against.

---

## How this file gets updated

Whenever a future session reviews the app and finds the spec is out of date, it should:
1. Diff the current codebase against what's documented in `SPEC.md`
2. Update `SPEC.md` to reflect the current state
3. Append a new dated version entry **here** with a Previous vs. Current table for what changed
4. Regenerate `CHANGELOG.docx` from this file
