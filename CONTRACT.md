# Frontend contract

What every app agrees on with the API and with each other. Change this file
in the same commit as the code that changes the contract. The backend's own
record is `../backend/INTEGRATION.md`; the two must agree.

## Hosts and sessions

| Origin | Talks to | Session |
|---|---|---|
| kypstamping.ph | api.kypstamping.ph | none; public endpoints only |
| biz.kypstamping.ph | api.kypstamping.ph | httpOnly cookie, `SameSite=Lax` |
| admin.kypstamping.ph | api.kypstamping.ph | httpOnly cookie, `SameSite=Lax` |
| app.kyp.ph | api.kyp.ph | httpOnly cookie, `SameSite=Lax` |
| kyp.ph | api.kyp.ph | none; public endpoints only |
| localhost:3000 to 3004 | localhost:8000 | cookie; CORS allows 3000 to 3003 today, 3004 must be added |

One API service, two hostnames. `CORS_ORIGINS` on the backend must list every
browser origin above. A preview on `*.vercel.app` is cross-site and gets no
cookie unless `SESSION_COOKIE_SAMESITE=none`; that is the reason every
authenticated call answers 401 with nothing in the network tab.

`NEXT_PUBLIC_API_BASE` is empty in production (same-origin path) or the
absolute API root. It is inlined at build time; changing it after a build
changes nothing.

## Environment variables

