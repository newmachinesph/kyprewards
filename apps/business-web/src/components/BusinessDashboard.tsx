"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Eyebrow,
  PreviewBadge,
  StampDots,
  StatCard,
} from "@kypstamping/ui";
import { cardTerms, DEFAULT_RULES } from "@/components/views/ProgramRules";
import { greeting, todayLabel } from "@kypstamping/ui/shell";
import { pesoCompactFromCentavos } from "@kypstamping/ui/format";
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
  Timer,
  UserPlus,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import type { NotifyIntent } from "@kypstamping/ui/shell";
import { useDemoState } from "@/components/DemoState";
import { planFor, usePlanGate } from "@/lib/plan";
import type { Automation } from "@kypstamping/api";
import {
  isPreview,
  useAudience,
  useAutomations,
  useBonusWindows,
  useBusinessMetrics,
  useBusinessProfile,
  useLocations,
  useMessagingPolicy,
  useRedemptions,
  useSetupProgress,
  usePrograms,
  useStaff,
  useTimeToSecondVisit,
  useVisitTrend,
  EMPTY_BUSINESS_METRICS,
} from "@kypstamping/api";
import {
  useRecordTestStamp,
  useToggleAutomation,
} from "@/components/mutations";
import type { BusinessView } from "@/components/BusinessShell";

/**
 * The periods the API buckets by. The labels used to be "Today / 7 days /
 * 30 days" over a fixed set of bars, so the switcher relabelled the axis
 * without changing a single number.
 */
const periods = [
  { id: "week", label: "7 days" },
  { id: "month", label: "30 days" },
  { id: "quarter", label: "13 weeks" },
] as const;

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
const programPresentation: Record<
  string,
  { icon: typeof Stamp; rule: string; suggestion: string }
> = {
  Stamps: {
    icon: Stamp,
    rule: "8 visits",
    suggestion: "Free pastry on the eighth visit",
  },
  Points: {
    icon: Coins,
    rule: "₱1 = 1 pt",
    suggestion: "Start with a 250-point first reward",
  },
  Discount: {
    icon: BadgePercent,
    rule: "5% → 10%",
    suggestion: "Regular and VIP member rates",
  },
  Membership: {
    icon: Crown,
    rule: "₱399 / month",
    suggestion: "Four monthly drinks plus VIP perks",
  },
  Coupon: {
    icon: TicketPercent,
    rule: "Double stamp",
    suggestion: "One use · Tuesdays before 4 PM",
  },
  Rewards: {
    icon: Gift,
    rule: "3 choices",
    suggestion: "Pastry, drink upgrade, or tote",
  },
  Multipass: {
    icon: CalendarCheck2,
    rule: "10 for 9",
    suggestion: "Prepaid visits, 90-day window",
  },
  "Gift card": {
    icon: CreditCard,
    rule: "₱500",
    suggestion: "Partial redemption and live balance",
  },
};

/** `21` → `9 PM`. The guardrail card printed a fixed "8 PM-8 AM" over a shop
 *  whose policy said something else. */
