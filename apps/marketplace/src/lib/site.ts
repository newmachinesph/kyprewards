const isDev = process.env.NODE_ENV === "development";

/** The wallet this marketplace fronts. Same registrable domain as the
 *  marketplace itself, which is what keeps the session cookie first-party. */
export const customerAppUrl =
  process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ??
  (isDev ? "http://localhost:3002" : "https://app.kyp.ph");

/** Where a shop owner goes. A different audience on a different domain. */
export const merchantSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (isDev ? "http://localhost:3003" : "https://kypstamping.ph");

export const siteUrl =
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ??
  (isDev ? "http://localhost:3004" : "https://kyp.ph");
