import type { Metadata } from "next";
import Link from "next/link";
import { decodeParam } from "@/lib/routes";
import { PageIntro, Section } from "@/components/Ui";
import { ShopGrid } from "@/components/ShopGrid";

type Params = Promise<{ neighborhood: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const neighborhood = decodeParam((await params).neighborhood);
  return {
    title: `Shops in ${neighborhood}`,
    description: `Shops in ${neighborhood} with a live rewards program. Join from the poster and keep the card in your wallet.`,
    alternates: { canonical: `/neighborhoods/${encodeURIComponent(neighborhood)}` },
  };
}

export default async function NeighborhoodPage({ params }: { params: Params }) {
  const neighborhood = decodeParam((await params).neighborhood);
  return (
    <>
      <PageIntro
        eyebrow="Neighborhood"
        title={neighborhood}
        description={`Every shop in ${neighborhood} with a live program, featured first, then nearest once you share where you are.`}
      >
        <p className="mt-4 text-sm">
          <Link href="/discover" className="focus-ring rounded-md font-bold text-[var(--accent-strong)] underline-offset-2 hover:underline">
            All neighborhoods
          </Link>
        </p>
      </PageIntro>
      <Section className="py-10 lg:py-14">
        <ShopGrid
          query={{ neighborhood }}
          empty={
            <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-10 text-center">
              <p className="text-lg font-bold">No shops in {neighborhood} listed yet</p>
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
