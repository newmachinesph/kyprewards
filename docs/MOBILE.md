# KYP mobile — the plan, and what was built

Status: **built 2026-09-06, bundles for Android and iOS, backend seams
tested, walked end to end on an Android phone in Expo Go the same day; no
app tests yet.** The plan below was written the same morning; the
"What was built" and "Run it" sections at the end record where it landed.

An Android and iOS app for shoppers, additional to the wallet at app.kyp.ph,
which stays: kypstamping.ph sells "nothing to install", and the marketing site
is the spec. The poster QR must keep working for somebody who never installs
anything. The app exists for reach - a home-screen icon, real push, a camera
- not to replace the web wallet.

## Where it lives

`frontend/apps/mobile`, inside the existing npm workspace. Not a new repo.

The whole leverage is `packages/api`: every endpoint, hook and type the wallet
uses, already written against `openapi.json`. In a separate repo that package
would have to be published to a private registry (a release step on every API
change) or copied (and the hand-written types already drift from the API - see
memory). In the workspace it is one import, and one `openapi.json` feeds the
PWA and the app.

The package's runtime imports are react, zustand, zod, react-hook-form and
TanStack Query - all fine in React Native. The `node:*` imports are in its two
test files only. Two seams were guarded: `stores.ts` falls back to an
in-memory store where there is no `localStorage`, and `http.ts` gained three
setters (`setApiBase`, `setAuthToken`, `setClientKind`) the app calls once at
boot, so every existing endpoint function works unchanged.

The one real hazard of an Expo app in a Next.js workspace is **two copies of
React** (or of any native module). The five Next apps and `packages/api` pin
`react 19.2.8`; React Native 0.86.3 accepts it (`^19.2.3`), so there is one
React, one React Native and one of every native module in `node_modules`.
Three `overrides` in the root `package.json` keep it so - see "Stack".

Vercel: each of the five projects has `rootDirectory` set, but the CLI uploads
the whole `frontend/` tree. `.vercelignore` lists `apps/mobile` so five
deploys do not each carry the app.

Escape hatch: the only coupling is the workspace import. If the app ever needs
its own cadence or team, it moves out and consumes `@kypstamping/api` as a
published package. Nothing here makes that harder.

## Shape: a modular app with one web slot, no SDK

Native tabs: **Home · Wallet · Code · Discover · Profile.** Every one of them
is React Native against `api.kyp.ph`, the same calls the PWA makes. The scan
is a full-screen modal off Home, not a tab, because the member code is what a
shopper needs at the counter more often than the camera.

One **webview slot** (`react-native-webview`, `app/web/[page].tsx`) hosts web
pages that are content rather than interaction: how it works, privacy, terms,
for shops. It opens with a signed-in session via a **one-time handoff code**,
never the app's own token:

    app  POST /auth/handoff            -> { code, expiresInSeconds: 60 }
    app  open https://kyp.ph/<page>?handoff=<code>
    web  POST /auth/handoff/exchange   -> its own cookie session

Two messages back over `window.ReactNativeWebView.postMessage`: `close`, and
`navigate` with a native route. That is the entire bridge.

**No SDK.** An SDK is for third parties building inside the shell, and there
are none. The handoff endpoint and two messages are the seam an SDK would grow
from if merchants ever author their own pages; building more now is
flexibility nobody asked for.

Discover is native, not a webview, on purpose: nearest-first needs
`expo-location` on the device; tapping a shop opens its native screen and
"join" puts a card into the same query cache the wallet reads; and it is the
same data the PWA's Discover tab already renders.

## What makes it better than the web wallet

- **Scan the poster in the app** (`expo-camera`). The poster encodes
  `app.kyp.ph/join/<slug>`; the app reads the slug and runs the same claim
  flow. Universal links for `app.kyp.ph` and `kyp.ph`, so a scanned or tapped
  link opens the app when installed and the PWA when not.
- **Member code offline**, cached in `expo-secure-store`, brightness raised
  while it is on screen. The PWA has an offline page; the app has an offline
  code.
- **Real push** for "your reward is waiting for approval" - the one moment a
  notification matters. The backend had web push only.
- Optional biometric lock on the wallet.
- Later, only if asked: Apple/Google Wallet passes, a home-screen widget.

## Stack (as pinned on 2026-09-06)

- **Expo SDK 57.0.20 / React Native 0.86.3**, the current release when the
  app was scaffolded. **Expo Router** with typed routes; file routes double as
  deep-link routes.
