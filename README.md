# Vetly — Freelance Deal Analyzer

**Know what a project offer is really worth before you say yes.**

Vetly takes a freelance project offer — pasted straight from the client's message, entered manually, or loaded from a 1-click preset — and gives you back:

- the **real effective hourly rate**, after platform fees, communication overhead, and realistic scope inflation
- a **client risk score (0–100)** with the exact factors that drove it
- a clear **Accept / Negotiate / Reject** verdict with reasoning
- when negotiation is warranted, a **concrete counter-offer** — the budget to ask for, the hours to cap, and the contract terms to require

Every offer can be saved (no account needed — ownership lives in your browser), compared side by side, and shared as a link.

> **Live URL:** [https://vetly-cut.vercel.app](https://vetly-cut.vercel.app) · **Automated PR Testing:** Powered by [TestSprite](https://testsprite.com) (Season 4)

Built for **TestSprite Season 4**. The analysis engine is intentionally **deterministic and self-contained** — no flaky third-party dependency sits in the decision path — so generated test suites can assert deep, meaningful behavior.

---

## How it works

1. **`/` (Home)** — paste the client's message (any language; Smart Paste extracts the fields via an LLM and pre-fills the form for your review) or enter the offer manually, or click a preset scenario. A **live risk gauge** updates as you type.
2. **`/result/[id]`** — the verdict: decision badge, rate vs. target with margin and distance-to-threshold, risk breakdown with per-factor points, and — when warranted — the counter-offer and contract conditions. Doubles as the public shared view.
3. **`/compare`** — every offer saved on this device, sortable side by side.

## Stack

- **Next.js 15** (App Router, TypeScript) — one deployable unit on Vercel serverless
- **Neon Postgres + Drizzle ORM** (serverless HTTP driver) — instant cold starts, no auto-pause flakiness
- **Zod** — the same validation schema runs on the API and in the form, so every invalid input becomes a structured, field-specific HTTP 400 — never a crash
- **DeepSeek API** (`deepseek-chat`) — Smart Paste extraction and negotiation-message drafting only; never in the decision path
- **Vitest** — unit tests over the engine and validation boundary matrix

The deterministic engine lives in `src/lib/engine/` as **pure functions** with zero framework, database, or LLM imports — the same code runs on the server, in the browser (the live gauge), and in tests.

## Business constants — heuristic assumptions, not empirical figures

These are documented deliberately (transparency over false precision). They are **heuristic business assumptions** chosen for sane defaults and deterministic behavior:

| Constant | Value | One-line rationale |
|---|---|---|
| Communication/admin overhead | **+10%** of estimated hours | Meetings, environment setup, and deployment eat real time beyond the build hours. |
| Revision penalty | **+5%** hours per revision beyond 2 | Two rounds is a reasonable industry baseline; each extra round tends to add rework. |
| Unlimited-revisions penalty | flat **+35%** hours (overrides the per-round math) | Uncapped revisions historically swallow fixed budgets, so a heavy scope-creep buffer replaces per-round accounting. |
| Risk point weights | deposit 0/10/20/30 · terms 0/10/20/35 · flags 25/20/15/10 | Simple, monotonic risk proxies: the later the money and the weaker the commitments, the higher the score. |
| Risk tiers | LOW 0–30 · MEDIUM 31–60 · HIGH 61–100 | Hard boundaries are required for deterministic decisions; the UI always shows distance to the next tier. |
| Margin bands | surplus ≥ +20% · fair 0–+20% · deficit < 0% | +20% over target leaves room for the overheads that estimates always miss. |

Counter-offer semantics: budget-side numbers (suggested budget, max executable hours) are generated whenever the margin is the problem; contract conditions whenever the risk is the problem. An ACCEPT never carries a counter-offer.

## What the test suite covers

- **`tests/` (Vitest, in-repo)** — the full PRD §3.4 boundary matrix: tier boundaries at exactly 30/31 and 60/61, margin bands at 0% and +20%, platform fee `< 100` (100 exactly → reject), non-integer revisions, the +35% unlimited-revision lockout, the 100-point risk cap, currency validation + rounding (2dp USD, 0dp JPY/IDR), all 9 decision-matrix cells, counter-offer formulas, contract-condition strings, and every validation rejection mapped to its exact field-specific message. 96 tests, all green.
- **TestSprite suite (generated against the live deployment)** — end-to-end API behavior: valid create → 201 with id + analysis, every §3.4 violation → field-specific 400, unknown id → 404, Smart Paste's schema-stable `{ ok, fields, error }` response (every field present or null), and the deterministic numbers across presets.

### Fail → fix → green

Every failure found during test iterations, and how it was fixed:

| # | Fail (observed) | Root cause | Fix | Result |
|---|---|---|---|---|
| 1 | Vitest: `finiteNumber(...).positive is not a function` at schema import | Validation helper chained `.refine()` (returns `ZodEffects`) before numeric checks that only exist on `ZodNumber` | Restructured the schema so numeric checks chain on `ZodNumber` and refines come last | Suite imports cleanly — green |
| 2 | Vitest: `expected 'IDR 1,234,567' to be 'IDR 1,234,567'` (identical-looking strings) | `Intl.NumberFormat` separates an unknown-symbol currency from the amount with a **non-breaking space** (U+00A0) | Pinned the test to the actual deterministic output and memoized one formatter per currency so repeated calls are always identical | Green (12+ consecutive runs) |
| 3 | Vitest: preset contributions `expected [30,10,15,20,25]` but got `[30,10,25,20,15]` | Test asserted the flag order from the input; the engine deliberately emits risk contributions in canonical flag order for deterministic output | Pinned the test to the canonical order (and documented it) | Green |
| 4 | Vitest: deficit-cell counter-offer `expected 3866.67/31h` but got `2933.34/40h` | Test expectations copied from the unlimited-revisions preset (+35% penalty); the cell input had 2 free revisions (+0%) | Corrected expectations to the flagless-deficit numbers and annotated the formulas | Green |
| 5 | `next build`: `Module parse failed` in the metadata icon loader | Next's `app/icon.png` convention embeds the project path in generated code; the apostrophe in the repo directory name broke the generated string literal | Moved the favicon to `public/` and set `metadata.icons` in the root layout | Build green |
| 6 | Typecheck: `Property 'targetRate' does not exist on type 'ExtractedFields'` | The extraction schema deliberately excludes the user's own target rate (never extractable from a client message); prefill code still referenced it | Removed the dead prefill branch | Green |
| 7 | API smoke test: Smart Paste with whitespace-only text returned `200 ok:false` instead of `400` | `min(1)` passed on `"   "` because length counts spaces | Added `.trim()` before `.min(1)` in the extract request schema | `400` with field-specific message — green |
| 8 | One run showed a single Intl formatting assertion failing; never reproduced in 12+ subsequent runs | Suspected a transient ICU hiccup under parallel test workers | Memoized `Intl.NumberFormat` per currency (same args → same cached formatter) as defense in depth | 12+ consecutive green runs |
| 9 | TestSprite (PR #2): `Copy a share link from an owned result` failed. Button clicked but no visible confirmation appeared in DOM | Headless browser blocks `navigator.clipboard.writeText` by default, aborting execution before `setCopied(true)` | Implemented `document.execCommand('copy')` fallback in `OwnerActions.tsx` and ensured state transition fires. Branch: `fix/clipboard-share-confirmation`, commit: `303698f`, PR: #2 | Test passed on rerun. Suite pass count increased from 27 to 30. Check status SUCCESS (2026-10-17) |

TestSprite automated test loop iterations are appended to this table following every merged PR.

## Privacy note

**Smart Paste sends your pasted text to a third-party AI API (DeepSeek) for extraction.** Don't paste anything highly sensitive (real client names are common but not required — the analysis never needs them). The disclosure is shown in-app next to the paste box and here. Without a `DEEPSEEK_API_KEY`, Smart Paste simply falls back to manual entry — the core analysis is never dependent on any LLM.

## Run locally

```bash
npm install
cp .env.example .env.local        # then fill in the values below
npm run db:push                   # create the offers table in Neon (needs DATABASE_URL)
npm run dev                       # http://localhost:3000
```

Environment variables (`.env.local`, same names in Vercel project settings):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes (for saving offers) | Neon Postgres connection string. Without it the app still renders and analyzes, but saving returns a structured 503. |
| `DEEPSEEK_API_KEY` | No | Powers Smart Paste + message drafting. The app degrades gracefully without it. |
| `DEEPSEEK_MODEL` / `DEEPSEEK_BASE_URL` | No | Optional provider overrides (default `deepseek-chat` @ `https://api.deepseek.com`). |

Other scripts: `npm test` (Vitest), `npm run build` / `npm start`, `npm run db:generate` (regenerate migration SQL in `drizzle/`), `npm run db:push`.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel (zero-config for Next.js). Framework preset: Next.js.
3. Set `DATABASE_URL` (Neon connection string) and `DEEPSEEK_API_KEY` in Project → Settings → Environment Variables.
4. Run `npm run db:push` once locally against the same Neon URL (or apply `drizzle/0000_*.sql`) to create the `offers` table.
5. Deploy. Update the **Live URL** at the top of this README.

## 30-second demo script

1. On `/`, click **"Scope Creep Trap"** — the form fills and the live risk gauge jumps to 100/HIGH.
2. Click **Analyze this offer** → the result: REJECT, effective rate $11.64/hr (−61.2% margin), full counter-offer: ask $3,866.67, cap at 31 hours, and three contract conditions.
3. Back to `/`, paste any client message (any language) into Smart Paste → **Extract** → review the pre-filled form.
4. From `/result/[id]`, use **Copy share link**; then visit `/compare` to see saved offers side by side, sortable.

## API summary

| Route | Method | Behavior |
|---|---|---|
| `/api/offers` | POST | Validate (§3.4) → deterministic engine → save → `201 { id, analysis }`; any invalid input → `400 { error: 'VALIDATION_ERROR', issues: [{ field, message }] }` |
| `/api/offers?ids=a,b,c` | GET | Saved offers for Compare (max 50 ids), newest first |
| `/api/offers/[id]` | GET | One saved offer; malformed id → 400, unknown → 404 |
| `/api/extract` | POST | Smart Paste → `{ ok, fields, error }`, every field present or explicitly null |
| `/api/draft` | POST | Negotiation-message draft from the stored counter-offer → `{ ok, message }` |

All 400/404/503 responses are structured JSON with field-specific messages — the API never returns an unhandled 500 for invalid input.

## Known limitations (by design)

- Decision and risk tiers use hard numeric boundaries — required for deterministic testability. The UI always shows distance to the next boundary instead of hiding the cliff.
- Counter-offer numbers are a mathematically sound **starting point** for negotiation, not a guarantee the client accepts them.
- The optional cross-currency normalization on `/compare` (daily-cached rates) was intentionally **not built** — raw amounts across currencies aren't meaningfully comparable, so every amount is always shown in its offer's native currency.
- No accounts: offer "ownership" is an array of ids in `localStorage` (`myOffers`), by design.

## Project structure

```
src/
├── app/                    # pages + API routes (App Router)
│   ├── page.tsx            # Home: hero + entry card
│   ├── result/[id]/        # analysis + shared view
│   └── compare/            # sortable saved-offers table
├── components/             # home / result / compare / ui
└── lib/
    ├── engine/             # ★ pure deterministic core (rate, risk, decision, counter-offer)
    ├── validation/         # Zod schemas shared by API + form
    ├── currency/           # bundled ISO 4217 list + Intl formatting
    ├── db/ · offers/       # Drizzle schema + persistence (server-only)
    └── llm/                # DeepSeek client + Smart Paste + drafting (server-only, isolated)
tests/                      # Vitest boundary suite (96 tests)
drizzle/                    # generated SQL migrations
```
