<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Customer wallet — app.kyp.ph

Read `../../AGENTS.md`, `../../PROJECT.md` and `../../CONTRACT.md` first.
This app is "your customer's wallet" on the marketing site's `/product#apps`
and the customer surface in `llms.txt`. It is behind that spec; the gap list
below is the work.

## Where it runs

- Local: `npm run dev:customer` on :3002. Production: app.kyp.ph, Vercel
  project `kyp-wallet`, API at api.kyp.ph. Brand: **KYP**, not KYP Stamping.
  `noindex`; the indexable shopper surface is the marketplace at kyp.ph.
- Installable PWA: `app/manifest.ts`, icons in `public/`, service worker in
  `public/sw.js` registered only in production builds.
- Sign-in: one-time code to a Philippine mobile number. New accounts on
  `/create-account`, birthday optional as day and month. Seeded customer
  `+639175550182`; the code is in Mailpit (:8025) or at
  `GET /api/v1/_dev/messages?purpose=otp`. Codes are three per destination
  per ten minutes.

## What exists

Routes: `/`, `/login`, `/verify`, `/create-account`, `/join/[slug]`,
`/feedback/[id]`, `/offline`. Tabs in `src/components/CustomerApp.tsx`: Home,
Wallet, Discover, Profile. Profile holds personal information, notifications,
and the privacy center (joined businesses, consent history, download my data,
leave or delete).

`/join/[slug]` is where the counter poster lands (`FirstStamp.tsx`). The
first-stamp claim is held in `localStorage` under
`kypstamping-pending-first-stamp` until sign-in, then claimed against the
API. The member code is a thirteen-digit EAN-13 rendered as a real QR and
barcode, savable and printable. Discover reads the device position
(`useCoordinates.ts`); nearby nudges depend on the `nearby` consent toggle.

## What the site promises for this surface

- One private code that works at every shop, saved or printed for use
  without a signal.
- A card per program with live progress and the terms in plain language:
  target, reward, cooldown, minimum spend, expiry, and whether the welcome
  stamp is still pending and when it expires.
- The stamp flow: join from the poster, a pending welcome stamp, the first
  staff scan makes the card read two, one scan per visit after that.
- A full card holds its reward; the customer approves the release on their
  phone; the card resets; several unredeemed rewards can be held at once.
- Discover by category and neighborhood, nearest first, featured shops above
  the distance ordering, every shop with a live program on every plan.
- Notifications and an in-app inbox, full history, per-channel preferences
  with service and promotional messages kept apart, consent per purpose and
  withdrawable per channel without leaving the program.
- Data export, leaving a program, deletion requests, consent history, and
  control over what each shop can see.
- Later, with the tiers: a suki tier on the card, mission progress, a bonus
  window shown before queueing, promo-code entry, sending a reward to another
  member as pasalubong.

## Known gaps, in order

1. **Brand and domain.** `app/layout.tsx` and `app/manifest.ts` say
   "KYPStamping"; the wallet is "KYP" on kyp.ph. Name and short name "KYP",
   the description in the marketplace's voice ("One card for every shop you
   already visit"). Legal links go to `kypstamping.ph/privacy` and `/terms`;
   the "I run a shop" door lives on kyp.ph, not here.
2. **Pending welcome stamp.** The API writes a real stamp from a two-hour
   offer; the site says pending for 30 days with the expiry date on the
   card, confirmed by the first staff scan. Backend gap. Render the state the
   API returns; when `pending` arrives, the card says so with the date and
   never counts it as earned.
3. **Customer-approved redemption.** No approval step exists in the wallet
   because the API has none. Until it does, nothing here says a reward is
   approved on the phone. When it arrives it is a notification plus a single
   confirm on the card, and the counter waits for it.
4. **Held and stacked rewards.** Verify a full card shows its held reward and
   a fresh card behind it, and that several unredeemed rewards list
   separately.
5. **Card terms.** Show whatever the program exposes today (target, reward,
   expiry); add cooldown, minimum spend and the welcome-stamp state when the
   API carries them. Never compute a rule locally.
6. **Push.** `sw.js` handles install, activate and fetch only; there is no
   web push. The notifications screen describes the in-app inbox and must not
   promise alerts on a closed phone until web push exists.
7. **Offline code.** The QR codec loads as a lazy chunk. Confirm it is
   precached or the code is rendered at install time, so the code opens at
   the counter with no signal on the first try.
8. **Discover ordering.** Featured placement above distance, category and
   neighborhood filters that match the categories shops actually carry,
   hours on the card.
9. **Consent on file per shop.** The account-wide channel preference and the
   membership's consent flags are both required for a promotional send.
   Decided (D3): joining, the poster claim and imports seed the shop's flags
   from the account preference. Until the backend ships that on every path,
   the per-shop view must not imply a shop can reach the customer when it
   cannot.
10. **Tier features.** Suki tier, missions, bonus windows, promo codes and
    gifting have no endpoints. No UI until they exist.
11. **Queued card conditions (D8 in `../../../PLAN.md`).** When the site
    publishes them: run dates on the card before the first stamp, a
    `completed` state at the completion cap, a `closed` state after the run
    with "redeem by" on any held reward, a plain sentence on what happened to
    unfinished stamps (expired, or moved to the named successor card), and
    "this card is full" on a capped poster.

## Rules specific to this app

- Service updates and promotional messages are separate on every screen that
  lists them.
- Distances are metres from the API through `formatDistance`; the nearby
  filter compares numbers, never strings.
- Nothing says "you will be notified" or "request received" without an
  endpoint that recorded it.
- No analytics, no third-party scripts, no links to merchant pages except
  the legal ones.

## Verify

`npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit:controls`.
With the backend up: `npm run qa:customer-auth` (phone and desktop, reads the
real one-time code) and `npm run qa:wallet`. Both share the three-codes budget
with manual testing; the suites say so when throttled. Test the installed
PWA offline at least once after touching `sw.js` or the code screen.
