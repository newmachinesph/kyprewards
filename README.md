# Stampr frontends

Four Next.js applications share a design package and one typed local JSON demo dataset:

- Business workspace: http://localhost:3000
- Platform administration: http://localhost:3001
- Customer PWA: http://localhost:3002
- Public marketing site: http://localhost:3003

The demos are frontend-only. No live API, account, payment, email, SMS, or push provider is connected yet. Navigation and local interactions are intentionally complete enough to review the product before building the shared FastAPI service and background worker.

## Start the connected demo

Open `http://localhost:3003/demo` to follow one Sweet Crumbs visit through all four products. The public story, customer wallet, business counter, and platform integration control room use the same customer, branch, purchase, loyalty balance, event ID, request ID, and delivery state from `packages/demo-data/src/stampr-demo.json`.

Useful direct links:

- Customer discovery: `http://localhost:3002/#discover`
- Customer wallet/activity: `http://localhost:3002/#home`
- Business counter: `http://localhost:3000/#scan`
- Business POS/API setup: `http://localhost:3000/#integrations`
- Platform integration control: `http://localhost:3001/#integrations`

The shared fixture proves information architecture and cross-product consistency. It does not pretend to provide live cross-origin synchronization; that begins when the shared FastAPI API and background worker are connected.

## Demo authentication

The three private products now include complete simulated entry and exit journeys. Demo credentials never leave the browser session.

- Business: `http://localhost:3000/login` → sign in → choose a workspace → dashboard. Recovery, verification, and invitation routes are also available at `/forgot-password`, `/verify`, and `/accept-invite`.
- Platform admin: `http://localhost:3001/login` → password or SSO preview → MFA at `/verify` → control room.
- Customer: `http://localhost:3002/login` → mobile/email verification → wallet. New-account setup is available at `/create-account`.
- Shared verification code: `424242`.
- Business password example: `DemoPass123!`.

Logout is available from each product account menu or profile. It clears that app's simulated browser session and prevents the private root screen from reopening until the demo user signs in again.

## Demo coverage

- Business: overview, scan, join materials, customers, profile and locations, eight program types, favorite orders, birthday journeys, redemptions, multichannel campaigns, messages, analytics, staff, POS/API setup, sample keys and scopes, webhook testing and delivery logs, billing, and privacy settings.
- Admin: network overview, business tenants, aggregate people/privacy operations, integration adapters, delivery recovery, credential posture, service health, support, audit, revenue and margin, and platform settings.
- Customer PWA: home, wallet cards, QR, discovery and join flow, notifications, activity, profile fields, channel choices, privacy history, export, leave, and deletion request surfaces.
- Marketing: guided four-app demo, product, features, integrations, industry solutions, pricing calculator, resources, Philippine loyalty guide, buyer FAQ, competitor comparisons, legal pages, and contact flow.

Useful marketing routes include `http://localhost:3003/demo`, `/integrations`, `/loyalty-program-philippines`, `/faq`, `/compare/gobalik`, `/compare/suki-cards`, and `/compare/zap`.

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
npm.cmd run audit:controls
npm.cmd run qa:customer-auth
npm.cmd run build
```

`qa:customer-auth` runs the customer login, verification, and signup journeys in Playwright at phone and desktop widths. Set `CUSTOMER_APP_URL` to run the same suite against a deployed PWA.

The latest measured release results and scope boundary are recorded in [docs/frontend-release-audit.md](docs/frontend-release-audit.md).

The customer service worker registers only in production builds so local development is not affected by stale caches.
