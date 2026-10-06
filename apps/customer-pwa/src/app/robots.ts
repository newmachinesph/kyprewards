import type { MetadataRoute } from "next";

// Only kyprewards.com and kyp.ph are crawlable. Every crawler, AI ones
// included, except the app-link files the phone platforms fetch.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/.well-known/", disallow: "/" } };
}
