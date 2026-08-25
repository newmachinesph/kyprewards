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

const plans = [
  {
    name: "Launch",
    monthly: 0,
    members: 250,
    locations: 1,
    email: 1000,
    sms: 0,
  },
  {
    name: "Core",
    monthly: 499,
    members: 1500,
    locations: 1,
    email: 5000,
    sms: 0,
  },
  {
    name: "Grow",
    monthly: 1290,
    members: 10000,
    locations: 3,
    email: 25000,
    sms: 100,
  },
  {
    name: "Scale",
    monthly: 3490,
    members: 50000,
    locations: 10,
    email: 100000,
    sms: 500,
  },
];

export function PricingEstimator() {
  const [members, setMembers] = useState(1200);
  const [locations, setLocations] = useState(1);
  const [email, setEmail] = useState(5000);
  const [sms, setSms] = useState(300);
  const [connectedBudget, setConnectedBudget] = useState(0);
  const [profitPerVisit, setProfitPerVisit] = useState(120);

  const estimate = useMemo(() => {
    const plan = plans.find(
      (item) => members <= item.members && locations <= item.locations,
    ) ?? {
      name: "Enterprise",
      monthly: 8990,
      members: Number.POSITIVE_INFINITY,
      locations: Number.POSITIVE_INFINITY,
      email: 250000,
      sms: 1000,
    };
    const paidSms = Math.max(0, sms - plan.sms);
    const smsCost = paidSms * 0.95;
    const emailBuckets = Math.ceil(Math.max(0, email - plan.email) / 1000);
    const emailCost = emailBuckets * 25;
    const total = plan.monthly + smsCost + emailCost + connectedBudget;
    return {
      plan,
      smsCost,
      emailCost,
      connectedBudget,
      total,
      breakEven: profitPerVisit > 0 ? Math.ceil(total / profitPerVisit) : 0,
    };
  }, [connectedBudget, email, locations, members, profitPerVisit, sms]);

  return (
    <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Plan estimator
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">
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
              label: "Active members",
              value: members,
              set: setMembers,
              min: 100,
              max: 60000,
              step: 100,
            },
            {
              label: "Locations",
              value: locations,
              set: setLocations,
              min: 1,
              max: 15,
              step: 1,
            },
            {
              label: "Emails / month",
              value: email,
              set: setEmail,
              min: 0,
              max: 150000,
              step: 1000,
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
              label: "Connected channel budget",
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
            className="min-h-12 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-sm outline-none focus:border-[var(--accent-strong)]"
          />
        </label>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: MessageSquareText,
              title: "In-app",
              detail: "Included · fair use",
            },
            { icon: Send, title: "Push", detail: "Included · fair use" },
            { icon: Mail, title: "Email", detail: "₱25 / 1,000 overage" },
            {
              icon: MessageCircle,
              title: "Connected",
              detail: "Provider cost + orchestration",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl bg-[var(--paper)] p-4"
              >
                <Icon size={16} className="text-[var(--accent-strong)]" />
                <p className="mt-4 text-xs font-black">{item.title}</p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <aside className="rounded-[18px] bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70">
            Recommended
          </p>
          <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--ink)]">
            {estimate.plan.name}
          </span>
        </div>
        <p className="mt-8 text-5xl font-black tracking-[-0.065em]">
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
              "SMS over allowance",
              `₱${estimate.smsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            ],
            ["Email over allowance", `₱${estimate.emailCost.toLocaleString()}`],
            [
              "Connected provider budget",
              `₱${estimate.connectedBudget.toLocaleString()}`,
            ],
            ["Break-even returning visits", `${estimate.breakEven} / month`],
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
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/6 p-4">
          <Phone size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <p className="text-xs leading-relaxed text-white/65">
            SMS is prepaid at ₱0.95 per 160-character segment after the plan
            allowance. Longer messages can consume multiple segments.
          </p>
        </div>
        <div className="mt-5 space-y-2">
          {[
            "No surprise channel overage",
            "Consent checked before delivery",
            "Budget ceiling per campaign",
            "Provider costs reviewed quarterly",
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
