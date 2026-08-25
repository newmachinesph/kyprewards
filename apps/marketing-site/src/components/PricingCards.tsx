"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { SiteButton } from "@/components/MarketingUi";

const plans = [
  {
    name: "Launch",
    monthly: 0,
    yearly: 0,
    description: "Prove the return-visit loop before paying.",
    features: [
      "250 active members",
      "One location and one program",
      "QR join, earn, and redeem",
      "Customer PWA and in-app updates",
      "Two staff accounts",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Core",
    monthly: 499,
    yearly: 399,
    description: "For one local business building a dependable customer base.",
    features: [
      "1,500 active members",
      "Two concurrent programs",
      "QR, NFC, and offline counter mode",
      "5,000 emails each month",
      "Three staff accounts",
    ],
    cta: "Choose Core",
    featured: false,
  },
  {
    name: "Grow",
    monthly: 1290,
    yearly: 990,
    description: "For teams ready to automate retention across locations.",
    features: [
      "10,000 active members",
      "Three locations and all eight program types",
      "Segments, referrals, reviews, and automations",
      "25,000 emails + 100 SMS credits monthly",
      "RFM, retention, and revenue analytics",
    ],
    cta: "Choose Grow",
    featured: true,
  },
  {
    name: "Scale",
    monthly: 3490,
    yearly: 2790,
    description: "For established multi-location operations and integrations.",
    features: [
      "50,000 active members",
      "Ten locations and 50 staff",
      "API, webhooks, POS, and commerce adapters",
      "100,000 emails + 500 SMS credits monthly",
      "Wallet passes, white label, and priority onboarding",
    ],
    cta: "Choose Scale",
    featured: false,
  },
];

export function PricingCards() {
  const [annual, setAnnual] = useState(true);

  return (
    <div>
      <div className="flex justify-center">
        <div
          className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1"
          aria-label="Billing period"
        >
          <button
            type="button"
            aria-pressed={!annual}
            onClick={() => setAnnual(false)}
            className={`focus-ring rounded-lg px-4 py-2 text-xs font-bold transition ${!annual ? "bg-[var(--ink)] text-[var(--surface)]" : "text-[var(--muted-strong)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={annual}
            onClick={() => setAnnual(true)}
            className={`focus-ring flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${annual ? "bg-[var(--ink)] text-[var(--surface)]" : "text-[var(--muted-strong)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"}`}
          >
            Yearly{" "}
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] text-[var(--ink)]">
              Save up to 23%
            </span>
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        {plans.map((plan) => {
          const price = annual ? plan.yearly : plan.monthly;
          return (
            <article
              key={plan.name}
              className={`relative flex min-h-[590px] flex-col rounded-[18px] p-7 ${plan.featured ? "bg-[var(--ink)] text-[var(--paper)] xl:-my-4 xl:min-h-[622px] xl:py-10" : "border border-[var(--line)] bg-[var(--surface)]"}`}
            >
              {plan.featured && (
                <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--ink)]">
                  <Sparkles size={12} /> Most useful
                </span>
              )}
              <p
                className={`font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${plan.featured ? "text-white/70" : "text-[var(--muted)]"}`}
              >
                {plan.name}
              </p>
              <div className="mt-10 flex items-end gap-2">
                <span className="text-5xl font-black tracking-[-0.065em]">
                  ₱{price.toLocaleString()}
                </span>
                {price > 0 && (
                  <span
                    className={`pb-1 text-xs ${plan.featured ? "text-white/70" : "text-[var(--muted)]"}`}
                  >
                    / month
                  </span>
                )}
              </div>
              <p
                className={`mt-4 min-h-12 text-sm leading-relaxed ${plan.featured ? "text-white/70" : "text-[var(--muted-strong)]"}`}
              >
                {plan.description}
              </p>
              <div
                className={`my-7 h-px ${plan.featured ? "bg-white/12" : "bg-[var(--line)]"}`}
              />
              <div className="space-y-3.5">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className={`flex items-start gap-3 text-sm ${plan.featured ? "text-white/80" : "text-[var(--muted-strong)]"}`}
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${plan.featured ? "bg-white/10 text-[var(--accent)]" : "bg-[rgb(242_161_45/15%)] text-[var(--accent-strong)]"}`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-8">
                <SiteButton
                  href="/contact"
                  tone={plan.featured ? "accent" : "outline"}
                >
                  {plan.cta}
                </SiteButton>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs leading-relaxed text-[var(--muted)]">
        Yearly prices are per month and billed annually. Prices exclude
        applicable taxes. Active-member limits reset as people leave programs;
        archived records do not count.
      </p>
    </div>
  );
}
