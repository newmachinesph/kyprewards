import type { Metadata } from "next";
import Link from "next/link";
import { decodeParam } from "@/lib/routes";
import { PageIntro, Section } from "@/components/Ui";
import { ShopGrid } from "@/components/ShopGrid";

type Params = Promise<{ category: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const category = decodeParam((await params).category);
  return {
    title: `${category} shops`,
    description: `${category} shops around you with a live rewards program. Join from the poster and keep the card in your wallet.`,
    alternates: { canonical: `/categories/${encodeURIComponent(category)}` },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const category = decodeParam((await params).category);
  return (
    <>
      <PageIntro
        eyebrow="Category"
        title={category}
        description={`Every ${category.toLowerCase()} shop with a live program, featured first, then nearest once you share where you are.`}
      >
        <p className="mt-4 text-sm">
          <Link href="/discover" className="focus-ring rounded-md font-bold text-[var(--accent-strong)] underline-offset-2 hover:underline">
            All categories
          </Link>
        </p>
      </PageIntro>
      <Section className="py-10 lg:py-14">
        <ShopGrid
          query={{ category }}
          empty={
            <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-10 text-center">
              <p className="text-lg font-bold">No {category.toLowerCase()} shops listed yet</p>
              <p className="mt-2 text-sm text-[var(--muted-strong)]">
                Shops appear here the day their program goes live.{" "}
                <Link href="/discover" className="font-bold text-[var(--accent-strong)] underline-offset-2 hover:underline">
                  See every shop
                </Link>
                .
              </p>
            </div>
          }
        />
      </Section>
    </>
  );
}
