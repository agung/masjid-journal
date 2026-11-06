# Masjid Journal

This app uses Next.js 16 through vinext on Cloudflare Workers. Production data lives in D1, proof images in a private R2 bucket, and per-organization ledger writes are serialized by the `LedgerCoordinator` Durable Object.

- Keep Cloudflare and vinext dependency versions pinned in `package.json` and `package-lock.json`.
- Use the SQLite schema in `drizzle/schema.sqlite.ts`; generate forward-only D1 migrations with `npm run db:generate`.
- Apply local migrations with `npm run db:migrate:local`. Never use `drizzle-kit push` in production.
- Keep authenticated routes explicitly dynamic and use the typed Worker environment helper in `lib/env.ts`.
- Store production secrets as Cloudflare Worker secrets. Do not commit credentials or populate `.env.example` with production values.
- See `DEPLOYMENT.md` for provisioning and GitHub deployment setup.
