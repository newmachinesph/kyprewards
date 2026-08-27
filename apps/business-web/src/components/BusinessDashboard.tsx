"use client";

import { useState } from "react";
import { Button, Eyebrow, StampDots, StatCard } from "@stampr/ui";
import { todayLabel } from "@stampr/ui/shell";
import {
  ArrowRight,
  BadgePercent,
  Bell,
  CakeSlice,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircleDollarSign,
  Coins,
  CreditCard,
  Crown,
  DatabaseZap,
  Gift,
  MapPin,
  Megaphone,
  MessageSquareText,
  Nfc,
  PlugZap,
  QrCode,
  Repeat2,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  Stamp,
  Store,
  TicketPercent,
  UserPlus,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import type { NotifyIntent } from "@stampr/ui/shell";
import { demoData } from "@stampr/demo-data";
import type { BusinessView } from "@/components/BusinessShell";

const periods = ["Today", "7 days", "30 days"];
const chartByPeriod: Record<string, { bars: number[]; total: number; peakIndex: number }> = {
  Today: { bars: [12, 22, 18, 34, 52, 46, 30, 24, 38, 62, 88, 54], total: 128, peakIndex: 10 },
  "7 days": { bars: [28, 42, 34, 58, 48, 68, 78, 55, 82, 72, 88, 76], total: 642, peakIndex: 10 },
  "30 days": { bars: [44, 52, 38, 60, 56, 72, 64, 80, 70, 86, 92, 78], total: 2716, peakIndex: 10 },
};

const programTypes = [
  { name: "Stamp card", detail: "8 visits → free pastry", icon: Stamp },
  { name: "Points", detail: "₱1 spent → 1 point", icon: Coins },
  { name: "Discount", detail: "Member and tier rates", icon: BadgePercent },
  { name: "Membership", detail: "VIP access and limits", icon: Crown },
  { name: "Coupon", detail: "Single-use offers", icon: TicketPercent },
  { name: "Rewards", detail: "A choice of perks", icon: Gift },
  { name: "Multipass", detail: "Prepaid visit bundle", icon: CalendarCheck2 },
  { name: "Gift card", detail: "Stored value and balance", icon: CreditCard },
];

const programPreviews: Record<
  string,
  { label: string; value: string; note: string }
> = {
  "Stamp card": {
    label: "Active rule",
    value: "8 visits",
    note: "Free pastry · 63% average completion",
  },
  Points: {
    label: "Suggested rule",
    value: "₱1 = 1 pt",
    note: "Start with a 250-point first reward",
  },
  Discount: {
    label: "Suggested tiers",
    value: "5% → 10%",
    note: "Regular and VIP member rates",
  },
  Membership: {
    label: "Suggested plan",
    value: "₱399 / month",
    note: "Four monthly drinks plus VIP perks",
  },
  Coupon: {
    label: "Suggested offer",
    value: "Double stamp",
    note: "One use · Tuesdays before 4 PM",
  },
  Rewards: {
    label: "Suggested catalog",
    value: "3 choices",
    note: "Pastry, drink upgrade, or tote",
  },
  Multipass: {
    label: "Suggested bundle",
    value: "10 for 9",
    note: "Prepaid visits with a 90-day window",
  },
  "Gift card": {
    label: "Suggested value",
    value: "₱500",
    note: "Partial redemption and live balance",
  },
};

const automationIcons: Record<string, typeof Gift> = {
  auto_birthday: CakeSlice,
  auto_reward: Gift,
  auto_winback: Repeat2,
  auto_review: MessageSquareText,
  auto_geo: MapPin,
  auto_referral: UserPlus,
};

const automationDefaults = demoData.business.automations.map((automation) => ({
  name: automation.name,
  detail: `${automation.trigger} · ${automation.audience} customers`,
  icon: automationIcons[automation.id] ?? Gift,
  enabled: automation.status === "Live",
}));


export function BusinessDashboard({
  onNavigate,
  notify,
}: {
  onNavigate: (view: BusinessView) => void;
  notify: (message: string, intent?: NotifyIntent) => void;
}) {
  const [period, setPeriod] = useState("7 days");
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("Stamp card");
  const [automations, setAutomations] = useState(() =>
    Object.fromEntries(
      automationDefaults.map((item) => [item.name, item.enabled]),
    ),
  );
  const preview = programPreviews[selectedProgram];

  return (
    <main
      id="overview"
      className="mx-auto max-w-[1400px] scroll-mt-24 px-4 py-6 sm:px-7 lg:px-10 lg:py-9"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>{todayLabel()}</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Good morning, Sweet Crumbs.
          </h1>
          <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            Your regulars are picking up. Here is what is moving in the shop
            today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              notify("Message activity opened.", "review");
              onNavigate("message-log");
            }}
            className="hidden size-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] transition hover:bg-[var(--surface-2)] sm:grid"
          >
            <Bell size={18} />
          </button>
          <Button
            icon={<ScanLine size={17} />}
            onClick={() => setScanOpen(true)}
          >
            Scan customer
          </Button>
        </div>
      </div>

      <section
        className="metric-grid mt-8 grid gap-3"
        aria-label="Business overview"
      >
        <StatCard className="col-span-6 lg:col-span-3" label="Visits" value={String(demoData.business.metrics.visitsToday)} detail="18%" icon={Repeat2} accent />
        <StatCard
          className="col-span-6 lg:col-span-3"
          label="New regulars"
          value={String(demoData.business.metrics.newRegulars)}
          detail="6 this week"
          icon={UserPlus}
        />
        <StatCard className="col-span-6 lg:col-span-3" label="Stamps issued" value={String(demoData.business.metrics.stampsIssued)} detail="31%" icon={Stamp} />
        <StatCard className="col-span-6 lg:col-span-3" label="Redemptions" value={String(demoData.business.metrics.redemptions)} detail="On pace" icon={Gift} trend="flat" />
      </section>

      <section
        id="analytics"
        className="mt-3 grid scroll-mt-24 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.75fr)]"
      >
        <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <header className="flex flex-col gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Eyebrow>Footfall rhythm</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                Visits across the counter
              </h2>
            </div>
            <div
              className="flex rounded-full bg-[var(--surface-2)] p-1"
              aria-label="Chart period"
            >
              {periods.map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${period === item ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </header>
          <div className="stamp-grid relative min-h-72 p-5 sm:p-7">
            <div className="absolute left-7 top-7">
              <p className="text-4xl font-extrabold tracking-[-0.03em]">
                {chartByPeriod[period].total.toLocaleString("en-PH")}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                visits {period === "Today" ? "so far today" : `in the last ${period.toLowerCase()}`}
              </p>
            </div>
            <div
              className="absolute inset-x-5 bottom-7 top-24 flex items-end gap-2 sm:inset-x-7 sm:gap-3"
              role="img"
              aria-label={`Visits bar chart for ${period.toLowerCase()}: ${chartByPeriod[period].total} visits`}
            >
              {chartByPeriod[period].bars.map((height, index) => (
                <div
                  key={index}
                  className="group relative flex h-full flex-1 items-end"
                >
                  <span
                    className={`w-full origin-bottom rounded-t-lg transition-transform duration-300 group-hover:scale-y-[1.04] ${index === 10 ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="ticket-edge relative overflow-hidden rounded-2xl p-7 text-[var(--paper)]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <Eyebrow>Live reward</Eyebrow>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                Active
              </span>
            </div>
            <h2 className="mt-8 max-w-[10ch] text-3xl font-extrabold leading-[1.02] tracking-[-0.03em]">
              Eight visits. One pastry on us.
            </h2>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-white/60">
              Your simplest reward is also your strongest performer this month.
            </p>
            <div className="mt-8 overflow-x-auto pb-1">
              <StampDots filled={5} total={8} dark />
            </div>
            <div className="mt-8 flex items-end justify-between border-t border-dashed border-white/20 pt-5">
              <div>
                <p className="text-2xl font-extrabold">63%</p>
                <p className="text-[11px] text-white/50">average completion</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("programs")}
                className="grid size-11 place-items-center rounded-full bg-[var(--accent)] text-[var(--ink)] transition hover:rotate-[-8deg] active:scale-[0.98]"
                aria-label="Open loyalty program"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </article>
      </section>

      <section
        id="customers"
        className="mt-3 grid scroll-mt-24 gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
      >
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Setup ledger</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                Ready for the first rush
              </h2>
            </div>
            <span className="text-sm font-extrabold">4/5</span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full w-4/5 rounded-full bg-[var(--accent)]" />
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {[
              "Business profile",
              "Loyalty reward",
              "Join QR",
              "Invite staff",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--muted-strong)]"
              >
                <span className="grid size-5 place-items-center rounded-full bg-[var(--success)] text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="line-through decoration-[var(--line-strong)]">
                  {item}
                </span>
              </div>
            ))}
            <button
              onClick={() => setScanOpen(true)}
              className="flex w-full items-center gap-3 py-3 text-left text-sm font-bold"
            >
              <span className="grid size-5 place-items-center rounded-full border border-[var(--accent)] bg-[rgb(232_163_61/10%)]">
                <ScanLine size={12} />
              </span>
              Run a test stamp
              <ChevronRight className="ml-auto" size={16} />
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Next best action</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                Bring back the almost-regulars
              </h2>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-[rgb(232_163_61/14%)] text-[var(--accent-strong)]">
              <Sparkles size={18} />
            </span>
          </div>
          <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            Thirty-two customers are one visit away from becoming regulars. A
            quiet Tuesday note could nudge them back.
          </p>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-[var(--surface-2)] p-4 sm:flex-row sm:items-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface)]">
              <Megaphone size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Tuesday treat</p>
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                A warm pastry is waiting. Drop in before 4 PM.
              </p>
            </div>
            <Button
              tone="quiet"
              className="min-h-10 px-4"
              onClick={() => onNavigate("campaigns")}
            >
              Review campaign
            </Button>
          </div>
        </article>
      </section>

      <section
        id="programs"
        className="mt-3 scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
      >
        <header className="flex flex-col gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <Eyebrow>Program studio</Eyebrow>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
              Choose how loyalty creates value
            </h2>
            <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              Start with one proven template. Add another program when customers
              have a clear reason to use it.
            </p>
          </div>
          <Button
            tone="quiet"
            icon={<Sparkles size={16} />}
            onClick={() => onNavigate("programs")}
          >
            Create program
          </Button>
        </header>
        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.7fr)]">
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
            {programTypes.map((program) => {
              const Icon = program.icon;
              const active = selectedProgram === program.name;
              return (
                <button
                  key={program.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedProgram(program.name)}
                  className={`min-h-40 bg-[var(--surface)] p-5 text-left transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${active ? "bg-[var(--accent)]" : "hover:bg-[var(--surface-2)]"}`}
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--paper)]">
                    <Icon size={18} />
                  </span>
                  <span className="mt-7 block text-sm font-extrabold">
                    {program.name}
                  </span>
                  <span
                    className={`mt-1 block text-xs ${active ? "text-[var(--ink)]/80" : "text-[var(--muted)]"}`}
                  >
                    {program.detail}
                  </span>
                </button>
              );
            })}
          </div>
          <aside className="flex min-h-80 flex-col justify-between border-t border-[var(--line)] bg-[var(--ink)] p-6 text-[var(--paper)] lg:border-l lg:border-t-0">
            <div>
              <div className="flex items-center justify-between">
                <Eyebrow>Rule preview</Eyebrow>
                <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/60">
                  Draft
                </span>
              </div>
              <p className="mt-9 text-xs font-bold uppercase tracking-[0.12em] text-white/50">
                {preview.label}
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">
                {preview.value}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                {preview.note}
              </p>
            </div>
            <div className="mt-10 border-t border-dashed border-white/20 pt-5">
              <div className="flex items-center gap-2 text-xs text-white/65">
                <ShieldCheck size={15} className="text-[var(--accent)]" />{" "}
                Existing earned value stays protected.
              </div>
              <button
                type="button"
                onClick={() => {
                  notify(`${selectedProgram} draft opened in Program studio.`, "review");
                  onNavigate("programs");
                }}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-xs font-extrabold text-[var(--ink)]"
              >
                Configure {selectedProgram.toLowerCase()}{" "}
                <ArrowRight size={14} />
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section
        id="automations"
        className="mt-3 grid scroll-mt-24 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.48fr)]"
      >
        <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] p-5 sm:p-6">
            <div>
              <Eyebrow>Lifecycle automation</Eyebrow>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
                Helpful moments, already watched
              </h2>
            </div>
            <span className="hidden rounded-full bg-[rgb(31_168_121/12%)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--success)] sm:inline-flex">
              {Object.values(automations).filter(Boolean).length} live
            </span>
          </header>
          <div className="grid sm:grid-cols-2">
            {automationDefaults.map((automation, index) => {
              const Icon = automation.icon;
              const enabled = automations[automation.name];
              return (
                <div
                  key={automation.name}
                  className={`flex items-start gap-3 p-5 sm:p-6 ${index % 2 === 1 ? "sm:border-l sm:border-[var(--line)]" : ""} ${index > 1 ? "border-t border-[var(--line)]" : index === 1 ? "border-t border-[var(--line)] sm:border-t-0" : ""}`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{automation.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                      {automation.detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${enabled ? "Disable" : "Enable"} ${automation.name}`}
                    onClick={() =>
                      setAutomations((current) => ({
                        ...current,
                        [automation.name]: !current[automation.name],
                      }))
                    }
                    className={`relative h-6 w-10 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${enabled ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                  >
                    <span
                      className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-5" : "left-1"}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl bg-[var(--accent)] p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Message guardrails</Eyebrow>
            <Send size={18} />
          </div>
          <p className="mt-8 max-w-[12ch] text-3xl font-extrabold leading-[1.02] tracking-[-0.03em]">
            Reach people without wearing out the welcome.
          </p>
          <div className="mt-8 divide-y divide-[rgb(24_18_12/14%)] border-y border-[rgb(24_18_12/14%)]">
            {[
              "Channel consent checked",
              "Quiet hours · 8 PM–8 AM",
              "Promotion cap · 2 per week",
              "28 eligible in this audience",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 py-3 text-xs font-bold"
              >
                <Check size={14} /> {item}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("campaigns")}
            className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--ink)] px-4 text-xs font-extrabold text-[var(--paper)]"
          >
            Open campaign studio <ArrowRight size={14} />
          </button>
        </article>
      </section>

      <section
        id="counter"
        className="mt-3 scroll-mt-24 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Counter & connections</Eyebrow>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
              One flow, even when the tools change
            </h2>
          </div>
          <p className="text-xs font-semibold text-[var(--muted)]">
            Last sync 18 seconds ago
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: QrCode,
              title: "QR + join links",
              detail: "Customer ID, posters, social links",
              status: "Ready",
            },
            {
              icon: Nfc,
              title: "NFC + offline",
              detail: "Signed queue and safe reconciliation",
              status: "Ready",
            },
            {
              icon: PlugZap,
              title: "API + webhooks",
              detail: "POS, ecommerce, messaging",
              status: "Connect",
            },
            {
              icon: DatabaseZap,
              title: "Import + export",
              detail: "Portable, permissioned records",
              status: "Review",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface)]">
                    <Icon size={17} />
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                    {item.status}
                  </span>
                </div>
                <h3 className="mt-7 text-sm font-extrabold">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                  {item.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="operations"
        className="mt-3 grid scroll-mt-24 gap-3 pb-2 lg:grid-cols-3"
      >
        {[
          {
            icon: Store,
            title: "3 locations",
            detail:
              "Shared programs with branch-level performance and controls.",
          },
          {
            icon: Users,
            title: "6 staff accounts",
            detail: "Owner, manager, cashier, analyst, and campaign roles across 12 branch seats.",
          },
          {
            icon: ShieldCheck,
            title: "Protected ledger",
            detail: "Approvals, reversals, consent history, and fraud review.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <Icon size={19} className="text-[var(--accent-strong)]" />
              <h2 className="mt-7 text-lg font-extrabold tracking-[-0.03em]">
                {item.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                {item.detail}
              </p>
            </article>
          );
        })}
      </section>

      {scanOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[rgb(24_18_12/55%)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scan-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Counter scanner</Eyebrow>
                <h2
                  id="scan-title"
                  className="mt-1 text-xl font-extrabold tracking-[-0.02em]"
                >
                  Scan a customer code
                </h2>
              </div>
              <button
                onClick={() => setScanOpen(false)}
                aria-label="Close scanner"
                className="grid size-10 place-items-center rounded-full bg-[var(--surface-2)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative mx-auto mt-7 aspect-square max-w-64 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink)] p-6">
              <div className="absolute left-5 top-5 size-12 border-l-2 border-t-2 border-[var(--accent)]" />
              <div className="absolute right-5 top-5 size-12 border-r-2 border-t-2 border-[var(--accent)]" />
              <div className="absolute bottom-5 left-5 size-12 border-b-2 border-l-2 border-[var(--accent)]" />
              <div className="absolute bottom-5 right-5 size-12 border-b-2 border-r-2 border-[var(--accent)]" />
              <QrCode className="size-full text-white/70" strokeWidth={1.1} />
            </div>
            <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-[rgb(31_168_121/12%)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--success)]">
              <WifiOff size={13} /> Offline queue ready
            </div>
            <p className="mx-auto mt-3 max-w-[34ch] text-center text-sm leading-relaxed text-[var(--muted-strong)]">
              Hold the customer&apos;s KYPStamping QR inside the frame. Nothing is
              saved until you confirm.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => {
                setScanOpen(false);
                onNavigate("scan");
              }}
              icon={<CircleDollarSign size={17} />}
            >
              Use demo customer
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
