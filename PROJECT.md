# KYPStamping — the product, as the marketing site defines it

This is a condensed reading of kypstamping.ph for anyone building the apps.
The site wins over this file; when in doubt open the page named in each
section. Last reconciled against the site on 2026-09-04.

## What it is

A digital loyalty platform for Philippine local businesses, their staff and
their customers. Customers carry one code across every business they join.
Staff record visits from any phone, tablet or browser beside the existing
register. Nothing to install on either side, no POS to replace, prices in
pesos, built around the Data Privacy Act and NPC Circular 2023-04.

Two brands, two audiences: **KYP Stamping** sells to shop owners on
kypstamping.ph; **KYP** is what shoppers see on kyp.ph and in the wallet.

## The surfaces (`/product#apps`, `llms.txt`)

| Surface | App | What the site promises |
|---|---|---|
| The customer's wallet | `customer-pwa` at app.kyp.ph | Installable web app. One private code that works at every shop, saved or printed for offline use. Live stamp progress and reward terms in plain language. Discovery, notifications, full history, per-channel message preferences, data export, leaving a program, deletion requests. Controls over what each shop can see or send. |
| The counter | `business-web` | Scan the customer's code or look up by mobile number, about three seconds, from any device beside the register. One-tap reversals; every action carries a name, a time and a branch. |
| The owner's workspace | `business-web` | Programs, customers, eight program formats, favorite orders, birthday journeys, redemptions, campaigns, delivery logs, analytics, staff roles, integrations, billing, privacy controls. |
| The shop in Discover | `marketplace` at kyp.ph, and the Discover tab in the wallet | Category, neighborhood, hours and live program, listed for every shop with a live program on every plan including free. Featured placement on Grow or as an add-on. |
| Platform administration | `admin-web` | Tenant health, privacy operations, service queues, support, audit ledger, unit economics, network-wide policy. Aggregate views only; scoped support access is time-limited, reason-bound and audited. |

## The stamp card (`/product`, `/faq`, `llms.txt`)

The flow, in order:

1. A customer joins from the shop's public code (poster, sticker, receipt,
   link, Facebook bio) with one mobile number. A **welcome stamp lands marked
   pending**. The public code grants nothing of value by itself.
2. On the first visit staff scan the customer's own code. The pending stamp
   becomes real and the visit earns its own: **the card reads two**.
3. Every visit after is one scan or a mobile-number lookup. A **cooldown** the
   merchant sets, default once a day, refuses a second stamp with a plain
   reason and the time the next one is available.
4. When the card completes the **reward is held**; the **customer approves
   its release on their phone** before staff hand it over. The card resets and
   keeps earning. A member can hold several unredeemed rewards.
5. **Reversals** are one tap, appended to the staff ledger; nothing is erased.

The rules, the same on every plan including Launch:

| Rule | Setting |
|---|---|
| Welcome stamp | merchant toggle, default on; pending stamps expire after 30 days, shown as a date on the card |
| Target | 1 to 30 |
| Cooldown | merchant-set, default once per day per customer per shop |
| Minimum spend per stamp | optional, shown on the card |
| Stamp expiry | off unless set; allowed for free-earned stamps under RA 10962; shown before the first stamp |
| Held until redeemed | always; earning is never blocked |
| Customer approves redemption | always |
| Raising the target | grandfathers cards in progress; new cards start at the new target |
| Staff stamping a friend | **detected** (named ledger, stamps per staff, one-tap reversal), not prevented. Never imply prevention until purchase-verified stamps exist. |

### The run window, the close, and completions (published 2026-09-04)

Two more rules the merchant sets, and the choices that follow from them.
Published on `/pricing` ("The stamp card" rows), `/product` (three rule
cards), `/faq` and `llms.txt` on 2026-09-04; `/roadmap` lists them as live.
Like every stamp-card rule they are on every plan, and whatever is set is
shown on the card before the first stamp.

| Condition | Choice | Default |
|---|---|---|
| Run window | The card runs from a start date to an end date, or forever. No earning outside the window; the card closes by itself at the end. | forever |
| Unfinished stamps at close | Expire, or carry over to a successor stamp card the merchant names. | expire |
| Earned rewards at close | Always honoured. The merchant sets how long after close a held reward can still be redeemed. Invalidating an earned reward is never offered; the FAQ promises rewards already earned are honoured. | 30 days |
| Completions per member per run | One, a number, or unlimited. At the limit the card reads completed and stops earning; the held reward is unaffected. | unlimited |
| Members per run | Not adopted. Revisit when a merchant asks. | |

Decided 2026-09-04: the first four ship with Launch, on every plan. The
site says them; the backend does not enforce them yet.

What does not change: cooldown, minimum spend, expiry and grandfathering
apply inside a run exactly as they do to a card that runs forever. A closed
run is a separate event from raising the target; a card started in a run
keeps its own target until the run closes.

## Plans (`/pricing`, `plans.ts`)

| | Launch | Core | Grow | Scale |
|---|---|---|---|---|
| Price per month | ₱0 | ₱499, or ₱399 yearly | ₱1,290, or ₱990 yearly | ₱3,490, or ₱2,790 yearly |
| Sellable today | yes | no | no | no |
| Staff accounts | 2 | 5 | 15 | 50 |
| Programs at once | 1 | 3 | unlimited | unlimited |
| Branch analytics | none | 3 branches | 5 branches | 10 branches |
| Email campaigns per month | none | 1,000 | 3,000 | 10,000 |
| Push per month | 1,000 | 10,000 | 50,000 | 200,000 |
| KYP Stamping badge on the card | shown | hidden | hidden | hidden |

