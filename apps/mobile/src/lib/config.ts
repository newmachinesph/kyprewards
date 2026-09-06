/**
 * Where the app talks to, per build.
 *
 * `EXPO_PUBLIC_*` values are inlined at build time, the same rule as
 * `NEXT_PUBLIC_*`: nothing secret, and changing one after a build changes
 * nothing. `eas.json` sets them per profile; `.env` covers a local run.
 *
 * The fallbacks are production. A release build with no env file must talk
 * to api.kyp.ph, never to an emulator address; local development opts out
 * through `.env` (`.env.example` shows the emulator and USB shapes).
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? "https://api.kyp.ph/api/v1";

/** kyp.ph - the shopper-facing web: how it works, privacy, terms, shop pages. */
export const MARKETPLACE_URL =
  process.env.EXPO_PUBLIC_MARKETPLACE_URL ?? "https://kyp.ph";

/** kypstamping.ph - the merchant site, for "I run a shop". */
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ?? "https://kypstamping.ph";

/** The web wallet's host, which is what a counter poster's QR encodes. */
export const WALLET_HOSTS = ["app.kyp.ph", "kyp.ph"];

/** A place is "nearby" within a 1.5 km walk. Mirrors the web wallet. */
export const NEARBY_METRES = 1500;
