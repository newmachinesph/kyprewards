import type { MetadataRoute } from "next";

// Only kyprewards.com and kyp.ph are crawlable. Every crawler, AI ones included.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
