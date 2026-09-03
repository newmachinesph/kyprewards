"use client";

import type { ChangeEvent } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePublicCategories, usePublicNeighborhoods, type DiscoverFacet } from "@kypstamping/api";
import { Search } from "lucide-react";

export type Filters = { category?: string; neighborhood?: string; search?: string };

const field =
  "focus-ring min-h-12 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm";
const labelClass = "block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]";

/** The current value stays selectable even if the facet list does not carry it. */
function options(facets: DiscoverFacet[] | undefined, current: string | undefined) {
  const list = facets ?? [];
  return current && !list.some((f) => f.name === current) ? [{ name: current, count: 0 }, ...list] : list;
}

/**
 * Filters live in the URL, so a filtered view can be shared and the back
 * button works. `next/form` turns the submit into a client-side navigation;
 * without JavaScript it is still a working GET form.
 */
export function DiscoverFilters({ filters }: { filters: Filters }) {
  const categories = usePublicCategories();
  const neighborhoods = usePublicNeighborhoods();
  const submitOnChange = (event: ChangeEvent<HTMLSelectElement>) =>
    event.currentTarget.form?.requestSubmit();
  const active = Boolean(filters.category || filters.neighborhood || filters.search);

  return (
    <Form
      key={JSON.stringify(filters)}
      action="/discover"
      className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end"
    >
      <label>
        <span className={labelClass}>Search</span>
        <span className="relative mt-1.5 block">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="search"
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Shop name or category"
            className={`${field} pl-11`}
          />
        </span>
      </label>
      <label>
        <span className={labelClass}>Category</span>
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          onChange={submitOnChange}
          className={`${field} mt-1.5`}
        >
          <option value="">All categories</option>
          {options(categories.data, filters.category).map((facet) => (
            <option key={facet.name} value={facet.name}>
              {facet.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={labelClass}>Neighborhood</span>
        <select
          name="neighborhood"
          defaultValue={filters.neighborhood ?? ""}
          onChange={submitOnChange}
          className={`${field} mt-1.5`}
        >
          <option value="">Anywhere</option>
          {options(neighborhoods.data, filters.neighborhood).map((facet) => (
            <option key={facet.name} value={facet.name}>
              {facet.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="focus-ring inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)] transition hover:bg-[var(--ink-soft)] md:flex-none"
        >
          Search
        </button>
        {active && (
          <Link
            href="/discover"
            className="focus-ring inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--line-strong)] px-4 text-sm font-bold"
          >
            Clear
          </Link>
        )}
      </div>
    </Form>
  );
}
