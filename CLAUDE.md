# 🕌 Masjid Finance Tracker — Project Context

## Tech Stack
- **Framework**: Next.js 15 (App Router), React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Better Auth (Email & Magic Link)
- **Database**: PostgreSQL (via Supabase Free Tier)
- **ORM**: Drizzle ORM
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## Architecture
- **Multi-tenant**: Every record belongs to an `organization_id`.
- **Multi-role**: `owner`, `admin`, `treasurer`, `viewer`.
- **PWA**: Mobile-first design, installable via manifest & service worker.

## Data Model (Ledger)
- **1 generic `accounts` table** containing both `cash_holder` and `bank` accounts.
- **Transaction Types**: `income`, `expense`, `transfer`, `deposit`, `withdrawal`, `adjustment`.
- Every transaction generates 1 or 2 entries in `transaction_movements`.
- Each movement tracks `amount`, `signed_amount`, `balance_before`, and `balance_after`.

## Development Commands
- Run dev server: `npm run dev`
- Build: `npm run build`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Generate Drizzle migrations: `npm run db:generate`
- Push Drizzle migrations: `npm run db:push`

## Code Conventions
- Use `pnpm` or `npm` consistently (prefer `npm` if no `pnpm-lock.yaml`).
- Use **Server Actions** (`"use server"`) for mutations, placed in `lib/server/`.
- Validate all inputs using **Zod**.
- Place UI components in `components/ui/` (shadcn) and domain components in `components/<domain>/`.
- Use mobile-first tailwind breakpoints: design for mobile default, use `md:` and `lg:` for larger screens.

## Git Workflow
- Create small, atomic commits.
- Prefix commit messages with standard Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `ui:`.
- Automatically push PRs for significant feature additions (`gh pr create`).
