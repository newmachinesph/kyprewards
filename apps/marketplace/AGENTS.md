<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Marketplace — kyp.ph

Read `../../AGENTS.md`, `../../PROJECT.md` and `../../CONTRACT.md` first.
This is the public, shopper-facing face of KYP: the directory of every shop
running a live program, on every plan, as `/product#apps` ("Your shop in
Discover") and `/features` ("Listed in Discover") sell it. Built complete on
2026-09-04. It renders sample shops under preview mode until the backend
ships the public Discover routes.

## Where it runs

- Local: `npm run dev:marketplace` on :3004. Production: kyp.ph, Vercel
  project `kyp-marketplace`, root directory `apps/marketplace`, API at
  api.kyp.ph. Brand: **KYP**, `BrandMark` with `label="KYP"` and the
  shopper tagline. Indexable; the wallet is `noindex`.
- `src/lib/site.ts` holds `customerAppUrl` (app.kyp.ph), `merchantSiteUrl`
  (kypstamping.ph) and `siteUrl` (kyp.ph). Read hosts from there and from
  `NEXT_PUBLIC_*`, never literals.
- Uses `@kypstamping/api` for public reads only, wrapped in `ApiProvider`
  for the query client. No session is ever sent or read.

## Routes

`/` (hero, search, category chips, nearby with a tap-to-locate button,
featured row, how it works, the two doors), `/discover` with URL-synced
`category`, `neighborhood`, `search` filters and cursor pagination,
`/categories/[category]`, `/neighborhoods/[neighborhood]`,
`/shops/[slug]` (stamp-card visual, about, hours, branches each with a Join
button to `app.kyp.ph/join/<branch slug>`, JSON-LD LocalBusiness; an unknown
slug renders not-found with `noindex`, status 200 because it streams inside
the root loading boundary), `/how-it-works`, `/for-shops`, `sitemap.xml`,
`robots.txt`, `opengraph-image`.

Components live in `src/components/` (header with mobile menu, footer,
`ShopCard`, `ShopGrid`, `DiscoverFilters` on `next/form`, `ShopPage`,
`StructuredData`, `useCoordinates` backed by `sessionStorage`). Server-side
reads for metadata, the sitemap and the 404 go through
`src/lib/public-data.ts`, the same `withPreview` seam the hooks use.

## Data

`usePublicDiscover`, `usePublicShop`, `usePublicCategories`,
`usePublicNeighborhoods` from `@kypstamping/api`. All four routes are
proposed in `../../../backend/CONTRACT.md` ("Discover, for the marketplace")
and do not exist yet, so locally they render `preview-samples.ts` under
`PreviewBadge`. Geolocation is asked for only when the visitor taps "Use my
location"; the position never enters the URL.

## Rules

- Never list a shop that is not returned by the API; featured placement is
  the API's `featured` flag, never a client-side sort by plan.
- The two doors and nothing else: "Open my wallet" to `app.kyp.ph/login`,
  "I run a shop" to `kypstamping.ph/partners`. Legal links go to the merchant
  site. The footer says "© 2026 KYP." and nothing more specific: there is no
  registered entity yet, so no page names an operator, an address or a DPO.
- No analytics until kyp.ph has its own cookies page and consent gate.
- Tokens from `packages/ui/src/tokens.css`; Sora display, Inter body; one
  amber emphasis per view; voice per `docs/BRAND.md`.

## Known constraints

- `/public/*` is rate limited at 30 calls a minute per caller and the 429
  arrives before CORS, so the browser reports it as a CORS error. React
  Query retries a 429 twice. A shopper browsing quickly can hit it; the
  backend should exempt or raise the limit for discover reads (recorded in
  `../../../backend/PROJECT.md`).

## Verify

`npm run typecheck -w @kypstamping/marketplace`, `npm run lint`,
`npm run audit:controls`, `npm run build`, and `npm run qa:marketplace`
against a running server: every route renders, no console or page errors,
every internal link resolves, the two doors point at the right hosts, and
429s are waited out rather than reported as failures.
