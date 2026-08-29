# Frontend synergy audit

Audit date: 28 August 2026
Scope: all four apps, `packages/ui`, `packages/demo-data`, and the docs that describe them.
Premise: the demo is treated as if it were a finished product. Findings are places where a
surface claims something the rest of the suite does not agree with, an action that does not
land, or a shape the future FastAPI service cannot be dropped into.

Gates at time of audit: `typecheck` pass, `build` pass (4/4), `lint` 0 errors / 5 warnings,
`audit:controls` pass across 81 files.

---

## Status — 28 August 2026

Every finding below has been reconciled unless this section says otherwise.

Gates after the work: `typecheck` pass, `build` pass (4/4), `lint` 0 errors / 3 warnings
(all `no-img-element` on intentionally unoptimised demo photography), `audit:controls`
pass across 83 files and 35 routes, `test:format` pass.

**What changed structurally**

- `packages/demo-data` gained `types.ts` (the shapes the service must return, with the
  narrow unions the UI branches on) and `api.ts` (the swap point — every accessor already
  async, already typed, resolving the local fixture for now). The one JSON-to-union
  assertion per accessor lives only in that file.
- The fixture gained a `contract` block: API base, ID prefixes, idempotency key format,
  and the inbound and outbound event names. The business quickstart, the subscription
  list, and the platform control room all read from it, so there is one vocabulary.
- Records carry stable identifiers (`businessId`, `branchId`, `merchantId`,
  `organizationId`) alongside display names, and time-bearing records carry ISO
  timestamps alongside their display strings.
- `admin-web` and `customer-pwa` gained stores (`AdminState`, `CustomerState`) to match
  `business-web`. Nothing a person changes is destroyed by navigation any more.
- `packages/ui/src/format.ts` holds the money, greeting, relative-time, and
  birthday-window helpers, with `npm run test:format` behind them. Writing that check
  caught a rounding bug in `pesoCompact` before it shipped.
- `scripts/audit-controls.mjs` now resolves internal link destinations against the routes
  each app serves, on **any** component carrying an `href` — not just `a` and `Link`. The
  dead `/demo` links were on a `SiteButton`, which is exactly why the old check missed
  them. Verified by reintroducing the bad link and watching the audit fail.

**Deliberately not changed**

| # | Why |
|---|---|
| 4.5 | Adopting `TableHead` across seven tables is a behaviour-preserving refactor with real visual risk and no user-facing gain. Worth doing, but not mixed into a correctness pass. |
| 6.2 | Nothing surviving a page reload is the intended scope of a session-length demo. The stores are the seam; persistence is the service's job. |
| 6.8 | The `"latest"` pins are held by the lockfile today. Pinning them is a dependency decision with its own verification, not part of this pass. |

**Partially reconciled**

| # | What is left |
|---|---|
| 1.7 | The two platform counts now derive from one `recoveryQueue`. The merchant delivery log still shows its own tenant-scoped failures, which is a different scope and correct — but nothing yet states that on screen. |
| 5.11 | The shared `DemoBadge` is now on the customer profile as well. The admin control room still renders its own inline "Demo control data" pill. |
| 6.7 | ISO timestamps are in the fixture and `relativeTime` is written and tested, but views still render the fixture's display strings. The wiring is available, not yet applied. |

---

## 0. Fix first

**`/demo` is linked twice from the homepage and the route does not exist.**
`apps/marketing-site/src/app/page.tsx:74` ("Take the product tour", hero secondary CTA) and
`:217` ("Tour all four apps"). The route was removed; the links were not. Both 404 in
production. `README.md` still points at `http://localhost:3003/demo` in two places and
`docs/frontend-release-audit.md` still lists "a guided four-app demo" as shipped coverage.

`scripts/audit-controls.mjs` did not catch this because it verifies a link *has* a
destination, not that the destination resolves.

**Offline QR silently fails.** `renderQrDataUrl` does `await import("qrcode")`, so the
codec arrives in a lazy chunk. `apps/customer-pwa/public/sw.js` precaches only `/`,
`/offline`, and the manifest; other assets are cached on first fetch. A customer who
installs the PWA and never opens "My QR" while online gets a permanently pulsing skeleton
when they open it at the counter with no signal — `QrImage` catches the failure and sets
`src` to `null` with no error state. This is the one flow the product promises works
offline ("Works without data. Save it to your photos…").

---

## 1. The shared scenario does not hold

