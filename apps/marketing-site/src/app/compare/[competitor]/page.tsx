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

export function generateStaticParams() {
  return comparisons.map((comparison) => ({ competitor: comparison.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params;
  const comparison = getComparison(competitor);
  if (!comparison) return {};
  return {
    title: `KYPStamping vs ${comparison.competitor}`,
    description: `Compare KYPStamping with ${comparison.competitor}: public pricing, customer experience, program formats, campaigns, analytics, and operational fit.`,
    alternates: { canonical: `/compare/${comparison.slug}` },
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
            headline: `KYPStamping vs ${comparison.competitor}`,
            description: comparison.summary,
            datePublished: "2026-08-25",
            dateModified: "2026-08-26",
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
        title={`KYPStamping vs ${comparison.competitor}`}
        description={comparison.summary}
      >
        <SiteButton href="/pricing">Model KYPStamping pricing</SiteButton>
        <SiteButton href="/contact" tone="outline">
          Discuss your requirements
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
              Comparison facts use publicly documented pages available on August
              25, 2026. Product offers can change; verify current terms with
              each provider. KYPStamping descriptions refer to this frontend demo and
              stated product direction.
            </p>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--line)]">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[var(--ink)] text-[var(--paper)]">
                <tr>
                  <th className="px-6 py-5 text-xs uppercase tracking-[0.12em]">
                    Requirement
                  </th>
                  <th className="px-6 py-5 text-xs uppercase tracking-[0.12em]">
                    {comparison.competitor}
                  </th>
                  <th className="px-6 py-5 text-xs uppercase tracking-[0.12em]">
                    KYPStamping direction
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.facts.map((fact, index) => (
                  <tr
                    key={fact.label}
                    className={index > 0 ? "border-t border-[var(--line)]" : ""}
                  >
                    <th className="bg-[var(--paper)] px-6 py-5 text-sm font-extrabold">
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
                        {fact.stampr}
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
        description="Use the demos to test customer, counter, campaign, and administration workflows before committing to implementation."
      />
    </main>
  );
}
