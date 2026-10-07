"use client";

import { useState, type ReactNode } from "react";
import { isPreview, usePublicDiscover, type PublicDiscoverQuery } from "@kyprewards/api";
import { Button, PreviewBadge, QueryBoundary } from "@kyprewards/ui";
import { LocateFixed, X } from "lucide-react";
import { ShopCard } from "./ShopCard";
import { useCoordinates } from "./useCoordinates";

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

/**
 * The directory, paged the way the API pages: one request per cursor, each
 * its own query so a "Show more" never refetches what is already on screen.
 * The API decides the order (featured first, then distance); nothing is
 * sorted here.
 */
export function ShopGrid({ query, empty }: { query: PublicDiscoverQuery; empty: ReactNode }) {
  const { coords, status, ask, clear } = useCoordinates();
  const located = coords ? { ...query, lat: coords.lat, lng: coords.lng } : query;

  // Cursors belong to one filter set; a new set starts again from the first page.
  const signature = JSON.stringify(located);
  const [pages, setPages] = useState({ signature, cursors: [] as string[] });
  const cursors = pages.signature === signature ? pages.cursors : [];
  const all: (string | undefined)[] = [undefined, ...cursors];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {coords ? (
          <button
            type="button"
            onClick={clear}
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--ink)] px-4 text-xs font-extrabold text-[var(--paper)]"
          >
            <LocateFixed size={14} aria-hidden="true" />
            Nearby first
            <X size={14} aria-hidden="true" />
            <span className="sr-only">, stop using my location</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void ask()}
            disabled={status === "asking"}
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-xs font-extrabold transition hover:border-[var(--ink)] disabled:opacity-60"
          >
            <LocateFixed size={14} aria-hidden="true" />
            {status === "asking" ? "Finding you" : "Use my location"}
          </button>
        )}
        {status === "denied" && !coords && (
          <p className="text-xs text-[var(--muted-strong)]">
            Location is off in your browser, so distances stay hidden.
          </p>
        )}
      </div>
      {all.map((cursor, index) => (
        <GridPage
          key={cursor ?? "first"}
          query={cursor ? { ...located, cursor } : located}
          first={index === 0}
          last={index === all.length - 1}
          onMore={(next) => setPages({ signature, cursors: [...cursors, next] })}
          empty={empty}
        />
      ))}
    </div>
  );
}

function GridPage({
  query,
  first,
  last,
  onMore,
  empty,
}: {
  query: PublicDiscoverQuery;
  first: boolean;
  last: boolean;
  onMore: (cursor: string) => void;
  empty: ReactNode;
}) {
  const shops = usePublicDiscover(query);
  const data = shops.data;
  const next = data?.nextCursor;

  return (
    <QueryBoundary
      isPending={shops.isPending}
      error={shops.error}
      onRetry={() => void shops.refetch()}
      label="shops"
      rows={3}
    >
      {data && (
        <div className={`space-y-4 ${shops.isPlaceholderData ? "opacity-60" : ""}`}>
          {first && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--muted-strong)]" aria-live="polite">
                {data.total === 1 ? "1 shop" : `${data.total} shops`}
              </p>
              {isPreview(data.items) && <PreviewBadge />}
            </div>
          )}
          {first && data.items.length === 0 ? (
            empty
          ) : (
            <ul className={GRID}>
              {data.items.map((shop) => (
                <ShopCard key={shop.slug} shop={shop} />
              ))}
            </ul>
          )}
          {last && next && (
            <div className="flex justify-center pt-2">
              <Button tone="quiet" size="lg" onClick={() => onMore(next)}>
                Show more
              </Button>
            </div>
          )}
        </div>
      )}
    </QueryBoundary>
  );
}
