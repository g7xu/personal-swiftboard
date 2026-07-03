# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal Swiftboard — a self-hosted weekly-sprint sticky-note board (Next.js 16 App Router, React 19, Prisma + PostgreSQL, Tailwind CSS 4, NextAuth v5 with Google OAuth, Anthropic SDK for AI task analysis).

## Commands

```bash
npm run dev          # start dev server (requires DB up)
npm run build        # prisma generate + prisma migrate deploy + next build
npm run lint         # eslint
npm run db:setup     # first-time: start Postgres container (port 5433) + run migrations
npm run db:up        # start Postgres container (subsequent sessions)
npm run db:down      # stop docker compose services
npm run db:migrate   # npx prisma migrate dev (after schema changes)
```

There is no test suite. Local env goes in `.env.local` — see `.env.example` for the full list (DB URLs, Google OAuth creds, `AUTH_SECRET`, AI provider keys); `prisma.config.ts` loads env via dotenv.

## Architecture

All data mutations and queries go through **server actions in `app/actions.ts`** — there are no REST API routes except the NextAuth handler (`app/api/auth/[...nextauth]/route.ts`). Every action starts with `getSessionUser()` (throws `Unauthorized` if not signed in) and verifies row ownership (`verifyTaskOwnership`, or a sprint `userId` check) before touching data. Follow this pattern for any new action.

**Auth is allowlist-based**: `auth.ts` has a hardcoded `allowedEmails` list in the `signIn` callback; AI features have a separate, smaller `AI_ALLOWED_EMAILS` list in `app/actions.ts` gated by `getAIAuthorizedUser()`.

### Domain model (prisma/schema.prisma)

- **Sprint**: one per user per week, keyed by `weekStart` (always a Monday, computed in UTC). Status: `ACTIVE`, `COMPLETED`, or `MISSING` (auto-backfilled for skipped weeks by `getCurrentSprint`). Completed/missing sprints are read-only — actions enforce this server-side.
- **Task**: belongs to a sprint. `status` is one of the board columns `Thorn`, `Rose`, `Seed`, `Action`, plus `Not Sure` (uncategorized). Statuses are plain strings, not enums — the column list is duplicated as `COLUMNS` in `components/Board.tsx`.
- **Carried actions** (`isCarriedAction`): when completing a sprint, up to 3 `Action` tasks can be carried into the next sprint. Carried tasks land as `Thorn`, can only toggle between `Thorn`/`Rose`, and can't be deleted or AI-analyzed. `completeSprint` clears the flag on the completed sprint's own carried tasks and creates the next week's sprint in one transaction.

### Week/date handling

All week math uses **UTC Mondays** (`getCurrentWeekMonday` / `getMondayOfWeek` in `app/actions.ts`, `getSprintWeekLabel` in `lib/sprintLabel.ts`). Keep new date logic in UTC to match; a recent hotfix was specifically about timestamp normalization.

### AI analysis flow

`lib/ai/` defines an `AIProvider` interface (`provider.ts`) with two implementations: Gemini (`gemini.ts`, the default — plain `fetch`, no SDK) and Claude (`claude.ts`); `getProvider()` in `index.ts` picks one via the `AI_PROVIDER` env var. Per-category system prompts live in `lib/prompts.ts` (each column gets a structured plain-text reflection format). Tasks are analyzable only if not carried, not `Not Sure`, and `analyzedAt === null`; accepting a suggestion (`keepAnalysis`) stamps `analyzedAt`, and editing content resets it to null.

### UI

`app/page.tsx` is a server component that fetches the sprint and renders `components/Board.tsx` (client component). The board keeps tasks in local state with **optimistic updates** on drag-and-drop, then calls server actions; `revalidatePath` refreshes server data. `?sprintId=` on the home page views a specific (possibly read-only) sprint; `/sprints` lists history.
