# KYP Rewards frontends

Five Next.js applications on two domains share a design package and one data
layer over the FastAPI service. `AGENTS.md` is how to work here, `PROJECT.md`
is the product as the marketing site defines it, `CONTRACT.md` is the wire
and cross-app contract, and each app carries its own `AGENTS.md`.

| App | Audience | Local | Production |
|---|---|---|---|
| `apps/marketing-site` | shop owners | http://localhost:3003 | kyprewards.com |
| `apps/business-web` | owners and staff | http://localhost:3000 | biz.kyprewards.com |
| `apps/admin-web` | platform operators | http://localhost:3001 | admin.kyprewards.com |
| `apps/customer-pwa` | shoppers | http://localhost:3002 | app.kyp.ph |
| `apps/marketplace` | shoppers, public | http://localhost:3004 | kyp.ph |

kyprewards.com speaks to merchants and is the product spec; kyp.ph and the
wallet under it speak to shoppers. The marketing site never links to the
wallet, and the join poster lands on the customer domain.

All apps read and write the live FastAPI service. Start the backend first
(`cd ../backend && make up && make migrate && make seed`); with it down,
every screen shows its error state rather than a fixture. Email is delivered
to Mailpit (`http://localhost:8025`); SMS is a stub locally and push needs
`VAPID_*` keys, so an SMS one-time code is mirrored to Mailpit and readable from
`GET /api/v1/_dev/messages?purpose=otp`.

## Start the connected demo

One Sweet Crumbs visit runs through every product: the same customer,
branch, purchase, loyalty balance, event ID, request ID and delivery state,
seeded into the API. The private apps sit behind a real session cookie the
browser code cannot read, so start at the login screen; a bare hash link
cannot survive the redirect:

- Customer wallet: `http://localhost:3002/login`, then Wallet, Discover, or the QR button
- Business counter: `http://localhost:3000/login`, then Scan
- Business POS/API setup: `http://localhost:3000/login`, then Integrations
- Platform integration control: `http://localhost:3001/login`, then Integrations

Once signed in, the in-app hash routes (`#scan`, `#integrations`, `#discover`)
are linkable and the browser back button works.

`@kyprewards/api` is the whole data layer: `endpoints.ts` is one function
per call, `queries.ts` and `mutations.ts` are the hooks, `keys.ts` is what
invalidation targets, and `contract.test.ts` runs all of it against the live
service. What remains of `packages/demo-data` is one narrated scenario used
by the marketing site.

## Authentication

Sign-in is the API's answer, not a browser flag: the session is an httpOnly
cookie this code cannot read.

- Business: `/login`, then the dashboard. An owner with one workspace does
  not pass a picker. Recovery, verification and invitation routes are at
  `/forgot-password`, `/verify` and `/accept-invite`.
- Platform admin: `/login`, password, then TOTP at `/verify`.
- Customer: `/login`, one-time code, then the wallet. New accounts at
  `/create-account`.
- The member code is a thirteen-digit EAN-13, stored on the account and
  reissuable. `formatMemberCode` in `packages/ui/src/format.ts` groups it for
  display; it is always stored and sent bare.
- Seeded accounts: `mara@sweetcrumbs.ph` (business owner) and
  `admin@kyprewards.com` (platform), both with password `DemoPass123!`.
- The admin's second factor is a real TOTP over the seeded secret; the
  customer's code is the one the API sent, readable from the dev sink or in
  Mailpit. Set `OTP_DEV_CODE=123456` in the backend `.env` to pin it, local
  only.
- One-time codes are limited to three per destination per ten minutes.

## Run with Node

```powershell
npm.cmd install
npm.cmd run dev:business
npm.cmd run dev:admin
npm.cmd run dev:customer
npm.cmd run dev:marketing
npm.cmd run dev --workspace @kyprewards/marketplace
```

Or with Docker: `docker compose -f compose.frontend.yaml up`.

Every app's `.env.local` sets `NEXT_PUBLIC_PREVIEW_UNBUILT=true`. With it,
a screen whose endpoint the API does not serve yet renders typed sample
data under a "Preview, not connected" badge, with its writes disabled, so
the whole product can be seen locally. Leave it empty in production. See
`CONTRACT.md`, "Preview mode". `node scripts/shots.mjs` walks all five apps
and drops screenshots in `design/shots/` for a visual review.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run audit:controls
npm.cmd run test:format
npm.cmd test -w @kyprewards/api
```

The QA suites below drive real browsers against the real API. Run them one
at a time, and reseed (`cd ../backend && make seed`) before a run you intend
to trust; the backend's own `pytest` uses the same database, so running the
two together is how a suite fails on the other's leftovers. Sign-in is rate
limited, so a tight rerun loop answers 429; each suite says so rather than
failing as a broken app.

`test:format` checks the shared money, greeting, relative-time and birthday
helpers in `packages/ui/src/format.ts`.

`audit:controls` checks that every rendered button has an action and every
link has a destination, and that internal destinations resolve to a route the
app actually serves.

`qa:marketing` renders every page of the public site, then submits the
contact form, walks the partner application, drives the estimator and flips
the wallet card against the real API.

`qa:customer-auth` runs the customer login, verification and signup journeys
at phone and desktop widths, reading the one-time code the service actually
sent. Set `CUSTOMER_APP_URL` to run it against a deployed wallet and
`KYP_TEST_API` if the API is not on `localhost:8000`.

`qa:private-apps` signs into the business and platform workspaces with a
real password and a live TOTP, walks every view, and re-checks the
interactions that have to outlive navigation. It fails on any 4xx or 5xx the
apps provoke except a 402, which is a plan gate a card renders. Set
`BUSINESS_APP_URL` and `ADMIN_APP_URL` to point it at a deployment.

`qa:merchant` and `qa:wallet` walk the two journeys a real person makes:
sign in, stamp, redeem, refund, join, leave. `qa:edges` drives the awkward
paths through the API instead of the UI: doing a thing twice, the eight
program types at the till, and whether what the merchant just did shows up
for the customer.

`qa:tenants` walks six seeded merchants on three plans with five feature
mixes, then asks whether any can read, stamp or spend anything belonging to
another.

`qa:refusals` provokes refusals on purpose and checks the screen says so. It
reads the whole page while the toast is still up, because the toast renders
outside `#main-content`.

`qa:free-tier` registers a real business through the real endpoints, keeps it
on Launch, and checks that somebody who signs up today and pays nothing gets
a working stamp card.

The customer service worker registers only in production builds so local
development is not affected by stale caches.

## Documents

- `AGENTS.md`, `PROJECT.md`, `CONTRACT.md` at this level; `apps/*/AGENTS.md`
  per app.
- `docs/BRAND.md`: the mark, palette and type every surface is built from.
- `docs/philippines-loyalty-benchmark.md`: the market research behind the
  prices and the feature matrix.
- `../backend/INTEGRATION.md` and `../backend/BACKLOG.md`: the API's own
  record of what is wired and what is left.
