const isDev = process.env.NODE_ENV === "development";

export const businessAppUrl =
  process.env.NEXT_PUBLIC_BUSINESS_APP_URL ??
  (isDev ? "http://localhost:3000" : "https://biz.kypstamping.ph");


export const adminAppUrl =
  process.env.NEXT_PUBLIC_ADMIN_APP_URL ??
  (isDev ? "http://localhost:3001" : "https://admin.kypstamping.ph");

/**
 * The customer wallet no longer lives on this site's domain, and this site no
 * longer points at it. kypstamping.ph speaks to merchants; the wallet and the
 * marketplace that fronts it are kyp.ph, a different audience and a different
 * registrable domain. `customerAppUrl` was removed rather than repointed so a
 * stray link cannot quietly reappear.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (isDev ? "http://localhost:3003" : "https://kypstamping.ph");
