import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, Minus } from "lucide-react";
import {
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb, organizationId, softwareId } from "@/lib/schema";
import { comparisons, getComparison } from "@/lib/comparisons";

type Props = { params: Promise<{ competitor: string }> };

// Only the slugs in generateStaticParams exist. Without this an unknown
// slug rendered not-found content with a 200, so search engines index
// arbitrary URLs as real pages.
export const dynamicParams = false;

export function generateStaticParams() {
  return comparisons.map((comparison) => ({ competitor: comparison.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params;
  const comparison = getComparison(competitor);
  if (!comparison) return {};
  return {
    title: `KYP Rewards vs ${comparison.competitor}`,
    description: `${comparison.publicPricing}. An honest side-by-side on price, program formats, campaigns and customer control — with ${comparison.competitor}'s own sources linked, and a straight answer on where it is the better fit.`,
    alternates: { canonical: `/compare/${comparison.slug}` },
    openGraph: {
      title: `KYP Rewards vs ${comparison.competitor}`,
      description: comparison.summary,
      url: `/compare/${comparison.slug}`,
      locale: "en_PH",
      type: "article",
    },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { competitor } = await params;
  const comparison = getComparison(competitor);
  if (!comparison) notFound();
  return (
    <main>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `KYP Rewards vs ${comparison.competitor}`,
            description: comparison.summary,
            datePublished: "2026-08-25",
            dateModified: "2026-09-03",
            inLanguage: "en-PH",
            author: { "@id": organizationId },
            publisher: { "@id": organizationId },
            about: [
              { "@id": softwareId },
              { "@type": "SoftwareApplication", name: comparison.competitor },
            ],
          },
          breadcrumb([
            { name: "Compare", path: "/compare" },
            {
              name: `vs ${comparison.competitor}`,
              path: `/compare/${comparison.slug}`,
            },
          ]),
        ]}
      />
      <PageHero
        image="/images/hero-integrations.webp"
        eyebrow="Fair product comparison"
        title={`KYP Rewards vs ${comparison.competitor}`}
        description={comparison.summary}
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/pricing" tone="outline">
          See pricing
        </SiteButton>
      </PageHero>
      <section className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
          <article className="bg-[var(--surface)] p-6">
            <SiteEyebrow>{comparison.competitor} public pricing</SiteEyebrow>
            <p className="mt-4 text-xl font-extrabold">
              {comparison.publicPricing}
            </p>
          </article>
          <article className="bg-[var(--paper)] p-6">
            <SiteEyebrow>Best fit</SiteEyebrow>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
              {comparison.bestFor}
            </p>
          </article>
        </div>
      </section>
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
            <div>
              <SiteEyebrow>Requirement by requirement</SiteEyebrow>
              <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em]">
                Choose for the workflow you need.
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
              {comparison.competitor} facts come from its own public pages, read
              on {comparison.observed}, and every source is linked at the foot of
              this page. Offers change — verify current terms with the provider
              before you decide. Where a KYP Rewards capability arrives with a
              paid tier, the row says which tier.
            </p>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--line)]">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[var(--ink)] text-[var(--paper)]">
                <tr>
                  <th scope="col" className="px-6 py-5 text-xs uppercase tracking-[0.12em]">
                    Requirement
                  </th>
                  <th scope="col" className="px-6 py-5 text-xs uppercase tracking-[0.12em]">
                    {comparison.competitor}
                  </th>
                  <th scope="col" className="px-6 py-5 text-xs uppercase tracking-[0.12em]">
                    KYP Rewards
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.facts.map((fact, index) => (
                  <tr
                    key={fact.label}
                    className={index > 0 ? "border-t border-[var(--line)]" : ""}
                  >
                    <th scope="row" className="bg-[var(--paper)] px-6 py-5 text-sm font-extrabold">
                      {fact.label}
                    </th>
                    <td className="bg-[var(--surface)] px-6 py-5 text-sm leading-relaxed text-[var(--muted-strong)]">
                      <span className="flex items-start gap-3">
                        <Minus size={15} className="mt-0.5 shrink-0" />
                        {fact.competitor}
                      </span>
                    </td>
                    <td className="bg-[rgb(232_163_61/8%)] px-6 py-5 text-sm leading-relaxed">
                      <span className="flex items-start gap-3">
                        <Check
                          size={15}
                          className="mt-0.5 shrink-0 text-[var(--accent-strong)]"
                        />
                        {fact.kypstamping}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1000px]">
          <SiteEyebrow>Primary sources</SiteEyebrow>
          <h2 className="mt-4 text-2xl font-extrabold">Verify the public offer.</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {comparison.sources.map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-5 text-sm font-bold"
              >
                {source.label}
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </div>
      </section>
      <MarketingCta
        title="Pick the system your team will actually run."
        description={`Tell us how your best customers already come back, and we will say honestly whether KYP Rewards is the better fit for you than ${comparison.competitor}.`}
      />
    </main>
  );
}