`README.md` and `docs/frontend-release-audit.md` both claim all four apps show "the same
customer, tenant, branch, purchase, balance, **event ID, request ID**, and status". Three
of the four do. The fourth disagrees, and the vocabulary around it disagrees five ways.

| # | Finding | Where |
|---|---|---|
| 1.1 | Business delivery log uses `evt_01J7SC10482` / `req_7G2K9P`. Shared scenario, admin control room, business scan receipt and customer activity (`act_1.reference`) all use `evt_SC_10482` / `req_SC_10482`. The delivery desk is the only surface that disagrees. | `business-web/src/components/DemoState.tsx:89-118` |
| 1.2 | Five names for one visit: `visit.recorded` (shared scenario + admin), `loyalty.transaction.completed` (business delivery log + outbound subscriptions), `sale.completed` (business inbound accepted events). Admin's recovery queue then lists `sale.refunded` — an *inbound* POS event — as an outbound delivery awaiting replay. | `kypstamping-demo.json`, `DemoState.tsx`, `IntegrationsView.tsx:727,780`, `AdminIntegrationsView.tsx:395` |
| 1.3 | Three idempotency conventions: `visit_SC_10482` (shared), `sale_sc_10482` (business quickstart), `sale_sc_10482` (marketing integrations). No key format is documented anywhere. | `kypstamping-demo.json`, `IntegrationsView.tsx:144`, `marketing integrations/page.tsx:250` |
| 1.4 | Four identifiers for one tenant: `biz_sweet_crumbs` (business profile + shared scenario), `biz_1` (admin tenant table), `mrc_sweet_crumbs` + `org_santos_foods` (integration header + curl), `sweet-crumbs` (join slug). Display name also splits: "Sweet Crumbs" vs "Sweet Crumbs Bakery". Admin's directory cannot be joined to the business profile by ID. | across all apps |
| 1.5 | Scan view prefills the shared ₱286 purchase but hardcodes `stampsBefore = 5`, producing 6 of 8. The shared event says 4 → 5, and the recent-activity card *on the same screen* shows that event already recorded at 5 of 8. | `BusinessViews.tsx:81` |
| 1.6 | Business and admin disagree on how Sweet Crumbs connects: business defaults to "KYPStamping terminal" (sidecar); admin's tenant table says "Custom API". | `IntegrationsView.tsx:110`, `AdminIntegrationsView.tsx:80` |
| 1.7 | Delivery failures counted three ways, none derived: business log has 1 Failed + 1 Retrying; admin dashboard says "2 delivery anomalies"; admin integrations says "3 deliveries need replay". | `DemoState.tsx`, `AdminDashboard.tsx:465`, `AdminIntegrationsView.tsx:389` |
| 1.8 | The "Main counter" credential is scoped to Legazpi Village, which `business.locations` marks `status: "Setup"`. The live counter in the shared scenario is Kapitolyo. The new-key form also defaults to Legazpi Village. | `DemoState.tsx:60`, `IntegrationsView.tsx:124` |
| 1.9 | The quickstart curl sends `branch_id: "br_legazpi"` and `amount: 48500` (₱485.00) on a page whose own scenario is ₱286 at Kapitolyo. Branch IDs in the fixture are `branch_pasig` / `branch_bgc` / `branch_makati`. | `IntegrationsView.tsx:140-152` |

---

## 2. Actions that announce a result they do not produce

