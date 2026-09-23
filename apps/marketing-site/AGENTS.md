<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Marketing site — kypstamping.ph

Read `../../AGENTS.md` first. **This app is the product spec.** Every other
app is measured against what this one says. Edit product copy here only when
the user asks to change the product; then update `../../PROJECT.md` and the
gap lists in the other apps' `AGENTS.md` in the same change.

## Where it runs

- Local: `npm run dev:marketing` on :3003. Production: kypstamping.ph, Vercel
  project `kyp-marketing`, deployed with `vercel deploy --prod` from
  `frontend/`, never by git push, and only when asked. Confirm a deploy by
  fetching `https://kypstamping.ph/llms.txt`.
- Talks to the API without a session: `POST /public/contact`,
  `POST /public/playbook`, `POST /public/partner-applications`. Each takes
  `category` as a free string, so changing the category list needs no
  backend change.
- GA4 loads only through `src/components/Analytics.tsx` after the consent
  banner. Any new tag goes through the same gate and updates `/cookies` and
  `/subprocessors` in the same change. The signed-in apps carry no analytics.

## Single sources

| File | Owns |
|---|---|
| `src/lib/plans.ts` | plans, prices, `featureMatrix`, `planLimits`, `overageRates`, add-ons, channel rates, payment methods, founding offer. The pricing page, estimator, table, `/roadmap` and `llms.txt` all render from it. Never hand-type a price or allowance anywhere else. |
| `src/lib/content.ts` | six industries, five resources, the business-category list shared by the partner form and the contact form, the short FAQ |
| `src/lib/comparisons.ts` | peso-priced competitors only (ZAP, Qashier, StoreHub, Suki Cards, GoBalik), each with a source URL and the date read |
| `src/lib/site.ts` | `businessAppUrl`, `adminAppUrl`, `siteUrl`. There is no `customerAppUrl`: this site never links to the wallet. |
| `src/lib/schema.ts`, `src/app/layout.tsx` | Organization schema, `hello@kypstamping.ph`, the Facebook page. No entity name, address, registration or DPO. |

## Routes

`/`, `/product`, `/features`, `/pricing`, `/integrations`, `/solutions`,
`/solutions/[industry]`, `/compare`, `/compare/[competitor]`, `/resources`,
`/resources/[slug]`, `/loyalty-program-philippines`, `/faq`, `/roadmap`,
`/about`, `/contact`, `/partners`, `/privacy`, `/terms`, `/merchant-terms`,
`/data-sharing`, `/cookies`, `/subprocessors`, `/llms.txt`, `/sitemap.xml`,
`/robots.txt`, `/opengraph-image`.

The join poster no longer lives here. It lands on `app.kyp.ph/join/<slug>`.

## The D8 rules are published

The run window, what happens when a card closes, and completions per member
were published on 2026-09-04: three `featureMatrix` rows in "The stamp card"
group, three rule cards on `/product` ("Eleven settings"), one FAQ answer,
three `llms.txt` bullets; `/roadmap` derives them as live. No members-per-run
cap, no dates. The apps build to these; the backend enforces them in 1A.

## Rules for copy

- Beta language: open beta, Launch is free, the paid tiers are published and
  not sellable yet, no dates anywhere.
- Brand is "KYP Rewards" in prose; the wordmark stays `KYP` + `Stamping`.
- Staff fraud is "detected", never "prevented".
- Viber and WhatsApp are "connecting". Push is included with an allowance.
  SMS is credits. Email campaigns are a paid-tier allowance. Transactional
  messages always send.
- Cite Philippine law the way the site already does (RA 10173, NPC Circular
  2023-04, RA 10962, DTI AO 02 s.2002) and never give legal advice.
- No testimonials, named customers, merchant counts or case studies.
- Comparisons only against providers with published peso pricing, with a
  date and a source on every page.
- The quickstart on `/integrations` is checked against the live endpoint:
  camelCase, `memberCode`, `branchId`, `amountCentavos`, no merchant header.

## Verify

`npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit:controls`,
and `npm run qa:marketing` with the backend up. The QA suite renders every
route, then submits the contact form, walks the partner application, drives
the estimator and flips the wallet card against the real API. Lighthouse
accessibility, best practices and SEO were 100 at the last audit; keep them.
