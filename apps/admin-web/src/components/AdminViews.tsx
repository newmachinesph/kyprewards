"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  Eyebrow,
  Pill,
  PreviewBadge,
  QueryBoundary,
  ViewFrame as SharedViewFrame,
} from "@kypstamping/ui";
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  CircleDollarSign,
  CreditCard,
  Download,
  FileClock,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Mail,
  RefreshCcw,
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
import { AdminAddOnsView } from "@/components/AdminAddOnsView";
import { AdminBusinessesView } from "@/components/AdminBusinessesView";
import { AdminIntegrationsView } from "@/components/AdminIntegrationsView";
import {
  useAuditLedger,
  useChannelEconomics,
  usePlanEconomics,
  ApiError,
  keys,
  downloadPlatformExport,
  PREVIEW_WRITE_REASON,
  setProviderPolicy,
  useAdministrators,
  useApiMutation,
  useProviderPolicy,
  usePlatformFlags,
  usePlatformCampaigns,
  usePlatformInvoices,
  usePlatformMetrics,
  EMPTY_PLATFORM_METRICS,
  useServices,
  useTenants,
  type ProviderPolicy,
  type ServiceHealth,
} from "@kypstamping/api";
import { useAdminState } from "@/components/AdminState";
import { pesoFromCentavos, relativeTime } from "@kypstamping/ui/format";
import { FOUNDING } from "@/lib/catalog";

type Notify = (message: string, intent?: NotifyIntent) => void;

function ViewFrame(
  props: Omit<Parameters<typeof SharedViewFrame>[0], "wide" | "className">,
) {
  return <SharedViewFrame wide className="admin-grid" {...props} />;
}

