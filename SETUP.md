# Local development and deployment

## Local development

Use Node.js 22.14.0 and npm. Install with `npm ci`, then run `npm run dev`. The project uses D1 in the Cloudflare Worker runtime; use `npm run db:migrate:local` for the local Wrangler D1 database before testing authenticated flows. Generate schema changes with `npm run db:generate`. Never use `drizzle-kit push` against production.

Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for local development. Keep the secret key out of source control. Configure sign-in methods and OAuth providers in the linked Clerk Dashboard application.

## Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for Cloudflare resource provisioning, Clerk Worker secrets, GitHub environment settings, migration policy, rollback, logs, and custom domains. CI applies migrations before deploying the Worker, and production starts with an empty D1 database.
