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
  project `kyp-wallet`, API at api.kyp.ph. Brand: **KYP**, not KYP Rewards.
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

## Built 2026-09-04

Brand is KYP throughout (layout, manifest, page titles, the auth flow in
`packages/ui/auth`). The wallet reads `useWalletWithPreview()`, so locally
three sample cards sit after the real ones: a pending welcome stamp, a
Ber-months run with a tier, a live bonus window, a mission and store
credit, and a closed run with a held reward and "Redeem by". Card states,
terms in plain language, `nextStampAt`, the KYP Rewards badge on Launch
cards, tier chip, missions and store credit render from
`src/components/cards.tsx`. New sheets: `ApproveSheet` (`#approve`,
pending redemption approvals), `GiftsSheet` (`#gifts`, pasalubong sent and
received, a send form), `PushSection` inside Notifications (web push
subscribe, production only). Discover derives its chips from the data,
keeps the API's order unless "Nearest first" is on, and links to the
marketplace. The member code renders as an inline EAN-13 (`Barcode.tsx`)
plus a QR cached in `localStorage` at boot, so it opens offline first time.
Every write against an unbuilt route is disabled with
`PREVIEW_WRITE_REASON`. Phone shell is 460px wide on every route.

## Known gaps, in order

1. **Every route and field this app was built ahead of now exists**
   (2026-09-04): card state, `pendingStamp`, `rules`, `nextStampAt`,
   `redeemBy`, `badge`, `plan`, `tier`, `bonusWindow`, `missions`,
   `storeCreditCentavos`; pending approvals with approve and decline; gifts;
   promo-code redemption; push. The API reports a pending card with
   `progress` 0, so `earnedStamps` in `cards.tsx` is a no-op on real data
   and only trims the sample card; the three sample cards still render
   locally after the real ones because `useWalletWithPreview` appends them.
   Switch the wallet back to `useWallet()` when the samples are no longer
   wanted.
2. **`DiscoverPlace.featured`** (closed 2026-09-10): the API carries it and
   lists featured shops first, then nearest; the app keeps that order and
   paints a card as featured only from the flag. The second Home suggestion
   used to be painted featured whatever it was.
3. **Reward gifts** send no `rewardId`; the API takes it as optional and
   gifts against the membership. Closed by design.
4. **Web push** needs the service worker registered, which is production
   only; the control is preview-disabled locally.
5. **Consent on file per shop** (closed 2026-09-10): every wallet card
   carries `consent` - the shop's own email, SMS and push flags, seeded from
   the account preference on join and kept in step by the API - and the
   privacy centre shows them per shop, falling back to the account setting
   only for a card the API did not annotate.

## Rules specific to this app

- Service updates and promotional messages are separate on every screen that
  lists them.
- Distances are metres from the API through `formatDistance`; the nearby
  filter compares numbers, never strings.
- Nothing says "you will be notified" or "request received" without an
  endpoint that recorded it.
- No analytics, no third-party scripts, no links to merchant pages except
  the legal ones. Sentry, with personal data scrubbed, is the one exception
  (`../../AGENTS.md` rule 5); GA never loads here.

## Verify

`npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit:controls`.
With the backend up: `npm run qa:customer-auth` (phone and desktop, reads the
real one-time code) and `npm run qa:wallet`. Both share the three-codes budget
with manual testing; the suites say so when throttled. Test the installed
PWA offline at least once after touching `sw.js` or the code screen.
