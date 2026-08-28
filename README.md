# Stampr frontends

Four Next.js applications share a design package and one typed local JSON demo dataset:

- Business workspace: http://localhost:3000
- Platform administration: http://localhost:3001
- Customer PWA: http://localhost:3002
- Public marketing site: http://localhost:3003

The demos are frontend-only. No live API, account, payment, email, SMS, or push provider is connected yet. Navigation and local interactions are intentionally complete enough to review the product before building the shared FastAPI service and background worker.

## Start the connected demo

Open `http://localhost:3003/product#apps` for the list of all four surfaces and the way into each one. One Sweet Crumbs visit runs through every product: the same customer, branch, purchase, loyalty balance, event ID, request ID, and delivery state from `packages/demo-data/src/stampr-demo.json`.

The three private apps sit behind a simulated session gate, so start at the login screen — a bare hash link cannot survive the redirect:

- Customer wallet: `http://localhost:3002/login`, then Wallet, Discover, or the QR button
- Business counter: `http://localhost:3000/login`, then Scan
- Business POS/API setup: `http://localhost:3000/login`, then Integrations
- Platform integration control: `http://localhost:3001/login`, then Integrations

Once signed in, the in-app hash routes (`#scan`, `#integrations`, `#discover`) are linkable and the browser back button works.

The shared fixture proves information architecture and cross-product consistency. It does not pretend to provide live cross-origin synchronization; that begins when the shared FastAPI API and background worker are connected. `packages/demo-data/src/api.ts` is where that switch happens — every store hydrates through it, and `types.ts` beside it declares the shapes the service has to return.

## Demo authentication

The three private products now include complete simulated entry and exit journeys. Demo credentials never leave the browser session.

- Business: `http://localhost:3000/login` → sign in → choose a workspace → dashboard. Recovery, verification, and invitation routes are also available at `/forgot-password`, `/verify`, and `/accept-invite`.
- Platform admin: `http://localhost:3001/login` → password or SSO preview → MFA at `/verify` → control room.
- Customer: `http://localhost:3002/login` → mobile/email verification → wallet. New-account setup is available at `/create-account`.
- Shared verification code: `424242`.
- Business password example: `DemoPass123!`.

Logout is available from each product account menu or profile. It clears that app's simulated browser session and prevents the private root screen from reopening until the demo user signs in again.

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
npm.cmd run qa:customer-auth
npm.cmd run qa:private-apps
npm.cmd run build
```

`test:format` checks the shared money, greeting, relative-time, and birthday-window helpers in `packages/ui/src/format.ts`.

`audit:controls` checks that every rendered button has an action and every link has a destination — and that internal destinations resolve to a route the app actually serves. That last check exists because two homepage buttons pointed at a deleted `/demo` route for a full release without failing anything.

`qa:customer-auth` runs the customer login, verification, and signup journeys in Playwright at phone and desktop widths. Set `CUSTOMER_APP_URL` to run the same suite against a deployed PWA.

`qa:private-apps` signs into the business and platform workspaces, walks all 24 views, and re-checks the interactions that have to outlive navigation: a staff invitation, a program rule edit, support triage, and replaying the recovery queue. Both apps have to be running; set `BUSINESS_APP_URL` and `ADMIN_APP_URL` to point it at a deployment.

The latest measured release results and scope boundary are recorded in [docs/frontend-release-audit.md](docs/frontend-release-audit.md). The cross-app consistency review that produced the current round of fixes is in [docs/frontend-synergy-audit.md](docs/frontend-synergy-audit.md).

The customer service worker registers only in production builds so local development is not affected by stale caches.
