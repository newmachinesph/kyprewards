# KYP Rewards frontends — how to work here

Loadout: `web` (Next.js 16, React 19, Tailwind v4).

Read this first, then the `AGENTS.md` of the app you are in. `PROJECT.md` is
the product as the marketing site defines it. `CONTRACT.md` is the wire and
cross-app contract every app codes against; its backend mirror is
`../backend/CONTRACT.md`. The release order is `../PLAN.md`: the free Launch
plan first, exactly as sold, then Core, Grow and Scale.

## The one rule

**`apps/marketing-site` is the product spec.** What kyprewards.com says is
what the other apps must do. Its data files are canonical:

| File | Owns |
|---|---|
| `apps/marketing-site/src/lib/plans.ts` | plans, prices, the feature matrix, plan limits, add-ons, channel rates, payment methods, founding offer |
| `apps/marketing-site/src/lib/content.ts` | industries, resources, business categories, the short FAQ |
| `apps/marketing-site/src/app/llms.txt/route.ts` | the whole product in prose, generated from the two files above |
| `/product`, `/features`, `/pricing`, `/integrations`, `/roadmap`, `/faq` | the surfaces, the stamp-card rules, what is live, next and later |

When an app and the site disagree, the app is wrong. When the site and the
backend disagree, the backend is behind (`../backend/BACKLOG.md` tracks it);
do not make an app pretend the backend has caught up. Never edit site copy to
match an app. If the site itself is wrong, say so and stop; changing the spec
is the user's call.

## Six apps, two domains

| App | Audience | Brand | Local | Production | API host |
|---|---|---|---|---|---|
| `apps/marketing-site` | shop owners | KYP Rewards | :3003 | kyprewards.com | api.kyprewards.com, public endpoints only |
| `apps/business-web` | owners and staff | KYP Rewards | :3000 | biz.kyprewards.com | api.kyprewards.com |
| `apps/admin-web` | platform operators | KYP Rewards | :3001 | admin.kyprewards.com | api.kyprewards.com |
| `apps/customer-pwa` | shoppers | KYP | :3002 | app.kyp.ph | api.kyp.ph |
| `apps/marketplace` | shoppers, public | KYP | :3004 | kyp.ph | api.kyp.ph, public endpoints only |
| `apps/mobile` | shoppers | KYP | Expo Go or a dev build | Play Store and App Store, as KYP | api.kyp.ph, with a bearer session |

kyprewards.com speaks to merchants. kyp.ph and the wallet under it speak to
shoppers. The split keeps the session cookie first-party on both sides with
`SameSite=Lax`. Consequences:

- The marketing site never links to the wallet. `customerAppUrl` was deleted
  from it on purpose so a stray link is a compile error.
- The only shopper-to-merchant door is "I run a shop" on kyp.ph, pointing at
  kyprewards.com.
- The join poster lands on the customer domain: `app.kyp.ph/join/<slug>`.
- Anything the business or admin app shows a shopper as a link must use
  `NEXT_PUBLIC_CUSTOMER_APP_URL`, never a literal host.
- The app claims `app.kyp.ph/join/*`, `app.kyp.ph/login` and `kyp.ph/shops/*`
  as universal links, so a scanned poster opens the app when it is installed
  and the wallet when it is not. The poster itself never changes.

## What is true today

- Open beta. Only **Launch** is purchasable; Core, Grow and Scale are published
  and marked coming soon, with no dates. Founding merchants get Core free for
  three months when it opens.
- Everything on Launch is unlimited customers, unlimited branches, one stamp
  card, two staff, the KYP Rewards badge on the card.
- Channels: in-app inbox, web push to the wallet and Expo push to the app are
  live (push needs the `VAPID_*` keys where it runs). Campaign email is refused by the API until a campaign
  sender separate from the transactional one exists. SMS is credits, priced
  before every send. Viber and WhatsApp are "connecting", never live.
- Apple and Google Wallet passes are blocked on signing certificates. Do not
  build UI for them.
- Merchants are onboarded by application on `/partners`; a person configures
  the first program before the owner signs in.
- There is no registered legal entity yet. Never write an entity name,
  address, registration number or DPO name anywhere.