const hourLabel = (hour: number | undefined) => {
  if (hour === undefined) return "--";
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${suffix}`;
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
  const [period, setPeriod] = useState<(typeof periods)[number]["id"]>("week");
  const [scanOpen, setScanOpen] = useState(false);
  const { completeTestStamp, startScanHandoff, workspace } = useDemoState();

  // Server state, from the API. Defaulted to empty rather than guarded one by
  // one: the dashboard is a wall of counters, and blanking the whole page
  // because one of six requests is still in flight reads worse than a zero
  // that fills in.
  const { data: profile } = useBusinessProfile();
  const { data: locations = [] } = useLocations();
  const { data: metrics = EMPTY_BUSINESS_METRICS, error: metricsError } =
    useBusinessMetrics();
  const { data: staff = [] } = useStaff();
  const { data: programs = [], isPending: programsPending } = usePrograms();
  const { data: automationRows = [] } = useAutomations();
  const { data: visits } = useVisitTrend(period);
  const { data: policy } = useMessagingPolicy();
  // From the API, not React state. The checklist tracked its last step in
  // memory, so "Ready for the first rush" reset to 4 of 5 on every reload and
  // could never reach 5 of 5 however many test stamps were run - the server
  // had recorded it the whole time and nothing ever read the row back.
  const { data: setupProgress } = useSetupProgress();
  const testStampDone = setupProgress?.enabled ?? false;
  const { data: audienceRows = [] } = useAudience();
  const widestReach = Math.max(...audienceRows.map((row) => row.reachable), 0);
  // Rewards the customer has not yet approved on their phone.
  const { data: redemptionRows = [] } = useRedemptions();
  const pendingApprovals = redemptionRows.filter(
    (row) => row.status === "Awaiting customer",
  ).length;
  // Only asked for on a plan that has them. Fetched unconditionally, this
  // answered 402 on every dashboard load for every free shop - harmless on
  // screen, because the banner is optional, but a guaranteed pair of refusals
  // in the log of a merchant who has done nothing wrong.
  const gate = usePlanGate();
  const { data: bonusWindows = [] } = useBonusWindows({
    enabled: gate.covers(planFor("Bonus windows")),
  });
  const liveWindow = bonusWindows.find((window) => window.status === "live");
  // Never zero: dividing by it would make every bar NaN tall.
  const busiest = Math.max(1, ...(visits?.bars ?? []).map((bar) => bar.visits));

  const automations = useMemo(
    () =>
      Object.fromEntries(
        automationRows.map((automation) => [
          automation.id,
          automation.status === "Live",
        ]),
      ),
    [automationRows],
  );
  const automationDefaults = useMemo(
    () => automationDefaultsFrom(automationRows),
    [automationRows],
  );
  const toggle = useToggleAutomation();
  const testStamp = useRecordTestStamp();
  const setupDone = SETUP_STEPS.length - (testStampDone ? 0 : 1);
  // Null until the programs arrive, where it used to be programs[0] from a
  // fixture that was always populated.
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null,
  );
  const selectedProgram =
    programs.find((program) => program.id === selectedProgramId) ?? programs[0];
  const presentation = selectedProgram
    ? (programPresentation[selectedProgram.type] ?? programPresentation.Stamps)
    : programPresentation.Stamps;
  /** The onboarding wizard's answers if the merchant came through it. */
  const workspaceName = workspace?.businessName ?? profile?.shortName ?? "";
  const locationCount = workspace?.locations ?? locations.length;
  const livePrograms = programs.filter((program) => program.status === "Live");
  /*
   * The card names a live program, so its dots have to be that program's.
   * They were the demo scenario's stamp count, which meant a shop running an
   * 8-visit card could be shown 5 of 6 under its own program's name.
   */
  const liveTarget = livePrograms[0]?.target ?? 0;
  const liveFilled = Math.round(
    (liveTarget * (livePrograms[0]?.completion ?? 0)) / 100,
  );

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
            {/* "Your regulars are picking up" was asserted to every shop on
                every load, including one that had opened an hour earlier with
                no customers at all. */}
            Here is what is moving in the shop today.
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

      {liveWindow && (
        <div
          role="status"
          className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--accent)] bg-[rgb(232_163_61/12%)] px-4 py-3 text-sm"
        >
          <Timer size={17} className="text-[var(--accent-strong)]" />
          <span className="font-extrabold">{liveWindow.name} is live</span>
          <span className="text-[var(--muted-strong)]">
            {liveWindow.multiplier}× stamps · {liveWindow.stampsGranted} granted
            so far
          </span>
          {isPreview(liveWindow) && <PreviewBadge />}
          <button
            type="button"
            onClick={() => onNavigate("bonus-windows")}
            className="ml-auto text-xs font-extrabold text-[var(--accent-strong)]"
          >
            Open bonus windows
          </button>
        </div>
      )}

      <section
        className="metric-grid mt-8 grid gap-3"
        aria-label="Business overview"
      >
        {/* The details beside these were "18%", "6 this week", "31%" and
            "On pace" - four numbers with nothing behind them, sitting next to
            four that are measured. A real figure loses its meaning next to an
            invented one, so each now says what it counts. */}
        {/* The same reasoning as the revenue line below, which already got
            this right: a refused request is not a zero. A Cashier is blocked
            from /business/metrics by design, and all four tiles rendered the
            fallback as fact - VISITS 0, STAMPS ISSUED 0 - on a shop that had
            taken fifteen that day. */}
        <StatCard
          className="col-span-6 lg:col-span-3"
          label="Visits"
          value={metricsError ? "—" : String(metrics.visitsToday)}
          detail={metricsError ? "hidden for your role" : "today"}
          icon={Repeat2}
          accent
        />
        <StatCard
          className="col-span-6 lg:col-span-3"
          label="New regulars"
          value={metricsError ? "—" : String(metrics.newRegulars)}
          detail={
            metricsError
              ? "hidden for your role"
              : `${metrics.repeatRate}% repeat rate`
          }
          icon={UserPlus}
        />
        <StatCard
          className="col-span-6 lg:col-span-3"
          label="Stamps issued"
          value={metricsError ? "—" : String(metrics.stampsIssued)}
          // "all time", against a figure the API filters to since local
          // midnight. A shop that had stamped all week read a zero here on a
          // quiet morning and went looking for the outage.
          detail={metricsError ? "hidden for your role" : "today"}
          icon={Stamp}
        />
        <StatCard
          className="col-span-6 lg:col-span-3"
          // The period is in the label because the badge beside it is spent on
          // a different figure: the count is since local midnight, the revenue
          // is the whole ledger. Saying both in one badge wrapped it onto two
          // lines and read as one number carrying two periods.
          label="Redemptions today"
          value={metricsError ? "—" : String(metrics.redemptions)}
          detail={
            // A refused request is not a zero. The API correctly blocks a
            // Cashier from /business/metrics, and this rendered the fallback
            // as fact: "P0 member revenue" on a shop that took P750 today.
            // Worse at the counter - somebody who has just scanned a customer
            // reads a zero as a failed scan and scans them again.
            metricsError
              ? "member revenue hidden for your role"
              : `${pesoCompactFromCentavos(metrics.memberRevenueCentavos)} member revenue`
          }
          icon={Gift}
          trend="flat"
        />
      </section>

      <ReturnScore />

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
                  key={item.id}
                  onClick={() => setPeriod(item.id)}
                  aria-pressed={period === item.id}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${period === item.id ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>
          <div className="stamp-grid relative min-h-72 p-5 sm:p-7">
            <div className="absolute left-7 top-7">
              <p className="text-4xl font-extrabold tracking-[-0.03em]">
                {(visits?.total ?? 0).toLocaleString("en-PH")}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                visit{(visits?.total ?? 0) === 1 ? "" : "s"} in the last{" "}
                {periods.find((item) => item.id === period)?.label}
              </p>
            </div>
            <div
              className="absolute inset-x-5 bottom-7 top-24 flex items-end gap-2 sm:inset-x-7 sm:gap-3"
              role="img"
              aria-label={`Visits bar chart: ${visits?.total ?? 0} visits`}
            >
              {(visits?.bars ?? []).map((bar, index) => (
                <div
                  key={bar.label}
                  title={`${bar.label}: ${bar.visits}`}
                  className="group relative flex h-full flex-1 items-end"
                >
                  <span
                    className={`w-full origin-bottom rounded-t-lg transition-transform duration-300 group-hover:scale-y-[1.04] ${index === visits?.peakIndex ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
                    // Scaled against the tallest bar, so a quiet week still
                    // fills the chart rather than sitting flat at the bottom.
                    style={{
                      height: `${Math.round((bar.visits / busiest) * 100)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="ticket-edge relative overflow-hidden rounded-2xl p-7 text-[var(--paper)]">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <Eyebrow>The stamp card at a glance</Eyebrow>
              {pendingApprovals > 0 ? (
                <button
                  type="button"
                  onClick={() => onNavigate("redemptions")}
                  className="rounded-full border border-[var(--accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]"
                >
                  {pendingApprovals} awaiting customer approval
                </button>
              ) : (
                <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                  {livePrograms[0] ? "Active" : "No live program"}
                </span>
              )}
            </div>
            <h2 className="mt-8 max-w-[10ch] text-3xl font-extrabold leading-[1.02] tracking-[-0.03em]">
              {livePrograms[0]?.name ?? "No live program yet"}
            </h2>
            {/* Was "Your simplest reward is also your strongest performer
                this month" - a comparison, stated as fact, on workspaces
                running exactly one program and none at all. The card can say
                what the program is instead of ranking it against nothing. */}
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-white/60">
              {livePrograms[0]
                ? `${livePrograms[0].target} ${livePrograms[0].target === 1 ? "visit" : "visits"} for ${livePrograms[0].rewardName || "a reward"}.`
                : "Publish a program and it will show here."}
            </p>
            <div className="mt-8 overflow-x-auto pb-1">
              <StampDots filled={liveFilled} total={liveTarget} dark />
            </div>
            {livePrograms[0]?.type === "Stamps" && (
              <ul className="mt-5 space-y-1 text-[11px] leading-relaxed text-white/60">
                {cardTerms(
                  livePrograms[0],
                  livePrograms[0].rules ?? DEFAULT_RULES,
                )
                  .slice(1, 4)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                {!livePrograms[0].rules && (
                  <li className="text-white/55">
                    Defaults shown; the rules editor saves them when the API
                    carries them.
                  </li>
                )}
              </ul>
            )}
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
          {/* Was "Thirty-two customers are one visit away", on every
              dashboard, for every shop, forever - including one with three
              customers. The count is measured now; a regular is someone with
              more than one visit, so one visit away is exactly the members
              sitting on their first. */}
          <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            {metrics.almostRegulars > 0
              ? `${metrics.almostRegulars} ${metrics.almostRegulars === 1 ? "customer has" : "customers have"} been in once and not come back. A quiet note could nudge them into a second visit.`
              : "Nobody is sitting on a single visit right now. When someone comes in once and stops, they will show up here."}
          </p>
          {/* This offered a "Tuesday treat" campaign to review that had never
              been written, on a workspace with no campaigns at all. The
              button goes where it always went; it no longer claims there is
              something waiting at the other end. */}
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-[var(--surface-2)] p-4 sm:flex-row sm:items-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface)]">
              <Megaphone size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Write them a message</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                One send, to the people who have been in once.
              </p>
            </div>
            <Button
              tone="quiet"
              className="min-h-10 px-4"
              onClick={() => onNavigate("campaigns")}
            >
              Go to campaigns
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
              const look =
                programPresentation[program.type] ?? programPresentation.Stamps;
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
                    {selectedProgram.status === "Live"
                      ? "Active rule"
                      : "Suggested rule"}
                  </p>
                  {/* The program's own numbers, not the ones for its type.
                  This read "8 visits - Free pastry on the eighth visit" under
                  an "Active rule" heading no matter what the shop had actually
                  published: an owner who set ten visits for a free rice meal
                  was told, on their own dashboard, to give it away on the
                  eighth. The type's suggestion is still the fallback for a
                  program that has not set its own. */}
                  <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">
                    {selectedProgram.target > 0
                      ? `${selectedProgram.target} visits`
                      : presentation.rule}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    {selectedProgram.rewardName || presentation.suggestion}
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
                      notify(
                        `${selectedProgram.name} opened in Program studio.`,
                        "review",
                      );
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
            {/* All three were constants, and all three were wrong: the shop's
                actual policy was 9 PM-9 AM and 3 a week, and "28 eligible"
                stood over a workspace with no customers. The Settings screen
                and the campaign studio each showed a different third answer. */}
            {[
              "Channel consent checked",
              `Quiet hours · ${hourLabel(policy?.quietFromHour)}–${hourLabel(policy?.quietToHour)}`,
              `Promotion cap · ${policy?.maxPerWeek ?? 0} per week`,
              `${widestReach} eligible in this audience`,
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
          {/* "Last sync 18 seconds ago" was byte-identical on every reload,
              for every shop, for ever. Nothing here measures a sync, so
              nothing here claims one. */}
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
            title: `${staff.length} staff account${staff.length === 1 ? "" : "s"}`,
            detail: (() => {
              const seats = locations.reduce(
                (sum, location) => sum + location.staff,
                0,
              );
              return `Owner, manager, cashier, analyst, and campaign roles across ${seats} branch seat${seats === 1 ? "" : "s"}.`;
            })(),
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
              Hold the customer&apos;s KYP QR inside the frame. Nothing is saved
              until you confirm.
            </p>
            <Button
              className="mt-6 w-full"
              disabled={testStamp.isPending}
              onClick={() =>
                // A real stamp against the merchant's own first program, so
                // "prove it works" proves the counter works rather than that
                // the button does. The API picks the customer and program.
                testStamp.mutate(undefined, {
                  onSuccess: (visit) => {
                    completeTestStamp();
                    notify(
                      `Test stamp recorded. ${visit.customerName} is at ${visit.stampsAfter} of ${visit.target}.`,
                    );
                    // Hands the counter view a customer, so the merchant is
                    // not asked to pick one a second time.
                    startScanHandoff();
                    setScanOpen(false);
                    onNavigate("scan");
                  },
                  onError: (failure) => notify(failure.message, "error"),
                })
              }
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

/**
 * How many members come back, banded so it reads at a glance.
 *
 * Deliberately the repeat rate and not a blended index. The RFM scores are
 * quintiles against the merchant's own customers, which means their average
 * is near the middle for every merchant on the platform by construction - a
 * headline built from them would move for nobody and compare to nothing. The
 * repeat rate is an absolute: it goes up when more people return, and this
 * month's can be set against last month's.
 *
 * The median days to a second visit sits beside it because a rate on its own
 * does not say whether "returning" means next week or next quarter.
 */
const RETURN_BANDS = [
  {
    floor: 0,
    label: "Starting",
    detail: "Not enough return visits to read yet.",
  },
  { floor: 25, label: "Emerging", detail: "A few are starting to come back." },
  { floor: 45, label: "Growing", detail: "Repeat visits are building." },
  { floor: 65, label: "Strong", detail: "Members return consistently." },
  { floor: 85, label: "Elite", detail: "Most members are regulars." },
] as const;

function bandFor(rate: number) {
  // Last band whose floor the rate clears. Written this way rather than as a
  // chain of ifs so the thresholds stay in one readable table.
  return (
    [...RETURN_BANDS].reverse().find((band) => rate >= band.floor) ??
    RETURN_BANDS[0]
  );
}

function ReturnScore() {
  const { data: metrics = EMPTY_BUSINESS_METRICS } = useBusinessMetrics();
  // The median is a sentence this ring adds when the plan carries cohorts;
  // asking for it on a plan that does not is a 402 nobody reads.
  const gate = usePlanGate();
  const { data: secondVisit } = useTimeToSecondVisit({
    enabled: gate.covers(planFor("Cohorts and time to second visit")),
  });
  const rate = Math.max(0, Math.min(100, metrics.repeatRate));
  const band = bandFor(rate);

  // A ring rather than a bar: the number is the point and the arc is the
  // context, so the figure sits inside it instead of beside it.
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className="mt-3 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="mx-auto sm:mx-0">
        <svg
          width="132"
          height="132"
          viewBox="0 0 132 132"
          role="img"
          aria-label={`${rate}% of members return. ${band.label}.`}
        >
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="12"
          />
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - rate / 100)}
            transform="rotate(-90 66 66)"
          />
          <text
            x="66"
            y="64"
            textAnchor="middle"
            className="fill-[var(--ink)] text-[26px] font-extrabold"
            style={{ fontSize: 26, fontWeight: 800 }}
          >
            {rate}%
          </text>
          <text
            x="66"
            y="84"
            textAnchor="middle"
            className="fill-[var(--muted-strong)]"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}
          >
            {band.label.toUpperCase()}
          </text>
        </svg>
      </div>
      <div>
        <Eyebrow>Return rate</Eyebrow>
        <h2 className="mt-1 text-lg font-extrabold">{band.detail}</h2>
        <p className="mt-2 max-w-[62ch] text-xs leading-relaxed text-[var(--muted-strong)]">
          The share of your members who have come back at least once
          {secondVisit && secondVisit.members > 0
            ? `, and a median of ${secondVisit.medianDays} day${secondVisit.medianDays === 1 ? "" : "s"} to that second visit across ${secondVisit.members} member${secondVisit.members === 1 ? "" : "s"}`
            : ""}
          . Counted from your own ledger, not compared against anybody
          else&apos;s.
        </p>
        <ol className="mt-4 flex flex-wrap gap-1.5">
          {RETURN_BANDS.map((step) => (
            <li
              key={step.label}
              aria-current={step.label === band.label ? "true" : undefined}
              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] ${
                step.label === band.label
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--surface-2)] text-[var(--muted-strong)]"
              }`}
            >
              {step.label}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
