# KYPStamping frontends

Four Next.js applications share a design package and one typed local JSON demo dataset:

- Business workspace: http://localhost:3000
- Platform administration: http://localhost:3001
- Customer PWA: http://localhost:3002
- Public marketing site: http://localhost:3003

All four apps read and write the live FastAPI service. Start the backend first (`cd ../backend && make up && make migrate && make seed`); with it down, every screen shows its error state rather than a fixture. Email is delivered to Mailpit (`http://localhost:8025`); SMS and push have no transport yet, so an SMS one-time code is mirrored to Mailpit and readable from `GET /api/v1/_dev/messages?purpose=otp`.

## Start the connected demo

Open `http://localhost:3003/product#apps` for the list of all four surfaces and the way into each one. One Sweet Crumbs visit runs through every product: the same customer, branch, purchase, loyalty balance, event ID, request ID, and delivery state, seeded into the API from `packages/demo-data/src/kypstamping-demo.json`.

The three private apps sit behind a real session cookie the browser code cannot read, so start at the login screen — a bare hash link cannot survive the redirect:

- Customer wallet: `http://localhost:3002/login`, then Wallet, Discover, or the QR button
- Business counter: `http://localhost:3000/login`, then Scan
- Business POS/API setup: `http://localhost:3000/login`, then Integrations
- Platform integration control: `http://localhost:3001/login`, then Integrations

Once signed in, the in-app hash routes (`#scan`, `#integrations`, `#discover`) are linkable and the browser back button works.

Cross-product consistency is the API's now, not a shared fixture's: a stamp taken at the counter is in the customer's wallet on the next request. `@kypstamping/api` is the whole data layer — `endpoints.ts` is one function per call, `queries.ts` and `mutations.ts` are the hooks, `keys.ts` is what invalidation targets, and `contract.test.ts` runs all of it against the live service. What remains of `packages/demo-data` is one narrated scenario used by the marketing site.

## Demo authentication

Sign-in is the API's answer, not a browser flag: the session is an httpOnly cookie this code cannot read.

- Business: `http://localhost:3000/login` → sign in → dashboard. An owner with one workspace does not pass a picker. Recovery, verification, and invitation routes are at `/forgot-password`, `/verify`, and `/accept-invite`.
- Platform admin: `http://localhost:3001/login` → password → TOTP at `/verify` → control room.
- Customer: `http://localhost:3002/login` → one-time code → wallet. New-account setup is at `/create-account`.
- The member code is a thirteen-digit EAN-13 (`2974 0128 0548 0`), stored on the account and reissuable - it is no longer derived from the customer id. `formatMemberCode` in `packages/ui/src/format.ts` groups it for display; it is always stored and sent bare.
- Seeded accounts: `mara@sweetcrumbs.ph` (business owner) and `admin@kypstamping.ph` (platform), both with password `DemoPass123!`.
- The admin's second factor is a real TOTP over the seeded secret; the customer's code is the one the API sent, readable at `GET /api/v1/_dev/messages?purpose=otp` or in Mailpit. Set `OTP_DEV_CODE=123456` in the backend `.env` to pin it instead — local only, and the API refuses to start with it set anywhere else.
- One-time codes are limited to three per destination per ten minutes, so a tight rerun loop is throttled by design.

Logout is available from each product account menu or profile. It ends the session on the server and prevents the private root screen from reopening until the user signs in again.

## Demo coverage

- Business: overview, scan, join materials, customers, profile and locations, eight program types with an editable rule editor, favorite orders, birthday journeys, redemptions, multichannel campaigns, messages, analytics, staff with an invitation composer, POS/API setup, sample keys and scopes, webhook testing and delivery logs, plan allowances, payment method and invoices, and privacy settings.
- Admin: network overview, business tenants, aggregate people/privacy operations, integration adapters, delivery recovery, credential posture, service health, support, audit, revenue and margin, and platform settings.
- Customer PWA: home, wallet cards, QR, discovery and join flow, notifications, activity, profile fields, channel choices, privacy history, export, leave, and deletion request surfaces.
- Marketing: product tour, the four-app index at `/product#apps`, features, integrations, industry solutions, pricing calculator, resources, Philippine loyalty guide, buyer FAQ, competitor comparisons, legal pages, and contact flow.

Useful marketing routes include `http://localhost:3003/product#apps`, `/integrations`, `/loyalty-program-philippines`, `/faq`, `/compare/gobalik`, `/compare/suki-cards`, and `/compare/zap`.

The researched Philippine loyalty feature baseline and parity-plus product requirements are documented in [docs/philippines-loyalty-benchmark.md](docs/philippines-loyalty-benchmark.md).

The frontend-to-FastAPI handoff for POS adapters, credential security, webhooks, idempotency, the loyalty ledger, and delivery phases is documented in [docs/pos-agnostic-business-integration-plan.md](docs/pos-agnostic-business-integration-plan.md).