| # | Finding | Where |
|---|---|---|
| 2.1 | Onboarding writes `kypstamping-business-profile` (name, category, city, locations, program, method) with the comment "so the workspace the merchant lands in reflects what they just configured". Nothing reads the key. Configure "Bean There, 1 location, Cebu" and the workspace is still Sweet Crumbs / Pasig / 3 branches. | `BusinessOnboarding.tsx:128-135` |
| 2.2 | Customer create-account writes `kypstamping-customer-signup-name`. Nothing reads it. The wallet still greets "Jacqueline." | `packages/ui/src/auth.tsx:695` |
| 2.3 | Customer "Save changes" on personal info updates `personal` state that no other screen reads. `ProfileView`, `JoinConsentDialog`, and the privacy centre all read `customerDemo.profile.*` directly. | `CustomerApp.tsx:1556` |
| 2.4 | "Leave a business" marks the row "Left". The wallet card stays, "Joined businesses" still shows Active, and the count (`customerDemo.wallet.length`) does not move. | `CustomerApp.tsx:1673`, `:787` |
| 2.5 | Customer channel toggles do not reach the privacy centre rows that describe the same permissions. | `CustomerApp.tsx:1591`, `:1735` |
| 2.6 | Deletion and export requests set flags no other surface reflects — no pending banner on Profile. | `CustomerApp.tsx:1820,1859` |
| 2.7 | Admin support triage (assignee, internal note, status) is per-view `useState`. It resets on every navigation, and neither the sidebar badge nor the "N open" pill moves when a ticket status changes. | `AdminViews.tsx:493-496` |
| 2.8 | Admin platform-settings flags reset on navigation; "Save changes" only toasts. | `AdminViews.tsx:920` |
| 2.9 | "Replay failed events" toasts "Three sample webhook deliveries moved into the replay queue". The counter stays at 3 and nothing in the list changes. | `AdminIntegrationsView.tsx:129` |
| 2.10 | Business dashboard `testStampDone` is component state, so the setup ledger reverts 5/5 → 4/5 the moment you navigate away and back. | `BusinessDashboard.tsx:135` |
| 2.11 | "Invite staff" pushes to `/accept-invite` — the *recipient's* acceptance screen, not an invite composer. | `BusinessViews.tsx:1895` |
| 2.12 | `updateProgramRule`, `settings`, and `setSetting` on `DemoState` have no callers. "Edit rules" only toasts. | `DemoState.tsx:187,206` |
| 2.13 | Campaign "Audience", "Send time", and "Frequency policy" selects are uncontrolled and never reach `scheduleCampaign`; the scheduled row always reads "N selected customers". | `BusinessViews.tsx:1381,1497,1508` |
| 2.14 | "Save endpoint" toasts, but `webhookUrl` is already bound on change — the button does nothing. | `IntegrationsView.tsx:815` |
| 2.15 | Environment toggles are cosmetic. Business "Production preview" leaves existing `st_test_*` keys on screen. Admin sandbox changes 2 of 4 tiles while the adapter registry (59 connections) and tenant table stay production. | `IntegrationsView.tsx:160`, `AdminIntegrationsView.tsx:204` |

---

## 3. Data that contradicts the fixture or itself

