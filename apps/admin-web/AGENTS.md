<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Platform administration — admin.kypstamping.ph

Read `../../AGENTS.md`, `../../PROJECT.md` and `../../CONTRACT.md` first.
This app is "platform administration" in the marketing site's `llms.txt`:
tenant health, privacy operations, service queues, support, an audit ledger,
unit economics and network-wide policy. It is the closest of the three
private apps to the spec.

## Where it runs

- Local: `npm run dev:admin` on :3001. Production: admin.kypstamping.ph,
  Vercel project `kyp-admin`, API at api.kypstamping.ph. Brand: KYP
  Stamping. `noindex`.
- Sign-in: password, then a TOTP on `/verify`. Seeded administrator
  `admin@kypstamping.ph` / `DemoPass123!`; the seed prints the TOTP secret.
  Recovery on `/forgot-password` and `/reset-password`.

## What exists

Views, in nav order (`src/components/AdminShell.tsx`): Overview, Businesses,
Applications (the partner queue from `/partners`), People, Operations,
Integrations, Support queue, Audit ledger, Revenue & margin, Platform
settings. All server state comes from `@kypstamping/api`; `AdminState.tsx`
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
- Service health for every transport, with honest status: SMS and push have
  no transport yet, email is transactional only, Viber and WhatsApp are
  being connected.
- Unit economics in pesos: plan revenue, channel cost, margin. Gross margin
  counts channel cost only and must be labelled that way.
- Network-wide policy: quiet hours, frequency caps, consent rules, provider
  policy.

## Known gaps, in order

1. **Brand copy.** Titles and metadata say "KYPStamping"; the site says
   "KYP Stamping". Decide once in `app/layout.tsx` and apply.
2. **Applications.** Check the queue captures the twelve answers of the
   partner form (`marketing-site/src/components/partner-intake`), records
   founding-merchant status on approval, and gives the operator somewhere to
   note the setup-with-a-person step. Approval creates a Launch workspace;
   nothing else is purchasable.
3. **Plans and add-ons.** There is no route to move a merchant to a paid
   tier and no endpoint for Featured in Discover or extra branch reporting.
   Do not add a plan switcher that answers 409 silently; the tenant view says
   the paid tiers are not purchasable yet.
4. **The two billing flags.** Platform settings shows `billing.paid_tiers`
   and `billing.credit_purchases` through the existing `/admin/flags` with
   the beta note "off through December 2026"; flipping one writes the audit
   entry the endpoint already records. Turning a flag on is what opens
   billing in January 2027, not a deploy.
5. **Privacy operations.** Verify the People view exposes aggregates only and
   that any per-customer access path is a scoped grant with a reason and an
   expiry, logged to the audit ledger. The privacy workflows themselves
   (export, deletion, consent) live in the merchant and customer apps; this
   app monitors them.
6. **Push provider.** The site no longer names a push provider. Service
   health and the delivery views must not name Firebase or any provider that
   is not integrated; push is in-app delivery today.
7. **Economics labels.** "Gross margin" is channel cost only; infrastructure
   is not modelled. Say so next to the figure.
8. **Recovery queue.** Replay exists and works; make sure the count of
   failures the Overview shows is derived from the same queue the
   Integrations view lists.

## Rules specific to this app

- Never render a customer's personal fields in a list an administrator can
  browse.
- Sample sizes are stated: "6 of 284 tenants" is a sample, not a table.
- Every tenant or adapter action writes to the audit ledger through the API;
  nothing is recorded client-side.
- No analytics, no third-party scripts.

## Verify

`npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit:controls`.
With the backend up and reseeded: `npm run qa:private-apps`, which signs in
with a live TOTP, walks every view, replays the recovery queue, triages a
ticket, and fails on any 4xx or 5xx other than a 402.
