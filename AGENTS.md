# Repository instructions

These instructions apply to every Codex session in this repository.

## Session startup

1. Read this file, `README.md`, and `docs/README.md` before changing anything.
2. Read the documentation linked from `docs/README.md` that applies to the task.
3. Run `git status --short --branch` and preserve all existing user changes.
4. Start each new session on the local `main` branch, then run `git fetch origin --prune` and fast-forward `main` to `origin/main` when safe. If the working tree has changes or `main` cannot be updated without overwriting work, preserve the changes and resolve the situation before switching branches.
5. For new code work, create a new branch from the latest `main`. Branch names must start with a type prefix such as `feat/`, `fix/`, `docs/`, or `refactor/`, followed by a concise description. Never edit or commit directly on `main`.
6. Continue an existing task branch only when the user explicitly asks to continue it or the task context clearly requires it. Compare it with the latest `origin/main` first. Do not rebase, reset, discard, or overwrite existing work without explicit user approval.

## Change rules

- Make source changes in the local working tree and review the diff. Do not edit production code through GitHub, Cloudflare, Clerk, or another web dashboard.
- Do not edit generated output manually, including `.next/`, `.vinext/`, `.cloudflare/`, `dist/`, Wrangler state, generated Worker types, or package lock entries. Use the owning command or package manager.
- Change the D1 model in `drizzle/schema.sqlite.ts`, then generate a forward-only migration with `npm run db:generate`. Never rewrite an applied migration and never use `drizzle-kit push` against production.
- Keep organization isolation and role checks on every server-side read and mutation.
- Serialize balance-changing ledger writes through `LedgerCoordinator`.
- Keep secrets out of source control, logs, examples, and documentation. Production secrets belong in Cloudflare Worker secrets or GitHub environment secrets.
- Keep Cloudflare and vinext dependency versions pinned unless the task explicitly upgrades them.
- Do not push, merge, deploy, alter production data, or send external messages unless the user explicitly asks.
- Do not create commits automatically. After implementation and review, ask whether the user wants the changes committed and pushed. Commit or push only after the user explicitly confirms the requested action.

## Documentation contract

- `docs/` is the source of truth for architecture, flows, design, setup, deployment, and proposals.
- Update the relevant document in the same change whenever behavior, data flow, UI conventions, infrastructure, setup, or deployment changes.
- Update `README.md` when the product overview, quick start, commands, or documentation map changes.
- Record planned work in `docs/proposal.md`; do not describe proposals as shipped behavior.
- Keep documentation factual and synchronized with the current code. Remove stale instructions instead of appending contradictory notes.

## Verification and handoff

- At minimum, run `git diff --check` and inspect `git diff` before handoff and before any user-approved commit.
- Run the relevant lint, typecheck, test, or build commands when requested or when preparing a PR; report any check that was not run.
- After implementation, leave changes uncommitted until the user explicitly confirms whether to commit and push. Use focused commits with clear messages when approved. Before handoff, report the branch, commit state, files changed, checks run, and remaining risks.