| # | Finding | Where |
|---|---|---|
| 3.1 | Analytics shows "Campaign-attributed ₱76.4k". `metrics.campaignRevenue` is 136,300 — the exact sum of `campaigns[].revenue`. The rendered figure contradicts the data beside it. | `BusinessViews.tsx:1804` |
| 3.2 | `metrics.repeatRate` (43.8) is defined and never rendered anywhere. | `kypstamping-demo.json` |
| 3.3 | `cmp_203` "BGC opening week" has `status: "Scheduled"` with ₱61,200 revenue and 188 visits. | `kypstamping-demo.json` |
| 3.4 | Consent history says "Joined Sweet Crumbs Bakery · 12 Feb 2026" while `customer.profile.memberSince` is "August 2026". 12 Feb 2026 is the *business's* platform join date (`admin.businesses[0].joined`). | `CustomerApp.tsx:1701` |
| 3.5 | Redemptions hardcodes "Approval rate 98.6%" and "Reward value this month ₱28,400". The ₱28,400 is `prog_stamps.liability` — outstanding liability, not redeemed value. | `BusinessViews.tsx:1183-1191` |
| 3.6 | `chartByPeriod[].peakIndex` is defined but the chart hardcodes `index === 10`. | `BusinessDashboard.tsx:44-48,249` |
| 3.7 | Admin dashboard `queue` hardcodes the first three support tickets with a different age format ("18m" vs the fixture's "18 min"). | `AdminDashboard.tsx:57-79` |
| 3.8 | Support priority enum drifts: High / Normal / **Medium** (`sup_7`). The UI treats everything not "High" identically, so Medium is invisible. Ages drift too: "2 hr" (`sup_4`) vs "2 h" (`sup_6`). | `kypstamping-demo.json`, `AdminViews.tsx:536` |
| 3.9 | The dashboard "Program studio" keeps a *third* parallel program list (`programTypes` + `programPreviews`) whose names do not match `business.programs` ("Stamp card" vs "Stamps"). Selecting Membership then "Configure" navigates to Programs without selecting it. | `BusinessDashboard.tsx:57-105` |
| 3.10 | `WalletView` hand-renders the four cards with hardcoded 640 pts / 64% bar / 3 of 5 / ₱740, while `WalletSheet`, the leave list, and the joined-businesses list all read `customer.wallet`. Two sources for one dataset. | `CustomerApp.tsx:399-470` |
| 3.11 | "Customer accounts 18,492" sits beside tenant member counts summing to 26,206, with no note that one person can hold several memberships. | `AdminViews.tsx:265` |

---

## 4. Filters, enums, and empty states

| # | Finding | Where |
|---|---|---|
| 4.1 | Wallet category chips are `All / Cafés / Food / Wellness / Retail`; the data uses `Bakery / Café / Wellness / Retail / Fitness / Grooming`. `newlyJoined` compares `category === business.category`, so a newly joined café never matches "Cafés" and a bakery never matches "Food" — cards vanish under a filter with no explanation. | `CustomerApp.tsx:336,384` |
| 4.2 | Message-log channel tabs omit Viber, which is a selectable campaign channel. A Viber send would be unfilterable. | `BusinessViews.tsx:1679` |
| 4.3 | Admin shows 6 of 284 tenants, 4 of 59 connections, and 7 support tickets with no "sample of N" label. Two tickets reference tenants absent from the directory (Harbor Grind Coffee, "Platform (customer)"), which reads as a data bug rather than a sample. | `AdminViews.tsx`, `AdminIntegrationsView.tsx` |
| 4.4 | `BirthdayView` filters a literal `["29 August", "30 August", "8 September"]` under the heading "Next 30 days" — correct only on today's date. The channel pill also counts channels from `smsConsent` alone, ignoring email and push consent. | `BusinessViews.tsx:1006,1053` |
| 4.5 | `@kypstamping/ui/shell` exports `TableHead` precisely to stop header drift; seven tables hand-roll `<thead>` instead (business customers, redemptions, staff, message log; admin businesses, audit, economics, tenant connections). | across business-web + admin-web |

---

## 5. Copy that undersells or misdescribes what is built

| # | Finding | Where |
|---|---|---|
| 5.1 | The join page's "Opening hours" row contains branch *status* copy, not hours. Real hours exist in `customer.discover[].hours` but the marketing page reads `demoData.business`, which has none. | `join/[slug]/page.tsx:157` |
| 5.2 | Business settings is titled "Channels & billing", and README + `llms.txt` both promise "billing". There is a plan card and a "Manage plan" toast — no invoices, payment method, or usage history. | `BusinessViews.tsx:1988` |
| 5.3 | `/product` states "Works offline: Yes, queued and signed" unqualified; the pricing matrix restricts the offline counter queue to Grow and Scale. | `product/page.tsx:161` |
| 5.4 | Campaign email is charged at ₱0.025/message from the first message while its own label reads "Uses allowance" (Grow includes 25,000). | `BusinessViews.tsx:1250-1256` |
| 5.5 | "Good morning" is hardcoded at any hour, in both the business dashboard and the customer home. | `BusinessDashboard.tsx:150`, `CustomerApp.tsx:210` |
| 5.6 | `IntegrationsView` renders `PlanTag plan="Scale"` (which reads "Scale feature") while the copy explains Grow has it as a preview. The sidebar entry carries no plan marker at all. | `IntegrationsView.tsx:290` |
| 5.7 | Admin "System posture" correctly computes "5 of 6 services normal", then shows a green tick and a hardcoded list of four healthy items that excludes the degraded SMS adapter it just counted. | `AdminDashboard.tsx:303-325` |
| 5.8 | Weekly-signal "View cohort" navigates to Revenue & margin, which contains no cohort view. The cohort matrix lives in the *business* app's Analytics. | `AdminDashboard.tsx:455` |
| 5.9 | The marketing site has no customer-app entry point in the header or footer. The wallet is reachable only from `/join/[slug]` and one features-page CTA. | `MarketingHeader.tsx`, `MarketingFooter.tsx` |
| 5.10 | "SMS balance 1,842 credits" on a Grow plan that includes 100/month, with no note that credits are prepaid top-ups. | `BusinessViews.tsx:2054` |
| 5.11 | The shared `DemoBadge` is used twice (both in business-web). Admin rolls its own "Demo control data" pill; the customer app discloses only in body copy. Honest everywhere, consistent nowhere. | `packages/ui/src/index.tsx:352` |

---

## 6. Backend-integration readiness

These are the structural items. Everything above is a bug; this section is about whether a
FastAPI response can be dropped in without rewriting the views.

| # | Finding |
|---|---|
| 6.1 | **Only business-web has a store.** `DemoStateProvider` gives it one seam to swap for a fetch layer. Admin has no provider at all — every view owns its own `useState`, so there is nothing to replace. The customer app keeps state at the component root and prop-drills it through `ProfileSheet` with eight props. Two of three private apps need a store before an API can land. |
| 6.2 | **Nothing survives a reload.** Every store is `useState`; `sessionStorage` carries only the auth flag. Fine for a demo, but it means no code path currently distinguishes "server state" from "view state" — which is exactly the distinction the API introduces. |
| 6.3 | **No typed domain layer.** `DemoData = typeof demoData` infers everything from JSON, so `status` is `string` where the code branches on `"Live"` / `"Draft"` / `"Ready"`. `Credential`, `Delivery`, `ProgramDraft`, and `ScheduledCampaign` are declared inside `DemoState.tsx` — a business-web component file — rather than in `@kypstamping/demo-data` where admin and customer could share them. Nothing declares the response shapes the service must produce. |
| 6.4 | **Relations join on display strings.** `activity.business === card.business`, wallet ↔ business, support ticket ↔ tenant, and campaign ↔ message are all matched by name. Combined with the four tenant IDs in §1.4, there is no key a real database could join on. |
| 6.5 | **No fetch boundary.** There is no `lib/api.ts`, no request/response types, and no per-view loading or error state — only route-level `loading.tsx` / `error.tsx`. Every view reads a module-level constant synchronously, so introducing async means editing every view rather than one adapter. |
| 6.6 | **Money has two units on one screen.** Fixtures store pesos as plain numbers (`lifetimeValue: 8120`); the API contract on the same page sends centavos (`amount: 48500`). Nothing reconciles them, and no formatter is shared. |
| 6.7 | **Dates are display strings.** "Today, 9:42 AM", "12 Feb 2026", "18 min ago", "2 hr". No ISO timestamps anywhere, so nothing can sort, localise, or re-derive relative time once real data arrives. This is also why §3.4 and §4.4 drifted. |
| 6.8 | `geist`, `lucide-react`, `@types/react`, `@types/react-dom`, and `eslint-config-next` are pinned to `"latest"`. The lockfile holds them today; a fresh `npm install` on a new machine may not. |

---

## 7. Documentation drift

- `README.md` links `http://localhost:3003/demo` twice and lists "guided four-app demo" in marketing coverage.
- `README.md`'s "Useful direct links" (`/#scan`, `/#integrations`, `/#discover`) all assume no auth gate. `DemoSessionGate` redirects a signed-out visitor to `/login` via `location.replace`, dropping the hash; after login the business app lands on `/workspaces` and then `/`. None of the deep links arrive.
- Marketing CTAs repeat the same mistake: `SiteButton href={businessAppUrl}` and `href={customerAppUrl}` point at app roots that bounce to `/login`, and `${businessAppUrl}/#integrations` loses its hash. `MarketingHeader` gets this right (`${businessAppUrl}/login`); the page CTAs do not.
- `adminAppUrl` is exported from `lib/site.ts` and never used.
- `docs/frontend-release-audit.md` claims the shared event ID and request ID match across apps (§1.1), that a guided four-app demo ships, and that ESLint passes "with no warnings or errors" (currently 5 warnings).
- `scripts/audit-controls.mjs` checks that links have a destination, not that the destination resolves — the gap that let `/demo` survive.

---

## What is working and should not be touched

- `admin.economics` is arithmetically self-consistent: plan MRR sums exactly to `monthlyRecurringRevenue` (176,568), accounts sum to `liveBusinesses` (284), and the computed contribution margin matches `grossMargin` (73.3%). Location member counts sum to the tenant's member count (5,202).
- Pricing has one source (`lib/plans.ts`) feeding the pricing page, the estimator, and `llms.txt`. The estimator's comment records why: a second hand-typed copy previously quoted allowances the pricing page denied.
- Real QR generation with error correction, save, and print — not a decorative bitmap, with the reasoning recorded at the call site.
- Campaign economics are genuinely computed: consent-eligible reach, per-channel cost, Viber-before-SMS routing savings, and a preflight that reports real failure reasons.
- Disclosure is consistently honest: `ProofStrip` ("KYPStamping has no production customers yet"), `DemoActionDialog`'s persistence/network table, the contact and playbook forms, and the `llms.txt` status section.
- Accessibility groundwork: focus trapping in `DemoActionDialog`, skip links in all three private apps, `aria-current`, Enter/Space on interactive table rows, `role="switch"` with `aria-checked` on every toggle, and reduced-motion blocks in all four apps.
- Design tokens are genuinely unified in `packages/ui/src/tokens.css` and imported by all four apps.

One caveat on the last point: `window.scrollTo({ behavior: "smooth" })` in `BusinessShell` and `AdminShell` is a JS API, so the CSS reduced-motion blocks cannot override it.
