"use client";

import { useMemo, useState } from "react";
import { Button, Eyebrow, StampDots, StatCard } from "@kypstamping/ui";
import { greeting, todayLabel } from "@kypstamping/ui/shell";
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
import type { NotifyIntent } from "@kypstamping/ui/shell";
import { useDemoState } from "@/components/DemoState";
import { sharedScenario } from "@kypstamping/demo-data";
import type { Automation } from "@kypstamping/demo-data";
import {
  useAutomations,
  useBusinessMetrics,
  useBusinessProfile,
  useLocations,
  usePrograms,
  useStaff,
} from "@kypstamping/api";
import { useToggleAutomation } from "@/components/mutations";
import type { BusinessView } from "@/components/BusinessShell";

const periods = ["Today", "7 days", "30 days"];
const chartByPeriod: Record<string, { bars: number[]; total: number; peakIndex: number }> = {
  Today: { bars: [12, 22, 18, 34, 52, 46, 30, 24, 38, 62, 88, 54], total: 128, peakIndex: 10 },
  "7 days": { bars: [28, 42, 34, 58, 48, 68, 78, 55, 82, 72, 88, 76], total: 642, peakIndex: 10 },
  "30 days": { bars: [44, 52, 38, 60, 56, 72, 64, 80, 70, 86, 92, 78], total: 2716, peakIndex: 10 },
};

const SETUP_STEPS = [
  "Business profile",
  "Loyalty reward",
  "Join QR",
  "Invite staff",
  "Run a test stamp",
] as const;

/**
 * Icon and headline rule per program type.
 *
 * This used to be a third parallel list of programs with names the fixture did
 * not use ("Stamp card" against "Stamps"), so picking one here and opening the
 * Programs view landed on a different program. Now the list is the workspace's
 * own programs and only the presentation lives here.
 */
/** Zeroes while the request is in flight: a counter that fills in reads
 *  better than a dashboard that is blank until all six answer. */
const EMPTY_METRICS = {
  visitsToday: 0,
  newRegulars: 0,
  stampsIssued: 0,
  redemptions: 0,
  repeatRate: 0,
  averageOrderCentavos: 0,
  memberRevenueCentavos: 0,
  campaignRevenueCentavos: 0,
};

const programPresentation: Record<
  string,
  { icon: typeof Stamp; rule: string; suggestion: string }
> = {
  Stamps: { icon: Stamp, rule: "8 visits", suggestion: "Free pastry on the eighth visit" },
  Points: { icon: Coins, rule: "₱1 = 1 pt", suggestion: "Start with a 250-point first reward" },
  Discount: { icon: BadgePercent, rule: "5% → 10%", suggestion: "Regular and VIP member rates" },
  Membership: { icon: Crown, rule: "₱399 / month", suggestion: "Four monthly drinks plus VIP perks" },
  Coupon: { icon: TicketPercent, rule: "Double stamp", suggestion: "One use · Tuesdays before 4 PM" },
  Rewards: { icon: Gift, rule: "3 choices", suggestion: "Pastry, drink upgrade, or tote" },
  Multipass: { icon: CalendarCheck2, rule: "10 for 9", suggestion: "Prepaid visits, 90-day window" },
  "Gift card": { icon: CreditCard, rule: "₱500", suggestion: "Partial redemption and live balance" },
};

const automationIcons: Record<string, typeof Gift> = {
  auto_birthday: CakeSlice,
  auto_reward: Gift,
  auto_winback: Repeat2,
  auto_review: MessageSquareText,
  auto_geo: MapPin,
  auto_referral: UserPlus,
};

/**
 * Derived per render rather than once at module load: automations arrive from
 * a request now, so a module-level constant would capture whatever the first
 * import saw - which is nothing.
 */