## Run with Node

```powershell
npm.cmd install
npm.cmd run dev:business
npm.cmd run dev:admin
npm.cmd run dev:customer
npm.cmd run dev:marketing
```

Run each development command in its own terminal.

## Run with Docker

```powershell
docker compose -f compose.frontend.yaml up --build
```

## Verify

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:format
npm.cmd run audit:controls
npm.cmd run test              # contract tests against the running API
npm.cmd run qa:customer-auth
npm.cmd run qa:private-apps
npm.cmd run qa:merchant       # a shop owner's day, end to end
npm.cmd run qa:wallet         # a customer's wallet, end to end
npm.cmd run qa:edges          # the awkward paths, through the API
npm.cmd run qa:tenants        # six shops, five feature mixes, three plans
npm.cmd run qa:refusals       # what the screen says when the API says no
npm.cmd run build
```

Everything below `audit:controls` needs the API up and freshly seeded, and each
one writes to the database it reads. Run them **one at a time, in this order**,
and reseed (`cd ../backend && make seed`) before a run you intend to trust —
the backend's own `pytest` uses the same database, so running the two together
is how a suite fails on the other's leftovers. Sign-in is rate limited (and
one-time codes are three per destination per ten minutes), so a tight rerun
loop answers 429; each suite says so rather than failing as a broken app.

`test:format` checks the shared money, greeting, relative-time, and birthday-window helpers in `packages/ui/src/format.ts`.

`audit:controls` checks that every rendered button has an action and every link has a destination — and that internal destinations resolve to a route the app actually serves. That last check exists because two homepage buttons pointed at a deleted `/demo` route for a full release without failing anything.

`qa:customer-auth` runs the customer login, verification, and signup journeys in Playwright at phone and desktop widths, against the real API: it reads the one-time code the service actually sent. Set `CUSTOMER_APP_URL` to run the same suite against a deployed PWA, and `KYP_TEST_API` if the API is not on `localhost:8000`. Codes are limited to three per destination per ten minutes, so back-to-back runs are throttled and the suite says so rather than failing as a broken sign-in.

`qa:private-apps` signs into the business and platform workspaces — a real password, and a live TOTP for the administrator's second factor — walks all 24 views, and re-checks the interactions that have to outlive navigation: a staff invitation, a published program rule, support triage, and replaying the recovery queue. It also fails on any 4xx or 5xx the apps provoke, naming the route; a 402 is excepted because a plan gate is an answer a card renders rather than a fault. Both apps and the API have to be running; set `BUSINESS_APP_URL` and `ADMIN_APP_URL` to point it at a deployment. It writes to the database it walks, so reseed (`cd ../backend && make seed`) before measuring anything from the demo data.

`qa:merchant` and `qa:wallet` walk the two journeys a real person makes - sign
in, stamp, redeem, refund, join, leave - and fail on any console error, page
error or unexpected 4xx/5xx along the way. `qa:edges` drives the awkward paths
through the API instead of the UI, so one failure does not hide the twenty
checks behind it: doing a thing twice, the eight program types at the till,
and whether what the merchant just did shows up for the customer.

`qa:tenants` is the one that needs the seed to be multi-tenant. Sweet Crumbs
runs all eight program types, so it was the only shop anything was tested
against, and a bug that only bites a shop running two of them had nowhere to
surface. The seed now creates six merchants on three plans with five different
mixes, each with its own owner login, and this walks every one of them through
the features it actually runs - then asks the question no single tenant can
ask of itself: whether it can read, stamp or spend anything belonging to
another.

`qa:refusals` goes the other way. The suites above walk the paths that are
meant to work and treat any 4xx as a fault, which leaves the refusals - the
ones the API is right to send - untested. A refusal the interface swallows is
worse than a crash: the cashier is standing at the till having been told
nothing, and the most likely thing they do next is press the button again. So
this one provokes refusals on purpose and checks the screen says so.

It found the counter answering a scanned card with "Enter a valid Philippine
mobile number". Worth knowing about its own first run: it accused the counter
of swallowing an error that was in fact being shown, because it read
`#main-content` and the toast renders outside it. A harness that cries wolf
about silence is worse than no harness, so it reads the whole page and reads
it while the toast is still up.

Between them they found five bugs the typecheck and the build could not see -
Discover offering businesses that could not be joined, an invitation accepted
for an address that cannot receive one, a blank tile where a shop had no
photo, a seed that was not repeatable, and a shop running only a multipass and
a membership being offered in Discover and then refusing to be joined.

The latest measured release results and scope boundary are recorded in [docs/frontend-release-audit.md](docs/frontend-release-audit.md). The cross-app consistency review that produced the current round of fixes is in [docs/frontend-synergy-audit.md](docs/frontend-synergy-audit.md).

The customer service worker registers only in production builds so local development is not affected by stale caches.
