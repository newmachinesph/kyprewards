# KYP Rewards

Digital stamp cards and loyalty for Philippine local businesses. Customers carry
one code across every shop they join; staff record a visit from any phone,
tablet or browser beside the register; nothing to install and no POS to
replace. Built around the Data Privacy Act and NPC Circular 2023-04.

Two brands, two audiences: **KYP Rewards** sells to shop owners on
[kyprewards.com](https://kyprewards.com); **KYP** is what shoppers see on
[kyp.ph](https://kyp.ph) and in the wallet.

This repository holds every frontend: five Next.js apps, an Expo mobile app,
and the shared packages they build on. The FastAPI backend is a separate
repository, checked out next to this one as `../backend`.

## What's in this repo

| Path | What it is | Audience | Local | Production |
|---|---|---|---|---|
| `apps/marketing-site` | Product site and spec | shop owners | http://localhost:3003 | kyprewards.com |
| `apps/business-web` | Counter (scan, stamp, redeem) and owner workspace | owners and staff | http://localhost:3000 | biz.kyprewards.com |
| `apps/admin-web` | Platform administration | platform operators | http://localhost:3001 | admin.kyprewards.com |
| `apps/customer-pwa` | Installable wallet | shoppers | http://localhost:3002 | app.kyp.ph |
| `apps/marketplace` | Discover: every shop with a live program | shoppers, public | http://localhost:3004 | kyp.ph |
| `apps/mobile` | Android and iOS wallet (Expo), alongside the web wallet | shoppers | Expo dev server | EAS builds |
| `packages/api` | The whole data layer over the API: endpoints, React Query hooks, cache keys | all apps | | |
| `packages/ui` | Design tokens, the lockup and shared formatting helpers | all apps | | |
| `packages/demo-data` | One narrated scenario used by the marketing site | marketing site | | |

kyprewards.com speaks to merchants and is the product spec; kyp.ph and the
wallet under it speak to shoppers. The marketing site never links to the
wallet, and the join poster lands on the customer domain.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript 6, Tailwind CSS 4
- TanStack Query for every read and write, through `@kyprewards/api`
- Expo SDK 57 and React Native 0.86 for the mobile app
- npm workspaces; ESLint 9; Playwright for the QA suites
- Sentry and Google Analytics, both optional and set by environment

## Getting started

### Prerequisites

- Node.js 20.9 or newer and npm
- The backend repository at `../backend`, with Docker for its services
- Docker, only if you want to run the frontends in containers

### 1. Start the backend

Every app reads and writes the live FastAPI service. With it down, each
screen shows its error state rather than a fixture.

```bash
cd ../backend && make up && make migrate && make seed
```

Email is delivered to Mailpit (http://localhost:8025). SMS is a stub locally
and push needs `VAPID_*` keys, so an SMS one-time code is mirrored to Mailpit
and readable from `GET /api/v1/_dev/messages?purpose=otp`.

### 2. Configure

Each app reads a `.env.local`; `.env.example` lists the variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE` | Base URL of the FastAPI service |
| `NEXT_PUBLIC_BUSINESS_APP_URL`, `NEXT_PUBLIC_ADMIN_APP_URL`, `NEXT_PUBLIC_CUSTOMER_APP_URL`, `NEXT_PUBLIC_MARKETPLACE_URL`, `NEXT_PUBLIC_SITE_URL` | Where each app links to the others |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in |
| `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Error reporting (optional) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Analytics (optional) |
| `NEXT_PUBLIC_PREVIEW_UNBUILT` | Preview mode, below. Leave empty in production |

With `NEXT_PUBLIC_PREVIEW_UNBUILT=true`, a screen whose endpoint the API does
not serve yet renders typed sample data under a "Preview, not connected"
badge, with its writes disabled, so the whole product can be seen locally.
See `CONTRACT.md`, "Preview mode".

### 3. Run

```bash
npm install
npm run dev:business      # http://localhost:3000
npm run dev:admin         # http://localhost:3001
npm run dev:customer      # http://localhost:3002
npm run dev:marketing     # http://localhost:3003
npm run dev:marketplace   # http://localhost:3004
npm run dev:mobile        # Expo dev server; see docs/MOBILE.md
```

Or run the web apps in Docker: `docker compose -f compose.frontend.yaml up`.

### 4. Walk the connected demo

One Sweet Crumbs visit runs through every product: the same customer, branch,
purchase, loyalty balance, event ID, request ID and delivery state, seeded
into the API. The private apps sit behind a session cookie the browser code
cannot read, so start at the login screen; a bare hash link cannot survive
the redirect.

- Customer wallet: http://localhost:3002/login, then Wallet, Discover, or the QR button
- Business counter: http://localhost:3000/login, then Scan
- Business POS/API setup: http://localhost:3000/login, then Integrations
- Platform integration control: http://localhost:3001/login, then Integrations

Once signed in, the in-app hash routes (`#scan`, `#integrations`, `#discover`)
are linkable and the browser back button works.

**Local development seed only.** `make seed` creates `mara@sweetcrumbs.ph`
(business owner) and `admin@kyprewards.com` (platform admin), both with the
password `DemoPass123!`. The admin's second factor is a real TOTP over the
secret the seed prints. These accounts exist only in a locally seeded
database.

## Authentication

Sign-in is the API's answer, not a browser flag: the session is an httpOnly
cookie this code cannot read.

- **Business:** `/login`, then the dashboard. An owner with one workspace
  skips the picker. Recovery, verification and invitations are at
  `/forgot-password`, `/verify` and `/accept-invite`.
- **Platform admin:** `/login`, password, then a TOTP at `/verify`.
- **Customer:** `/login` with a one-time code, then the wallet. New accounts
  at `/create-account`. Locally the code is readable from Mailpit or the dev
  sink; set `OTP_DEV_CODE=123456` in the backend `.env` to pin it.
- One-time codes are limited to three per destination per ten minutes.
- The member code is a thirteen-digit EAN-13, stored on the account and
  reissuable. `formatMemberCode` in `packages/ui/src/format.ts` groups it for
  display; it is always stored and sent bare.

## Data layer

`@kyprewards/api` is the whole data layer: `endpoints.ts` is one function per
call, `queries.ts` and `mutations.ts` are the hooks, `keys.ts` is what
invalidation targets, and `contract.test.ts` runs all of it against the live
service.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
npm run audit:controls
npm run test:format
npm test -w @kyprewards/api
```

- `audit:controls`: every rendered button has an action, every link has a
  destination, and internal destinations resolve to a route the app serves.
- `test:format`: the shared money, greeting, relative-time and birthday
  helpers in `packages/ui/src/format.ts`.
- `node scripts/shots.mjs` walks all five web apps and saves screenshots to
  `design/shots/` for a visual review.

## QA suites

These drive real browsers against the real API. Run them one at a time and
reseed (`cd ../backend && make seed`) before a run you intend to trust: the
backend's own `pytest` uses the same database, so running both together makes
a suite fail on the other's leftovers. Sign-in is rate limited, so a tight
rerun loop gets 429s; each suite reports that rather than failing as a broken
app.

| Script | What it covers |
|---|---|
| `qa:marketing` | Renders every page of the public site, then submits the contact form, walks the partner application, drives the estimator and flips the wallet card |
| `qa:marketplace` | Every page of kyp.ph and the two ways out of it |
| `qa:customer-auth` | Customer login, verification and signup at phone and desktop widths, reading the one-time code the service sent |
| `qa:private-apps` | Signs into the business and platform workspaces with a password and live TOTP, walks every view, and fails on any 4xx or 5xx except a 402 plan gate |
| `qa:merchant`, `qa:wallet` | The two journeys a real person makes: sign in, stamp, redeem, refund, join, leave |
| `qa:edges` | The awkward paths through the API: doing a thing twice, the eight program types at the till, and whether the merchant's action shows up for the customer |
| `qa:tenants` | Six seeded merchants on three plans with five feature mixes, checking none can read, stamp or spend another's data |
| `qa:refusals` | Provokes refusals on purpose and checks the screen says so |
| `qa:free-tier` | Registers a business through the real endpoints, keeps it on the free Launch plan, and checks it gets a working stamp card |
| `qa:journey` | The free tier as four people live it, start to finish, from a shop owner who has never heard of KYP onward |
| `qa:fuzz` | Randomised model checking of the free tier: invents its own sequences instead of chosen scenarios |
| `qa:all` | Every suite, in order, against a freshly seeded database |

To point a suite at a deployment instead of localhost, set `CUSTOMER_APP_URL`,
`BUSINESS_APP_URL`, `ADMIN_APP_URL` and `KYP_TEST_API` as needed.

The customer service worker registers only in production builds, so local
development is not affected by stale caches.

## Documents

- `AGENTS.md`: how to work in this repo; each app has its own `apps/*/AGENTS.md`.
- `PROJECT.md`: the product as the marketing site defines it.
- `CONTRACT.md`: the wire and cross-app contract with the API.
- `docs/BRAND.md`: the mark, palette and type every surface is built from.
- `docs/MOBILE.md`: the mobile app's plan, build and run instructions.
- `docs/DEPLOY.md`: how each web app is deployed.
- `docs/philippines-loyalty-benchmark.md`: the market research behind the
  prices and the feature matrix.
- `../backend/INTEGRATION.md` and `../backend/BACKLOG.md`: the API's record of
  what is wired and what is left.

## Deployment

Each web app is its own Vercel project, deployed from the CLI rather than on
git push; the mobile app builds with EAS. See `docs/DEPLOY.md` and
`docs/MOBILE.md`.

## License

MIT. See [LICENSE](LICENSE).
