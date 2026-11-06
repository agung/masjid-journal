# Claude repository instructions

At the beginning of every session:

1. Read `AGENTS.md` and follow it as the canonical repository rule set.
2. Read `README.md`, `docs/README.md`, and every task-relevant document linked there.
3. Check the working tree, fetch `origin`, and base new work on the latest `origin/main` in a `claude/<topic>` branch.

Never work directly on `main`, discard existing changes, edit generated files manually, expose secrets, or change production through a web dashboard. Keep the relevant files in `docs/` synchronized whenever a flow, design rule, setup step, architecture decision, or deployment process changes.
