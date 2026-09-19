"use client";

import { Button, Eyebrow, QueryBoundary } from "@kypstamping/ui";
import { pesoCompactFromCentavos, relativeTime } from "@kypstamping/ui/format";
import {
  usePlatformMetrics,
  EMPTY_PLATFORM_METRICS,
  useAuditLedger,
  usePartnerApplications,
  useServices,
  useTenants,
} from "@kypstamping/api";
import { useAdminState } from "@/components/AdminState";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Coins,
  ShieldAlert,
  Sparkles,
  Store,
  Users,
  Webhook,
} from "lucide-react";
import type { NotifyIntent } from "@kypstamping/ui/shell";
import type { AdminView } from "@/components/AdminShell";

/**
 * The network at a glance. Every number is the API's; the failure count is
 * the same recovery queue Integrations lists, read once in AdminState.
 */
export function AdminDashboard({
  onNavigate,
  notify,
}: {
  onNavigate: (view: AdminView) => void;
  notify: (message: string, intent?: NotifyIntent) => void;
}) {
  const { data: services = [] } = useServices();
  // Zeroes while the request is in flight: this screen is a wall of counters,
  // and one of them arriving late should not blank the page.
  const {
    data: metrics = EMPTY_PLATFORM_METRICS,
    isPending,
    error,
    refetch,
  } = usePlatformMetrics();
  const { data: waiting = [] } = usePartnerApplications("new");
  const { data: tenants = [] } = useTenants();
  const { data: audit = [] } = useAuditLedger();
  const { tickets, openTicketCount, recoveryQueue } = useAdminState();
  // Was a hardcoded copy of the first three tickets, with its own age format.
  const queue = tickets
    .filter((ticket) => ticket.status !== "Resolved")
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "High" ? -1 : 1;
      return Date.parse(b.openedAt) - Date.parse(a.openedAt);
    })
    .slice(0, 3);
  const degradedServices = services.filter((service) => service.status !== "Operational");
  const founding = tenants.filter((tenant) => tenant.founding).length;
  const recent = [...audit]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 6);

  const tiles = [
    {
      label: "Customer accounts",
      value: metrics.customerAccounts.toLocaleString("en-PH"),
      detail: "One person, many memberships",
      icon: Users,
    },
    {
      label: "Subscription MRR",
      value: pesoCompactFromCentavos(metrics.monthlyRecurringRevenueCentavos),
      detail: "Only Launch is sellable",
      icon: Coins,
    },
    {
      label: "Applications waiting",
      value: String(waiting.length),
      detail: "Read by a person, usually the same day",
      icon: ClipboardCheck,
      view: "partners" as AdminView,
    },
    {
      label: "Founding merchants",
      value: String(founding),
      detail: "Core free for three months when it opens",
      icon: Sparkles,
      view: "businesses" as AdminView,
    },
    {
      label: "Deliveries awaiting replay",
      value: String(recoveryQueue.length),
      detail: recoveryQueue.length ? "Retries exhausted" : "Everything replayed",
      icon: Webhook,
      view: "integrations" as AdminView,
    },
    {
      label: "Services degraded",
      value: `${degradedServices.length} of ${services.length}`,
      detail: degradedServices.length ? degradedServices.map((s) => s.name).join(", ") : "All reported services normal",
      icon: CircleAlert,
      view: "operations" as AdminView,
    },
  ];

  return (
    <main className="admin-canvas min-h-[calc(100dvh-68px)] px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <div>
          <Eyebrow>Platform control room</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Network pulse
          </h1>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            {openTicketCount === 0 && waiting.length === 0
              ? "Nothing is waiting on a human decision."
              : `${openTicketCount} ticket${openTicketCount === 1 ? "" : "s"} and ${waiting.length} application${waiting.length === 1 ? "" : "s"} need a human decision.`}
          </p>
        </div>

        <div className="mt-8">
          <QueryBoundary
            isPending={isPending}
            error={error}
            onRetry={refetch}
            label="platform metrics"
            rows={2}
          >
            <section
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_1fr]"
              aria-label="Platform metrics"
            >
              <article className="relative overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:row-span-2 xl:row-span-2">
                <div className="absolute -right-10 -top-10 size-40 rounded-full border-[28px] border-[var(--accent)] opacity-80" />
                <div className="relative">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/50">
                    Live businesses
                  </p>
                  <p className="mt-5 text-5xl font-extrabold tracking-[-0.03em]">
                    {metrics.liveBusinesses}
                  </p>
                  <p className="mt-7 border-t border-white/12 pt-4 text-xs text-white/55">
                    Every workspace with a live program is listed in Discover, on every plan.
                  </p>
                  <Button
                    tone="accent"
                    className="mt-5"
                    icon={<Store size={16} />}
                    onClick={() => onNavigate("businesses")}
                  >
                    Open businesses
                  </Button>
                </div>
              </article>
              {tiles.map((item) => {
                const Icon = item.icon;
                const body = (
                  <>
                    <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)]">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tracking-[-0.02em]">{item.value}</p>
                    <p className="mt-1 truncate text-[11px] text-[var(--muted-strong)]">
                      {item.detail}
                    </p>
                  </>
                );
                return item.view ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onNavigate(item.view)}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-left transition hover:border-[var(--ink)]"
                  >
                    {body}
                  </button>
                ) : (
                  <article
                    key={item.label}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
                  >
                    {body}
                  </article>
                );
              })}
            </section>
          </QueryBoundary>
        </div>

        <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(360px,0.8fr)]">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Attention queue</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">Needs a decision</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${openTicketCount ? "bg-[rgb(178_59_43/12%)] text-[var(--danger)]" : "bg-[rgb(15_118_85/12%)] text-[var(--success)]"}`}
              >
                {openTicketCount} open
              </span>
            </div>
            <div className="mt-5 divide-y divide-[var(--line)]">
              {queue.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    notify(`${ticket.title} is in the support queue.`);
                    onNavigate("support");
                  }}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 py-4 text-left"
                >
                  <span
                    className={`grid size-9 place-items-center rounded-xl ${ticket.priority === "High" ? "bg-[rgb(178_59_43/12%)] text-[var(--danger)]" : "bg-[var(--surface-2)] text-[var(--muted-strong)]"}`}
                  >
                    {ticket.priority === "High" ? (
                      <ShieldAlert size={17} aria-hidden="true" />
                    ) : (
                      <Clock3 size={17} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{ticket.title}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                      {ticket.business} · {ticket.owner} · {ticket.status}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-[var(--muted)] group-hover:text-[var(--ink)]">
                    {relativeTime(ticket.openedAt)}
                  </span>
                </button>
              ))}
              {queue.length === 0 && (
                <p className="py-6 text-center text-xs font-semibold text-[var(--muted)]">
                  Nothing is waiting on a decision.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate("support")}
              className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-strong)]"
            >
              Open full queue <ArrowRight size={14} aria-hidden="true" />
            </button>
          </article>

          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Event stream</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                  Happening across KYP Stamping
                </h2>
              </div>
            </div>
            <div className="mt-5">
              {recent.length === 0 && (
                <p className="rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-center text-xs font-semibold text-[var(--muted)]">
                  Nothing in the audit ledger yet.
                </p>
              )}
              {recent.map((event, index) => (
                <div key={event.id} className="grid grid-cols-[12px_1fr_auto] gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1.5 size-2.5 rounded-full border-2 border-[var(--surface)] ${event.severity === "Elevated" ? "bg-[var(--accent)]" : "bg-[var(--line-strong)]"}`}
                    />
                    {index < recent.length - 1 && <span className="h-full w-px bg-[var(--line)]" />}
                  </div>
                  <div className="min-w-0 pb-4">
                    <p className="truncate text-sm font-bold">{event.action}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                      {event.actor} · {event.target}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--muted)]">
                    {relativeTime(event.occurredAt)}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate("audit")}
              className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-strong)]"
            >
              Open the audit ledger <ArrowRight size={14} aria-hidden="true" />
            </button>
          </article>

          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <Eyebrow>System posture</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
                  {degradedServices.length === 0
                    ? "All reported services normal"
                    : `${services.length - degradedServices.length} of ${services.length} services normal`}
                </h2>
              </div>
              <span
                className={`grid size-10 place-items-center rounded-full ${
                  degradedServices.length
                    ? "bg-[rgb(178_59_43/12%)] text-[var(--danger)]"
                    : "bg-[rgb(15_118_85/12%)] text-[var(--success)]"
                }`}
              >
                {degradedServices.length ? (
                  <CircleAlert size={19} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={19} aria-hidden="true" />
                )}
              </span>
            </div>
            <div className="mt-6 divide-y divide-[var(--line)]">
              {[...services]
                .sort((a, b) => (a.status === b.status ? 0 : a.status === "Degraded" ? -1 : 1))
                .map((service) => (
                  <div
                    key={service.name}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-bold">{service.name}</p>
                      <p
                        className={`mt-0.5 text-[11px] ${service.status === "Degraded" ? "font-bold text-[var(--danger)]" : "text-[var(--muted)]"}`}
                      >
                        {service.status} · {service.latency}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold">{service.uptime}</span>
                  </div>
                ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate("operations")}
              className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-strong)]"
            >
              Every transport, with honest status <ArrowRight size={14} aria-hidden="true" />
            </button>
          </article>
        </section>
      </div>
    </main>
  );
}
