import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BellRing,
  ChartNoAxesCombined,
  Gift,
  QrCode,
  ScanLine,
  Stamp,
} from "lucide-react";
import {
  MarketingCta,
  ReceiptDemo,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { industries } from "@/lib/content";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb, service } from "@/lib/schema";

type Props = { params: Promise<{ industry: string }> };

// Only the slugs in generateStaticParams exist. Without this an unknown
// slug rendered not-found content with a 200, so search engines index
// arbitrary URLs as real pages.
export const dynamicParams = false;

export function generateStaticParams() {
  return industries.map((industry) => ({ industry: industry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry: slug } = await params;
  const industry = industries.find((item) => item.slug === slug);
  if (!industry) return { title: "Solution not found" };
  return {
    title: `Loyalty for ${industry.name}`,
    // The full industry blurb ran to 300 characters here; search engines cut
    // at about 160. The headline carries the specific hook on its own.
    description: `${industry.headline} Free digital stamp cards for ${industry.name.toLowerCase()}, built for the Philippines.`,
    alternates: { canonical: `/solutions/${industry.slug}` },
    openGraph: {
      title: `${industry.headline} — KYP Stamping for ${industry.name}`,
      description: industry.description,
      url: `/solutions/${industry.slug}`,
      locale: "en_PH",
      type: "article",
    },
  };
}

export default async function IndustryPage({ params }: Props) {
  const { industry: slug } = await params;
  const industry = industries.find((item) => item.slug === slug);
  if (!industry) notFound();

  return (
    <>
      <StructuredData
        data={[
          service({
            name: `KYP Stamping for ${industry.name}`,
            description: industry.description,
            path: `/solutions/${industry.slug}`,
            audience: industry.name,
          }),
          breadcrumb([
            { name: "Solutions", path: "/solutions" },
            { name: industry.name, path: `/solutions/${industry.slug}` },
          ]),
        ]}
      />
    <main>
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-industry.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-[70%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,var(--paper)_10%,rgb(250_248_243/93%)_52%,rgb(250_248_243/74%)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,var(--paper))]"
        />
        <div className="relative mx-auto grid min-h-[720px] max-w-[1400px] items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <SiteEyebrow>{industry.eyebrow}</SiteEyebrow>
            <h1 className="mt-6 max-w-[11ch] text-5xl font-extrabold leading-[0.94] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              {industry.headline}
            </h1>
            <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
              {industry.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SiteButton href="/partners">Apply to join</SiteButton>
              <SiteButton href="/pricing" tone="outline">
                See pricing
              </SiteButton>
            </div>
          </div>
          <div className="relative min-h-[520px]">
            <div className="absolute inset-10 rounded-full border-[74px] border-[var(--accent)] opacity-85" />
            <div className="absolute inset-x-0 bottom-0">
              <ReceiptDemo compact />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SiteEyebrow>The real challenge</SiteEyebrow>
            <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
              Recognition gets harder when business gets busy.
            </h2>
          </div>
          <div className="self-end">
            <p className="max-w-[58ch] text-xl font-semibold leading-relaxed tracking-[-0.025em] text-[var(--muted-strong)]">
              {industry.challenge}
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
                <p className="text-4xl font-extrabold tracking-[-0.03em]">
                  {industry.metric}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/70">
                  {industry.metricLabel}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--accent)] p-6">
                <Gift size={20} />
                <p className="mt-8 text-lg font-extrabold tracking-[-0.02em]">
                  {industry.reward}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <SiteEyebrow>For {industry.name.toLowerCase()}</SiteEyebrow>
              <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em]">
                The levers that fit.
              </h2>
              <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Each one names the plan it arrives with. The stamp card itself is
                free.
              </p>
            </div>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {industry.features.map((feature, index) => {
                const icons = [ScanLine, BellRing, ChartNoAxesCombined];
                const Icon = icons[index];
                return (
                  <article
                    key={feature.title}
                    className="grid gap-5 py-7 sm:grid-cols-[56px_1fr_auto] sm:items-start"
                  >
                    <span
                      className={`grid size-12 place-items-center rounded-2xl ${index === 1 ? "bg-[var(--accent)]" : "bg-[var(--paper)]"}`}
                    >
                      <Icon size={19} />
                    </span>
                    <div>
                      <h3 className="text-xl font-extrabold tracking-[-0.02em]">
                        {feature.title}
                      </h3>
                      <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                        {feature.description}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 font-mono text-[9px] font-extrabold uppercase tracking-[0.1em] ${
                        feature.tier
                          ? "border border-[var(--line-strong)] text-[var(--muted-strong)]"
                          : "bg-[var(--ink)] text-[var(--paper)]"
                      }`}
                    >
                      {feature.tier ?? "Free"}
                    </span>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <SiteEyebrow inverse>Launch sequence</SiteEyebrow>
              <h2 className="mt-4 max-w-[10ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
                Live before the next busy day.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Shape the reward",
                  detail: industry.reward,
                  icon: Gift,
                },
                {
                  title: "Put the join code out",
                  detail: "Poster, sticker, receipt, Instagram bio. A welcome stamp waits for everyone who scans it.",
                  icon: QrCode,
                },
                {
                  title: "Invite the team",
                  detail: "Give each staff role only what it needs.",
                  icon: ScanLine,
                },
                {
                  title: "Confirm the first visit",
                  detail: "One scan makes their welcome stamp real and earns the visit. The card reads two.",
                  icon: Stamp,
                },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    className={`rounded-2xl border p-6 ${index === 0 ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]" : "border-white/10 bg-white/5"}`}
                  >
                    <Icon size={20} />
                    <p
                      className={`mt-12 font-mono text-[10px] uppercase tracking-[0.14em] ${index === 0 ? "text-[var(--ink)]" : "text-white/70"}`}
                    >
                      Step 0{index + 1}
                    </p>
                    <h3 className="mt-2 text-xl font-extrabold tracking-[-0.02em]">
                      {step.title}
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${index === 0 ? "text-[var(--ink)]" : "text-white/70"}`}
                    >
                      {step.detail}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <MarketingCta
        title={`A loyalty program shaped for ${industry.name.toLowerCase()}.`}
        description="Tell us how often your best customers return and what they value. We’ll help you turn that rhythm into a clear program."
      />
    </main>
    </>
  );
}
