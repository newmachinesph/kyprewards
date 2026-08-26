const isDev = process.env.NODE_ENV === "development";

export const businessAppUrl =
  process.env.NEXT_PUBLIC_BUSINESS_APP_URL ??
  (isDev ? "http://localhost:3000" : "https://biz.kypstamping.ph");

export const customerAppUrl =
  process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ??
  (isDev ? "http://localhost:3002" : "https://app.kypstamping.ph");

export const adminAppUrl =
  process.env.NEXT_PUBLIC_ADMIN_APP_URL ??
  (isDev ? "http://localhost:3001" : "https://admin.kypstamping.ph");

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (isDev ? "http://localhost:3003" : "https://kypstamping.ph");
