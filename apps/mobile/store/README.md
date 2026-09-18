# Store listing assets and release steps

Everything the Play Console and App Store Connect ask for as images, plus
the steps that need a console login and cannot be scripted from here.

## What is here

| File | Size | Where it goes |
|---|---|---|
| `android/icon-512.png` | 512 × 512 | Play Console, store listing, app icon |
| `android/feature-graphic.png` | 1024 × 500 | Play Console, store listing, feature graphic |
| `android/phone-1..4-*.png` | 1080 × 1920 (9:16) | Play Console, phone screenshots |
| `ios/iphone-6.9-1..4-*.png` | 1320 × 2868 | App Store Connect, iPhone 6.9" display |
| `ios/iphone-6.5-1..4-*.png` | 1284 × 2778 | App Store Connect, iPhone 6.5" display (optional; 6.9" is enough) |
| `captures/` | 1080 × 2408 | the raw app captures the screenshots are built from |
| `imagery/` | 1344 × 768, 768 × 1344 | generated backdrops (Gemini 2.5 Flash Image on Vertex AI) |

Sizes checked against the stores' own pages on 2026-09-18: Play wants a
512 icon, a 1024 × 500 feature graphic and at least four 9:16 screenshots
of 1080 px or more for promotion; Apple accepts 1320 × 2868 for the 6.9"
iPhone, and 6.5" is required only when 6.9" is missing. No image carries an
alpha channel, which both stores refuse on screenshots.

The app icons themselves live in `../assets/` and come from the same script:
`icon.png` (1024, opaque, iOS and default), `adaptive-icon.png` and
`adaptive-icon-monochrome.png` (Android foreground and themed icon),
`notification-icon.png` (96, white on transparent, as Android requires),
`splash.png`.

## Regenerate

From `frontend/`:

    python apps/mobile/store/imagery.py      # backdrops; needs gcloud ADC
    node apps/mobile/store/render.mjs icons  # app icons into ../assets
    node apps/mobile/store/render.mjs store  # listing graphics
    node apps/mobile/store/render.mjs        # both

New captures: run the app against the seeded local API, turn on Android's
demo status bar (`settings put global sysui_demo_allowed 1`, then the
`com.android.systemui.demo` broadcasts for clock 1541, full battery and
Wi-Fi, notifications hidden), and `adb exec-out screencap -p` each screen
into `captures/` under the same names.

The iOS set frames the same captures in a drawn iPhone 16 (Dynamic
Island, iOS status bar, home indicator, side buttons): the Android status
bar and gesture strip are cut, and the tab bar is kept clear of the home
indicator the way iOS lays it out. The app inside is still the Android
build, so replace the captures with iOS simulator or device ones once an
iOS build exists; the frame then needs no change.

## Steps that need a console login

Done on 2026-09-18: the Web and iOS OAuth clients exist and their IDs are
set on EAS and in the local env files; the Apple App ID `ph.kyp.wallet` and
the App Store Connect app exist.

1. **Google sign-in client IDs** (console.cloud.google.com, project
   `kyp-ph`, Google Auth Platform):
   - Branding and audience: app name KYP, support email, `kyp.ph` as an
     authorised domain, privacy and terms at kyp.ph, publish to production.
   - A **Web application** client. Authorised JavaScript origins
     `https://app.kyp.ph` and `http://localhost:3002`. Its ID goes to
     `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (customer-pwa on Vercel),
     `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (EAS, all three environments) and
     `GOOGLE_CLIENT_IDS` (the API).
   - An **iOS** client, bundle `ph.kyp.wallet`. Its ID goes to
     `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (EAS) and is appended to
     `GOOGLE_CLIENT_IDS`. `app.config.js` derives the URL scheme from it.
   - **Android** clients, package `ph.kyp.wallet`, one per signing
     certificate SHA-1: the EAS upload key (`eas credentials -p android`
     after the first build) and the Play App Signing key (Play Console,
     App integrity). Android needs no ID in the app; Google matches the
     package and certificate.
2. **Apple** (developer.apple.com): enable Sign in with Apple on the App ID
   `ph.kyp.wallet`. EAS does this, and creates the APNs push key, during the
   first `eas build -p ios` when signed in with the Apple account. Set
   `APPLE_TEAM_ID` on the customer-pwa Vercel project so
   `/.well-known/apple-app-site-association` answers.
3. **Android App Links**: after the first Android build, set
   `ANDROID_CERT_SHA256` on the customer-pwa Vercel project to the Play App
   Signing SHA-256 so `/.well-known/assetlinks.json` answers.
4. **Store listings**: privacy policy `https://kyp.ph/privacy`; account
   deletion is in the app (Profile, Privacy center, Leave or delete) and
   must also be reachable on the web for Play's data-deletion field.
5. **Submit**: `eas build -p android --profile production` and
   `eas submit -p android`, which needs a Play service account key; the same
   for iOS. `eas.json` already carries Team ID `4VU48XCNM2` and
   `ascAppId` `6813543606` (the App Store Connect app, created 2026-09-18).
