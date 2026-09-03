<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Business workspace — biz.kypstamping.ph

Read `../../AGENTS.md`, `../../PROJECT.md` and `../../CONTRACT.md` first.
This app is the counter and the owner's workspace the marketing site
describes on `/product#apps`, `/features` and `/pricing`. It is behind that
spec; the gap list below is the work.

## Where it runs

- Local: `npm run dev:business` on :3000. Production: biz.kypstamping.ph,
  Vercel project `kyp-business`, API at api.kypstamping.ph. Brand: KYP
  Stamping. `noindex`.
- Sign-in: password, then the workspace picker (skipped when there is one),
  then hash views on `/`. Sign-up on `/create-account`, the onboarding wizard
  on `/onboarding`, invitations on `/accept-invite`, recovery on
  `/forgot-password` and `/reset-password`, second step on `/verify`.
- Seeded owner: `mara@sweetcrumbs.ph` / `DemoPass123!`. Six seeded merchants
  on three plans exist for tenant tests.

## What exists

Views, in nav order (`src/components/BusinessShell.tsx`): Dashboard, Scan,
My join code, Customers, Business, Integrations (Grow), Program, Favorite
orders, Birthday offers, Redemptions, Campaigns, Message log, Analytics, plus
Staff and Settings from the account menu. A Cashier sees a reduced nav; the
API refuses what the role cannot do and the screen shows the refusal.

