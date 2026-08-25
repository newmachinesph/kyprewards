"use client";

import { useState } from "react";
import { demoData } from "@stampr/demo-data";
import { Button, Eyebrow, TrendBadge } from "@stampr/ui";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Coins,
  Filter,
  MoreHorizontal,
  ShieldAlert,
  Sparkles,
  Stamp,
  Store,
  Users,
} from "lucide-react";
import type { AdminView } from "@/components/AdminShell";

const activity = [
  {
    business: "Sweet Crumbs Bakery",
    action: "Program published",
    time: "2 min",
    tone: "success",
  },
  {
    business: "Northline Coffee",
    action: "Staff invitation accepted",
    time: "8 min",
    tone: "neutral",
  },
  {
    business: "Aster Wellness",
    action: "Campaign queued",
    time: "14 min",
    tone: "accent",
  },
  {
    business: "Corner Thread",
    action: "Business verified",
    time: "21 min",
    tone: "success",
  },
  {
    business: "Field Notes Café",
    action: "Reward redeemed",
    time: "29 min",
    tone: "neutral",
  },
];

const queue = [
  {
    title: "Duplicate business report",
    meta: "Sweet Crumbs Bakery · Pasig",
    priority: "High",
    age: "18m",
  },
  {
    title: "Owner access recovery",
    meta: "Aster Wellness · Makati",
    priority: "Normal",
    age: "43m",
  },
  {
    title: "Campaign delivery question",
    meta: "Northline Coffee · Cebu",
    priority: "Normal",
    age: "1h",
  },
];

