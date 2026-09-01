"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  Eyebrow,
  Pill,
  ViewFrame as SharedViewFrame,
} from "@kypstamping/ui";
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  CircleDollarSign,
  Download,
  Eye,
  FileClock,
  Filter,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Mail,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCog,
  Users,
  Webhook,
} from "lucide-react";
import type { NotifyIntent } from "@kypstamping/ui/shell";
import { PartnerQueueView } from "@/components/PartnerQueueView";
import type { AdminView } from "@/components/AdminShell";
import { AdminIntegrationsView } from "@/components/AdminIntegrationsView";
import {
  useAuditLedger,
  useChannelEconomics,
  usePlanEconomics,
  ApiError,
  keys,
  downloadPlatformExport,
  setProviderPolicy,
  useAdministrators,
  useApiMutation,
  useOnboarding,
  useProviderPolicy,
  usePlatformCampaigns,
  usePlatformInvoices,
  usePlatformMetrics,
  EMPTY_PLATFORM_METRICS,
  useServices,
  useTenants,
  type ProviderPolicy,
} from "@kypstamping/api";
import { useAdminState } from "@/components/AdminState";
import { longDate, peso, pesoFromCentavos, relativeTime } from "@kypstamping/ui/format";

type Notify = (message: string, intent?: NotifyIntent) => void;



function ViewFrame(props: Omit<Parameters<typeof SharedViewFrame>[0], "wide" | "className">) {
  return <SharedViewFrame wide className="admin-grid" {...props} />;
}

