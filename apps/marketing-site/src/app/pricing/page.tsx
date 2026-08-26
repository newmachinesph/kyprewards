import type { Metadata } from "next";
import { Building2, Check, MessagesSquare, ShieldCheck } from "lucide-react";
import {
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { PricingCards } from "@/components/PricingCards";
import { PricingEstimator } from "@/components/PricingEstimator";
import { ChannelRates, PricingTable } from "@/components/PricingTable";
import { StructuredData } from "@/components/StructuredData";
import { faqs } from "@/lib/content";
import { plans } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start a simple loyalty program for free, then add campaigns, automation, analytics, and multi-location tools as you grow.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "KYPStamping loyalty platform",
          description:
            "Digital loyalty software for local businesses, staff, and customers.",
          brand: { "@type": "Brand", name: "KYPStamping" },
          offers: plans.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            price: plan.monthly,
            priceCurrency: "PHP",
            ...(plan.monthly > 0 && {
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                billingDuration: "P1M",
              },
            }),
          })),
        }}
      />
      <PageHero
        image="/images/hero-pricing.webp"
        eyebrow="Simple plans, useful limits"
        title="Start small. Pay when loyalty starts working."
        description="Launch the core visit-and-reward loop for free. Upgrade when you are ready to segment, automate, and manage a larger customer base."
      >
        <SiteButton href="#compare">Compare all features</SiteButton>
        <SiteButton href="/contact" tone="outline">
          Talk through your setup
        </SiteButton>
      </PageHero>

      <section
        id="plans"
        className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px]">
          <PricingCards />
        </div>
      </section>

      <section
        id="compare"
        className="scroll-mt-24 border-t border-[var(--line)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <div>
              <SiteEyebrow>Every line, side by side</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.02em]">
                No asterisks. No “contact us” column.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              The whole product, row by row. Consent controls, reversals, the
              staff ledger, and the spend preview are on every plan including
              the free one — the paid tiers add scale, automation, and depth,
              not the fundamentals.
            </p>
          </div>
          <div className="mt-12">
            <PricingTable />
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <div>
              <SiteEyebrow>Message add-ons</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.02em]">
                Delivery costs money. We show you how much.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              Your plan includes a monthly allowance on every channel. Past it,
              you pay the rate below — no forced upgrade, no surprise invoice.
              Carriers charge us per SMS, so that is the one channel that is
              credit-based on every plan.
            </p>
          </div>
          <div className="mt-12">
            <ChannelRates />
          </div>
          <p className="mt-6 max-w-[80ch] text-xs leading-relaxed text-[var(--muted)]">
            Add-on rates are billed monthly in arrears and exclude applicable
            taxes. You can set a hard spend ceiling per campaign and per month;
            sends stop at the ceiling rather than overspending silently.
          </p>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <div>
              <SiteEyebrow>Costs before checkout</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
                Price the relationship, including delivery.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              Software should be predictable; paid delivery should be
              transparent. Estimate the right plan, channel overage, and number
              of profitable return visits needed to cover it.
            </p>
          </div>
          <div className="mt-12">
            <PricingEstimator />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <SiteEyebrow>Included in every plan</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
                The fundamentals are never add-ons.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: "Customer privacy controls",
                  detail:
                    "Consent, joined-business visibility, profile sharing, export, and deletion requests are built in.",
                },
                {
                  icon: MessagesSquare,
                  title: "In-app communication",
                  detail:
                    "Reach customers in their KYPStamping inbox without an external provider.",
                },
                {
                  icon: Building2,
                  title: "Business profile and discovery",
                  detail:
                    "Publish your category, location, hours, and program in Discover.",
                },
                {
                  icon: Check,
                  title: "Secure QR counter flow",
                  detail:
                    "Join, earn, redeem, reverse, and keep a complete staff activity ledger.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="bg-[var(--surface)] p-7">
                    <Icon size={21} className="text-[var(--accent-strong)]" />
                    <h3 className="mt-10 text-xl font-extrabold tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                      {item.detail}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-10 lg:grid-cols-[0.6fr_1.4fr]">
            <div>
              <SiteEyebrow>Questions before checkout</SiteEyebrow>
              <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em]">
                Straight answers.
              </h2>
            </div>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-extrabold">
                    <span>{faq.question}</span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line)] text-lg font-normal transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-[64ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Start free, with the real product."
        description="Set up the core loyalty loop without a card, contract, or sales call. We’re here when you want help shaping it."
      />
    </main>
  );
}
