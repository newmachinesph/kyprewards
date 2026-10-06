<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Platform administration — admin.kyprewards.com

Read `../../AGENTS.md`, `../../PROJECT.md` and `../../CONTRACT.md` first.
This app is "platform administration" in the marketing site's `llms.txt`:
tenant health, privacy operations, service queues, support, an audit ledger,
unit economics and network-wide policy. It is the closest of the three
private apps to the spec.

## Where it runs

- Local: `npm run dev:admin` on :3001. Production: admin.kyprewards.com,
  Vercel project `kyp-admin`, API at api.kyprewards.com. Brand: KYP
  Stamping. `noindex`.
- Sign-in: password, then a TOTP on `/verify`. Seeded administrator
  `admin@kypstamping.ph` / `DemoPass123!`; the seed prints the TOTP secret.
  Recovery on `/forgot-password` and `/reset-password`.

## What exists

Views, in nav order (`src/components/AdminShell.tsx`): Overview, Businesses,
Applications (the partner queue from `/partners`), People, Operations,
Integrations, Support queue, Audit ledger, Revenue & margin, Add-ons,
Platform settings. All server state comes from `@kypstamping/api`; `AdminState.tsx`
holds view state that must survive navigation.

Controls with nothing behind them say so on screen rather than toasting:
the incident runbook, the privacy playbook and support routing rules. Keep
that pattern.

## What the site promises for this surface

- Aggregate views only. No administrator reads a customer profile; scoped
  support access is time-limited, reason-bound and written to the audit
  ledger.
- Applications are read by a person, usually approved the same working day,
  and the first program is configured with the merchant before they sign in.
  Anyone who joins during the beta is a founding merchant: Core free for
  three months when it opens.
- Service health for every transport, with honest status: SMS sends sign-in
  codes through Semaphore and shop SMS waits for credits, push is web push and
  Expo push, email is transactional only, Viber and WhatsApp are being
  connected.
- Unit economics in pesos: plan revenue, channel cost, margin. Gross margin
  counts channel cost only and must be labelled that way.
- Network-wide policy: quiet hours, frequency caps, consent rules, provider
  policy.

## Built 2026-09-04

Views in nav order: Overview, Businesses, Applications, People, Operations,
Integrations, Support queue, Audit ledger, Revenue & margin, Add-ons,
Platform settings. Titles are "KYP Rewards Platform". Applications show
every intake answer, a founding-merchant checkbox (on by default through
31 December 2026, sent in the decide body the API ignores today) and setup
notes (save disabled with `PREVIEW_WRITE_REASON`). Businesses carry plan,
founding, featured, filters and a drawer with that tenant's add-ons.
Add-ons is a new view over `useAddOns()` with the catalogue from
`src/lib/catalog.ts` (a mirror of `plans.ts`; keep identical). Platform
settings renders `billing.paid_tiers` and `billing.credit_purchases`: off
with a `PreviewBadge` and a disabled switch until `/admin/flags` returns
them, then live through `setPlatformFlag`. Operations lists every transport
and says "Not reported by the API" rather than borrowing a green light.
Gross margin is labelled channel cost only. Everything under "Known gaps"
below is what is left.

## Known gaps, in order

1. **Integrations view** (closed 2026-09-10): the invented figures and the
   "Demo control data" badge are gone; the four headline tiles are counts
   from the adapter registry and tenant connections.
2. **Backend routes to ship** (closed 2026-09-04): `GET /admin/add-ons`,
   `PATCH /admin/partner-applications/{id}/notes`, `founding` on the decide
   body and the two billing flags all answer.
3. **The auth pages' visible copy** lives in `packages/ui/auth`; only their
   titles were changed here.
4. **People** (closed 2026-09-10): consent withdrawals, data exports and
   deletion requests come from `GET /admin/privacy`, counts only.
5. **Moving a tenant** (added 2026-09-10): the tenant drawer moves a shop
   between tiers through `PATCH /admin/tenants/{businessId}/plan`, under the
   same rules as the merchant's billing screen. While `billing.paid_tiers`
   is off only Launch is open and the API's 409 is shown in place; a
   downgrade that strands a live program is refused by name; a founding
   merchant's three free months of Core are applied on the first move up.
   Every move lands in the audit ledger.
6. **Support access and account managers** (added 2026-09-13): the FAQ's
   "scoped support access" is real. The tenant drawer opens a business with
   a reason and 30, 60 or 120 minutes (`POST
   /admin/tenants/{businessId}/support-access`); the API steps this session
   into the shop, emails the owner, writes the ledger, and biz.kyprewards.com
   opens in a new tab on the same cookie, with a banner and an End button.
   Inside, the role is `Support`: profile, image, branches, programs, staff,
   analytics and billing reads; never the counter, a customer record, an
   export or a billing write. `users.platform_role` splits admin kinds into
   `admin` (everything) and `account_manager` (only the businesses assigned
   in the drawer, `PUT /admin/tenants/{businessId}/managers`, and only that
   view of the console). Platform settings adds either
   (`POST /admin/administrators`): the temporary password is emailed, the
   authenticator secret is shown once.

## Rules specific to this app

- Never render a customer's personal fields in a list an administrator can
  browse.
- Sample sizes are stated: "6 of 284 tenants" is a sample, not a table.
- Every tenant or adapter action writes to the audit ledger through the API;
  nothing is recorded client-side.
- No analytics, no third-party scripts. Sentry, with personal data
  scrubbed, is the one exception (`../../AGENTS.md` rule 5).

## Verify

`npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit:controls`.
With the backend up and reseeded: `npm run qa:private-apps`, which signs in
with a live TOTP, walks every view, replays the recovery queue, triages a
ticket, and fails on any 4xx or 5xx other than a 402.