function BusinessesView({ notify }: { notify: Notify }) {
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const { data: tenants = [] } = useTenants();
  const { data: metrics = EMPTY_PLATFORM_METRICS } = usePlatformMetrics();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const filtered = tenants.filter(
    (business) =>
      (business.name.toLowerCase().includes(query.toLowerCase()) ||
        business.city.toLowerCase().includes(query.toLowerCase())) &&
      (!attentionOnly || business.risk !== "Healthy"),
  );
  const selected = tenants.find((business) => business.id === selectedId) ?? tenants[0];

  if (!selected) {
    return (
      <ViewFrame
        eyebrow="Tenant directory"
        title="Businesses"
        description="Review tenant health, subscription, member growth, and risk signals."
      >
        <p className="text-sm text-[var(--muted-strong)]">No tenants yet.</p>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Tenant directory"
      title="Businesses"
      description={`Review tenant health, subscription, member growth, risk signals, and operational access without crossing customer-data boundaries. This demo carries ${tenants.length} of ${metrics.liveBusinesses} live tenants.`}
      action={
        <Button
          icon={<Building2 size={16} />}
          aria-expanded={onboardingOpen}
          onClick={() => setOnboardingOpen((open) => !open)}
        >
          {onboardingOpen ? "Hide onboarding" : "Onboarding progress"}
        </Button>
      }
    >
      {onboardingOpen && <OnboardingPanel />}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex gap-3 border-b border-[var(--line)] p-4">
            <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="Business or city"
                aria-label="Search businesses by name or city"
              />
            </label>
            <button
              type="button"
              aria-label="Show businesses needing attention"
              aria-pressed={attentionOnly}
              onClick={() => setAttentionOnly((active) => !active)}
              className={`grid size-11 place-items-center rounded-xl border transition ${attentionOnly ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--paper)]"}`}
            >
              <Filter size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">MRR</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((business) => (
                  <tr
                    key={business.id}
                    tabIndex={0}
                    aria-label={`Open ${business.name}`}
                    onClick={() => setSelectedId(business.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(business.id);
                      }
                    }}
                    className={`cursor-pointer border-b border-[var(--line)] outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--accent)] last:border-0 ${selected.id === business.id ? "bg-[rgb(232_163_61/9%)]" : "hover:bg-[var(--paper)]"}`}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold">{business.name}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                        {business.owner} · {business.city}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Pill
                        tone={business.plan === "Scale" ? "warning" : "neutral"}
                      >
                        {business.plan}
                      </Pill>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {business.members.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm font-extrabold">
                      {pesoFromCentavos(business.mrrCentavos)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-2)]">
                          <div
                            className={`h-full rounded-full ${business.health >= 80 ? "bg-[var(--success)]" : business.health >= 65 ? "bg-[var(--accent)]" : "bg-[var(--danger)]"}`}
                            style={{ width: `${business.health}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">
                          {business.health}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Pill
                        tone={
                          business.risk === "Healthy"
                            ? "success"
                            : business.risk === "Watch"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {business.risk}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)] text-lg font-extrabold text-[var(--ink)]">
              {selected.name
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </span>
            <Pill
              tone={
                selected.risk === "Healthy"
                  ? "success"
                  : selected.risk === "Watch"
                    ? "warning"
                    : "danger"
              }
            >
              {selected.risk}
            </Pill>
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.02em]">
            {selected.name}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {selected.owner} · {selected.city}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
            {[
              ["Plan", selected.plan],
              ["MRR", pesoFromCentavos(selected.mrrCentavos)],
              ["Members", selected.members.toLocaleString()],
              ["Joined", longDate(selected.joinedOn)],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink-soft)] p-4">
                <p className="text-[10px] text-white/50">{label}</p>
                <p className="mt-1 text-sm font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/12 p-4">
            <div className="flex gap-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[var(--accent)]"
              />
              <p className="text-xs leading-relaxed text-white/65">
                Support access will require a reason, expire after 30 minutes, and
                is written to the audit ledger.
              </p>
            </div>
          </div>
          <Button
            tone="accent"
            className="mt-6 w-full"
            onClick={() =>
              notify(
                `Time-limited support view requested for ${selected.name}.`,
              )
            }
          >
            Request support access
          </Button>
        </aside>
      </div>
    </ViewFrame>
  );
}

function PeopleView({ notify }: { notify: Notify }) {
  const { data: metrics = EMPTY_PLATFORM_METRICS } = usePlatformMetrics();
  return (
    <ViewFrame
      eyebrow="Network people"
      title="People & privacy"
      description="Monitor aggregate account health and data-subject requests. Platform staff never browse customer profiles without a scoped support or trust reason."
      action={
        <PlatformExportButton
          kind="privacy"
          label="Export privacy report"
          notify={notify}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            [
              "Customer accounts",
              metrics.customerAccounts.toLocaleString("en-PH"),
              "One person, many memberships",
              Users,
            ],
            ["Consent withdrawals", "184", "0.99% of accounts", Eye],
            ["Exports in SLA", "100%", "12 completed", Download],
            ["Deletion queue", "9", "Oldest is 3 hours", LockKeyhole],
          ] as const
        ).map(([label, value, detail, icon]) => {
          const Icon = icon;
          return (
            <article
              key={String(label)}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <Icon size={18} className="text-[var(--accent-strong)]" />
              <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
                {label}
              </p>
              <p className="mt-1 text-2xl font-extrabold">{value}</p>
              <p className="mt-1 text-xs text-[var(--muted-strong)]">
                {detail}
              </p>
            </article>
          );
        })}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Data-subject requests</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Active work</h2>
            </div>
            <Pill tone="success">All in SLA</Pill>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {[
              ["dsr_1096", "Delete account", "Identity verified", "2h 14m"],
              ["dsr_1095", "Portable export", "Generating archive", "3h 02m"],
              [
                "dsr_1094",
                "Correct mobile number",
                "Waiting for customer",
                "5h 18m",
              ],
              ["dsr_1093", "Object to profiling", "Completed", "Yesterday"],
            ].map(([id, request, status, age]) => (
              <div key={id} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                <div>
                  <p className="text-sm font-extrabold">{request}</p>
                  <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">
                    {id} · {status}
                  </p>
                </div>
                <span className="text-xs font-bold text-[var(--muted-strong)]">
                  {age}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--accent)] p-6">
          <ShieldCheck size={22} />
          <h2 className="mt-8 max-w-[12ch] text-3xl font-extrabold tracking-[-0.02em]">
            Rights are operational workflows.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]/80">
            Access, correction, objection, portability, deletion, complaint, and
            damage claims each need evidence, deadlines, ownership, and an
            immutable completion record.
          </p>
          <button
            type="button"
            onClick={() =>
              notify(
                "The playbook is not written yet. The workflows it describes are live in the privacy centre.",
                "review",
              )
            }
            className="mt-7 inline-flex items-center gap-2 text-xs font-extrabold"
          >
            Open privacy playbook <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </ViewFrame>
  );
}

function OperationsView({ notify }: { notify: Notify }) {
  const { data: services = [] } = useServices();
  const [replaying, setReplaying] = useState(false);
  return (
    <ViewFrame
      eyebrow="System operations"
      title="Delivery & services"
      description="Follow API, worker, channel adapter, wallet-pass, and offline reconciliation health from one operational view."
      action={
        <Button
          tone="quiet"
          icon={<RefreshCcw size={16} />}
          onClick={() => {
            setReplaying(true);
            window.setTimeout(() => setReplaying(false), 900);
            notify("Health checks refreshed.");
          }}
        >
          {replaying ? "Refreshing…" : "Refresh health"}
        </Button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.name}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <div className="flex items-start justify-between">
              <span
                className={`grid size-10 place-items-center rounded-xl ${service.status === "Degraded" ? "bg-[rgb(178_59_43/12%)] text-[var(--danger)]" : "bg-[rgb(15_118_85/12%)] text-[var(--success)]"}`}
              >
                {service.status === "Degraded" ? (
                  <CircleAlert size={18} />
                ) : (
                  <Check size={18} />
                )}
              </span>
              <Pill tone={service.status === "Degraded" ? "danger" : "success"}>
                {service.status}
              </Pill>
            </div>
            <h2 className="mt-7 text-base font-extrabold">{service.name}</h2>
            <div className="mt-4 flex justify-between border-t border-[var(--line)] pt-3 text-xs">
              <span className="text-[var(--muted)]">
                Latency {service.latency}
              </span>
              <strong>{service.uptime}</strong>
            </div>
          </article>
        ))}
      </section>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Worker queues</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Backlog by job type</h2>
            </div>
            <Activity />
          </div>
          <div className="mt-6 space-y-5">
            {[
              ["Campaign delivery", 38, 120],
              ["Webhook retry", 12, 40],
              ["Offline reconciliation", 84, 180],
              ["Exports and deletion", 9, 30],
              ["Wallet pass updates", 24, 80],
            ].map(([name, depth, max]) => (
              <div key={String(name)}>
                <div className="flex justify-between text-xs">
                  <strong>{name}</strong>
                  <span className="text-[var(--muted)]">{depth} queued</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--ink)]"
                    style={{ width: `${(Number(depth) / Number(max)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center justify-between">
            <Eyebrow>Active incident</Eyebrow>
            <Pill tone="danger">Investigating</Pill>
          </div>
          <h2 className="mt-7 text-2xl font-extrabold tracking-[-0.02em]">
            SMS delivery latency
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            One provider route is delayed. Service messages are retrying;
            promotional jobs are held to avoid duplicates and unexpected credit
            spend.
          </p>
          <div className="mt-6 divide-y divide-white/12 border-y border-white/12">
            {[
              ["Started", "10:21 AM"],
              ["Affected", "8.4% of SMS"],
              ["Fallback", "Email when consented"],
              ["Next update", "11:15 AM"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 text-xs">
                <span className="text-white/50">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          {/* No runbook exists to open. Saying so beats reporting that one
              did - an operator in an incident must not be told a document
              opened when none did. */}
          <p className="mt-6 rounded-xl border border-dashed border-white/20 p-3 text-[11px] leading-relaxed text-white/55">
            No incident runbook is published yet. Service health above is live;
            the written procedure is not.
          </p>
        </section>
      </div>
    </ViewFrame>
  );
}

const TICKET_STATUSES = ["Open", "Investigating", "Waiting", "Resolved"];

function SupportView({ notify }: { notify: Notify }) {
  const {
    tickets,
    openTicketCount,
    updateTicket,
    assignTicket,
    setTicketNote,
  } = useAdminState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];
  /**
   * The note being typed, kept local until the field is left.
   *
   * It used to write on every keystroke, so a forty-character note was forty
   * PATCH requests - free against a fixture, and forty round trips against a
   * real API. Keyed by ticket, like the program and custom-field drafts
   * elsewhere, so switching tickets drops a half-typed note rather than
   * carrying one investigation's words onto another.
   */
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  if (selected && noteFor !== selected.id) {
    setNoteFor(selected.id);
    setNoteDraft(null);
  }
  const note = noteDraft ?? selected?.note ?? "";

  /** Writes the draft if it says anything new. Returns what the note now is. */
  const commitNote = () => {
    if (selected && noteDraft !== null && noteDraft !== selected.note) {
      setTicketNote(selected.id, noteDraft, (message) => notify(message, "error"));
    }
    return note;
  };

  if (!selected) {
    return (
      <ViewFrame
        eyebrow="Human support"
        title="Support queue"
        description="Triage trust, access, messaging, fraud, and privacy work."
      >
        <p className="text-sm text-[var(--muted-strong)]">
          Nothing in the queue.
        </p>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Human support"
      title="Support queue"
      description="Triage trust, access, messaging, fraud, and privacy work with clear ownership and audited resolution steps."
      action={
        <Button
          tone="quiet"
          icon={<SlidersHorizontal size={16} />}
          onClick={() =>
            notify(
              "Routing rules are not configurable yet. Tickets arrive unassigned and are picked up from this queue.",
              "review",
            )
          }
        >
          Queue rules
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.7fr)]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>Open work</Eyebrow>
            <Pill tone={openTicketCount ? "danger" : "success"}>
              {openTicketCount} open
            </Pill>
          </div>
          <div className="mt-4 divide-y divide-[var(--line)]">
            {tickets.map((ticket) => (
              <button
                type="button"
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 py-4 text-left ${selected.id === ticket.id ? "text-[var(--ink)]" : "text-[var(--muted-strong)]"}`}
              >
                <span
                  className={`grid size-10 place-items-center rounded-xl ${ticket.priority === "High" ? "bg-[rgb(178_59_43/12%)] text-[var(--danger)]" : "bg-[var(--surface-2)]"}`}
                >
                  {ticket.category === "Fraud" ? (
                    <ShieldAlert size={17} />
                  ) : ticket.category === "Privacy" ? (
                    <LockKeyhole size={17} />
                  ) : (
                    <LifeBuoy size={17} />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-extrabold">
                    {ticket.title}
                  </span>
                  <span className="mt-1 block text-[10px]">
                    {ticket.business} · {ticket.category} · {ticket.owner} ·{" "}
                    {ticket.status}
                  </span>
                </span>
                <span className="text-xs font-bold">{relativeTime(ticket.openedAt)}</span>
              </button>
            ))}
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center justify-between">
            <Pill tone={selected.priority === "High" ? "danger" : "neutral"}>
              {selected.priority}
            </Pill>
            <span className="font-mono text-[10px] text-white/50">
              {selected.id}
            </span>
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.02em]">
            {selected.title}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {selected.business} · {selected.category}
          </p>

          {/* Set when the ticket came from the public contact form. Without
              it the queue holds a question and no way to answer it. */}
          {selected.contactEmail && (
            <div className="mt-6 rounded-2xl border border-white/12 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
                Raised from the website
              </p>
              <p className="mt-2 text-sm font-extrabold">{selected.contactName}</p>
              <a
                href={`mailto:${selected.contactEmail}?subject=${encodeURIComponent(
                  `Re: ${selected.title}`,
                )}`}
                className="mt-1 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] underline underline-offset-2"
              >
                <Mail size={13} /> {selected.contactEmail}
              </a>
            </div>
          )}

          {selected.note && (
            <div className="mt-4 rounded-2xl bg-white/6 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
                What they wrote
              </p>
              <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-white/75">
                {selected.note}
              </p>
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-white/6 p-4">
            <p className="text-xs font-extrabold">Recommended next step</p>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              Verify the requester and event scope, request time-limited support
              access when needed, then record the decision and customer-facing
              explanation.
            </p>
          </div>
          <label className="mt-5 grid gap-2 text-xs font-bold">
            Assign to
            <select
              className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3"
              value={selected.owner}
              onChange={(event) => {
                assignTicket(selected.id, event.target.value, (message) =>
                  notify(message, "error"),
                );
                notify(`${selected.id} assigned to ${event.target.value}.`);
              }}
            >
              {[...new Set([selected.owner, "Unassigned", "Nica", "Mika", "Paolo"])].map(
                (owner) => (
                  <option key={owner}>{owner}</option>
                ),
              )}
            </select>
          </label>
          <label className="mt-4 grid gap-2 text-xs font-bold">
            Status
            <select
              className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3"
              value={selected.status}
              // One write carrying both fields.
              //
              // The API refuses "Investigating" without an internal note, and
              // sending the note and the status as two PATCHes races: blur
              // fires the note, the change fires the status, and the status
              // can reach the server first and be refused over a note that is
              // moments from arriving.
              //
              // The dropdown also announced the move before the API had taken
              // it. The row reverts now, and the reason the server gave is
              // what the admin reads.
              onChange={(event) => {
                const status = event.target.value;
                const pending =
                  noteDraft !== null && noteDraft !== selected.note
                    ? { status, note: noteDraft }
                    : { status };
                updateTicket(selected.id, pending, (message) => notify(message, "error"));
                notify(`${selected.id} moved to ${status.toLowerCase()}.`);
              }}
            >
              {[...new Set([selected.status, ...TICKET_STATUSES])].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="mt-4 grid gap-2 text-xs font-bold">
            Internal note
            <textarea
              rows={4}
              className="rounded-xl border border-white/15 bg-[var(--ink-soft)] p-3 outline-none"
              placeholder="Record evidence and the next decision"
              value={note}
              onChange={(event) => setNoteDraft(event.target.value)}
              onBlur={commitNote}
            />
          </label>
          <Button
            tone="accent"
            className="mt-5 w-full"
            onClick={() => {
              // The draft, not the saved note: the API refuses this transition
              // without one, and a note typed but not yet blurred is still a
              // note the admin has written.
              if (!note.trim()) {
                notify("Add an internal note before starting an investigation.", "error");
                return;
              }
              // Same single write, for the same reason.
              updateTicket(
                selected.id,
                { status: "Investigating", note: note },
                (message) => notify(message, "error"),
              );
              notify(`${selected.id} moved to investigating.`);
            }}
          >
            Start investigation
          </Button>
        </aside>
      </div>
    </ViewFrame>
  );
}

function AuditView({ notify }: { notify: Notify }) {
  const { data: audit = [] } = useAuditLedger();
  return (
    <ViewFrame
      eyebrow="Privileged action ledger"
      title="Audit ledger"
      description="Every admin access, change, reversal, replay, export, and automated safeguard is recorded for accountability."
      action={
        <PlatformExportButton kind="audit" label="Export audit log" notify={notify} />
      }
    >
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-5 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Severity</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-extrabold">{event.actor}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {event.role}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm">{event.action}</td>
                  <td className="px-4 py-4 text-xs font-bold">
                    {event.target}
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">
                    {relativeTime(event.occurredAt)}
                  </td>
                  <td className="px-4 py-4 font-mono text-[10px]">
                    {event.ip}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={
                        event.severity === "Elevated" ? "warning" : "neutral"
                      }
                    >
                      {event.severity}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <FileClock size={19} className="mt-0.5 text-[var(--accent-strong)]" />
        <div>
          <p className="text-sm font-extrabold">Append-only by design (planned)</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
            Demo records are local JSON. The production API should hash event
            chains, retain actor and request context, and export signed evidence
            without allowing in-place edits.
          </p>
        </div>
      </div>
    </ViewFrame>
  );
}

/**
 * Invoices and campaigns as they actually stand.
 *
 * The screen above this models plan margin. These are the two reads that
 * say what really billed and what really sent - both endpoints existed and
 * nothing called either.
 */
function BilledAndSent() {
  const { data: invoices = [] } = usePlatformInvoices();
  const { data: campaigns = [] } = usePlatformCampaigns();
  const outstanding = invoices.filter((invoice) => invoice.status !== "Paid");

  return (
    <div className="mt-3 grid gap-3 xl:grid-cols-2">
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-5">
          <Eyebrow>Billing</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">
            {outstanding.length
              ? `${outstanding.length} invoice${outstanding.length === 1 ? "" : "s"} outstanding`
              : "Every invoice settled"}
          </h2>
        </div>
        {invoices.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted-strong)]">Nothing issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3">Workspace</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 12).map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-5 py-3.5 font-mono text-[11px]">{invoice.merchantId}</td>
                    <td className="px-4 py-3.5 text-sm">{invoice.period}</td>
                    <td className="px-4 py-3.5 text-sm font-bold">
                      {pesoFromCentavos(invoice.amountCentavos)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Pill tone={invoice.status === "Paid" ? "success" : "warning"}>
                        {invoice.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-5">
          <Eyebrow>Delivery</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">
            {campaigns.reduce((sum, campaign) => sum + campaign.sent, 0).toLocaleString()}{" "}
            messages across {campaigns.length} campaign
            {campaigns.length === 1 ? "" : "s"}
          </h2>
        </div>
        {campaigns.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted-strong)]">Nothing sent yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {campaigns.slice(0, 8).map((campaign) => (
              <li key={campaign.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{campaign.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">
                    {campaign.merchantId}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">{campaign.sent.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--muted-strong)]">
                    {pesoFromCentavos(campaign.costCentavos)}
                  </p>
                </div>
                <Pill tone={campaign.status === "Sent" ? "success" : "neutral"}>
                  {campaign.status}
                </Pill>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EconomicsView() {
  const { data: metrics = EMPTY_PLATFORM_METRICS } = usePlatformMetrics();
  const { data: planEconomics = [] } = usePlanEconomics();
  const { data: channelEconomics = [] } = useChannelEconomics();
  const totalPlanMrr = planEconomics.reduce(
    (sum, plan) => sum + plan.mrrCentavos,
    0,
  );
  const totalPlanCost = planEconomics.reduce(
    (sum, plan) => sum + plan.monthlyCostCentavos,
    0,
  );
  const margin = ((totalPlanMrr - totalPlanCost) / totalPlanMrr) * 100;
  return (
    <ViewFrame
      eyebrow="Sustainable growth"
      title="Revenue & margin"
      description="Protect gross margin by separating predictable software value from variable delivery costs. SMS and connected messaging never disappear inside an unlimited promise."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Subscription MRR",
            pesoFromCentavos(metrics.monthlyRecurringRevenueCentavos),
            "+8.4%",
          ],
          [
            "Blended gross margin",
            `${metrics.grossMargin}%`,
            "Target ≥ 75%",
          ],
          [
            "Net revenue retention",
            `${metrics.netRevenueRetention}%`,
            "Expansion healthy",
          ],
          [
            "SMS credit liability",
            pesoFromCentavos(metrics.smsLiabilityCentavos),
            "Prepaid reserve",
          ],
        ].map(([label, value, detail]) => (
          <article
            key={label}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-strong)]">{detail}</p>
          </article>
        ))}
      </div>
      <BilledAndSent />
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Plan contribution</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">
              Revenue after direct service cost
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-4 py-3">Accounts</th>
                  <th className="px-4 py-3">MRR</th>
                  <th className="px-4 py-3">Direct cost</th>
                  <th className="px-4 py-3">Margin</th>
                </tr>
              </thead>
              <tbody>
                {planEconomics.map((plan) => (
                  <tr
                    key={plan.name}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-5 py-4 text-sm font-extrabold">
                      {plan.name}
                    </td>
                    <td className="px-4 py-4 text-sm">{plan.accounts}</td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {pesoFromCentavos(plan.mrrCentavos)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {pesoFromCentavos(plan.monthlyCostCentavos)}
                    </td>
                    <td className="px-4 py-4">
                      <Pill
                        tone={
                          plan.margin >= 75
                            ? "success"
                            : plan.margin
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {plan.margin ? `${plan.margin}%` : "Acquisition"}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--accent)] p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Pricing guardrail</Eyebrow>
            <CircleDollarSign size={20} />
          </div>
          <p className="mt-7 text-4xl font-extrabold tracking-[-0.03em]">
            {margin.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm font-bold">
            modeled subscription contribution margin
          </p>
          <p className="mt-5 text-sm leading-relaxed text-[var(--ink)]/80">
            Launch is an acquisition cost with hard limits. Core and Grow fund
            support and product development. Scale’s API and account-service
            load is priced high enough to remain useful, not merely popular.
          </p>
          <div className="mt-6 rounded-2xl bg-[var(--surface)] p-4">
            <p className="text-xs font-extrabold">
              Rule: variable channels stay variable
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
              SMS is prepaid at ₱0.95 per segment. Email overages are ₱25 per
              1,000 and push ₱8 per 1,000. Connected channels pass through
              provider cost plus orchestration.
            </p>
          </div>
        </section>
      </div>
      <section className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-5">
          <Eyebrow>Channel unit economics</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">
            Delivery volume, revenue, and cost
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <tbody>
              {channelEconomics.map((channel) => {
                const contribution = channel.revenueCentavos - channel.costCentavos;
                return (
                  <tr
                    key={channel.name}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-5 py-4 text-sm font-extrabold">
                      {channel.name}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {channel.volume.toLocaleString()} messages
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                      {channel.model}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {pesoFromCentavos(channel.revenueCentavos)} revenue
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {pesoFromCentavos(channel.costCentavos)} cost
                    </td>
                    <td
                      className={`px-4 py-4 text-sm font-extrabold ${contribution >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                    >
                      {contribution >= 0 ? "+" : ""}
                      {peso(contribution)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </ViewFrame>
  );
}

/**
 * A network-wide export, streamed straight to the browser.
 *
 * Both buttons used to say "prepared" and produce nothing. An audit ledger
 * you cannot take out of the system is not a ledger: the reason to keep one
 * is to hand it to whoever is asking.
 */
/**
 * Who signed up and then stalled.
 *
 * There is no approval queue - a business is live the moment it signs up -
 * so the useful question is not who is waiting but who got stuck, and on
 * which step.
 */
function OnboardingPanel() {
  const { data: rows = [] } = useOnboarding();
  const stalled = rows.filter((row) => row.stepsDone < row.stepsTotal);

  return (
    <section className="mb-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="border-b border-[var(--line)] p-5">
        <Eyebrow>Setup</Eyebrow>
        <h2 className="mt-1 text-lg font-extrabold">
          {stalled.length
            ? `${stalled.length} of ${rows.length} still setting up`
            : "Every workspace is set up"}
        </h2>
      </div>
      <ul className="divide-y divide-[var(--line)]">
        {rows.map((row) => (
          <li key={row.merchantId} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{row.name}</p>
              <p className="mt-0.5 text-[10px] text-[var(--muted-strong)]">
                {row.plan} · joined {relativeTime(row.createdAt)}
              </p>
            </div>
            <div className="hidden gap-1.5 sm:flex">
              {(
                [
                  ["Program", row.hasProgram],
                  ["Location", row.hasLocation],
                  ["Staff", row.hasStaff],
                  ["First stamp", row.hasFirstStamp],
                ] as const
              ).map(([label, done]) => (
                <span
                  key={label}
                  className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] ${
                    done
                      ? "bg-[rgb(15_118_85/12%)] text-[var(--success)]"
                      : "bg-[var(--surface-2)] text-[var(--muted)]"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
            <Pill tone={row.stepsDone === row.stepsTotal ? "success" : "warning"}>
              {row.stepsDone}/{row.stepsTotal}
            </Pill>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The five network-wide limits, editable.
 *
 * They were displayed as settled fact and stored nowhere. The SMS ceiling
 * and the complaint threshold are what stand between one misconfigured
 * tenant and either a bill or a blocklisting.
 */
function ProviderPolicyCard({ notify }: { notify: Notify }) {
  const { data: policy } = useProviderPolicy();
  const save = useApiMutation(setProviderPolicy, {
    invalidates: [keys.admin.providerPolicy()],
  });
  const [draft, setDraft] = useState<ProviderPolicy | null>(null);
  const shown = draft ?? policy;

  if (!shown) {
    return (
      <article className="h-72 animate-pulse rounded-2xl bg-[var(--ink-soft)]" />
    );
  }

  const field =
    "min-h-9 w-28 rounded-lg border border-white/15 bg-[var(--ink-soft)] px-2 text-right text-xs font-bold text-white outline-none focus:border-[var(--accent)]";

  return (
    <article className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
      <div className="flex items-center justify-between">
        <Eyebrow>Provider policies</Eyebrow>
        <Webhook size={19} className="text-[var(--accent)]" />
      </div>
      <div className="mt-6 divide-y divide-white/12 border-y border-white/12">
        {(
          [
            ["SMS ceiling", "smsCeilingCentavos", "centavos per tenant"],
            ["Email complaint pause", "emailComplaintPauseBps", "basis points"],
            ["Webhook retry window", "webhookRetryHours", "hours"],
            ["Offline replay window", "offlineReplayDays", "days"],
            ["Audit retention", "auditRetentionDays", "days"],
          ] as const
        ).map(([label, key, unit]) => (
          <label key={key} className="flex items-center justify-between gap-4 py-3 text-xs">
            <span className="text-white/50">
              {label}
              <span className="ml-1 text-white/30">({unit})</span>
            </span>
            <input
              type="number"
              value={shown[key]}
              onChange={(event) =>
                setDraft({ ...shown, [key]: Number(event.target.value) })
              }
              className={field}
            />
          </label>
        ))}
      </div>
      <Button
        tone="accent"
        className="mt-5"
        disabled={!draft || save.isPending}
        onClick={() =>
          draft &&
          save.mutate(draft, {
            onSuccess: () => {
              setDraft(null);
              notify("Provider policy saved network-wide.");
            },
            onError: (failure) => notify(failure.message, "review"),
          })
        }
      >
        {save.isPending ? "Saving\u2026" : draft ? "Save policy" : "Saved"}
      </Button>
    </article>
  );
}

function PlatformExportButton({
  kind,
  label,
  notify,
}: {
  kind: "audit" | "privacy";
  label: string;
  notify: Notify;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      tone="quiet"
      icon={<Download size={16} />}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadPlatformExport(kind);
        } catch (failure) {
          notify(
            failure instanceof ApiError ? failure.message : "That export could not be prepared.",
            "review",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Preparing\u2026" : label}
    </Button>
  );
}

function SettingsView({ notify }: { notify: Notify }) {
  const { data: administrators = [] } = useAdministrators();
  const [reviewOpen, setReviewOpen] = useState(false);
  const signedIn = administrators.filter((person) => person.activeSessions > 0);
  const withoutMfa = administrators.filter((person) => !person.mfaEnabled);
  const { flags, toggleFlag } = useAdminState();
  return (
    <ViewFrame
      eyebrow="Platform configuration"
      title="Platform settings"
      description="Set global trust, delivery, billing, retention, and privileged-access defaults. Every change enters the audit ledger."
      action={
        <Button
          onClick={() =>
            notify("Platform settings saved to the local demo state.")
          }
        >
          Save changes
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[1fr_0.72fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Safety defaults</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">
              Controls that apply network-wide
            </h2>
          </div>
          {(
            [
              [
                "automaticPausing",
                "Automatic campaign pausing",
                "Pause on complaint, unsubscribe, fraud, or provider-error thresholds",
                ShieldAlert,
              ],
              [
                "publicStatus",
                "Public service status",
                "Publish active incidents and resolution updates",
                Activity,
              ],
              [
                "newTenantReview",
                "New tenant review",
                "Verify business identity before paid outbound messaging",
                Building2,
              ],
              [
                "adminMfa",
                "Administrator MFA",
                "Require a strong second factor for every privileged session",
                KeyRound,
              ],
            ] as const
          ).map(([key, title, detail, icon], index) => {
            const Icon = icon;
            const enabled = flags[key];
            return (
              <div
                key={String(key)}
                className={`flex items-start gap-4 p-5 ${index > 0 ? "border-t border-[var(--line)]" : ""}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {detail}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label={`Toggle ${title}`}
                  aria-checked={enabled}
                  onClick={() => {
                    const next = toggleFlag(key);
                    notify(`${title} ${next ? "enabled" : "disabled"} network-wide.`);
                  }}
                  className={`relative h-6 w-10 shrink-0 rounded-full ${enabled ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                >
                  <span
                    className={`absolute top-1 size-4 rounded-full bg-white transition ${enabled ? "left-5" : "left-1"}`}
                  />
                </button>
              </div>
            );
          })}
        </section>
        <aside className="space-y-3">
          <ProviderPolicyCard notify={notify} />
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex gap-3">
              <UserRoundCog
                size={19}
                className="mt-0.5 text-[var(--accent-strong)]"
              />
              <div>
                <p className="text-sm font-extrabold">
                  Administrator access review
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                  {administrators.length} administrator
                  {administrators.length === 1 ? "" : "s"} ·{" "}
                  {signedIn.length} signed in now ·{" "}
                  {withoutMfa.length
                    ? `${withoutMfa.length} without a second factor`
                    : "all with a second factor"}
                  .
                </p>
              </div>
            </div>
            <Button
              tone="quiet"
              className="mt-5"
              aria-expanded={reviewOpen}
              onClick={() => setReviewOpen((open) => !open)}
            >
              {reviewOpen ? "Close review" : "Review access"}
            </Button>
            {reviewOpen && (
              <ul className="mt-4 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
                {administrators.map((person) => (
                  <li key={person.id} className="flex items-start gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold">{person.name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--muted-strong)]">
                        {person.email}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--muted)]">
                        {person.activeSessions
                          ? `${person.activeSessions} live session${person.activeSessions === 1 ? "" : "s"}`
                          : "not signed in"}
                        {person.lastSeenAt ? ` · last seen ${relativeTime(person.lastSeenAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {/* The two states this review exists to surface. */}
                      <Pill tone={person.isActive ? "success" : "neutral"}>
                        {person.isActive ? "Active" : "Disabled"}
                      </Pill>
                      {!person.mfaEnabled && <Pill tone="danger">No MFA</Pill>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </aside>
      </div>
    </ViewFrame>
  );
}

export function AdminViewContent({
  view,
  notify,
}: {
  view: AdminView;
  notify: Notify;
}) {
  const views: Record<Exclude<AdminView, "overview">, ReactNode> = {
    businesses: <BusinessesView notify={notify} />,
    partners: <PartnerQueueView notify={notify} />,
    people: <PeopleView notify={notify} />,
    operations: <OperationsView notify={notify} />,
    integrations: <AdminIntegrationsView notify={notify} />,
    support: <SupportView notify={notify} />,
    audit: <AuditView notify={notify} />,
    economics: <EconomicsView />,
    settings: <SettingsView notify={notify} />,
  };
  return view === "overview" ? null : views[view];
}
