/**
 * Where the app talks to, per build.
 *
 * `EXPO_PUBLIC_*` values are inlined at build time, the same rule as
 * `NEXT_PUBLIC_*`: nothing secret, and changing one after a build changes
 * nothing. `eas.json` sets them per profile; `.env` covers a local run.
 *
 * The fallbacks are production, and an empty value counts as unset: a
 * `.env` line left as `EXPO_PUBLIC_API_BASE=` inlines "", and `??` kept it.
 * The fallbacks are production. A release build with no env file must talk
 * to api.kyp.ph, never to an emulator address; local development opts out
 * through `.env` (`.env.example` shows the emulator and USB shapes).
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || "https://api.kyp.ph/api/v1";

/** kyp.ph - the shopper-facing web: how it works, privacy, terms, shop pages. */
export const MARKETPLACE_URL =
  process.env.EXPO_PUBLIC_MARKETPLACE_URL || "https://kyp.ph";

/** kypstamping.ph - the merchant site, for "I run a shop". */
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL || "https://kypstamping.ph";

/** The web wallet's host, which is what a counter poster's QR encodes. */
export const WALLET_HOSTS = ["app.kyp.ph", "kyp.ph"];

/** A place is "nearby" within a 1.5 km walk. Mirrors the web wallet. */
export const NEARBY_METRES = 1500;

/**
 * Google sign-in. The web client ID is what makes Google put an ID token in
 * the answer, and the API checks the token's audience against it; the iOS
 * client ID is iOS's own. Empty hides the button - nothing half-configured
 * is offered. Not secret: both ship inside every Google-enabled app.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
