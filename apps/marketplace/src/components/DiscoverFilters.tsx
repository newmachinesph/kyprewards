"use client";

import type { ChangeEvent } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePublicCategories, usePublicNeighborhoods, type DiscoverFacet } from "@kypstamping/api";
import { Button, buttonClass } from "@kypstamping/ui";
import { Input, Select } from "@kypstamping/ui/form";
import { Search } from "lucide-react";

export type Filters = { category?: string; neighborhood?: string; search?: string };

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
        <Input
          type="search"
          name="search"
          defaultValue={filters.search ?? ""}
          placeholder="Shop name or category"
          icon={<Search size={16} />}
          className="mt-1.5"
        />
      </label>
      <label>
        <span className={labelClass}>Category</span>
        <Select
          name="category"
          defaultValue={filters.category ?? ""}
          onChange={submitOnChange}
          className="mt-1.5"
        >
          <option value="">All categories</option>
          {options(categories.data, filters.category).map((facet) => (
            <option key={facet.name} value={facet.name}>
              {facet.name}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span className={labelClass}>Neighborhood</span>
        <Select
          name="neighborhood"
          defaultValue={filters.neighborhood ?? ""}
          onChange={submitOnChange}
          className="mt-1.5"
        >
          <option value="">Anywhere</option>
          {options(neighborhoods.data, filters.neighborhood).map((facet) => (
            <option key={facet.name} value={facet.name}>
              {facet.name}
            </option>
          ))}
        </Select>
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="lg" className="flex-1 md:flex-none">
          Search
        </Button>
        {active && (
          <Link href="/discover" className={buttonClass({ tone: "quiet", size: "lg" })}>
            Clear
          </Link>
        )}
      </div>
    </Form>
  );
}