- **NativeWind 5.0.0-preview.4 with react-native-css 3** on the workspace's
  **Tailwind 4.3.3**. NativeWind 4 (the stable line) compiles only with
  Tailwind 3 and refuses the hoisted 4; a second Tailwind nested under the
  app cannot be reached from a hoisted NativeWind, and npm will not nest a
  peer dependency. NativeWind 5 is the line that runs on Tailwind 4, and it is
  what NativeWind's own docs now install. It is a preview: if it misbehaves
  on a device, the fallback is NativeWind 4 with the app moved out of the
  workspace, not another round of npm tricks. Theme tokens are the wallet's
  palette by the same names, in `global.css` under `@theme`; there is no
  `tailwind.config.js`.
- **Three root `overrides`**, each with a reason:
  - `lightningcss: 1.30.1`, because react-native-css deserialises CSS
    through lightningcss's native binding and breaks on 1.31+ ("expected an
    object-like struct named Specifier"). Expo's own Metro CSS stage wants
    `^1.30.1`, so it is happy too.
  - `@tailwindcss/node: { lightningcss: 1.32.0 }`, so the Tailwind the five
    Next apps build with keeps the exact version it pins, nested under
    itself. Nothing on the web side resolves the root copy.
  - `react-native-svg: 15.15.4`, the SDK 57 version, so lucide and the QR
    library share the one native module instead of pulling their own.
  - npm applies a changed override only when it rebuilds the tree: after
    editing `overrides`, run `npm dedupe`, not just `npm install`, and check
    `apps/mobile/node_modules` is empty of native packages afterwards.
- TanStack Query and zustand through `packages/api`; `expo-secure-store`,
  `expo-camera`, `expo-location`, `expo-notifications`, `expo-brightness`,
  `expo-local-authentication`, `react-native-webview`,
  `react-native-qrcode-svg`, `lucide-react-native`; Inter and Sora from
  `@expo-google-fonts`.
- `react 19.2.8` is shared with the workspace on purpose; `expo.install.exclude`
  in the app's `package.json` tells `expo-doctor` so.

Deployment: **EAS Build** (cloud - iOS builds happen there; this machine is
Windows), **EAS Submit**, **EAS Update** on `preview` and `production`
channels so JS-only fixes ship without a store review. `eas.json` carries the
three profiles; `expo-updates` and the `updates` config arrive with
`eas update:configure`, not before.

## Backend seams - three small changes, one contract

Built 2026-09-06, additive, `ruff` clean, and tested the same day in
`backend/tests/test_mobile_seams.py` against the local database (fourteen
tests; the whole suite still passes). They touch auth, and the change
contract the rules ask for was skipped on the instruction to build everything
at once.

1. **Bearer sessions.** `current_session` tries `Authorization: Bearer` first
   - same session table, same expiry, same revocation - and falls back to the
   cookie when the bearer names no session, because the counter already
   posts a machine key in that header beside the staff cookie.
   `POST /auth/otp/verify` returns `sessionToken` when the request carries
   `X-KYP-Client: mobile`; the app keeps it in the secure store.
2. **Handoff.** `POST /auth/handoff` (customer session only) mints a
   single-use sixty-second code in Redis (`services/handoff.py`);
   `POST /auth/handoff/exchange` spends it for a fresh cookie session on the
   same account.
3. **Expo push tokens.** `push_subscriptions.kind` (`webpush` | `expo`,
   migration `e7a1c9d24b58`), `POST /customer/push/expo`, and a send path in
   `notify.py` that posts to Expo's push service; a `DeviceNotRegistered`
   receipt removes the row. No APNs or FCM plumbing.

Covered: a browser never sees the token and the app does; the same account
answers over bearer and cookie; a bearer that is not a session leaves the
cookie to decide; sign-out over bearer revokes the row; a handoff code is
customer-only, spent once, dies with its session, expires, and yields a
session of its own; an Expo token registers, moves, and unsubscribes with
the browsers; a push reaches Expo without VAPID, an uninstalled app is
forgotten, an outage keeps the device; the migration applied to the seeded
local database.

## What was built (2026-09-06)

`apps/mobile`, fifty-odd files:

- `app/_layout.tsx` fonts, splash, the API provider, push registration, the
  pending poster claim settled on first sign-in, notification-tap routing.
- `app/(auth)/` login (email or mobile), verify, create account.
- `app/(tabs)/` Home, Wallet, Code (full brightness, offline), Discover
  (nearest-first with `expo-location`), Profile.
- `app/card/[id]`, `app/place/[id]`, `app/shops/[slug]`, `app/join/[slug]`,
  `app/scan` (camera to `/join/<slug>`), `app/my-code`, `app/activity`,
  `app/notifications`, `app/approvals`, `app/gifts`, `app/profile/*` (personal,
  notifications, privacy, businesses, consent, export, leave),
  `app/web/[page]` (the webview slot).
- `src/lib/` config, secure storage, the auth store, claim memory, location,
  push, the card helpers ported from the wallet, theme; `src/components/`
  brand, primitives, screen shell, stamp dots, the loyalty card, the member
  QR, toasts, the auth shell.