export function AdminDashboard({
  onNavigate,
  notify,
}: {
  onNavigate: (view: AdminView) => void;
  notify: (message: string) => void;
}) {
  const [scope, setScope] = useState("Network");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [chartMode, setChartMode] = useState<"volume" | "growth">("volume");
  const chartBars =
    chartMode === "volume"
      ? [36, 44, 39, 54, 48, 61, 57, 70, 66, 78, 72, 88, 82, 92]
      : [22, 28, 24, 40, 33, 47, 41, 58, 52, 66, 61, 79, 73, 86];

  return (
    <main className="admin-grid min-h-[calc(100dvh-68px)] px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Platform control room</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Network pulse
            </h1>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              The loyalty network is healthy. Seven items need a human decision.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
              {["Network", "Today"].map((item) => (
                <button
                  key={item}
                  onClick={() => setScope(item)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${scope === item ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--muted-strong)]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Button
              tone="quiet"
              icon={<Filter size={16} />}
              aria-expanded={filtersOpen}
              aria-controls="network-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              Filter
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div
            id="network-filters"
            className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3"
          >
            <span className="mr-1 text-xs font-bold text-[var(--muted-strong)]">
              Quick views
            </span>
            {["All activity", "Needs action", "Delivery risk"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  notify(`${filter} filter applied.`);
                  setFiltersOpen(false);
                }}
                className="min-h-9 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 text-xs font-bold transition hover:border-[var(--ink)]"
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        <section
          className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_0.85fr]"
          aria-label="Platform metrics"
        >
          <article className="relative overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:row-span-2 xl:row-span-1">
            <div className="absolute -right-10 -top-10 size-40 rounded-full border-[28px] border-[var(--accent)] opacity-80" />
            <div className="relative">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/50">
                Live businesses
              </p>
              <p className="mt-5 text-5xl font-extrabold tracking-[-0.03em]">
                {demoData.admin.metrics.liveBusinesses}
              </p>
              <div className="mt-7 flex items-center justify-between border-t border-white/12 pt-4">
                <span className="text-xs text-white/55">
                  18 joined this month
                </span>
                <TrendBadge value="6.8%" />
              </div>
            </div>
          </article>
          {(scope === "Network"
            ? [
                {
                  label: "Customer accounts",
                  value: demoData.admin.metrics.customerAccounts.toLocaleString("en-PH"),
                  detail: "+824",
                  icon: Users,
                },
                {
                  label: "Stamps this week",
                  value: "42.8k",
                  detail: "+12%",
                  icon: Stamp,
                },
                {
                  label: "Rewards funded",
                  value: "₱318k",
                  detail: "On pace",
                  icon: Coins,
                },
              ]
            : [
                {
                  label: "New accounts today",
                  value: "214",
                  detail: "+31",
                  icon: Users,
                },
                {
                  label: "Stamps today",
                  value: "6.4k",
                  detail: "+9%",
                  icon: Stamp,
                },
                {
                  label: "Rewards funded today",
                  value: "₱46k",
                  detail: "On pace",
                  icon: Coins,
                },
              ]
          ).map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)]">
                    <Icon size={17} />
                  </span>
                  <TrendBadge
                    value={item.detail}
                    trend={item.detail === "On pace" ? "flat" : "up"}
                  />
                </div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-[-0.02em]">
                  {item.value}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(390px,0.8fr)]">
          <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <header className="flex items-start justify-between border-b border-[var(--line)] p-5 sm:p-6">
              <div>
                <Eyebrow>Network velocity</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                  Stamps issued by active businesses
                </h2>
              </div>
              <button
                type="button"
                aria-label="Toggle between volume and growth view"
                aria-pressed={chartMode === "growth"}
                onClick={() => {
                  const next = chartMode === "volume" ? "growth" : "volume";
                  setChartMode(next);
                  notify(`Chart now shows ${next}.`);
                }}
                className="grid size-9 place-items-center rounded-full hover:bg-[var(--surface-2)]"
              >
                <MoreHorizontal size={18} />
              </button>
            </header>
            <div className="bar-grid relative h-72 px-5 pb-6 pt-8 sm:px-7">
              <div className="flex h-full items-end gap-2 sm:gap-3">
                {chartBars.map(
                  (height, index) => (
                    <div
                      key={index}
                      className="group flex h-full flex-1 items-end"
                    >
                      <span
                        className={`w-full rounded-t-md transition-transform group-hover:scale-y-[1.03] ${index > 10 ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <Eyebrow>System posture</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                  {(() => {
                    const degraded = demoData.admin.services.filter(
                      (service) => service.status !== "Operational",
                    ).length;
                    return degraded === 0
                      ? "All core services normal"
                      : `${demoData.admin.services.length - degraded} of ${demoData.admin.services.length} services normal`;
                  })()}
                </h2>
              </div>
              <span className="grid size-10 place-items-center rounded-full bg-[rgb(242_161_45/16%)] text-[var(--accent-strong)]">
                <CheckCircle2 size={19} />
              </span>
            </div>
            <div className="mt-6 divide-y divide-[var(--line)]">
              {[
                { name: "API gateway", value: "99.99%", label: "Operational" },
                { name: "Campaign delivery", value: "1.2s", label: "Healthy" },
                { name: "Queue depth", value: "38", label: "Normal" },
                { name: "QR verification", value: "84ms", label: "Healthy" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5"
                >
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                      {item.label}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Attention queue</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                  Needs a decision
                </h2>
              </div>
              <span className="rounded-full bg-[rgb(216_86_65/12%)] px-3 py-1 text-xs font-extrabold text-[var(--danger)]">
                7 open
              </span>
            </div>
            <div className="mt-5 divide-y divide-[var(--line)]">
              {queue.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    notify(`${item.title} opened in the support queue.`);
                    onNavigate("support");
                  }}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 py-4 text-left"
                >
                  <span
                    className={`grid size-9 place-items-center rounded-xl ${index === 0 ? "bg-[rgb(216_86_65/12%)] text-[var(--danger)]" : "bg-[var(--surface-2)] text-[var(--muted-strong)]"}`}
                  >
                    {index === 0 ? (
                      <ShieldAlert size={17} />
                    ) : (
                      <Clock3 size={17} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                      {item.meta}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-[var(--muted)] group-hover:text-[var(--ink)]">
                    {item.age}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate("support")}
              className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-strong)]"
            >
              Open full queue <ArrowRight size={14} />
            </button>
          </article>

          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Event stream</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                  Happening across Stampr
                </h2>
              </div>
              <span className="flex items-center gap-2 text-[11px] font-bold text-[var(--success)]">
                <span className="size-2 rounded-full bg-[var(--success)]" />{" "}
                Live
              </span>
            </div>
            <div className="mt-5">
              {activity.map((item, index) => (
                <div
                  key={`${item.business}-${index}`}
                  className="grid grid-cols-[12px_1fr_auto] gap-3"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1.5 size-2.5 rounded-full border-2 border-[var(--surface)] ${item.tone === "success" ? "bg-[var(--success)]" : item.tone === "accent" ? "bg-[var(--accent)]" : "bg-[var(--line-strong)]"}`}
                    />
                    {index < activity.length - 1 && (
                      <span className="h-full w-px bg-[var(--line)]" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-bold">{item.business}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {item.action}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--muted)]">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <article className="flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--accent)] p-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em]">
                <Sparkles size={15} /> Weekly signal
              </div>
              <h2 className="mt-4 max-w-[18ch] text-2xl font-extrabold leading-tight tracking-[-0.02em]">
                Bakery programs retain customers 22% better after week four.
              </h2>
            </div>
            <Button
              className="mt-6 shrink-0 sm:mt-0"
              icon={<Store size={16} />}
              onClick={() => onNavigate("economics")}
            >
              View cohort
            </Button>
          </article>
          <article className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[rgb(216_86_65/12%)] text-[var(--danger)]">
              <CircleAlert />
            </span>
            <div>
              <p className="text-sm font-extrabold">2 delivery anomalies</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                Retries are running. No action needed yet.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
