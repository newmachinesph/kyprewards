# Deploying the five web apps

Each app is its own Vercel project, deployed with the CLI from `frontend/`,
never by git push, and only when asked:

```powershell
vercel link --project <project> --yes       # once per project, writes .vercel/
vercel env add <NAME> production             # once per variable, per project
vercel deploy --prod
```

`NEXT_PUBLIC_*` values are inlined at build time: set them before the deploy,
and redeploy after changing one. Every value below ships in the browser
bundle, so none of them is a secret. `NEXT_PUBLIC_PREVIEW_UNBUILT` must not be
set on any production project.

## Shared by all five

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://kyprewards.com` |
| `NEXT_PUBLIC_MARKETPLACE_URL` | `https://kyp.ph` |
| `NEXT_PUBLIC_BUSINESS_APP_URL` | `https://biz.kyprewards.com` |
| `NEXT_PUBLIC_ADMIN_APP_URL` | `https://admin.kyprewards.com` |
| `NEXT_PUBLIC_CUSTOMER_APP_URL` | `https://app.kyp.ph` |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `production` |

## Per project

| Project | Domain | `NEXT_PUBLIC_API_BASE` | `NEXT_PUBLIC_SENTRY_DSN` | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
|---|---|---|---|---|
| kyp-marketing (marketing-site) | kyprewards.com | `https://api.kyprewards.com/api/v1` | kyprewards DSN | `G-5SP903WBDS` |
| kyp-business (business-web) | biz.kyprewards.com | `https://api.kyprewards.com/api/v1` | kyprewards DSN | none |
| kyp-admin (admin-web) | admin.kyprewards.com | `https://api.kyprewards.com/api/v1` | kyprewards DSN | none |
| kyp-wallet (customer-pwa) | app.kyp.ph | `https://api.kyp.ph/api/v1` | kyp.ph DSN | none, ever |
| kyp-marketplace (marketplace) | kyp.ph | `https://api.kyp.ph/api/v1` | kyp.ph DSN | `G-0XXP9DDSPQ` |

- kyprewards DSN: `https://da3bdb44de5156d9604c6a78b17eccfd@o4511871274385408.ingest.us.sentry.io/4512208613081088`
- kyp.ph DSN: `https://d0f33644873b33f40a07c5859f93c11c@o4511871274385408.ingest.us.sentry.io/4512208497213440`

The wallet and the marketplace call `api.kyp.ph` so the session cookie stays
first-party on kyp.ph; the merchant apps call `api.kyprewards.com` for the
same reason. Both hostnames point at the one API service.

## Wallet only (customer-pwa)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `806259750490-2ojceor4pr74ucumed113hegl3bh7id0.apps.googleusercontent.com` |

The Google Cloud console must list `https://app.kyp.ph` as an authorised
JavaScript origin for that web client, or the sign-in button does not render.

## Universal links (customer-pwa and marketplace, server-side, not public)

`APPLE_TEAM_ID` and `ANDROID_CERT_SHA256` serve
`/.well-known/apple-app-site-association` and `assetlinks.json`. Until they
are set those routes answer 404 and a scanned poster opens the browser
instead of the app.

## Hostinger

The five apps are prepared to move to Hostinger Node.js web apps. The plan
needs room for five managed Node.js apps (one per app). The values above
stay the same; only the setup differs.

Build settings, the same for every app except the root directory:

| Setting | Value |
|---|---|
| Node.js | 24 |
| Framework | Next.js |
| Root directory | `apps/<app>` (e.g. `apps/marketplace`) |
| Output directory | `.next` |
| Build script | `build` |
| Package manager | npm |

What the repo already does for Hostinger:

- `next build --webpack`: Turbopack cannot spawn its PostCSS worker there.
- Hostinger builds Next as standalone and starts the first `server.js` at the
  top of `.next/standalone`; in this monorepo Next nests it under
  `apps/<app>/`. Each app's `postbuild` runs
  `scripts/hostinger-standalone.mjs`, which adds a top-level `server.js` that
  starts the app's own, and copies `.next/static` and `public` beside it.
- Hostinger counts threads, across every site on the account, against one
  process limit (120). `experimental.imgOptConcurrency: 1` and
  `experimental.cpus: 2` keep each server and each build small, since one
  push rebuilds all five sites at once.

Per site, in order:

1. Create the website (a temporary `*.hostingersite.com` domain is fine for
   a first check).
2. Set the variables above for that app, plus `UV_THREADPOOL_SIZE=2`. Do not
   set `NODE_OPTIONS` yet.
3. Build from GitHub (`newmachinesph/kyprewards`, branch `main`) with the
   settings above.
4. After the first build, add
   `NODE_OPTIONS=--require /home/<user>/domains/<domain>/hbuilds/config/preload-timestamp.js --v8-pool-size=2`.
   The `--require` keeps Hostinger's runtime logs working, and the file only
   exists after a first build. The variables API replaces the whole set, so
   send every variable again.
5. Set `APPLE_TEAM_ID` and `ANDROID_CERT_SHA256` on the wallet and the
   marketplace.
6. Point DNS at the server, then install SSL. An SSL attempt made before DNS
   resolves stays `waiting_for_retry`; uninstall and install it again.

Once on Hostinger every push to `main` rebuilds all five sites, the mobile
app's commits included.

## Retired

kypstamping.ph is no longer ours. Nothing may link to it, send from it, or
list it as an origin. The public contact address is
support@kyprewards.com.