const automationDefaultsFrom = (automations: Automation[]) =>
  automations.map((automation) => ({
    id: automation.id,
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
  const { testStampDone, completeTestStamp, startScanHandoff, workspace } = useDemoState();

  // Server state, from the API. Defaulted to empty rather than guarded one by
  // one: the dashboard is a wall of counters, and blanking the whole page
  // because one of six requests is still in flight reads worse than a zero
  // that fills in.
  const { data: profile } = useBusinessProfile();
  const { data: locations = [] } = useLocations();
  const { data: metrics = EMPTY_METRICS } = useBusinessMetrics();
  const { data: staff = [] } = useStaff();
  const { data: programs = [], isPending: programsPending } = usePrograms();
  const { data: automationRows = [] } = useAutomations();

  const automations = useMemo(
    () =>
      Object.fromEntries(
        automationRows.map((automation) => [automation.id, automation.status === "Live"]),
      ),
    [automationRows],
  );
  const automationDefaults = useMemo(
    () => automationDefaultsFrom(automationRows),
    [automationRows],
  );
  const toggle = useToggleAutomation();
  const setupDone = SETUP_STEPS.length - (testStampDone ? 0 : 1);
  // Null until the programs arrive, where it used to be programs[0] from a
  // fixture that was always populated.
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const selectedProgram =
    programs.find((program) => program.id === selectedProgramId) ?? programs[0];
  const presentation = selectedProgram
    ? (programPresentation[selectedProgram.type] ?? programPresentation.Stamps)
    : programPresentation.Stamps;
  /** The onboarding wizard's answers if the merchant came through it. */
  const workspaceName = workspace?.businessName ?? profile?.shortName ?? "";
  const locationCount = workspace?.locations ?? locations.length;
  const livePrograms = programs.filter((program) => program.status === "Live");

  return (
    <main
      id="section-overview"
      className="mx-auto max-w-[1400px] scroll-mt-24 px-4 py-6 sm:px-7 lg:px-10 lg:py-9"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>{todayLabel()}</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            {greeting()}, {workspaceName}.
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
        <StatCard className="col-span-6 lg:col-span-3" label="Visits" value={String(metrics.visitsToday)} detail="18%" icon={Repeat2} accent />
        <StatCard
          className="col-span-6 lg:col-span-3"
          label="New regulars"
          value={String(metrics.newRegulars)}
          detail="6 this week"
          icon={UserPlus}
        />
        <StatCard className="col-span-6 lg:col-span-3" label="Stamps issued" value={String(metrics.stampsIssued)} detail="31%" icon={Stamp} />
        <StatCard className="col-span-6 lg:col-span-3" label="Redemptions" value={String(metrics.redemptions)} detail="On pace" icon={Gift} trend="flat" />
      </section>

      <section
        id="section-analytics"
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
                    className={`w-full origin-bottom rounded-t-lg transition-transform duration-300 group-hover:scale-y-[1.04] ${index === chartByPeriod[period].peakIndex ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
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
              {livePrograms[0]?.name ?? "No live program yet"}
            </h2>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-white/60">
              Your simplest reward is also your strongest performer this month.
            </p>
            <div className="mt-8 overflow-x-auto pb-1">
              <StampDots
                filled={sharedScenario.loyaltyEvent.afterStamps}
                total={sharedScenario.loyaltyEvent.target}
                dark
              />
            </div>
            <div className="mt-8 flex items-end justify-between border-t border-dashed border-white/20 pt-5">
              <div>
                <p className="text-2xl font-extrabold">
                  {livePrograms[0]?.completion ?? 0}%
                </p>
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
        id="section-customers"
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
            <span className="text-sm font-extrabold">
              {setupDone}/{SETUP_STEPS.length}
            </span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width]"
              style={{ width: `${(setupDone / SETUP_STEPS.length) * 100}%` }}
            />
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {SETUP_STEPS.slice(0, -1).map((item) => (
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
            {testStampDone ? (
              <div className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--muted-strong)]">
                <span className="grid size-5 place-items-center rounded-full bg-[var(--success)] text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="line-through decoration-[var(--line-strong)]">
                  Run a test stamp
                </span>
              </div>
            ) : (
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
            )}
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
        id="section-programs"
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
            {programs.slice(0, 8).map((program) => {
              const look = programPresentation[program.type] ?? programPresentation.Stamps;
              const Icon = look.icon;
              const active = selectedProgram.id === program.id;
              return (
                <button
                  key={program.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedProgramId(program.id)}
                  className={`min-h-40 bg-[var(--surface)] p-5 text-left transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${active ? "bg-[var(--accent)]" : "hover:bg-[var(--surface-2)]"}`}
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--paper)]">
                    <Icon size={18} />
                  </span>
                  <span className="mt-7 block text-sm font-extrabold">
                    {program.type}
                  </span>
                  <span
                    className={`mt-1 block text-xs ${active ? "text-[var(--ink)]/80" : "text-[var(--muted)]"}`}
                  >
                    {program.name}
                  </span>
                </button>
              );
            })}
          </div>
          <aside className="flex min-h-80 flex-col justify-between border-t border-[var(--line)] bg-[var(--ink)] p-6 text-[var(--paper)] lg:border-l lg:border-t-0">
            {!selectedProgram ? (
              <div>
                <Eyebrow>Rule preview</Eyebrow>
                <p className="mt-9 text-sm leading-relaxed text-white/65">
                  {programsPending
                    ? "Loading your programs…"
                    : "No programs yet. Create one and its rule shows up here."}
                </p>
              </div>
            ) : (
            <>
            <div>
              <div className="flex items-center justify-between">
                <Eyebrow>Rule preview</Eyebrow>
                <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/60">
                  {selectedProgram.status}
                </span>
              </div>
              <p className="mt-9 text-xs font-bold uppercase tracking-[0.12em] text-white/50">
                {selectedProgram.status === "Live" ? "Active rule" : "Suggested rule"}
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">
                {presentation.rule}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                {presentation.suggestion}
                {selectedProgram.members > 0
                  ? ` · ${selectedProgram.completion}% average completion`
                  : ""}
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
                  notify(`${selectedProgram.name} opened in Program studio.`, "review");
                  onNavigate("programs");
                }}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-xs font-extrabold text-[var(--ink)]"
              >
                Configure {selectedProgram.type.toLowerCase()}{" "}
                <ArrowRight size={14} />
              </button>
            </div>
            </>
            )}
          </aside>
        </div>
      </section>

      <section
        id="section-automations"
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
            <span className="hidden rounded-full bg-[rgb(15_118_85/12%)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--success)] sm:inline-flex">
              {Object.values(automations).filter(Boolean).length} live
            </span>
          </header>
          <div className="grid sm:grid-cols-2">
            {automationDefaults.map((automation, index) => {
              const Icon = automation.icon;
              const enabled = automations[automation.id];
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
                    aria-label={automation.name}
                    disabled={toggle.isPending}
                    onClick={() => {
                      // The server decides which way it lands and says so, so
                      // the toast reports the state rather than predicting it.
                      toggle.mutate(automation.id, {
                        onSuccess: (result) =>
                          notify(
                            `${automation.name} ${result.enabled ? "switched on" : "paused"}.`,
                          ),
                        onError: (error) => notify(error.message, "error"),
                      });
                    }}
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
        id="section-counter"
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
        id="section-operations"
        className="mt-3 grid scroll-mt-24 gap-3 pb-2 lg:grid-cols-3"
      >
        {[
          {
            icon: Store,
            title: `${locationCount} location${locationCount === 1 ? "" : "s"}`,
            detail:
              "Shared programs with branch-level performance and controls.",
          },
          {
            icon: Users,
            title: `${staff.length} staff accounts`,
            detail: `Owner, manager, cashier, analyst, and campaign roles across ${locations.reduce((sum, location) => sum + location.staff, 0)} branch seats.`,
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
            <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-[rgb(15_118_85/12%)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--success)]">
              <WifiOff size={13} /> Offline queue ready
            </div>
            <p className="mx-auto mt-3 max-w-[34ch] text-center text-sm leading-relaxed text-[var(--muted-strong)]">
              Hold the customer&apos;s KYPStamping QR inside the frame. Nothing is
              saved until you confirm.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => {
                completeTestStamp();
                // Hands the counter view a customer, so the merchant is not
                // asked to pick the demo customer a second time.
                startScanHandoff();
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
