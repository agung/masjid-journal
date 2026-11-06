# Deployment and data plan

The application deploys to Cloudflare Workers through vinext. Production uses D1 SQLite for application data, private R2 for proof images, and a Durable Object keyed by organization to serialize ledger mutations. The production database starts empty; existing accounts, transactions, and proof images are not imported.

See `DEPLOYMENT.md` for resource provisioning, migration and deployment workflow, Worker secrets, OAuth setup, rollback policy, and logs. D1 migrations are forward-only and must remain backward-compatible with the currently deployed Worker.
