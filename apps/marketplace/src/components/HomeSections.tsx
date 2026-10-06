"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  isPreview,
  usePublicCategories,
  usePublicDiscover,
  type DiscoverFacet,
  type Page,
  type PublicShop,
} from "@kypstamping/api";
import { PreviewBadge, QueryBoundary } from "@kypstamping/ui";
import { ArrowRight, LocateFixed } from "lucide-react";
import { categoryPath } from "@/lib/routes";
import { ActionLink, EmptyState } from "./Ui";
import { ShopCard } from "./ShopCard";
import { useCoordinates } from "./useCoordinates";

export function CategoryChips({ initialData }: { initialData?: DiscoverFacet[] }) {
  const categories = usePublicCategories({ initialData });
  return (
    <QueryBoundary
      isPending={categories.isPending}
      error={categories.error}
      onRetry={() => void categories.refetch()}
      label="categories"
      rows={1}
    >
      {categories.data?.length === 0 && (
        <p className="text-sm text-[var(--muted-strong)]">
          Categories appear here as shops join.
        </p>
      )}
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
export function FeaturedRow({ initialData }: { initialData?: Page<PublicShop> }) {
  const shops = usePublicDiscover({ limit: 6 }, { initialData });
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
      {/* A directory with nothing in it is where this marketplace starts, so
          it says so. Rendering nothing at all - which is what an empty
          `picks` used to do - leaves a blank band under the hero that reads
          as a page that failed to load. */}
      {picks.length === 0 && (
        <EmptyState
          title="No shops listed yet"
          action={
            <ActionLink href="/for-shops" tone="dark">
              Run a shop? Get listed
            </ActionLink>
          }
        >
          Shops appear here the moment they switch on a loyalty card — every one of them, on
          every plan, with no placement to buy. We are signing up the first ones now.
        </EmptyState>
      )}
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
