import type { Metadata } from "next";
import { Building2, Check, MessagesSquare, ShieldCheck } from "lucide-react";
import {
  MarketingCta,
  AnswerBlock,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { PricingCards } from "@/components/PricingCards";
import { PricingEstimator } from "@/components/PricingEstimator";
import { AddOns, ChannelRates, PricingTable } from "@/components/PricingTable";
import { StructuredData } from "@/components/StructuredData";
import { faqs } from "@/lib/content";
import { plans } from "@/lib/plans";
import { breadcrumb, webPage } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Pricing in Philippine Pesos",
  description:
    "Free for one program with unlimited customers and branches. Paid tiers from ₱499 a month. Every message rate published — ₱0.95 per SMS, never bundled.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "KYP Rewards pricing — from ₱0, in pesos",
    description:
      "Unlimited customers on every plan. Published per-message rates. No per-member fee, ever.",
    url: "/pricing",
    locale: "en_PH",
    type: "article",
  },
};

export default function PricingPage() {
  return (
    <main>
      <StructuredData
        data={[
          webPage({
            name: "KYP Rewards pricing",
            description:
              "Plan prices, included limits, and per-channel message rates in Philippine pesos.",
            path: "/pricing",
          }),
          breadcrumb([{ name: "Pricing", path: "/pricing" }]),
        ]}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "KYP Rewards loyalty platform",
          description:
            "Digital loyalty software for local businesses, staff, and customers.",
          brand: { "@type": "Brand", name: "KYP Rewards" },
          // availability is not decoration here: only Launch can be bought,
          // and publishing bare prices for three tiers that cannot be is a
          // live risk under Google's merchant policies.
          offers: plans.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            price: plan.monthly,
            priceCurrency: "PHP",
            availability: plan.available
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
            url: "https://kyprewards.com/pricing",
            ...(plan.monthly > 0 && {
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: plan.monthly,
                priceCurrency: "PHP",
                billingDuration: "P1M",
                unitText: "MON",
              },
            }),
          })),
        }}
      />
      <PageHero
        image="/images/hero-pricing.webp"
        eyebrow="Simple plans, useful limits"
        title="Start small. Pay when loyalty starts working."
        description="Launch the core visit-and-reward loop for free. Upgrade when you are ready to segment, automate, and see each branch on its own."
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="#compare" tone="outline">
          Compare all features
        </SiteButton>
      </PageHero>
      <AnswerBlock
        image="/images/answer-pricing.webp"
        question="How much does a loyalty program cost in the Philippines?"
        answer="Free for one stamp card, any number of branches and unlimited customers — we never charge per member or per shop. Paid tiers open after beta at ₱499, ₱1,290 and ₱3,490 a month. The free plan starts below every paid loyalty tool with published peso pricing in the Philippines, and Core sits within a hundred pesos of the cheapest of them."
        points={[
          {
            label: "Launch, free:",
            text: "one program, unlimited branches, unlimited customers, two staff accounts, printable poster QR, and every stamp-card rule.",
          },
          {
            label: "Core, ₱499:",
            text: "for the shop whose card is working — five staff, your own branding, three programs at once, birthday campaigns, three branches reported separately.",
          },
          {
            label: "Grow ₱1,290 and Scale ₱3,490:",
            text: "automation, segments, API and offline queue; then approvals, fifty staff and a person for onboarding.",
          },
          {
            label: "Messaging is billed apart:",
            text: "in-app and push free on every plan, campaign email with the paid tiers, SMS as credits at ₱0.95 a segment — never bundled into a price.",
          },
        ]}
        facts={[
          { label: "Free plan", value: "₱0 · unlimited customers" },
          { label: "Core", value: "₱499 / month · 5 staff, your branding" },
          { label: "Grow", value: "₱1,290 / month · automation, API" },
          { label: "SMS", value: "₱0.95 a segment; ₱0.90 or ₱0.85 prepaid" },
        ]}
      />

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
              The in-app inbox and push are included on every plan. Campaign
              email carries a monthly allowance on the paid tiers, and past it
              you buy more at the rate below — no forced upgrade, no surprise
              invoice. SMS is the deliberate exception: carriers charge us for
              every single send, so it is credit-based on every plan and you see
              the cost before the message goes.
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

      <section className="border-t border-[var(--line)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <div>
              <SiteEyebrow>Add-ons</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.02em]">
                Spend more only where it earns you something.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              The subscription never charges you for growing — more customers,
              more branches, more stamps cost nothing extra. These are the
              things a shop that is doing well chooses to buy: visibility, a
              person&apos;s time, and message volume.{" "}
              {/* Said "all open with the paid tiers", directly above a table
                  listing three of the five as available on Launch. */}
              Each row says which plans it is on; setup is free for every
              founding merchant now.
            </p>
          </div>
          <div className="mt-12">
            <AddOns />
          </div>
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
                    "Reach customers in their KYP Rewards inbox without an external provider.",
                },
                {
                  icon: Building2,
                  title: "Business profile and discovery",
                  detail:
                    "Publish your category, location, hours, and program in Discover.",
                },
                {
                  icon: Check,
                  title: "The whole stamp card",
                  detail:
                    "Welcome stamp, cooldown, held rewards, customer-approved redemption, reversals and a full staff ledger — on the free plan too.",
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
        description="Set up the core loyalty loop without a card or a contract. Apply, and a person sets your first card up with you."
      />
    </main>
  );
}
