import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AnswerBlock,
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { comparisons } from "@/lib/comparisons";
import { breadcrumb, itemList, webPage } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Compare Loyalty Platforms in the Philippines",
  description:
    "Honest side-by-side comparisons against every Philippine loyalty platform with peso pricing — ZAP, Qashier, StoreHub, Suki Cards, GoBalik. Sources linked.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <main>
      <StructuredData
        data={[
          itemList({
            name: "KYP Stamping platform comparisons",
            items: comparisons.map((comparison) => ({
              name: `KYP Stamping vs ${comparison.competitor}`,
              path: `/compare/${comparison.slug}`,
              description: comparison.summary,
            })),
          }),
          webPage({
            name: "Compare loyalty platforms in the Philippines",
            description:
              "How KYP Stamping compares with the Philippine loyalty platforms buyers shortlist most often.",
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
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/pricing" tone="outline">
          See pricing
        </SiteButton>
      </PageHero>
      <AnswerBlock
        image="/images/answer-compare.webp"
        question="Which loyalty platforms do Philippine businesses compare?"
        answer="The realistic shortlist is the platforms that quote in pesos: ZAP, the established local incumbent at ₱4,800 a month above a free tier; Qashier Treats at ₱590 a month but only on top of a Qashier POS subscription; StoreHub from ₱2,249 a month with loyalty bundled into a full POS; Suki Cards on annual peso pricing with Apple and Google Wallet passes; and GoBalik at ₱399 for a stamp card and little else. KYP Stamping is the one that costs nothing to start, replaces no part of your checkout, and publishes what each message costs to send."
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
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
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
                  KYP Stamping vs {comparison.competitor}
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
          <p className="mt-8 max-w-[86ch] text-xs leading-relaxed text-[var(--muted)]">
            Every comparison uses the provider&apos;s own public pages, with the
            date they were read and a link to the source on each page. We compare
            against platforms that publish Philippine peso pricing: a monthly
            figure in dollars is not a like-for-like number for a shop that earns
            and banks in pesos. Offers change — verify current terms with the
            provider before deciding.
          </p>
        </div>
      </section>

      <MarketingCta
        title="Still deciding? Talk it through."
        description="Tell us how your best customers already return. If one of these is the better answer for your shop, we will say so."
      />
    </main>
  );
}
