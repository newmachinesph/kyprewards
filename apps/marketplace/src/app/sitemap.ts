import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { loadDirectory } from "@/lib/public-data";
import { categoryPath, neighborhoodPath, shopPath } from "@/lib/routes";

// Rebuilt hourly. Cached forever by default, the sitemap kept shops the
// directory had since hidden and never listed new ones until a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { shops, categories, neighborhoods } = await loadDirectory();
  const at = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  });
  return [
    at("/", 1),
    at("/discover", 0.9),
    at("/how-it-works", 0.6),
    at("/for-shops", 0.4),
    at("/privacy", 0.3),
    at("/terms", 0.3),
    ...categories.map((f) => at(categoryPath(f.name), 0.7)),
    ...neighborhoods.map((f) => at(neighborhoodPath(f.name), 0.7)),
    ...shops.map((shop) => at(shopPath(shop.slug), 0.8)),
  ];
}
