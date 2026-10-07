"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Check,
  Mail,
  MessageCircle,
  MessageSquareText,
  Phone,
  Send,
} from "lucide-react";
import { overageRates, planLimits, plans as sourcePlans } from "@kyprewards/ui/plans";

// Single source: the published plan table. A second hand-typed copy here is how
// the calculator previously came to quote allowances the pricing page denied.
const plans = sourcePlans.map((plan, index) => ({
  name: plan.name,
  monthly: plan.monthly,
  available: plan.available,
  ...planLimits[index],
}));

const topPlan = plans[plans.length - 1];

export function PricingEstimator() {
  const [branchAnalytics, setBranchAnalytics] = useState(0);
  const [email, setEmail] = useState(0);
  const [sms, setSms] = useState(300);
  const [connectedBudget, setConnectedBudget] = useState(0);
  const [profitPerVisit, setProfitPerVisit] = useState(120);

  const estimate = useMemo(() => {
    // Beyond the top published plan we quote the top plan and say so, rather
    // than inventing a tier that appears on no price list.
    //
    // Customers are not an input: they are unlimited on every tier, so they
    // cannot pick a plan. Branches are the same — a chain is one company and we
    // do not charge for having shops — so the question is how many of them you
    // want reported separately, which is what the tiers actually sell.
    //
    // Both metered inputs select the plan. Branch reporting alone used to, and
    // because Launch reports 0 branches while the slider floor was 1, Launch
    // could never be matched: a one-shop cafe was quoted Core, a tier nobody
    // can buy yet, on the page whose whole argument is "start free". The floor
    // is 0 and campaign email selects too, because on Launch it is not an
    // allowance to overrun — there is no campaign email at all.
    const matched = plans.find(
      (item) => branchAnalytics <= item.branchAnalytics && email <= item.email,
    );
    const plan = matched ?? topPlan;
    const beyondPublishedPlans = !matched;
    // Never bundled, on any tier. Every segment is charged.
    const smsCost = sms * overageRates.smsPerSegment;
    const emailBuckets = Math.ceil(Math.max(0, email - plan.email) / 1000);
    const emailCost = emailBuckets * overageRates.emailPer1000;
    const total = plan.monthly + smsCost + emailCost + connectedBudget;
    return {
      plan,
      beyondPublishedPlans,
      smsCost,
      emailCost,
      connectedBudget,
      total,
      breakEven: profitPerVisit > 0 ? Math.ceil(total / profitPerVisit) : 0,
    };
  }, [branchAnalytics, connectedBudget, email, profitPerVisit, sms]);

  return (
    <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Plan estimator
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">
              Model a real month
            </h2>
          </div>
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-2)]">
            <Calculator size={20} />
          </span>
        </div>
        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          {[
            {
              label: "Branches reported separately",
              value: branchAnalytics,
              set: setBranchAnalytics,
              min: 0,
              max: 12,
              step: 1,
            },
            {
              label: "Campaign emails / month",
              value: email,
              set: setEmail,
              min: 0,
              max: 15000,
              step: 500,
            },
            {
              label: "SMS segments / month",
              value: sms,
              set: setSms,
              min: 0,
              max: 5000,
              step: 50,
            },
            {
              label: "Viber and WhatsApp budget",
              value: connectedBudget,
              set: setConnectedBudget,
              min: 0,
              max: 10000,
              step: 100,
            },
          ].map((input) => (
            <label key={input.label} className="grid gap-2 text-xs font-bold">
              <span className="flex items-center justify-between">
                <span>{input.label}</span>
                <strong className="text-sm">
                  {input.value.toLocaleString()}
                </strong>
              </span>
              <input
                type="range"
                min={input.min}
                max={input.max}
                step={input.step}
                value={input.value}
                onChange={(event) => input.set(Number(event.target.value))}
                className="accent-[var(--accent-strong)]"
              />
            </label>
          ))}
        </div>
        <label className="mt-7 grid gap-2 text-xs font-bold">
          Estimated gross profit per returning visit
          <input
            type="number"
            min="1"
            value={profitPerVisit}
            onChange={(event) => setProfitPerVisit(Number(event.target.value))}
            className="min-h-12 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-base outline-none focus:border-[var(--accent-strong)]"
          />
        </label>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: MessageSquareText,
              title: "In-app",
              detail: "Unlimited, included",
            },
            {
              icon: Send,
              title: "Push",
              detail: `₱${overageRates.pushPer1000} / 1,000 overage`,
            },
            {
              icon: Mail,
              title: "Email",
              detail: `₱${overageRates.emailPer1000} / 1,000 overage`,
            },
            {
              icon: MessageCircle,
              title: "Viber / WhatsApp",
              detail: "From ₱0.42 · connecting",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl bg-[var(--paper)] p-4"
              >
                <Icon size={16} className="text-[var(--accent-strong)]" />
                <p className="mt-4 text-xs font-extrabold">{item.title}</p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <aside className="rounded-[var(--radius-card)] bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70">
            Recommended
          </p>
          <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--ink)]">
            {estimate.plan.name}
          </span>
        </div>
        <p className="mt-8 text-5xl font-extrabold tracking-[-0.03em]">
          ₱
          {estimate.total.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
        </p>
        <p className="mt-1 text-xs text-white/60">
          estimated monthly platform and channel spend
        </p>
        <div className="mt-7 divide-y divide-white/12 border-y border-white/12">
          {[
            ["Subscription", `₱${estimate.plan.monthly.toLocaleString()}`],
            [
              "SMS credits",
              `₱${estimate.smsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            ],
            ["Email over allowance", `₱${estimate.emailCost.toLocaleString()}`],
            [
              "Viber and WhatsApp budget",
              `₱${estimate.connectedBudget.toLocaleString()}`,
            ],
            ["Break-even returning visits", estimate.breakEven > 0 ? `${estimate.breakEven} / month` : "—"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 py-3 text-sm"
            >
              <span className="text-white/60">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        {/* A recommendation a merchant cannot act on has to say so here, not
            leave them to discover it on the card above. */}
        {!estimate.plan.available && (
          <p className="mt-6 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-4 text-xs leading-relaxed text-white/80">
            <strong className="font-extrabold text-[var(--accent)]">
              {estimate.plan.name} is not open yet.
            </strong>{" "}
            Start on the free Launch plan today and move up when this tier
            opens — your programs and customer list come with you.
          </p>
        )}
        {estimate.beyondPublishedPlans && (
          <p className="mt-3 rounded-2xl bg-white/6 p-4 text-xs leading-relaxed text-white/65">
            You are past the top published plan. This quotes {topPlan.name};
            talk to us and we will price the rest properly rather than guess.
          </p>
        )}
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/6 p-4">
          <Phone size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <p className="text-xs leading-relaxed text-white/65">
            SMS is ₱0.95 per 160-character segment pay as you go, less if you
            prepay, on every plan and never part of a subscription. Longer
            messages use more than one segment.
          </p>
        </div>
        <div className="mt-5 space-y-2">
          {[
            "No surprise channel overage",
            "Consent checked before delivery",
            "Budget ceiling per campaign",
            "Every rate published before you send",
          ].map((item) => (
            <p
              key={item}
              className="flex items-center gap-2 text-xs font-bold text-white/75"
            >
              <span className="grid size-5 place-items-center rounded-full bg-white/10 text-[var(--accent)]">
                <Check size={12} />
              </span>
              {item}
            </p>
          ))}
        </div>
      </aside>
    </div>
  );
}