Customers, branches and transactions are unlimited on every plan. SMS is
add-on credit on every plan (₱0.95 / ₱0.90 / ₱0.85 per segment). The full
row-by-row matrix is `featureMatrix` in `plans.ts`; the roadmap page is
generated from it. Add-ons: Featured in Discover ₱299 a month, extra branch
reporting ₱150 per branch a month, setup with a person ₱1,500 once (free in
beta), email top-up ₱25 per 1,000. Merchants pay by GCash, Maya, Visa or
Mastercard, InstaPay or PESONet. Founding merchants get Core free for three
months when it opens.

Where a lever arrives:

- **Free:** the whole stamp card, join code and printable poster, reversals
  and ledger, in-app messages, push allowance, quiet-hour campaigns with
  spend and reach preview, favorite orders, consent ledger and privacy
  rights, data export, Discover listing, basic profiles and analytics.
- **Core:** seven more program types, bonus windows, promo codes, store
  credit, birthday and anniversary journeys, basic segments, custom fields,
  customer import, role-based permissions, own branding, NFC, per-branch
  reporting and home branch, scheduled campaigns.
- **Grow:** suki tiers, missions, earn by category or item, gifting
  (pasalubong), automated journeys, win-back, geofence nudges, referrals,
  feedback requests, RFM, cohorts, reward liability, staff and branch
  performance, attribution, offline counter queue, wallet passes, API,
  webhooks, POS adapters, featured placement, SMS fallback to gateway.
- **Scale:** approval controls for privileged actions, priority support and
  onboarding, the bigger allowances.

## Channels (`/integrations`, `plans.ts`)

| Channel | Today |
|---|---|
| In-app inbox | live, unlimited, every plan |
| Push | an allowance on every plan; delivery is in-app only until web push exists, which is built last in Phase 1 (D1) |
| Email campaigns | allowance on paid tiers; the API refuses the channel until a campaign sender exists; transactional email always sends. Two senders by design: transactional (ZeptoMail in production) and marketing (provider undecided); locally two Mailpit boxes, so a campaign seen in the transactional box is a bug |
| SMS | credits, ₱0.95 per segment, cost shown before every send |
| Viber and WhatsApp | "connecting", from ₱0.42; never shown as live |
| SMS from the shop's own phone | Android companion app, opens with Core; roadmap |

Consent is per purpose: joining a program is not consent to marketing.
Promotional permissions are asked, stored and withdrawable per channel.
Quiet hours and frequency caps apply to every channel including the free ones.

## Integrations (`/integrations`)

Counter flow first, on any register, no integration. With Grow: a versioned
REST API under `/api/v1`, signed webhooks, isolated POS adapters. Credentials
scoped to account, merchant, branch or terminal; one-time secrets; idempotency
keys on every sale and redemption; reserve, commit and cancel redemption
states. Signing and a sandbox are marked planned on the site.

## Later, not now (`/roadmap`)

Filipino interface; rolling counter code; receipt codes; purchase-verified
stamps; partner rewards across shops. Each waits for a real merchant to ask.

## Deliberately excluded

Leaderboards, spin-to-win, scratch or mystery rewards, waitlist and donation
rewards, achievements, family or corporate accounts, employee perks,
subscription credits. Do not add them because a generic list has them.

## Where each app stands (2026-09-04)

The order in which the gaps close is `../PLAN.md`; the backend's own status
against this spec is `../backend/PROJECT.md`.

All five apps were built to the full spec on 2026-09-04, every tier
included, ahead of the backend. Where the API has no route yet, a local
build renders typed sample data under a "Preview, not connected" badge
(`CONTRACT.md`, "Preview mode"); production shows the honest empty state.

| App | State | Read |
|---|---|---|
| marketing-site | the spec; the D8 rules published | `apps/marketing-site/AGENTS.md` |
| business-web | complete for every tier: rules editor with the D8 conditions, counter outcome states, print sheets on the customer domain, the six levers, billing with the ladder off and QR Ph, plan gating everywhere; preview where the API is behind | `apps/business-web/AGENTS.md` |
| customer-pwa | complete: brand KYP, every card state, approvals, gifts, promo codes, push, phone shell on desktop | `apps/customer-pwa/AGENTS.md` |
| admin-web | complete: applications with founding status, businesses, add-ons, the two billing flags, honest transport health | `apps/admin-web/AGENTS.md` |
| marketplace | complete: directory, filters, shop pages, how it works, the two doors, sitemap; preview shops until the public Discover routes ship | `apps/marketplace/AGENTS.md` |

The backend caught up on 2026-09-04: the stamp-card rules including the D8
conditions, customer-approved redemption, the pending welcome stamp, the
public Discover routes, founding merchants, web push, billing over QR Ph
behind the two flags, add-ons, the two email senders, and the Core and Grow
levers all answer from the API (`../backend/PROJECT.md`). Preview mode now
only fills what is still missing on a given response; a screen showing the
badge locally is pointing at a route to check in `../backend/CONTRACT.md`.

## Decided on 2026-09-04 (`../PLAN.md`, D1 to D8)

Joining a shop seeds its marketing consent from the customer's account
preference. Web push is built, last in Phase 1. Stamp expiry is one number
for stamps and rewards. The poster keeps landing on the wallet at
`app.kyp.ph/join/<slug>`; kyp.ph shop pages link there. Titles are "KYP
Stamping" in the business and admin apps and "KYP" in the wallet. The run
window, close behaviour with a reward grace, and the completion cap ship
with Launch. Billing is built in Phase 1 behind two admin flags, off
through the beta, QR Ph only.

## Open decisions the apps should not pre-empt

- The per-branch reporting overage rate, and what the API does past the
  allowance.
- Annual billing: the toggle shows yearly prices but the API bills monthly.
