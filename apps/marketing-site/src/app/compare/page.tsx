import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AnswerBlock,
  MarketingCta,
  PageHero,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { comparisons } from "@/lib/comparisons";
import { breadcrumb, itemList, webPage } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Compare loyalty platforms in the Philippines",
  description:
    "Side-by-side comparisons of KYPStamping against GoBalik, Suki Cards, and ZAP, using each provider's public information with sources linked.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <main>
      <StructuredData
        data={[
          itemList({
            name: "KYPStamping platform comparisons",
            items: comparisons.map((comparison) => ({
              name: `KYPStamping vs ${comparison.competitor}`,
              path: `/compare/${comparison.slug}`,
              description: comparison.summary,
            })),
          }),
          webPage({
            name: "Compare loyalty platforms in the Philippines",
            description:
              "How KYPStamping compares with the Philippine loyalty platforms buyers shortlist most often.",
            path: "/compare",
          }),
          breadcrumb([{ name: "Compare", path: "/compare" }]),
        ]}
      />
      <PageHero
        image="/images/hero-integrations.webp"
        eyebrow="Fair product comparison"
        title="See the shortlist honestly."
        description="Each comparison uses the competitor's own public information, links its sources, and says plainly where the other product is the better fit."
      />
      <AnswerBlock
        question="Which loyalty platforms do Philippine businesses compare?"
        answer="The shortlist is usually GoBalik, Suki Cards, and ZAP. GoBalik is the closest match on price for a single shop, Suki Cards leads on Apple and Google Wallet passes, and ZAP is the established enterprise option with deep POS integration. KYPStamping sits between a narrow stamp-card tool and a full engagement suite."
        facts={comparisons.map((comparison) => ({
          label: comparison.competitor,
          value: comparison.publicPricing,
        }))}
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SiteEyebrow>Every comparison</SiteEyebrow>
          <h2 className="mt-4 max-w-[16ch] text-4xl font-extrabold leading-[1] tracking-[-0.02em] sm:text-5xl">
            Read the one that matches your shortlist.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
            {comparisons.map((comparison) => (
              <Link
                key={comparison.slug}
                href={`/compare/${comparison.slug}`}
                className="focus-ring group flex flex-col bg-[var(--surface)] p-7 transition hover:bg-[var(--paper)]"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                  {comparison.descriptor}
                </p>
                <h3 className="mt-3 flex items-start justify-between gap-3 text-xl font-extrabold tracking-[-0.02em]">
                  KYPStamping vs {comparison.competitor}
                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--accent-strong)]"
                  />
                </h3>
                <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                  {comparison.summary}
                </p>
                <dl className="mt-auto grid grid-cols-2 gap-4 pt-7 text-sm">
                  <div>
                    <dt className="text-xs text-[var(--muted)]">
                      Public pricing
                    </dt>
                    <dd className="mt-1 font-bold">
                      {comparison.publicPricing}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--muted)]">Best for</dt>
                    <dd className="mt-1 font-bold">{comparison.bestFor}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
          <p className="mt-8 max-w-[80ch] text-xs leading-relaxed text-[var(--muted)]">
            Comparisons use each provider&apos;s public information observed on
            25 August 2026, with primary sources linked on every page. Verify
            current terms with the provider before deciding.
          </p>
        </div>
      </section>

      <MarketingCta
        title="Still deciding? Talk it through."
        description="Tell us how your best customers already return, and we will say honestly whether KYPStamping is the right fit."
      />
    </main>
  );
}
