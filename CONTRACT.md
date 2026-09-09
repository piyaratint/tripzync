# Contract — UI ↔ Backend

Purpose: stop UI and backend work from drifting apart while they run concurrently. The source of truth for data shapes is the code itself — [lib/validations.ts](lib/validations.ts) and [lib/db/schema.ts](lib/db/schema.ts) — this file is not a copy of it. What this file *is*: the changelog of contract changes, so an agent working in an isolated branch/worktree notices a shape changed underneath them even before merging.

## Rule

If you change `lib/validations.ts`, `lib/db/schema.ts`, or an API route's request/response shape, add a line under **Pending** below in the same commit. Once both sides have merged and adapted, move the line to **Resolved** (or delete it).

If you're about to build UI against a shape, or wire an endpoint the UI depends on, check **Pending** first — it may already be in flux.

## Pending

_(none — add entries here as `- YYYY-MM-DD [ui|backend] <what changed> — <file>`)_

## Resolved

_(moved here once merged and both sides are in sync)_

## Merge cadence

Branches (`ui/<slug>`, `backend/<slug>`) are short-lived. Merge into `main` after each coherent unit of work — don't let either branch outlive a day or two of work. Smaller, more frequent merges surface contract drift while it's still cheap to fix.

## Lane boundaries

See [.claude/agents/ux-ui-designer.md](.claude/agents/ux-ui-designer.md) and [.claude/agents/backend-dev.md](.claude/agents/backend-dev.md) for what each side owns. The short version: UI owns `app/**/*.tsx` (non-route), `components/**`, `app/globals.css`. Backend owns `app/api/**`, `app/actions/**`, `lib/db/**`, `lib/auth.ts`, `lib/tripAccess.ts`, `lib/validations.ts`, `drizzle/**`.