function PeopleView({ notify }: { notify: Notify }) {
  const {
    data: metrics = EMPTY_PLATFORM_METRICS,
    isPending,
    error,
    refetch,
  } = usePlatformMetrics();
  return (
    <ViewFrame
      eyebrow="Network people"
      title="People & privacy"
      description="Aggregate account health and the privacy workflows this app monitors. No administrator reads a customer profile here; every field on this page is a count."
      action={
        <PlatformExportButton
          kind="privacy"
          label="Export privacy report"
          notify={notify}
        />
      }
    >
      <QueryBoundary
        isPending={isPending}
        error={error}
        onRetry={refetch}
        label="account aggregates"
        rows={2}
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
              [
                "Consent withdrawals",
                "—",
                "Not reported by the API yet",
                ShieldCheck,
              ],
              ["Data exports", "—", "Not reported by the API yet", Download],
              [
                "Deletion requests",
                "—",
                "Not reported by the API yet",
                LockKeyhole,
              ],
            ] as const
          ).map(([label, value, detail, icon]) => {
            const Icon = icon;
            return (
              <article
                key={String(label)}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <Icon
                  size={18}
                  className="text-[var(--accent-strong)]"
                  aria-hidden="true"
                />
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
      </QueryBoundary>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <Eyebrow>Scoped access</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">
            How a person ever sees a customer record
          </h2>
          <dl className="mt-5 divide-y divide-[var(--line)]">
            {(
              [
                [
                  "Time-limited",
                  "A grant expires on its own, in minutes, not days.",
                ],
                [
                  "Reason-bound",
                  "Every grant names the ticket or trust reason it serves.",
                ],
                [
                  "Audited",
                  "The grant, the reads and the expiry are written to the audit ledger by the API.",
                ],
              ] as const
            ).map(([term, detail]) => (
              <div
                key={term}
                className="grid gap-1 py-3.5 sm:grid-cols-[140px_1fr]"
              >
                <dt className="text-sm font-extrabold">{term}</dt>
                <dd className="text-xs leading-relaxed text-[var(--muted-strong)]">
                  {detail}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-xl border border-dashed border-[var(--line-strong)] p-3 text-[11px] leading-relaxed text-[var(--muted-strong)]">
            There is no endpoint to request a grant yet, so this console cannot
            open one. Consent, export and deletion are handled in the merchant
            and customer apps; this page will show their counts once the API
            reports them.
          </p>
        </section>
        <section className="rounded-2xl bg-[var(--accent)] p-6">
          <ShieldCheck size={22} aria-hidden="true" />
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
            Open privacy playbook <ArrowRight size={14} aria-hidden="true" />
          </button>
        </section>
      </div>
    </ViewFrame>
  );
}

/**
 * Every transport, with honest status.
 *
 * The API reports the checks it can actually make. Everything else on this
 * list says it is not reported rather than borrowing a green tile, and the
 * note under it is what the site says about that transport today.
 */
const TRANSPORTS: { name: string; match: RegExp; detail?: string }[] = [
  { name: "API", match: /^api/i },
  {
    name: "Worker",
    match: /worker/i,
    detail: "Background jobs run here; a stale worker runs stale code.",
  },
  {
    name: "Beat",
    match: /beat|schedul/i,
    detail: "The scheduler behind journeys and retries.",
  },
  {
    name: "Database",
    match: /database|postgres/i,
    detail: "The API check probes it; there is no separate check yet.",
  },
  { name: "Redis", match: /redis/i },
  {
    name: "Email · transactional",
    match: /transactional/i,
    detail:
      "Sign-in codes, reward notices and exports always send, on every plan.",
  },
  {
    name: "Email · marketing",
    match: /marketing/i,
    detail:
      "Not connected. Campaign email is refused until a campaign sender separate from the transactional one exists.",
  },
  {
    name: "SMS",
    match: /sms/i,
    detail:
      "Stub, no transport. Credits are priced before every send; nothing leaves the platform yet.",
  },
  {
    name: "Push",
    match: /push/i,
    detail: "In-app delivery only. There is no web push.",
  },
  {
    name: "Payments · QR Ph",
    match: /payment|paymongo/i,
    detail:
      "PayMongo webhook not registered. Billing opens with the two flags in Platform settings.",
  },
  {
    name: "Webhook delivery",
    match: /webhook/i,
    detail:
      "Outbound events to merchant endpoints; failures land in the recovery queue.",
  },
];

function TransportTile({
  name,
  service,
  detail,
}: {
  name: string;
  service?: ServiceHealth;
  detail?: string;
}) {
  const degraded = service?.status === "Degraded";
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between">
        <span
          className={`grid size-10 place-items-center rounded-xl ${
            !service
              ? "bg-[var(--surface-2)] text-[var(--muted)]"
              : degraded
                ? "bg-[rgb(178_59_43/12%)] text-[var(--danger)]"
                : "bg-[rgb(15_118_85/12%)] text-[var(--success)]"
          }`}
        >
          {!service ? (
            <CircleAlert size={18} aria-hidden="true" />
          ) : degraded ? (
            <CircleAlert size={18} aria-hidden="true" />
          ) : (
            <Check size={18} aria-hidden="true" />
          )}
        </span>
        <Pill tone={!service ? "neutral" : degraded ? "danger" : "success"}>
          {service ? service.status : "Unreported"}
        </Pill>
      </div>
      <h2 className="mt-7 text-base font-extrabold">{service?.name ?? name}</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
        {service ? "" : "Not reported by the API. "}
        {detail ?? ""}
      </p>
      {service && (
        <div className="mt-4 flex justify-between border-t border-[var(--line)] pt-3 text-xs">
          {/* No "Latency" prefix: this field carries a retry count on the
              webhook card, and the API now sends a string that names itself. */}
          <span className="text-[var(--muted)]">{service.latency}</span>
          <strong>{service.uptime}</strong>
        </div>
      )}
    </article>
  );
}

function OperationsView() {
  const {
    data: services = [],
    isPending,
    error,
    refetch,
    isFetching,
  } = useServices();
  const { recoveryQueue } = useAdminState();
  const claimed = new Set<string>();
  const tiles = TRANSPORTS.map((transport) => {
    const service = services.find(
      (s) => !claimed.has(s.name) && transport.match.test(s.name),
    );
    if (service) claimed.add(service.name);
    return { ...transport, service };
  });
  const unmatched = services.filter((s) => !claimed.has(s.name));
  return (
    <ViewFrame
      eyebrow="System operations"
      title="Delivery & services"
      description="Every transport, with honest status. A tile the API does not report says so; it does not borrow a green light."
      action={
        <Button
          tone="quiet"
          icon={
            <RefreshCcw
              size={16}
              className={isFetching ? "animate-spin" : ""}
            />
          }
          disabled={isFetching}
          onClick={() => refetch()}
        >
          {isFetching ? "Checking…" : "Refresh health"}
        </Button>
      }
    >
      <QueryBoundary
        isPending={isPending}
        error={error}
        onRetry={refetch}
        label="service health"
        rows={4}
      >
        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Service health"
        >
          {tiles.map((tile) => (
            <TransportTile
              key={tile.name}
              name={tile.name}
              service={tile.service}
              detail={tile.detail}
            />
          ))}
          {unmatched.map((service) => (
            <TransportTile
              key={service.name}
              name={service.name}
              service={service}
            />
          ))}
        </section>
        <p className="mt-3 text-[10px] font-semibold text-[var(--muted)]">
          {services.length} check{services.length === 1 ? "" : "s"} reported by
          the API; the rest are the site&apos;s own account of each transport.
        </p>
      </QueryBoundary>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Recovery queue</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">
                {recoveryQueue.length} deliver
                {recoveryQueue.length === 1 ? "y" : "ies"} awaiting replay
              </h2>
            </div>
            <Activity aria-hidden="true" />
          </div>
          <ul className="mt-5 divide-y divide-[var(--line)]">
            {recoveryQueue.slice(0, 6).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-3 text-xs"
              >
                <span className="min-w-0">
                  <code className="block truncate font-extrabold">
                    {item.event}
                  </code>
                  <span className="block truncate text-[var(--muted-strong)]">
                    {item.tenant} · {item.detail}
                  </span>
                </span>
                <Pill tone="neutral">{item.direction}</Pill>
              </li>
            ))}
            {recoveryQueue.length === 0 && (
              <li className="py-4 text-xs font-semibold text-[var(--muted)]">
                Everything has been replayed.
              </li>
            )}
          </ul>
          <a
            href="#integrations"
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-strong)]"
          >
            Replay from Integrations <ArrowRight size={14} aria-hidden="true" />
          </a>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>Incidents</Eyebrow>
          <h2 className="mt-7 text-2xl font-extrabold tracking-[-0.02em]">
            {services.some((s) => s.status === "Degraded")
              ? "A reported check is degraded"
              : "No reported check is degraded"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Queue depth, worker liveness and incident timelines are not reported
            by the API yet; this panel will carry them when they are.
          </p>
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
  const selected =
    tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];
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
      setTicketNote(selected.id, noteDraft, (message) =>
        notify(message, "error"),
      );
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
                <span className="text-xs font-bold">
                  {relativeTime(ticket.openedAt)}
                </span>
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
              <p className="mt-2 text-sm font-extrabold">
                {selected.contactName}
              </p>
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
              {[
                ...new Set([
                  selected.owner,
                  "Unassigned",
                  "Nica",
                  "Mika",
                  "Paolo",
                ]),
              ].map((owner) => (
                <option key={owner}>{owner}</option>
              ))}
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
                updateTicket(selected.id, pending, (message) =>
                  notify(message, "error"),
                );
                notify(`${selected.id} moved to ${status.toLowerCase()}.`);
              }}
            >
              {[...new Set([selected.status, ...TICKET_STATUSES])].map(
                (status) => (
                  <option key={status}>{status}</option>
                ),
              )}
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
                notify(
                  "Add an internal note before starting an investigation.",
                  "error",
                );
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
        <PlatformExportButton
          kind="audit"
          label="Export audit log"
          notify={notify}
        />
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
          <p className="text-sm font-extrabold">
            Append-only by design (planned)
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
            Rows are the API&apos;s. Hashed event chains and signed exports are
            planned; nothing here edits an entry in place.
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
          <p className="p-5 text-sm text-[var(--muted-strong)]">
            Nothing issued yet.
          </p>
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
                  <tr
                    key={invoice.id}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      {invoice.merchantId}
                    </td>
                    <td className="px-4 py-3.5 text-sm">{invoice.period}</td>
                    <td className="px-4 py-3.5 text-sm font-bold">
                      {pesoFromCentavos(invoice.amountCentavos)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Pill
                        tone={invoice.status === "Paid" ? "success" : "warning"}
                      >
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
            {campaigns
              .reduce((sum, campaign) => sum + campaign.sent, 0)
              .toLocaleString()}{" "}
            messages across {campaigns.length} campaign
            {campaigns.length === 1 ? "" : "s"}
          </h2>
        </div>
        {campaigns.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted-strong)]">
            Nothing sent yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {campaigns.slice(0, 8).map((campaign) => (
              <li
                key={campaign.id}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">
                    {campaign.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">
                    {campaign.merchantId}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">
                    {campaign.sent.toLocaleString()}
                  </p>
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
  const {
    data: metrics = EMPTY_PLATFORM_METRICS,
    isPending,
    error,
    refetch,
  } = usePlatformMetrics();
  const { data: planEconomics = [] } = usePlanEconomics();
  const { data: channelEconomics = [] } = useChannelEconomics();
  const { data: tenants = [] } = useTenants();
  const totalPlanMrr = planEconomics.reduce(
    (sum, plan) => sum + plan.mrrCentavos,
    0,
  );
  const totalPlanCost = planEconomics.reduce(
    (sum, plan) => sum + plan.monthlyCostCentavos,
    0,
  );
  const margin = totalPlanMrr
    ? ((totalPlanMrr - totalPlanCost) / totalPlanMrr) * 100
    : 0;
  const foundingCount = tenants.filter((tenant) => tenant.founding).length;
  const foundingExposure =
    foundingCount * FOUNDING.freeMonths * FOUNDING.coreMonthlyCentavos;
  return (
    <ViewFrame
      eyebrow="Sustainable growth"
      title="Revenue & margin"
      description="Plan revenue, channel cost and the margin between them, in pesos. Gross margin counts channel cost only; infrastructure is not modelled."
    >
      <QueryBoundary
        isPending={isPending}
        error={error}
        onRetry={refetch}
        label="platform economics"
        rows={2}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            [
              "Subscription MRR",
              pesoFromCentavos(metrics.monthlyRecurringRevenueCentavos),
              "Only Launch is sellable today",
            ],
            [
              "Gross margin",
              `${metrics.grossMargin}%`,
              "Channel cost only, infrastructure not modelled",
            ],
            [
              "Net revenue retention",
              `${metrics.netRevenueRetention}%`,
              "Against last month's MRR",
            ],
            [
              "SMS credit liability",
              pesoFromCentavos(metrics.smsLiabilityCentavos),
              "Prepaid credits not yet sent",
            ],
            [
              "Founding credit exposure",
              pesoFromCentavos(foundingExposure),
              `Projection: ${foundingCount} founding × ${FOUNDING.freeMonths} months × ${pesoFromCentavos(FOUNDING.coreMonthlyCentavos)} Core`,
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
              <p className="mt-1 text-xs text-[var(--muted-strong)]">
                {detail}
              </p>
            </article>
          ))}
        </div>
      </QueryBoundary>
      <BilledAndSent />
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Plan contribution</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">
              Revenue after channel cost
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-strong)]">
              Margin is channel cost only; infrastructure is not modelled.
            </p>
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
            subscription margin after channel cost
          </p>
          <p className="mt-1 text-xs text-[var(--ink)]/70">
            Channel cost only, infrastructure not modelled.
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
                const contribution =
                  channel.revenueCentavos - channel.costCentavos;
                return (
                  <tr
                    key={channel.name}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-5 py-4 text-sm font-extrabold">
                      {channel.name}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {channel.volume.toLocaleString()} message
                      {channel.volume === 1 ? "" : "s"}
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
                      {/* `peso` on a centavo figure, beside two cells that
                          convert correctly: ₱0.09 of margin printed as ₱9,
                          every row a hundred times too big, in the column a
                          pricing decision is made from. The sign leads, so a
                          loss reads "-₱0.42" rather than "₱-42". */}
                      {contribution < 0 ? "-" : "+"}
                      {pesoFromCentavos(Math.abs(contribution))}
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

  // `shrink-0` so nothing injected into the row can squeeze the box: a flex
  // child shrinks below its width by default, and the attributes below stop
  // the usual culprit rather than relying on that alone.
  const field =
    "min-h-9 w-28 shrink-0 rounded-lg border border-white/15 bg-[var(--ink-soft)] px-2 text-right text-xs font-bold text-white outline-none focus:border-[var(--accent)]";

  /**
   * Keep password managers out of these boxes.
   *
   * "Email complaint pause" is the only label on this card containing the
   * word Email, and a manager classifying fields by their nearby text reads
   * that as an email box: it plants its badge inside the input, which both
   * narrows the visible field and paints a coloured mark in it. One row of
   * five ends up shorter than the rest for a reason nothing in this file
   * explains - the markup is identical, and it renders correctly in a
   * browser with no extensions at every width from 420px up.
   *
   * Every basis point and centavo ceiling on this card is a number, so none
   * of them wants autofill from anything.
   */
  const noAutofill = {
    autoComplete: "off",
    "data-1p-ignore": true,
    "data-lpignore": "true",
    "data-bwignore": true,
    "data-form-type": "other",
  } as const;

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
          <label
            key={key}
            className="flex items-center justify-between gap-4 py-3 text-xs"
          >
            <span className="text-white/50">
              {label}
              <span className="ml-1 text-white/55">({unit})</span>
            </span>
            <input
              type="number"
              value={shown[key]}
              onChange={(event) =>
                setDraft({ ...shown, [key]: Number(event.target.value) })
              }
              className={field}
              {...noAutofill}
            />
          </label>
        ))}
      </div>
      {/* Not a number, so not in the list above. It is here rather than in
          its own card because it is the same thing: a value somebody would
          otherwise need a release to change. This one pointed at a mailbox
          that did not exist, so every demo enquiry and partner application
          notice bounced while the enquiry itself was filed correctly - the
          quietest way to miss a shop asking to join. */}
      <label className="mt-5 grid gap-2">
        <span className="text-xs text-white/50">
          Enquiries and applications go to
          <span className="ml-1 text-white/55">
            (demo enquiries, partner applications)
          </span>
        </span>
        <input
          type="email"
          value={shown.internalInbox ?? ""}
          onChange={(event) =>
            setDraft({ ...shown, internalInbox: event.target.value })
          }
          placeholder="inbox@example.com"
          className="min-h-10 w-full rounded-lg border border-white/15 bg-[var(--ink-soft)] px-3 text-xs font-bold text-white outline-none placeholder:font-normal placeholder:text-white/55 focus:border-[var(--accent)]"
          {...noAutofill}
        />
      </label>

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
            failure instanceof ApiError
              ? failure.message
              : "That export could not be prepared.",
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

