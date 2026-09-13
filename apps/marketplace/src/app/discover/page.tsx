import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Section } from "@/components/Ui";
import { DiscoverFilters, type Filters } from "@/components/DiscoverFilters";
import { ShopGrid } from "@/components/ShopGrid";

export const metadata: Metadata = {
  title: "Discover shops",
  description:
    "Every shop around you with a live rewards program, on every plan. Filter by category and neighborhood, or sort by distance.",
  alternates: { canonical: "/discover" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (value: string | string[] | undefined) => {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed.slice(0, 120) : undefined;
};

export default async function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters: Filters = {
    category: one(params.category),
    neighborhood: one(params.neighborhood),
    search: one(params.search),
  };

  return (
    <>
      <PageIntro
        eyebrow="Discover"
        title="Shops with a card waiting for you"
        description="Every shop running a live program with a complete profile is listed, on every plan. Featured shops come first, then the nearest once you share where you are."
      />
      <Section className="py-10 lg:py-14">
        <DiscoverFilters filters={filters} />
        <div className="mt-8">
          <ShopGrid
            query={filters}
            empty={
              <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-10 text-center">
                <p className="text-lg font-bold">No shops match that yet</p>
                <p className="mt-2 text-sm text-[var(--muted-strong)]">
                  Try another neighborhood, or{" "}
                  <Link href="/discover" className="font-bold text-[var(--accent-strong)] underline-offset-2 hover:underline">
                    clear the filters
                  </Link>
                  .
                </p>
              </div>
            }
          />
        </div>
      </Section>
    </>
  );
}
