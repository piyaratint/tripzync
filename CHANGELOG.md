# TripZync® — Changelog

> Living document — updated every time the app's features or flow change.  
> Each entry compares **Previous vs. Current** so you can see exactly what shipped between spec versions.  
> Full current feature status lives in [SPEC.md](./SPEC.md); this file is the history of how it got there.

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
