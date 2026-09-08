# TripZync® — Changelog

> Living document — updated every time the app's features or flow change.  
> Each entry compares **Previous vs. Current** so you can see exactly what shipped between spec versions.  
> Full current feature status lives in [SPEC.md](./SPEC.md); this file is the history of how it got there.

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
