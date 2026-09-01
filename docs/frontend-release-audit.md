# Frontend release audit

Audit date: 25 August 2026 · revised 28 August 2026 after the cross-app consistency review in [frontend-synergy-audit.md](frontend-synergy-audit.md)

> **Superseded in part, 1 September 2026.** This audit was taken while the four
> apps were frontend-only. They now read and write the live FastAPI service, so
> the "Scope boundary" section at the end no longer describes the product: state
> survives a reload, authentication is a real server session, and the fixture
> seam it refers to is gone. The automated gates and the accessibility results
> above still stand and are still run. What remains simulated is narrower —
> SMS and push have no transport, and wallet passes are blocked on signing
> certificates. See the README for the current picture.

## Result

All four frontend demos pass the release gate for the current frontend-only scope.

| Surface | Accessibility | Best practices | SEO | Result |
| --- | ---: | ---: | ---: | --- |
| Public marketing site | 100 | 100 | 100 | Pass |
| Business workspace | 100 | 100 | Private/noindex | Pass |
| Platform administration | 100 | 100 | Private/noindex | Pass |
| Customer PWA | 100 | 100 | Private/noindex | Pass |

Scores were revalidated with the latest Lighthouse CLI against the rendered application routes. Private applications intentionally use `noindex, nofollow`; SEO scoring is therefore only a release requirement for the public site.

## Automated gates

- ESLint: pass with no errors. Three warnings remain, all `no-img-element` on demo photography that is intentionally unoptimised.
- TypeScript: pass across every workspace.
- Next.js production build: pass for all four applications.
- Route smoke test: 46 public, private, authentication, PWA, metadata, and machine-readable routes return HTTP 200.
- Static control audit: every rendered `button`/`Button` has an action or form behavior, every link has a destination, and undefined or placeholder actions fail the release check. Internal destinations are now also resolved against the routes each app serves — a link to a deleted route fails the check, on any component that carries an `href`, not only `a` and `Link`.
- Shared formatter checks: `npm run test:format` covers the money, greeting, relative-time, and birthday-window helpers.
- Missing-route behavior: all four applications return branded HTTP 404 pages.
- Package security: `npm audit` reports zero vulnerabilities.
- Dependency graph: clean, with the newest versions compatible with Next.js 16.3.2. TypeScript 7 and ESLint 10 are intentionally not forced because packages in the current Next lint stack do not yet declare support for them.
- Docker Compose: `compose.frontend.yaml` validates successfully.

## Experience coverage

- Every visible button is either a real link, a form submission, or a stateful demo action.
- Business authentication covers password, recovery, verification, workspace selection, invitations, account switching, guarded signed-out state, and logout.
- Platform authentication covers password, SSO preview, MFA, recovery, privileged session messaging, guarded signed-out state, and secure logout.
- Customer authentication covers mobile/email passwordless entry, OTP, passkey preview, account creation, trusted-device choice, guarded signed-out state, and device logout.
- Operational actions that open editors, reviews, setup flows, or runbooks now produce a review-and-confirm dialog instead of only a passive notification.
- Business and admin shells include working mobile navigation, skip links, dashboard shortcuts, filters, and desktop command search.
- One typed shared scenario connects the public site, customer wallet/activity, business counter/ledger, business delivery desk, and admin event delivery view with the same customer, tenant, branch, purchase, balance, event ID, request ID, and status. The merchant delivery log previously used an unrelated ID scheme; it now renders the shared event itself.
- One event vocabulary. `packages/demo-data` carries the contract — API base, ID prefixes, idempotency key format, and the inbound and outbound event names — and the business quickstart, subscription list, and platform control room all read from it.
- Business integration flows cover environment selection, scoped sample keys, signed webhooks, delivery logs, testing, rotation, revocation, quickstart guidance, and visible recovery behavior.
- Admin integration control covers adapter maturity, tenant connection health, credential posture, event metadata, idempotency, and failed-delivery replay without exposing customer payloads or plaintext secrets.
- Customer flows cover wallet search and categories, nearby discovery, joining, QR handoff, notifications, a reference-bearing activity ledger, editable profile details, channel consent, export, leave, and deletion-request states. Profile edits, channel choices, and leaving a program now propagate to every screen that describes them, and the QR codec is pre-fetched so a saved code still renders with no connection.
- Table rows that open detail panels support Enter and Space in addition to pointer input.
- Every app provides loading, route error, root error, and not-found experiences.
- Contrast, focus visibility, reduced-motion behavior, touch targets, responsive layouts, and accessible names were checked in rendered desktop and mobile views.
- The public site includes a four-app index at `/product#apps` with a route into each surface, integration architecture, canonical metadata, Open Graph data, structured data, sitemap, robots rules, `llms.txt`, FAQ content, Philippine-market guidance, and competitor comparison pages. The customer wallet is reachable from the header, the footer, and that index.

## State and backend readiness

- Each private app owns one store above its view switch: `DemoState` (business), `AdminState` (platform), `CustomerState` (customer). Nothing that a person changes is destroyed by navigation.
- `packages/demo-data/src/types.ts` declares the response shapes the planned service must satisfy, including the narrow unions the UI branches on.
- `packages/demo-data/src/api.ts` is the swap point. Every accessor is already async and already returns those types; today each resolves the local fixture. Assertions from JSON into the narrowed types happen only in that file.
- Records carry stable identifiers (`businessId`, `branchId`, `merchantId`, `organizationId`) alongside display names, and time-bearing records carry ISO timestamps alongside their display strings.

## Scope boundary

The current product is a navigable frontend demo backed by typed local JSON. Authentication, persistence, payment capture, QR verification, analytics ingestion, SMS, email, push delivery, API integrations, and background processing remain intentionally simulated until the shared FastAPI service and worker are built. Nothing survives a page reload; state lives for the length of a browser session and no longer.
