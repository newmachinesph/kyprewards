import type { MetadataRoute } from "next";
import { industries, resources } from "@/lib/content";
import { comparisons } from "@/lib/comparisons";
import { siteUrl } from "@/lib/site";

/** A date the content states, or none when it does not parse. */
function knownDate(text: string): Date | undefined {
  const date = new Date(`${text} UTC`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Only real dates. A lastmod stamped at build time says "changed today" on
  // every page at every deploy, and Google stops trusting the field for the
  // whole site. Pages without a known edit date leave it out.
  const core = [
    "",
    "/product",
    "/features",
    "/integrations",
    "/solutions",
    "/compare",
    "/pricing",
    "/roadmap",
    "/loyalty-program-philippines",
    "/faq",
    "/resources",
    "/about",
    "/contact",
    "/partners",
    "/privacy",
    "/terms",
    "/merchant-terms",
    "/data-sharing",
    "/subprocessors",
    "/cookies",
  ];
  return [
    ...core.map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/contact" ? 0.9 : 0.8,
    })),
    ...industries.map((industry) => ({
      url: `${siteUrl}/solutions/${industry.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...resources.map((resource) => ({
      url: `${siteUrl}/resources/${resource.slug}`,
      lastModified: knownDate(resource.modified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...comparisons.map((comparison) => ({
      url: `${siteUrl}/compare/${comparison.slug}`,
      // The day the competitor's pages were last read: "3 September 2026".
      lastModified: knownDate(comparison.observed),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