/**
 * The two switches that open billing.
 *
 * Both live in the same `/admin/flags` list as the safety defaults; the API
 * writes the audit entry on every flip. Until the API lists them they render
 * off, under a preview badge, and the switch cannot move.
 */
const BILLING_FLAGS = [
  {
    key: "billing.paid_tiers",
    title: "Paid tiers",
    detail:
      "Core, Grow and Scale become purchasable; the business app shows QR Ph payment instead of “not open yet”.",
  },
  {
    key: "billing.credit_purchases",
    title: "Credit purchases",
    detail: "SMS credit bundles and email top-ups can be bought, QR Ph only.",
  },
] as const;

function BillingFlagsCard({ notify }: { notify: Notify }) {
  const { flags, toggleFlag } = useAdminState();
  const { isPending, error, refetch } = usePlatformFlags();
  const anyMissing = BILLING_FLAGS.some((flag) => !(flag.key in flags));
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-5">
        <div>
          <Eyebrow>Billing</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">
            Off through December 2026
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
            Turning a flag on opens billing; no deploy needed. Every flip is an
            audit ledger entry recorded by the API.
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
          <CreditCard size={17} aria-hidden="true" />
        </span>
      </div>
      <div className="p-5">
        <QueryBoundary
          isPending={isPending}
          error={error}
          onRetry={refetch}
          label="billing flags"
          rows={2}
        >
          {BILLING_FLAGS.map((flag, index) => {
            const present = flag.key in flags;
            const enabled = flags[flag.key] ?? false;
            return (
              <div
                key={flag.key}
                className={`flex items-start gap-4 ${index > 0 ? "mt-4 border-t border-[var(--line)] pt-4" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold">{flag.title}</p>
                    <code className="font-mono text-[10px] text-[var(--muted)]">
                      {flag.key}
                    </code>
                    {!present && <PreviewBadge />}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {flag.detail}
                  </p>
                  {!present && (
                    <p className="mt-1 text-[11px] text-[var(--muted-strong)]">
                      {PREVIEW_WRITE_REASON}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label={`Toggle ${flag.title}`}
                  aria-checked={enabled}
                  disabled={!present}
                  title={present ? undefined : PREVIEW_WRITE_REASON}
                  onClick={() => {
                    const next = toggleFlag(flag.key);
                    notify(
                      `${flag.title} ${next ? "on" : "off"}. The API wrote it to the audit ledger.`,
                    );
                  }}
                  className={`relative h-6 w-10 shrink-0 rounded-full disabled:opacity-45 ${enabled ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                >
                  <span
                    className={`absolute top-1 size-4 rounded-full bg-white transition ${enabled ? "left-5" : "left-1"}`}
                  />
                </button>
              </div>
            );
          })}
          {anyMissing && (
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
              A flag the API does not list yet is shown off. It becomes live
              here the day `/admin/flags` returns it; nothing on this page needs
              to change.
            </p>
          )}
        </QueryBoundary>
      </div>
    </section>
  );
}

function SettingsView({ notify }: { notify: Notify }) {
  const {
    data: administrators = [],
    isPending,
    error,
    refetch,
  } = useAdministrators();
  const [reviewOpen, setReviewOpen] = useState(false);
  const signedIn = administrators.filter((person) => person.activeSessions > 0);
  const withoutMfa = administrators.filter((person) => !person.mfaEnabled);
  const { flags, toggleFlag } = useAdminState();
  return (
    <ViewFrame
      eyebrow="Platform configuration"
      title="Platform settings"
      description="Network-wide trust, delivery, billing, retention and privileged-access defaults. Every switch writes on the press; every change enters the audit ledger."
    >
      <div className="grid gap-3 xl:grid-cols-[1fr_0.72fr]">
        <div className="space-y-3">
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
                    <Icon size={17} aria-hidden="true" />
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
                      notify(
                        `${title} ${next ? "enabled" : "disabled"} network-wide.`,
                      );
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
          <BillingFlagsCard notify={notify} />
        </div>
        <aside className="space-y-3">
          <ProviderPolicyCard notify={notify} />
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex gap-3">
              <UserRoundCog
                size={19}
                className="mt-0.5 text-[var(--accent-strong)]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-extrabold">
                  Administrator access review
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                  {administrators.length} administrator
                  {administrators.length === 1 ? "" : "s"} · {signedIn.length}{" "}
                  signed in now ·{" "}
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
              <div className="mt-4">
                <QueryBoundary
                  isPending={isPending}
                  error={error}
                  onRetry={refetch}
                  label="administrators"
                  rows={2}
                >
                  <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
                    {administrators.map((person) => (
                      <li
                        key={person.id}
                        className="flex items-start gap-3 p-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-extrabold">
                            {person.name}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-[var(--muted-strong)]">
                            {person.email}
                          </p>
                          <p className="mt-1 text-[10px] text-[var(--muted)]">
                            {person.activeSessions
                              ? `${person.activeSessions} live session${person.activeSessions === 1 ? "" : "s"}`
                              : "not signed in"}
                            {person.lastSeenAt
                              ? ` · last seen ${relativeTime(person.lastSeenAt)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {/* The two states this review exists to surface. */}
                          <Pill tone={person.isActive ? "success" : "neutral"}>
                            {person.isActive ? "Active" : "Disabled"}
                          </Pill>
                          {!person.mfaEnabled && (
                            <Pill tone="danger">No MFA</Pill>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </QueryBoundary>
              </div>
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
    businesses: <AdminBusinessesView />,
    partners: <PartnerQueueView notify={notify} />,
    people: <PeopleView notify={notify} />,
    operations: <OperationsView />,
    integrations: <AdminIntegrationsView notify={notify} />,
    support: <SupportView notify={notify} />,
    audit: <AuditView notify={notify} />,
    economics: <EconomicsView />,
    addons: <AdminAddOnsView />,
    settings: <SettingsView notify={notify} />,
  };
  return view === "overview" ? null : views[view];
}
