<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Marketplace — kyp.ph

Read `../../AGENTS.md`, `../../PROJECT.md` and `../../CONTRACT.md` first.
This is the fifth app and the newest: the public, shopper-facing face of
KYP. Today it is one coming-soon page with the one working door, the wallet
at app.kyp.ph. It is not yet set up in the workspace tooling; that comes
first.

## Where it runs

- Local: `next dev --port 3004` from this directory (no root script yet).
  Production: kyp.ph, Vercel project `kyp-marketplace`, root directory
  `apps/marketplace`, API at api.kyp.ph. Brand: **KYP**. Indexable; this is
  the shopper surface search engines should find, the wallet is `noindex`.
- `src/lib/site.ts` holds `customerAppUrl` (app.kyp.ph), `merchantSiteUrl`
  (kypstamping.ph) and `siteUrl` (kyp.ph), with localhost defaults in
  development. Read hosts from there and from `NEXT_PUBLIC_*`, never
  literals.
- Depends on `@kypstamping/ui` only. It will use `@kypstamping/api` for
  public reads once a public Discover endpoint exists; it never carries a
  session or `ApiProvider`.

## Workspace setup still to do

Each of these is a configuration change, listed here so they are done
together and not forgotten:

1. Root `package.json`: add `dev:marketplace`.
2. `eslint.config.mjs`: add `apps/marketplace/` to `settings.next.rootDir`.
3. `Dockerfile.frontend` and `compose.frontend.yaml`: add the app and port
   3004.
4. `.env.example`: add `NEXT_PUBLIC_MARKETPLACE_URL`; add
   `apps/marketplace/.env.local` with `NEXT_PUBLIC_CUSTOMER_APP_URL`,
   `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_MARKETPLACE_URL`.
5. Backend `CORS_ORIGINS`: add `http://localhost:3004` and `https://kyp.ph`
   before the first API call from here.
6. `tools/sweep.mjs` and `scripts/audit-controls.mjs`: include the app once it
   has more than one route.
7. README and `docs/BRAND.md` already describe five apps; keep them in step.

## What the site says the marketplace is

From `/product#apps` ("Your shop in Discover"), `/features` ("Listed in
Discover") and `plans.ts`:

- Every shop running a live program is listed, on every plan including the
  free one. A marketplace that only lists paying shops is empty on day one.
- Each listing carries category, neighborhood, hours and the live program:
  the reward in plain words.
- Nearest first, with Featured placement above the distance ordering
  (included on Grow and Scale, ₱299 a month as an add-on on Launch and Core).
- Categories are the shared list in
  `marketing-site/src/lib/content.ts` (`businessCategories`), phrased the way
  an owner says it.
- A listing leads to joining: the join code lands on
  `app.kyp.ph/join/<slug>` and grants a membership and a pending welcome
  stamp, nothing of value by itself.
- The current page's promise stands: one card, nearby first, nothing to
  install, Metro Manila first.

## What it must become

1. **Discover directory.** A paged listing with category and neighborhood
   filters, optional coordinates for distance, featured shops first, then
   distance. Renders only real shops from the API.
2. **Shop page.** One page per slug: name, category, neighborhood, hours,
   the live program and its reward, a "Join" button to
   `app.kyp.ph/join/<slug>`, and "Open my wallet". Indexable, with a sitemap
   and robots once pages exist.
3. **The two doors.** "Open my wallet" to `app.kyp.ph/login`; "I run a shop"
   to kypstamping.ph. No other merchant-facing links.
4. **Legal.** Footer links to `kypstamping.ph/privacy` and `/terms`. "KYP is
   operated by KYPStamping" is the most the footer may say; no entity name,
   address, registration or DPO.
5. **No analytics** until kyp.ph has its own cookies page and consent gate;
   the marketing site's `/cookies` covers kypstamping.ph only.

## What it needs from the backend

A public Discover read. `GET /customer/discover` is session-scoped and cannot
serve this page. Ask for `GET /public/discover` (paged, `category`,
`neighborhood`, optional `lat` and `lng`, returning slug, name, category,
neighborhood, hours, a program summary, a `featured` flag and distance in
metres) and `GET /public/shops/{slug}` for the shop page. Until they exist
the page stays coming soon: a directory showing invented merchants is the
same mistake as a dashboard showing invented customers.

## Rules specific to this app

- Never list a shop that is not returned by the API.
- Featured placement is a flag from the API, never a client-side sort by
  plan name.
- Design tokens from `packages/ui/src/tokens.css`; Sora for display, Inter
  for body; one amber emphasis per view.
- Voice from `docs/BRAND.md`: direct, warm, specific, sentence case.

## Verify

`npm run typecheck -w @kypstamping/marketplace`, `npm run lint`,
`npm run build`. Once there are routes, add a `qa:marketplace` harness
modelled on `scripts/qa-marketing.mjs`: every route renders, no console or
page errors, every link resolves, the two doors go where they say.
