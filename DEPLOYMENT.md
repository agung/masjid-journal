# Cloudflare deployment

## Pre-deployment checklist

Complete these steps before publishing the Worker:

1. Choose a domain you own and can configure in DNS. Clerk production setup requires this; a `workers.dev` hostname alone is not sufficient for Clerk's production instance.
2. From this project directory, create the Clerk production instance with `npx -y clerk@latest deploy --domain <your-domain>`. Follow the CLI's `nextAction` and add the DNS records it reports. Do not substitute a guessed domain.
3. In the Clerk Dashboard, configure the production sign-in methods and OAuth providers you intend to offer, and set the production redirect URLs to the app's domain.
4. In Cloudflare Worker settings, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL` as variables. Set `CLERK_SECRET_KEY` and `CLERK_JWT_KEY` as secrets for the production Clerk instance. `NEXT_PUBLIC_APP_URL` must be the same app origin used for Clerk's authorized-party check.
5. Apply D1 migrations with `npx wrangler d1 migrations apply masjid-journal --remote`.
6. Deploy the Worker with `npx vinext-cloudflare deploy`.
7. Verify Clerk with `npx -y clerk@latest deploy status --mode agent`, then check sign-in, sign-up, invitation acceptance, and a protected D1-backed page on the production domain.

The application code and local development integration are ready, but production provisioning is not complete until you provide the domain and configure the production instance and Cloudflare values.

The production database starts empty. Provision a Cloudflare D1 database named `masjid-journal`, a private R2 bucket named `masjid-journal-proofs`, and a Cloudflare Worker. Replace `REPLACE_WITH_D1_DATABASE_ID` in both `wrangler.jsonc` and `cloudflare.config.ts` with the D1 ID. Apply the first schema with `npx wrangler d1 migrations apply masjid-journal --remote`, then deploy with `npx vinext-cloudflare deploy`.

Set `CLERK_SECRET_KEY` and `CLERK_JWT_KEY` as Worker secrets. The JWT key is the PEM public key shown in the linked Clerk application's API Keys page and enables local token verification. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL` as Worker variables; the URL must be the full origin used by the deployed app and is checked against Clerk session authorized parties. Use credentials for the existing Clerk application linked to this project, and configure allowed callback URLs and sign-in methods in its Dashboard. The app maps Clerk subjects to existing D1 user rows by verified email, preserving internal IDs and memberships.

Configure GitHub Actions with `CLOUDFLARE_ACCOUNT_ID` and a least-privilege `CLOUDFLARE_API_TOKEN` as production environment secrets, plus `CLOUDFLARE_ACCOUNT_SUBDOMAIN` as an environment variable. Protect the production environment with required reviewers. Deployments serialize migrations and Worker releases.

All later D1 migrations are forward-only and backward-compatible: Worker rollback does not revert D1. Review a migration against a local D1 copy before applying it remotely. To roll back application code, redeploy the prior Worker version while retaining the compatible schema. Use `npx wrangler tail masjid-journal` for logs. Add a custom domain through Cloudflare DNS and add it to the Clerk application's allowed domains and redirect URLs.