All server state comes from `@kypstamping/api`. Client-only state lives in
`DemoState.tsx` (webhook draft, setup ledger, scan handoff, wizard answers),
`useCounterStore` (a scanned-but-unsubmitted transaction), and
`useOfflineQueue.ts` (visits queued in `localStorage` and replayed through
`recordVisit` with the visit's own idempotency key). The till's branch is
remembered under `kypstamping-till-branch`.

## What the site promises for this surface

| View | Promise |
|---|---|
| Scan | Scan the customer's code or look up by mobile number, about three seconds. A cooldown refusal names the reason and the time the next stamp is available. Reversals are one tap; every stamp, reversal and redemption carries who, when and which branch. Refusals are visible on screen, never swallowed. |
| My join code | The public code as a printable poster, sticker and table tent PDF, on the free plan. The code lands on `app.kyp.ph/join/<slug>` and grants a membership plus a pending welcome stamp only. |
| Program | The stamp-card rules on every plan: welcome stamp on or off, target 1 to 30, cooldown (default once a day), minimum spend per stamp, optional stamp expiry, the reward in plain words. Held-until-redeemed, customer approval and grandfathering are always on. One program on Launch, three on Core, unlimited on Grow. Eight types from Core. Bonus windows, promo codes and store credit on Core; suki tiers, missions, category earning and gifting on Grow. |
| Customers | Segments that update themselves: new, regular, VIP, lapsed, reward-ready. Basic segments on Core, RFM on Grow. Custom fields and import on Core; export on every plan. Home branch on Core. Favorite orders on every plan. |
| Campaigns | Audience, channel, estimated cost, predicted visits, break-even and a spend ceiling per campaign and per month, shown before sending. Quiet hours and frequency caps. Audiences filtered by consent. In-app and push on every plan; email on the paid tiers, marked not yet sending until the API accepts the channel; SMS as credits with the cost shown first; Viber and WhatsApp shown as connecting, never selectable as live. |
| Message log | Every channel the composer offers is filterable here. |
| Analytics | Basic on Launch. Per-branch reporting for 3, 5 or 10 branches by tier and which branch a customer came from. RFM, cohorts, time to second visit, reward liability in pesos, stamps per staff and campaign attribution on Grow, labelled "attributed", never "incremental". |
| Staff | 2, 5, 15 or 50 accounts by tier. Owner, manager, marketer and counter roles from Core. The named ledger on every plan. |
| Business | Profile, unlimited branches never charged for, hours and neighborhood for Discover, own branding on Core, Discover listing on every plan. |
| Integrations | Grow only: scoped API keys with one-time secrets, webhooks with the four published events, POS adapters by approval, the offline queue. Wallet passes are blocked on certificates and the screen says so. |
| Settings and billing | Launch is the live plan; Core, Grow and Scale are coming soon with no date. Founding offer: Core free for three months when it opens. Payment by GCash, Maya, Visa or Mastercard, InstaPay or PESONet. Add-ons: Featured in Discover ₱299 a month, extra branch reporting ₱150 a branch, setup with a person ₱1,500 once and free in beta, SMS credits at ₱0.95, ₱0.90 and ₱0.85, email top-up ₱25 per 1,000. The KYP Stamping badge shows on Launch and is hidden on paid plans. |
| Privacy | Consent ledger, export and deletion workflows on every plan. |

## Known gaps, in order

1. **Wallet URL.** `src/components/BusinessViews.tsx:1259` falls back to
   `https://app.kypstamping.ph`. The wallet is `https://app.kyp.ph`
   (`http://localhost:3002` locally); read `NEXT_PUBLIC_CUSTOMER_APP_URL`
   with that default and nothing else. Every place the app shows a shopper a
   link, including the printed join code, must resolve to the customer
   domain.
2. **Brand copy.** Page titles and metadata say "KYPStamping Business"; the
   site says "KYP Stamping". Decide the title form once in `app/layout.tsx`
   and the auth pages and apply it everywhere.
3. **Stamp-card rules editor.** The API has no welcome-stamp toggle,
   cooldown, minimum spend or stamp expiry on a program yet, and today the
   first stamp is a real stamp from a two-hour offer, not a pending one. Do
   not add local-only controls. When the backend exposes these fields, the
   Program view shows them on every plan and the card preview shows them the
   way the customer will see them.
4. **Counter refusals for the cooldown.** Needs `nextStampAt` from the API.
   Until the backend has a cooldown, nothing in the counter may claim one.
5. **Customer-approved redemption.** Reserve, commit and cancel are
   staff-driven today. The Redemptions view must not say the customer
   approved a release until the API waits for that approval.
6. **Core and Grow levers.** Bonus windows, promo codes, store credit, suki
   tiers, missions, earn by category, gifting: no endpoints. No UI until they
   exist; then gate each with `PlanTag` and the tier in `plans.ts`.
7. **Join materials.** Verify My join code exports a poster, a sticker and a
   table tent as a PDF, that the QR is a real symbol at print error
   correction, and that it encodes the customer-domain URL.
8. **Plan and billing copy.** Check the plan card, founding offer, payment
   methods, add-ons and allowances row for row against `plans.ts`. The
   yearly toggle on the site shows yearly prices, but the API bills monthly;
   do not promise annual billing. Render the off state from
   `paidTiersOpen` and `creditPurchasesOpen` (ladder visible, paid tiers
   "not open yet, free during the beta", SMS credits "opens with billing",
   no dates). Build the QR Ph payment sheet (QR image, countdown to
   `expiresAt`, status polling) reachable only when a flag is on; it is the
   only payment method, so the payment-method chooser goes.
9. **Branch analytics past the allowance.** The API silently truncates to
   the busiest N; the view should say which branches are not included once
   the overage rate is decided.
10. **Push.** Push sends are delivered in-app only. The channel picker and
    the message log must not describe push as reaching a closed phone.
11. **Queued card conditions (D8 in `../../../PLAN.md`).** Run window,
    close behaviour with a successor card, reward grace, completion cap,
    member cap. Not on the site yet, so not in the editor yet. When they
    are: same rules editor, every plan, a close preview counting the open
    cards affected, and the counter naming a closed or completed card.

## Rules specific to this app

- A 402 from the API is a plan gate rendered as a card, not an error.
- A 429 is wait-and-retry-once.
- Every refusal the API sends is shown; the toast renders outside
  `#main-content`, so tests read the whole page.
- `POST /counter/offline-sync` is never called from here.
- No analytics, no third-party scripts.

## Verify

`npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit:controls`.
With the backend up and reseeded, one at a time: `npm run qa:merchant`,
`npm run qa:refusals`, `npm run qa:free-tier` (registers a real business and
keeps it on Launch), `npm run qa:private-apps`, `npm run qa:tenants`,
`npm run qa:edges`.
