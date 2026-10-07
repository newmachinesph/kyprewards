"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { SiteButton } from "@/components/MarketingUi";
import { foundingOffer, paymentMethods, plans } from "@kyprewards/ui/plans";

export function PricingCards() {
  const [annual, setAnnual] = useState(true);

  return (
    <div>
      <div className="flex justify-center">
        <div
          className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1"
          role="group" aria-label="Billing period"
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
              className={`panel relative flex min-h-[590px] flex-col p-7 ${plan.featured ? "shadow-lift bg-[var(--ink)] text-[var(--paper)] xl:-my-4 xl:min-h-[622px] xl:py-10" : "shadow-soft border border-[var(--line)] bg-[var(--surface)]"}`}
            >
              {/* A tier that cannot be bought yet says so where the badge
                  goes, rather than wearing "Most useful" over a button that
                  does nothing. */}
              {!plan.available ? (
                <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full border border-current px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-70">
                  Coming soon
                </span>
              ) : (
                plan.featured && (
                  <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--ink)]">
                    <Sparkles size={12} /> Most useful
                  </span>
                )
              )}
              <p
                className={`font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${plan.featured ? "text-white/70" : "text-[var(--muted)]"}`}
              >
                {plan.name}
              </p>
              <div className="mt-10 flex items-end gap-2">
                <span className="text-5xl font-extrabold tracking-[-0.03em]">
                  ₱{price.toLocaleString()}
                </span>
                {price > 0 && (
                  <span
                    className={`pb-1 text-xs ${plan.featured ? "text-white/70" : "text-[var(--muted)]"}`}
                  >
                    {/* The toggle starts on Yearly, so the first number anybody
                        sees is the discounted one. Labelling it "/ month" and
                        stopping there reads as the monthly price, which is a
                        hundred pesos higher — somebody comparing us against a
                        competitor was quoting the wrong figure back to us. */}
                    / month{annual ? ", billed yearly" : ""}
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
                {plan.highlights.map((feature) => (
                  <div
                    key={feature}
                    className={`flex items-start gap-3 text-sm ${plan.featured ? "text-white/80" : "text-[var(--muted-strong)]"}`}
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${plan.featured ? "bg-white/10 text-[var(--accent)]" : "bg-[rgb(232_163_61/15%)] text-[var(--accent-strong)]"}`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-8">
                {plan.available ? (
                  <SiteButton
                    href="/partners"
                    tone={plan.featured ? "accent" : "outline"}
                  >
                    {plan.cta}
                  </SiteButton>
                ) : (
                  // Not a button. There is no action to perform, so a disabled
                  // control would only add something to announce and skip past.
                  // A plain statement reads the same to everyone — which is
                  // also what the control audit was telling us by refusing a
                  // button with nothing behind it.
                  <p className="w-full rounded-xl border border-current px-5 py-3 text-center text-sm font-bold opacity-50">
                    Coming soon
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="mx-auto mt-8 max-w-[86ch] text-center text-xs leading-relaxed text-[var(--muted)]">
        Yearly prices are shown per month and billed annually. Prices exclude
        applicable taxes. Customers are unlimited on every plan including the
        free one, and branches are unlimited on every plan too — we do not charge
        you for growing, and we do not charge you for opening shops. Launch is
        the plan you can join today; the paid tiers are published so you can see
        where this goes, and they open after beta.
      </p>
      <p className="mx-auto mt-4 max-w-[86ch] rounded-2xl border border-[var(--accent)]/40 bg-[rgb(232_163_61/10%)] px-5 py-4 text-center text-sm leading-relaxed text-[var(--ink)]">
        <strong className="font-extrabold">{foundingOffer.headline}</strong>{" "}
        <span className="text-[var(--muted-strong)]">{foundingOffer.detail}</span>
      </p>
      <p className="mt-5 text-center font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        Paid in pesos by {paymentMethods.join(" \u00b7 ")}
      </p>
    </div>
  );
}