Every app ships a `.env.local`; the documented shape is `.env.example`.

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_API_BASE` | where the app reaches the API |
| `NEXT_PUBLIC_BUSINESS_APP_URL` | biz.kypstamping.ph |
| `NEXT_PUBLIC_ADMIN_APP_URL` | admin.kypstamping.ph |
| `NEXT_PUBLIC_CUSTOMER_APP_URL` | app.kyp.ph; the only way an app may name the wallet |
| `NEXT_PUBLIC_SITE_URL` | kypstamping.ph |
| `NEXT_PUBLIC_MARKETPLACE_URL` | kyp.ph; read by the marketplace, not yet in `.env.example` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | marketing site only, consent-gated |

Defaults for local and production live in each app's `src/lib/site.ts`
(marketing site, marketplace). Nowhere else may a hostname be a literal.

## Wire conventions

| | |
|---|---|
| Prefix | `/api/v1` |
| Casing | camelCase on the wire; three legacy snake_case query params exist and the contract test names them |
| Money | integer centavos, never a float; render with `pesoFromCentavos` |
| Time | ISO 8601 with offset; the API never returns display strings |
| Distance | metres; render with `formatDistance` |
| Member code | thirteen-digit EAN-13 starting `29`, stored and sent bare, grouped for display with `formatMemberCode` |
| Errors | HTTP status plus `{ detail, requestId }`; a 422 adds `errors: [{ field, message }]`, field paths as the client sent them |
| Pagination | bare array body with `X-Total-Count` and `Link: rel="next"`; `?limit=` (default 50, max 200) and `?cursor=`; `/analytics/rfm` uses `limit` and `offset` |
| 403 vs 404 | another tenant's resource is 404 |
| Idempotency | `Idempotency-Key` on every sale and redemption; the same key returns the original result; a concurrent double-submit is 409 |
| Rate limits | per caller per minute: 600 reads, 120 writes, 30 on `/auth/*` and `/public/*`; 429 carries `Retry-After`; treat as wait and retry once |
| Tracing | every response carries `X-Request-Id`; show `requestId` in error states so a screenshot maps to a log line |

## Auth flows

| App | Flow |
|---|---|
| business-web | `POST /auth/login`, then the workspace picker (skipped for one workspace), then the session. Sign-up is `POST /auth/register/business`; onboarding is `POST /auth/workspaces`. |
| admin-web | `POST /auth/login`, then `POST /auth/mfa/verify` with a TOTP, then the session. `GET /auth/session` is readable while `mfaPending`. |
| customer-pwa | `POST /auth/otp/request`, then `POST /auth/otp/verify`, then the session. Sign-up is `POST /auth/register/customer`; birthday is optional, stored as day and month. |

Every app calls `GET /auth/session` on boot through `SessionGate`, which
fails closed. A customer session does not open the merchant workspace and
vice versa. Sign-out ends the session on the server. One-time codes are three
per destination per ten minutes; the suites and manual testing share that
budget. The password rule the API enforces is ten characters and no
character classes; copy must state that rule and no other.

## Public endpoints (no session)

| Endpoint | Caller |
|---|---|
| `GET /public/join/{slug}` | the join poster page; an unknown slug renders not-found with `noindex` and answers 200 |
| `GET` and `POST /public/join/{slug}/first-stamp` | the first-stamp offer; today a two-hour token, to become the pending welcome stamp |
| `POST /public/contact` | marketing contact form; `category` is a free string up to 120 characters |
| `POST /public/playbook` | marketing resource request |
| `POST /public/partner-applications`, `PATCH .../heard-from` | the partner application on `/partners` |

The marketplace needs a public Discover read that does not exist yet.
`GET /customer/discover` is session-scoped. Ask the backend for a public,
paged listing before building the directory.

## The stamp-card contract the apps must be ready for

These are what the site promises and the API does not yet enforce. When the
backend ships each one, the app reads it from the response rather than
computing it locally.

| Rule | What the wallet and counter will need from the API |
|---|---|
| Pending welcome stamp | a card state `pending` with `expiresAt` (30 days); the first staff scan returns a card at 2 |
| Cooldown | a refusal with a reason and `nextStampAt`; the counter shows both |
| Minimum spend per stamp | the threshold on the program, so the card and the counter can show it |
| Stamp expiry | one per-program term (`expiryDays`) covering unclaimed stamps and earned rewards, shown on the card before the first stamp |
| Held rewards | rewards stack on the membership; earning continues on a fresh card |
| Customer-approved redemption | the reserve step waits for the customer's approval from the wallet before commit |
| Grandfathering | a card carries its own target, not the program's current one |
| Run window (queued) | `startsAt` and `endsAt` on the program and the card; a 409 outside the window names the date; a card state `closed` after the run ends |
| Close behaviour (queued) | `onClose: "expire" \| "carryOver"` with a successor program; `rewardGraceDays` and a "redeem by" date on held rewards after close |
| Completion limit (queued) | `maxCompletions` on the program; the card returns `completed: true` at the cap |
| Member cap (queued) | `maxMembers`; the poster page and join answer "this card is full" |

## Outbound events and integration vocabulary

Four outbound webhook events are published at `GET /contract`, starting with
`visit.recorded`, and offered as tickboxes in the merchant's Integrations
view. Idempotency keys look like `sale_sc_10482`. The quickstart on the
marketing site is checked against the live endpoint and must stay that way.
Branch ids are `branch_<slug>`. A credential identifies the merchant, so
there is no merchant header.

`POST /counter/offline-sync` is never called from a browser; it needs the
server-side signing secret and is for a POS sidecar. The web counter queues in
`localStorage` and replays through `recordVisit` with the visit's own key.

## Plan and gating vocabulary

Plan keys are `launch`, `core`, `grow`, `scale`; display names `Launch`,
`Core`, `Grow`, `Scale`. Only Launch is purchasable; `POST /billing/plan`
answers 409 for anything else and there is no admin route to move a merchant
up. The feature-to-tier mapping is `featureMatrix` in `plans.ts`; an app
renders a gate with `PlanTag` and the tier named there, never a tier of its
own.

Billing, decided 2026-09-04: `GET /business/billing` will carry
`paidTiersOpen` and `creditPurchasesOpen`, read from two platform flags the
admin app toggles, both off through the beta. While off, the business app
shows the ladder with the site's prices, each paid tier marked not open yet
and free during the beta, and SMS credits with the rate and "opens with
billing"; no dates. When on, payment is QR Ph only: the pay endpoints return
a base64 QR image and an `expiresAt`, and the app polls the payment status
while it is on screen. The full shape is in `../backend/CONTRACT.md` under
"Billing and PayMongo".

## What each app may claim on screen

- Nothing "simulated", "demo", "stubbed" or "coming soon" that the site does
  not also say. The site says coming soon for the paid tiers, Viber and
  WhatsApp, wallet passes, the API sandbox and webhook signing.
- No testimonials, customer names, counts of live merchants or case studies.
- No entity name, address, registration or DPO.
- No claim that staff fraud is prevented.
- No analytics in the signed-in apps or the marketplace.

## Preview mode (decided 2026-09-04)

The frontend is built ahead of the backend so the whole product can be
seen. `packages/api/src/preview.ts` wraps a read of a route that does not
exist yet: the API is called first, and only a 404, 405 or 501 with
`NEXT_PUBLIC_PREVIEW_UNBUILT=true` falls back to the typed samples in
`preview-samples.ts`. Every sample row carries `preview: true`;
`PreviewBadge` renders where `isPreview(data)` is true and writes beside it
are disabled with `PREVIEW_WRITE_REASON`. The flag is local only. The hooks
ahead of the backend are the last section of `queries.ts`; the routes they
expect are the last section of `endpoints.ts` and mirror
`../backend/CONTRACT.md`. The day a route ships, the sample stops rendering
with no frontend change.

## Adding or changing a call

1. Check `http://localhost:8000/openapi.json` and the live response.
2. Add the function to `endpoints.ts`, the hook to `queries.ts` or
   `mutations.ts`, the key to `keys.ts`, the type to `types.ts`.
3. Add a case to `contract.test.ts` that asserts on the real body, including
   every member of any string-literal union.
4. Name the narrowest invalidation prefix that is still correct.
5. Run `npm test -w @kypstamping/api` with the backend up.
