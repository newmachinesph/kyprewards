/**
 * Server-side reads for metadata, the sitemap and the shop page's 404.
 *
 * The screens themselves render through the hooks in `@kypstamping/api`;
 * these run where a hook cannot (`generateMetadata`, `sitemap.ts`) and hand
 * the static pages their first data, so a visitor's browser does not repeat
 * the call the server already made.
 * They go through the same `withPreview` seam, so under preview mode they
 * see the same sample shops the hooks do, and the day the public routes ship
 * they read the API with no change here.
 */
import { cache } from "react";
import {
  ApiError,
  getPublicCategories,
  getPublicDiscover,
  getPublicNeighborhoods,
  getPublicShop,
  isMissingEndpoint,
  previewEnabled,
  previewSamples,
  withPreview,
  type DiscoverFacet,
  type Page,
  type PublicShop,
} from "@kypstamping/api";

type ShopLookup =
  | { status: "found"; shop: PublicShop }
  | { status: "missing" }
  /** The API could not be reached; the client will try again in the browser. */
  | { status: "unknown" };

export const loadShop = cache(async (slug: string): Promise<ShopLookup> => {
  try {
    const shop = await withPreview(
      () => getPublicShop(slug),
      () => previewSamples.samplePublicShop(slug),
    )();
    return shop ? { status: "found", shop } : { status: "missing" };
  } catch (error) {
    // A 404 from a route that exists is a missing shop. A 404 from a route
    // that does not exist yet, with preview off, is the same answer for a
    // visitor: there is nothing to show at that address.
    if (error instanceof ApiError && error.status === 404) return { status: "missing" };
    if (isMissingEndpoint(error) && !previewEnabled()) return { status: "missing" };
    return { status: "unknown" };
  }
});

/**
 * The home page's two reads, made once per regeneration instead of per visit.
 * A read that fails comes back undefined rather than empty, so the browser
 * fetches it as before instead of caching "no shops" for an hour.
 */
export async function loadHome(): Promise<{
  categories: DiscoverFacet[] | undefined;
  shops: Page<PublicShop> | undefined;
}> {
  const [categories, shops] = await Promise.all([
    withPreview(getPublicCategories, previewSamples.sampleCategories)().catch(() => undefined),
    withPreview(
      () => getPublicDiscover({ limit: 6 }),
      () => previewSamples.samplePublicDiscover(),
    )().catch(() => undefined),
  ]);
  return { categories, shops };
}

export async function loadDirectory(): Promise<{
  shops: PublicShop[];
  categories: DiscoverFacet[];
  neighborhoods: DiscoverFacet[];
}> {
  try {
    const [page, categories, neighborhoods] = await Promise.all([
      withPreview(() => getPublicDiscover({ limit: 200 }), () => previewSamples.samplePublicDiscover())(),
      withPreview(getPublicCategories, previewSamples.sampleCategories)(),
      withPreview(getPublicNeighborhoods, previewSamples.sampleNeighborhoods)(),
    ]);
    return { shops: page.items, categories, neighborhoods };
  } catch {
    return { shops: [], categories: [], neighborhoods: [] };
  }
}