## How the code is organised

npm workspaces. Next 16.3, React 19.2, TypeScript 6, Tailwind 4. Read
`node_modules/next/dist/docs/` before writing Next code; the version differs
from training data. The mobile app is Expo SDK 57 on React Native 0.86 and
shares the workspace's one React and one Tailwind (`docs/MOBILE.md` records
the three `overrides` in the root `package.json` that keep it that way).

- `packages/api` is the whole data layer. `endpoints.ts` is one function per
  call, `queries.ts` and `mutations.ts` are the hooks, `keys.ts` is what
  invalidation targets, `stores.ts` is client-only state, `forms.ts` puts the
  API's field errors back under inputs. `contract.test.ts` runs against the
  live service. Never copy server state into zustand.
- `packages/ui` is tokens (`tokens.css`), the seal mark and wordmark, the
  session gate and auth flows, the shell helpers, and `format.ts` for money,
  time and distance. Never make a per-app copy of any of it.
- `packages/demo-data` is one narrated scenario the marketing site uses. It
  is a story, not a record, and the API has no route for it.
- `apps/mobile` is the Android and iOS app: Expo Router screens over
  `packages/api`, with no data code of its own. The root ESLint config and
  `.vercelignore` leave it out; `npm run dev:mobile` starts it,
  `npm run lint:mobile` lints it, `npm run typecheck` includes it.
- Types in `packages/api/src/types.ts` are hand-written. They have lied
  before. The authority is `http://localhost:8000/openapi.json` and the
  live response, never the type.

## Rules

1. **No control that only toasts.** Every button does what it says or says on
   screen why it cannot. A control with no endpoint behind it names that.
2. **No faked rules, and preview mode for unbuilt routes.** The app never
   simulates a rule client-side. A screen whose endpoint does not exist yet
   is still built to the contract; locally, with
   `NEXT_PUBLIC_PREVIEW_UNBUILT=true`, its hook renders typed sample data
   (`packages/api/src/preview.ts`, `preview-samples.ts`) under `PreviewBadge`
   and its writes are disabled with `PREVIEW_WRITE_REASON`. In production
   the flag is unset and the screen shows its honest empty state. Never wrap
   an endpoint that exists; a 404 there is a missing resource.
3. **Plan gates come from the API's plan** and are rendered with `PlanTag`.
   Tier names and the feature-to-tier mapping come from `plans.ts`.
4. **Units:** money is integer centavos through `pesoFromCentavos`; time is
   ISO through `relativeTime`, `timeOfDay`, `longDate`; distance is metres
   through `formatDistance`. No display strings from the API, ever.
5. **No analytics or third-party scripts** in the signed-in apps or the
   marketplace. The marketing site loads GA4 only through `AnalyticsConsent`.
6. **Brand names:** "KYP Rewards" (two words) in merchant-facing copy; the
   wordmark is `KYP` + `Stamping` set tight; "KYP" alone on kyp.ph and in the
   wallet. See `docs/BRAND.md`.
7. **Vocabulary:** tiers are "suki tiers", gifting is "pasalubong", the free
   plan is "Launch", the public join code grants "a pending welcome stamp".
   Do not add gamification or enterprise features from generic loyalty lists;
   the site deliberately excludes them.
8. **Deep links:** the private apps land on `/login`; hash routes such as
   `#scan` work only after sign-in. External links point at `/login`.
9. **Do not deploy** unless asked. Deploys are `vercel deploy --prod` from
   this directory with a token, never a git push.
10. **Smallest correct change.** Trace the flow first, grep callers, then edit.
    Reuse what is in `packages/*` before writing anything new.

## Verify before you say done

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run audit:controls
npm.cmd run test:format
npm.cmd test -w @kypstamping/api     # backend must be up
```

The QA suites (`qa:*`) drive real browsers against the real API. Run them one
at a time, never alongside the backend's pytest, and reseed
(`cd ../backend && make seed`) between suites: they write to the database they
walk and sign-in is rate limited. Kill a stale dev server by port
(`netstat -ano | findstr :3003`, then `taskkill /PID <pid> /F`) before
serving anything for verification; an old build will answer the port.
