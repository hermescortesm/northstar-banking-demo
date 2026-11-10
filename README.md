# Northstar Banking (simulated demo)

Northstar is a front-end demo of a business banking app: an overview dashboard, a searchable transaction list and a transfer flow between three accounts. **Everything is simulated. No real funds, no real accounts, no backend, no authentication.** All people, merchants and balances are fictional.

## Features

- **Overview** - total cash, per-account balances, range-switchable balance chart (7D / 30D / 90D / 12M) with a screen-reader table, money in / out / net, spending by category, recent transactions. Cards and category rows link to pre-filtered Transactions.
- **Transactions** - search, date range, direction, category, status, account and amount filters; sortable columns; 12 per page; detail drawer with timeline (focus-trapped, Escape to close, background inert).
- **Transfers** - 3-step flow (details, review, confirm) between your own accounts with validation (no overdraft, same-account blocked, amount parsing), idempotent submit and a visible "simulated" label. A transfer creates a debit and a credit row (reference `SIM-####`) that appear everywhere immediately.
- Light and dark themes (system default, toggle in the top bar, saved in the browser), CSS-only motion that respects reduced-motion, loading skeletons.
- Responsive from 1920px down to 375px; collapsible sidebar on desktop, drawer navigation on mobile.

## Tech stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Recharts 3. Tests: Vitest + Testing Library (unit), Playwright + `@axe-core/playwright` (e2e, accessibility). Node 24.

## Components

The UI is built from small reusable primitives in `src/components/ui/`. See [docs/COMPONENTS.md](docs/COMPONENTS.md) for each component, its props and where it is used.

## Architecture

A modular monolith in a single Next.js app; there is no server API.

```
src/
  app/          routes: /, /transactions, /transfers (+ root layout)
  components/   AppShell, Toast, and per-feature folders (overview/, transactions/, transfers/)
  lib/          pure domain code: money, data (seed), ledger, dates, overview, transfer-form
  state/        LedgerProvider - React context holding the ledger for the session
e2e/            Playwright specs (feature, integration, responsive, a11y)
```

- **Ledger is the single source of truth.** Balances, summaries, chart buckets, category totals and the sidebar are all derived from the transaction list by pure functions in `src/lib/ledger.ts`; nothing stores a balance separately. Total cash is therefore invariant under transfers.
- **Integer cents** everywhere (`src/lib/money.ts`); formatting happens only at the edge. No floating point in financial math.
- **Deterministic seed.** `src/lib/data.ts` uses a fixed seeded PRNG and a fixed "today" so every run and every test sees the same ledger. IDs come from counters (`txn_####`, `SIM-####`), never from `Date.now()` or `Math.random()`.
- **Idempotent transfers.** Each submission carries a request key derived from the ledger; re-applying a key returns `duplicate` instead of moving money twice (double-click and double-Enter are covered by tests).
- `LedgerProvider` lives in the root layout, so state persists across client-side navigation.

## Run and test

```bash
npm ci
npm run dev          # http://localhost:5050
npm run typecheck
npm run lint
npm test             # unit tests (Vitest)
npm run build && npm start
npm run e2e          # Playwright; builds and serves on port 3100
E2E_PORT=3200 npm run e2e   # use another port
npx playwright install chromium   # first time only
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint, unit tests, build and e2e on every push and pull request. It does not deploy.

## Design notes

The UI is implemented from the approved Claude Design prototype. Deliberate deviations:

- The Income / Expenses bar card is omitted; Spending by category uses the freed space.
- On mobile, navigation is an off-canvas drawer opened from the top bar.
- Small accessibility changes: larger touch targets (44px) on phones, text alternatives for the chart, labels on filter controls.

## Financial rules

- Balances use **posted** (completed) transactions; pending items are shown separately and are excluded from the balance. Failed items are excluded everywhere.
- Available to transfer = posted balance minus pending debits. A transfer greater than available is rejected; exactly the available amount is allowed.
- Source and destination must differ; amounts are positive with at most two decimals.
- A transfer is two ledger rows (debit, credit) with the same reference, flagged simulated, completed instantly at the fixed simulated time.
- Overview summaries count external activity only (transfers between own accounts are excluded from money in / out).

## Known limitations

- No persistence: reloading the page resets the ledger to the seed.
- The clock is fixed: today is **2026-11-09** and new simulated transactions are stamped **3:04 PM**.
- No authentication, no multi-user support, no real bank integration. This is a demo, not production software.
- 12M percentage deltas compare against a prior window the seed only partly covers, so they can be very large. "90D" is 13 weekly buckets (91 days). Both follow the prototype.
- Transaction table rows have a concise accessible name (merchant, amount, status, date) rather than the full visible row text, so axe's experimental label-in-name check is excluded for those rows only.
- Only Chromium is covered by e2e.

## AI-assisted development

This project was built with AI assistance (Claude Code agents working as frontend developer and QA, coordinated by a human). Code was reviewed through QA rounds and is covered by unit and e2e tests, but treat it as a demo.
