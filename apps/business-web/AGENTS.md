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
  then hash views on `/`. No sign-up: a workspace exists only from an approved
  partner application, one per owner email. Invitations on `/accept-invite`, recovery on
  `/forgot-password` and `/reset-password`, second step on `/verify`.
- Seeded owner: `mara@sweetcrumbs.ph` / `DemoPass123!`. Six seeded merchants
  on three plans exist for tenant tests.

## What exists

Views, in nav order (`src/components/BusinessShell.tsx`): Workspace
(Dashboard, Scan, My join code, Customers, Business, Integrations), Loyalty
(Program, Bonus windows, Promo codes, Store credit, Suki tiers, Missions,
Gifts, Favorite orders, Birthday offers, Redemptions), Reach (Campaigns,
Message log, Analytics), plus Staff, Billing & plan and Settings from the
account menu. Hash ids are the kebab-case labels (`#bonus-windows`,
`#billing`). A Cashier sees a reduced nav; the API refuses what the role
cannot do and the screen shows the refusal.

Every view lives in its own file under `src/components/views/`;
`BusinessViews.tsx` keeps the counter, business profile, favorite orders,
birthday, redemptions, campaigns and message log, and the `views` record.
Plan gating is `src/lib/plan.ts` (`usePlanGate`, `writeBlock`, `refusal`,
`planFor`) over `src/lib/plans.ts`, a byte-for-byte mirror of the marketing
site's `plans.ts` that must be kept identical. Every tier's feature renders
its full screen; a feature above the plan is tagged with `PlanTag` and its
writes are disabled with "Opens with <Plan>". A route the API does not serve
yet renders preview samples under `PreviewBadge` with its writes disabled
by `PREVIEW_WRITE_REASON`.

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

Built 2026-09-04: every view in the nav above, the stamp-card rules editor
with the D8 conditions and a close preview, the counter outcome states, the
awaiting-customer redemption state, poster, sticker and table tent print
sheets on the customer domain, the six lever views, the billing view with
the ladder in its off state and the QR Ph payment sheet, plan gating on
every tier's feature. What is left:

1. **Every route this app was built ahead of now exists** (2026-09-04): the
   `rules` block and close preview, the transaction outcome fields, the
   awaiting-customer redemption status, the six levers, category rates,
   featured placement, the billing flags, credit purchase, payments and
   QR Ph on invoices. A preview badge that still shows here means a real
   404 worth investigating, not an unbuilt route.
2. **Suki tier per customer** (closed 2026-09-10): `BusinessCustomer.tier`
   is on the API and the customer drawer shows it, "No rung yet" when the
   shop runs no ladder.
3. **Notification switches** (closed 2026-09-10): the API reads all three.
   `notifyRedemptions` sends the owner one line when a reward is committed
   or a reservation cancelled, `notifyDailySummary` is the
   `engagement.daily_summary` beat task at 21:00 Manila, `notifyLowCredits`
   fires once as the SMS balance crosses under the last day's send count.
4. **Merchant-side deletion** has no endpoint; the control files a support
   request in the Privacy category and says so.
5. **`NewProgramDialog`** in `WorkspaceForms.tsx` still lists locked types as
   disabled options labelled "needs <Plan>"; the Program view's own picker
   uses `PlanTag`. Unify when that dialog is next touched. All eight types
   now open at Core, matching the pricing page.
6. **Branch analytics past the allowance** (closed 2026-09-10): the read is a
   page, and "N branches not shown" is `X-Total-Count` minus the rows
   returned rather than a guess from the location list. Under it, every
   withheld branch can be bought separately at the published ₱150 a month
   (`POST /business/branch-reporting`, QR Ph, activated by the webhook, the
   same path as featured placement) - opt-in per named branch, never
   automatic, Core and up, 409 "opens with billing" until credit purchases
   open.
7. **Billing, ready and switched off.** The plan cards send the cycle
   (`Yearly` bills twelve months at the yearly per-month price) and the
   founding card says when the three free months of Core were applied.
   Nothing is reachable until `billing.paid_tiers` is on; the API answers
   409 and the card shows it.

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
