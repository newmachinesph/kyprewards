import type { MetadataRoute } from "next";
import { industries, resources } from "@/lib/content";
import { comparisons } from "@/lib/comparisons";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Stamped at build time so a redeploy refreshes it, instead of a literal
  // date that silently ages every time the site ships.
  const lastModified = new Date();
  const core = [
    "",
    "/product",
    "/features",
    "/integrations",
    "/solutions",
    "/compare",
    "/pricing",
    "/loyalty-program-philippines",
    "/faq",
    "/resources",
    "/about",
    "/contact",
    "/partners",
    "/privacy",
    "/terms",
  ];
  return [
    ...core.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/contact" ? 0.9 : 0.8,
    })),
    ...industries.map((industry) => ({
      url: `${siteUrl}/solutions/${industry.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...resources.map((resource) => ({
      url: `${siteUrl}/resources/${resource.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...comparisons.map((comparison) => ({
      url: `${siteUrl}/compare/${comparison.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
