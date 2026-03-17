# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An internal simulation platform for testing a Connect-3 bingo game against real Superbet sportsbook events. Admins create bingo sheet templates (9 squares in a 3x3 grid), attach them to sports events, lock in odds prices, then result squares after the event finishes to measure how often sheets achieve Connect-3 (3 WON squares in a horizontal or vertical line — no diagonals).

## Working Directory

All development happens inside `hunch-bingo/`. Run all commands from there:

```bash
cd hunch-bingo
npm run dev        # start dev server
npm run build      # production build
npm run lint       # ESLint
npx prisma migrate dev   # run migrations
npx prisma studio        # browse DB
npx prisma generate      # regenerate client after schema changes
```

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma v7, PostgreSQL (Railway), Tailwind CSS v4, Netlify hosting.

**Pattern:** All data mutations use Next.js Server Actions (`"use server"`) — not API routes. The only API route is `app/api/advance-games/route.ts`, which exists solely to be called by the Netlify cron function.

**Prisma client** is generated to `app/generated/prisma` (non-standard). Always import types from there:
```ts
import type { SquareStatus, GameStatus } from "@/app/generated/prisma";
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/game-engine.ts` | `lockPrices(gameId)` — opens a game, queries Offer API for live odds, creates `GameSheetResult` and `GameSquareResult` rows for every sheet |
| `lib/offer-api.ts` | Superbet Offer API client — `fetchEvent`, `fetchEventsByDate`, `findOutcomeForMarket` |
| `lib/connect3.ts` | `evaluateConnect3(statuses[])` — checks 6 lines (3 rows + 3 cols), returns `{ connect3, score }` |
| `lib/prisma.ts` | Shared Prisma client singleton |
| `app/api/advance-games/route.ts` | Cron-protected POST — auto-opens PENDING games and auto-closes OPEN games based on time |
| `netlify/functions/advance-games.mts` | Netlify scheduled function (every minute) that calls `/api/advance-games` |
| `app/games/[id]/actions.ts` | `advanceGameStatus` (manual status bump) and `triggerResulting` (CLOSED→COMPLETED with full square evaluation) |
| `prisma/schema.prisma` | Single source of truth for all models |

## Game Lifecycle

```
DRAFT → PENDING (on create) → OPEN (cron/manual, runs lockPrices) → CLOSED (cron/manual) → COMPLETED (manual resulting)
```

- **PENDING→OPEN**: `lockPrices()` fetches live odds from Offer API, creates `GameSheetResult` + `GameSquareResult` rows for every `BingoSheet` in the system, capturing market name/outcome/price.
- **CLOSED→COMPLETED**: `triggerResulting()` re-fetches the event with `oddsResults=true`, matches each `GameSquareResult.outcomeId` against results, sets WON/LOST, then runs `evaluateConnect3`.

## Offer API

- Base URL: `https://production-superbet-offer-ng-be.freetls.fastly.net`
- Events endpoint: `GET /v2/en-BE/events/{externalEventId}` (add `?oddsResults=true` when resulting)
- 404 returns `null` (handled gracefully); filters to football only (`sportId === 5`)
- Outcome matching: `marketId` + odds price within `[oddsMin, oddsMax]` from the difficulty tier

## Data Model Summary

- `OddsDifficulty` — named odds ranges (e.g. "Easy" = 1.26–1.50)
- `BingoSheet` + `BingoSheetSquare` — templates with 9 squares (positions 1–9), each referencing a `marketId` and difficulty tier; markets must be unique per sheet
- `ExternalEvent` — Superbet event IDs registered for use in games
- `Game` — links an event to a time window; has `GameStatus` enum (DRAFT/PENDING/OPEN/CLOSED/COMPLETED)
- `GameSheetResult` — per-game copy of each sheet; stores `connect3` bool + `score` after resulting
- `GameSquareResult` — per-square outcome record; `status` is `SquareStatus` (PENDING/WON/LOST/NO_MATCH); `NO_MATCH` means no odds within the difficulty range were found at lock time

## Design System

See `memory/MEMORY.md` for the full design token reference. Key points:
- Font: `Outfit` via `next/font/google` (var `--font-outfit`)
- Page bg `bg-slate-100`, cards `bg-white shadow-sm rounded-2xl border border-slate-200`
- Primary accent: indigo-600; gradient: indigo-500→violet-600
- Labels: `uppercase tracking-widest font-bold text-[11px]`
- Tailwind v4 arbitrary opacity syntax (e.g. `bg-white/80` not `bg-white bg-opacity-80`)

## Environment Variables

| Var | Used by |
|-----|---------|
| `DATABASE_URL` | Prisma (Railway PostgreSQL) |
| `CRON_SECRET` | `/api/advance-games` Bearer auth |
| `URL` or `NEXT_PUBLIC_SITE_URL` | Netlify function → self-calls advance-games |
