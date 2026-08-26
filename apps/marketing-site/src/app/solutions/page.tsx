import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  Dumbbell,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import {
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { industries } from "@/lib/content";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb, itemList } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Loyalty programs shaped for cafés, bakeries, salons, wellness studios, restaurants, and independent retail.",
  alternates: { canonical: "/solutions" },
};

const icons = [Coffee, Dumbbell, UtensilsCrossed, ShoppingBag];

export default function SolutionsPage() {
  return (
    <main>
      <StructuredData
        data={[
          itemList({
            name: "KYPStamping loyalty solutions by industry",
            items: industries.map((industry) => ({
              name: industry.name,
              path: `/solutions/${industry.slug}`,
              description: industry.description,
            })),
          }),
          breadcrumb([{ name: "Solutions", path: "/solutions" }]),
        ]}
      />
      <PageHero
        image="/images/hero-solutions.webp"
        eyebrow="Solutions by business rhythm"
        title="Loyalty should feel native to the visit."
        description="A morning coffee, six-week appointment, dinner reservation, and considered purchase do not follow the same cadence. KYPStamping adapts to each one."
      >
        <SiteButton href="/contact">Find your program</SiteButton>
        <SiteButton href="/pricing" tone="outline">
          Compare plans
        </SiteButton>
      </PageHero>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[0.62fr_1.38fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SiteEyebrow>Choose your rhythm</SiteEyebrow>
              <h2 className="mt-4 text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
                Start with how people already come back.
              </h2>
              <p className="mt-5 max-w-[40ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Then use a reward to make that natural return more visible,
                memorable, and consistent.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {industries.map((industry, index) => {
                const Icon = icons[index];
                return (
                  <Link
                    key={industry.slug}
                    href={`/solutions/${industry.slug}`}
                    className={`group min-h-[360px] rounded-[18px] p-7 transition hover:-translate-y-1 ${index === 0 ? "bg-[var(--ink)] text-[var(--paper)]" : index === 1 ? "bg-[var(--accent)]" : "border border-[var(--line)] bg-[var(--surface)]"}`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`grid size-12 place-items-center rounded-2xl ${index === 0 ? "bg-white/10 text-[var(--accent)]" : "bg-[var(--paper)]"}`}
                      >
                        <Icon />
                      </span>
                      <span
                        className={`grid size-10 place-items-center rounded-full border transition group-hover:translate-x-1 ${index === 0 ? "border-white/15" : "border-[var(--line)]"}`}
                      >
                        <ArrowRight size={16} />
                      </span>
                    </div>
                    <div className="mt-24">
                      <p
                        className={`font-mono text-[10px] uppercase tracking-[0.15em] ${index === 0 ? "text-white/70" : index === 1 ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}
                      >
                        {industry.eyebrow}
                      </p>
                      <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
                        {industry.name}
                      </h3>
                      <p
                        className={`mt-3 text-sm leading-relaxed ${index === 0 ? "text-white/70" : index === 1 ? "text-[var(--ink)]" : "text-[var(--muted-strong)]"}`}
                      >
                        {industry.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <SiteEyebrow>One platform underneath</SiteEyebrow>
            <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              The shape changes. The fundamentals do not.
            </h2>
          </div>
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {[
              "A reward the customer can explain in one sentence",
              "A counter flow staff can complete in seconds",
              "Consent the customer can understand and change",
              "Enough insight to decide what to do next",
            ].map((item, index) => (
              <div
                key={item}
                className="grid grid-cols-[48px_1fr] items-center py-5"
              >
                <span className="font-mono text-xs font-extrabold text-[var(--accent-strong)]">
                  0{index + 1}
                </span>
                <p className="text-base font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta
        title="Build around your real customer rhythm."
        description="We’ll help you choose a visit target, reward, and launch plan that fit the way your business already works."
      />
    </main>
  );
}
