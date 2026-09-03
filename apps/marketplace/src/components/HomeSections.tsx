"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isPreview, usePublicCategories, usePublicDiscover } from "@kypstamping/api";
import { PreviewBadge, QueryBoundary } from "@kypstamping/ui";
import { ArrowRight, LocateFixed } from "lucide-react";
import { categoryPath } from "@/lib/routes";
import { ShopCard } from "./ShopCard";
import { useCoordinates } from "./useCoordinates";

export function CategoryChips() {
  const categories = usePublicCategories();
  return (
    <QueryBoundary
      isPending={categories.isPending}
      error={categories.error}
      onRetry={() => void categories.refetch()}
      label="categories"
      rows={1}
    >
      <ul className="flex flex-wrap gap-2" aria-label="Categories">
        {categories.data?.map((facet) => (
          <li key={facet.name}>
            <Link
              href={categoryPath(facet.name)}
              className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-bold transition hover:border-[var(--ink)]"
            >
              {facet.name}
              <span className="text-xs font-semibold text-[var(--muted)]">{facet.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </QueryBoundary>
  );
}

/** Asks for a position, then opens the directory already sorted by it. */
export function LocationButton() {
  const router = useRouter();
  const { coords, status, ask } = useCoordinates();

  const go = async () => {
    if (!coords) await ask();
    router.push("/discover");
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void go()}
        disabled={status === "asking"}
        className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-6 text-sm font-extrabold text-[var(--ink)] shadow-[0_2px_0_rgb(0_0_0/12%)] transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        <LocateFixed size={16} aria-hidden="true" />
        {status === "asking" ? "Finding you" : coords ? "Show shops near me" : "Use my location"}
      </button>
      {status === "denied" && (
        <p className="mt-3 text-sm text-[var(--muted-strong)]">
          Location is off in your browser. You can still browse by neighborhood.
        </p>
      )}
    </div>
  );
}

/** Featured shops, or the first few when nobody has bought placement yet. */
export function FeaturedRow() {
  const shops = usePublicDiscover({ limit: 6 });
  const items = shops.data?.items ?? [];
  const featured = items.filter((shop) => shop.featured);
  const picks = (featured.length ? featured : items).slice(0, 3);

  return (
    <QueryBoundary
      isPending={shops.isPending}
      error={shops.error}
      onRetry={() => void shops.refetch()}
      label="featured shops"
      rows={2}
    >
      {picks.length > 0 && (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                {featured.length ? "Featured shops" : "Shops in Discover"}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-strong)]">
                {featured.length
                  ? "Placed above the distance order by the shop."
                  : "Every shop with a live program, on every plan."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isPreview(items) && <PreviewBadge />}
              <Link
                href="/discover"
                className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-[var(--accent-strong)] transition hover:gap-3"
              >
                All shops <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((shop) => (
              <ShopCard key={shop.slug} shop={shop} />
            ))}
          </ul>
        </div>
      )}
    </QueryBoundary>
  );
}