- `app.json`: scheme `kyp`, bundle and package `ph.kyp.wallet`, universal
  links for `app.kyp.ph/join`, `/login` and `kyp.ph/shops`, permission copy,
  the notification channel `rewards`. `extra.eas.projectId` is empty until
  `eas init` runs under the org's Expo account.

Verified: `tsc --noEmit` clean; `expo export` for Android and for iOS
bundles; `expo-doctor` clean; `expo lint` clean; the workspace `typecheck`
still passes for all seven packages. Walked on a Realme RMX3636 (Android 15,
Expo Go 57.0.9) against the local API on 2026-09-06: OTP sign-in, Home,
Wallet, the member code, Discover with a real position, Profile and every
screen under it, a card, a place, the inbox, activity, gifts, the camera
permission path, the webview slot on kyp.ph, sign-out. Fixed from that walk:
`expo-notifications` is required lazily and never in Expo Go (it throws on
import there, and Metro reports the throw as fatal past any try/catch); the
tab bar no longer sets a height, so its labels clear Android's navigation
bar; the member code raises the app window's brightness without asking for
the system-settings permission; Home reads a position only if already
allowed, Discover and a place page ask; the login card's title and chip no
longer overlap; a place page's promise tiles wrap two per row. Not verified:
iOS on a device, push delivery to a phone (Expo Go cannot receive remote
push; that needs a development build), universal links, the web apps'
builds after the lightningcss override (only `@tailwindcss/node`
loading its nested copy was checked).

## Run it

    cd frontend
    npm run dev:mobile          # expo start; press a for the Android emulator
    npm run lint:mobile
    npm run typecheck           # includes the app

With no `.env` the app talks to production, the defaults in
`src/lib/config.ts`, so a release build can never point at an emulator.
`.env.example` shows the local shapes: the emulator reaches a local API at
`http://10.0.2.2:8000/api/v1`, a phone on the LAN needs the machine's IPv4. Start Metro from the workspace root or
the app directory, nowhere else.

A phone on USB needs no LAN: `adb reverse tcp:8000 tcp:8000` and
`adb reverse tcp:8081 tcp:8081`, `EXPO_PUBLIC_API_BASE=http://localhost:8000/api/v1`
in `.env`, and Metro started as
`NODE_OPTIONS=--dns-result-order=ipv4first npx expo start --localhost`. The
Node option matters: on Node 24 `--localhost` otherwise binds only `[::1]`,
adb's tunnel connects over IPv4, and Expo Go reports "Failed to download
remote update". Open `exp://127.0.0.1:8081` in Expo Go once Metro says it is
waiting; a launch before that sticks on an error screen until reloaded.
In Expo Go the OTP is the local `OTP_DEV_CODE`, readable at
`/api/v1/_dev/messages?purpose=otp&limit=1`.

A release APK from this Windows machine (`npx expo run:android --variant
release`, or `android/gradlew.bat app:assembleRelease` after the prebuild it
runs) needs two things the SDK does not give: ninja 1.12 or newer dropped
into `Android/Sdk/cmake/3.22.1/bin` in place of the bundled 1.10 (the
codegen object paths pass 260 characters and only newer ninja honours the
long-path setting), and `-PreactNativeArchitectures=arm64-v8a` unless all
four ABIs are wanted, which triples the build. The APK is signed with the
debug keystore: fine for a phone over USB, not for a store; that is EAS
Build's job. Built and installed on the Realme against production on
2026-09-06.

## Phases, revisited

1. Backend seams - built, tests owed.
2. Wallet - built; the parity walk against app.kyp.ph on a device is next.
3. Discover - built.
4. Approvals, gifts, notifications, the webview slot - built.
5. **Universal links on a real domain, EAS channels, store submission** - not
   started; needs `eas init`, an Apple Developer account and a Google Play
   console, and `apple-app-site-association` and `assetlinks.json` served
   from app.kyp.ph and kyp.ph.

Each remaining phase ends with the free-tier walk (`qa:journey`) still green
and an on-device check of the app's own flows (Maestro is the lighter choice
and the one Expo recommends; decide when a device is in hand).

## Decisions taken here, open to being overruled

- The PWA stays; the app is additive.
- No BFF, no new backend service. The app talks to `api.kyp.ph` directly.
- Discover native; webview only for content.
- No SDK; a handoff code and two messages.
- Expo Push Service rather than raw APNs/FCM.
- NativeWind 5 preview over a second Tailwind; see "Stack" for the fallback.

## Not in this plan

Merchant app. The counter stays on biz.kypstamping.ph - a till is a browser
on a tablet, and the offline queue already lives there.
