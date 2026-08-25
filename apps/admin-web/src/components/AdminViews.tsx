"use client";

import { useState, type ReactNode } from "react";
import { demoData } from "@stampr/demo-data";
import {
  Button,
  Eyebrow,
  Pill,
  ViewFrame as SharedViewFrame,
} from "@stampr/ui";
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
  Play,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCog,
  Users,
  Webhook,
} from "lucide-react";
import type { AdminView } from "@/components/AdminShell";
import { AdminIntegrationsView } from "@/components/AdminIntegrationsView";

const admin = demoData.admin;
type Notify = (message: string) => void;



function ViewFrame(props: Omit<Parameters<typeof SharedViewFrame>[0], "wide" | "className">) {
  return <SharedViewFrame wide className="admin-grid" {...props} />;
}

function BusinessesView({ notify }: { notify: Notify }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(admin.businesses[0].id);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const filtered = admin.businesses.filter(
    (business) =>
      (business.name.toLowerCase().includes(query.toLowerCase()) ||
        business.city.toLowerCase().includes(query.toLowerCase())) &&
      (!attentionOnly || business.risk !== "Healthy"),
  );
  const selected =
    admin.businesses.find((business) => business.id === selectedId) ??
    admin.businesses[0];
  return (
    <ViewFrame
      eyebrow="Tenant directory"
      title="Businesses"
      description="Review tenant health, subscription, member growth, risk signals, and operational access without crossing customer-data boundaries."
      action={
        <Button
          icon={<Building2 size={16} />}
          onClick={() => notify("Business onboarding review opened.")}
        >
          Review applications
        </Button>
      }
    >
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
                    className={`cursor-pointer border-b border-[var(--line)] outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--accent)] last:border-0 ${selected.id === business.id ? "bg-[rgb(242_161_45/9%)]" : "hover:bg-[var(--paper)]"}`}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-black">{business.name}</p>
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
                    <td className="px-4 py-4 text-sm font-black">
                      ₱{business.mrr.toLocaleString()}
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
            <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)] text-lg font-black text-[var(--ink)]">
              {selected.name
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </span>
            <Pill tone={selected.risk === "Healthy" ? "success" : "warning"}>
              {selected.risk}
            </Pill>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-[-0.04em]">
            {selected.name}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {selected.owner} · {selected.city}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
            {[
              ["Plan", selected.plan],
              ["MRR", `₱${selected.mrr.toLocaleString()}`],
              ["Members", selected.members.toLocaleString()],
              ["Joined", selected.joined],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink-soft)] p-4">
                <p className="text-[10px] text-white/50">{label}</p>
                <p className="mt-1 text-sm font-black">{value}</p>
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
                Support access requires a reason, expires after 30 minutes, and
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
  return (
    <ViewFrame
      eyebrow="Network people"
      title="People & privacy"
      description="Monitor aggregate account health and data-subject requests. Platform staff never browse customer profiles without a scoped support or trust reason."
      action={
        <Button
          tone="quiet"
          icon={<Download size={16} />}
          onClick={() => notify("Privacy operations report prepared.")}
        >
          Export privacy report
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["Customer accounts", "18,492", "+824 this month", Users],
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
              <p className="mt-7 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--muted)]">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black">{value}</p>
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
              <h2 className="mt-1 text-lg font-black">Active work</h2>
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
                  <p className="text-sm font-black">{request}</p>
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
          <h2 className="mt-8 max-w-[12ch] text-3xl font-black tracking-[-0.05em]">
            Rights are operational workflows.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]/80">
            Access, correction, objection, portability, deletion, complaint, and
            damage claims each need evidence, deadlines, ownership, and an
            immutable completion record.
          </p>
          <button
            type="button"
            onClick={() => notify("Privacy workflow playbook opened.")}
            className="mt-7 inline-flex items-center gap-2 text-xs font-black"
          >
            Open privacy playbook <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </ViewFrame>
  );
}

function OperationsView({ notify }: { notify: Notify }) {
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
        {admin.services.map((service) => (
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
            <h2 className="mt-7 text-base font-black">{service.name}</h2>
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
              <h2 className="mt-1 text-lg font-black">Backlog by job type</h2>
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
          <h2 className="mt-7 text-2xl font-black tracking-[-0.04em]">
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
          <Button
            tone="accent"
            className="mt-6"
            icon={<Play size={15} />}
            onClick={() => notify("Incident runbook opened.")}
          >
            Open runbook
          </Button>
        </section>
      </div>
    </ViewFrame>
  );
}

function SupportView({ notify }: { notify: Notify }) {
  const [selectedId, setSelectedId] = useState(admin.support[0].id);
  const selected =
    admin.support.find((ticket) => ticket.id === selectedId) ??
    admin.support[0];
  return (
    <ViewFrame
      eyebrow="Human support"
      title="Support queue"
      description="Triage trust, access, messaging, fraud, and privacy work with clear ownership and audited resolution steps."
      action={
        <Button
          tone="quiet"
          icon={<SlidersHorizontal size={16} />}
          onClick={() => notify("Support queue rules opened for review.")}
        >
          Queue rules
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.7fr)]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>Open work</Eyebrow>
            <Pill tone="danger">7 open</Pill>
          </div>
          <div className="mt-4 divide-y divide-[var(--line)]">
            {admin.support.map((ticket) => (
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
                  <span className="block text-sm font-black">
                    {ticket.title}
                  </span>
                  <span className="mt-1 block text-[10px]">
                    {ticket.business} · {ticket.category} · {ticket.owner}
                  </span>
                </span>
                <span className="text-xs font-bold">{ticket.age}</span>
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
          <h2 className="mt-6 text-2xl font-black tracking-[-0.04em]">
            {selected.title}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {selected.business} · {selected.category}
          </p>
          <div className="mt-7 rounded-2xl bg-white/6 p-4">
            <p className="text-xs font-black">Recommended next step</p>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              Verify the requester and event scope, request time-limited support
              access when needed, then record the decision and customer-facing
              explanation.
            </p>
          </div>
          <label className="mt-5 grid gap-2 text-xs font-bold">
            Assign to
            <select className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3">
              <option>{selected.owner}</option>
              <option>Nica</option>
              <option>Mika</option>
              <option>Paolo</option>
            </select>
          </label>
          <label className="mt-4 grid gap-2 text-xs font-bold">
            Internal note
            <textarea
              rows={4}
              className="rounded-xl border border-white/15 bg-[var(--ink-soft)] p-3 outline-none"
              placeholder="Record evidence and the next decision"
            />
          </label>
          <Button
            tone="accent"
            className="mt-5 w-full"
            onClick={() => notify(`${selected.id} moved to investigating.`)}
          >
            Start investigation
          </Button>
        </aside>
      </div>
    </ViewFrame>
  );
}

function AuditView({ notify }: { notify: Notify }) {
  return (
    <ViewFrame
      eyebrow="Privileged action ledger"
      title="Audit ledger"
      description="Every admin access, change, reversal, replay, export, and automated safeguard is recorded for accountability."
      action={
        <Button
          tone="quiet"
          icon={<Download size={16} />}
          onClick={() => notify("Signed audit export prepared.")}
        >
          Export signed log
        </Button>
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
              {admin.audit.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-black">{event.actor}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {event.role}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm">{event.action}</td>
                  <td className="px-4 py-4 text-xs font-bold">
                    {event.target}
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">
                    {event.time}
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
          <p className="text-sm font-black">Append-only by design</p>
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

function EconomicsView() {
  const totalPlanMrr = admin.economics.plans.reduce(
    (sum, plan) => sum + plan.mrr,
    0,
  );
  const totalPlanCost = admin.economics.plans.reduce(
    (sum, plan) => sum + plan.monthlyCost,
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
            `₱${admin.metrics.monthlyRecurringRevenue.toLocaleString()}`,
            "+8.4%",
          ],
          [
            "Blended gross margin",
            `${admin.metrics.grossMargin}%`,
            "Target ≥ 75%",
          ],
          [
            "Net revenue retention",
            `${admin.metrics.netRevenueRetention}%`,
            "Expansion healthy",
          ],
          [
            "SMS credit liability",
            `₱${admin.metrics.smsLiability.toLocaleString()}`,
            "Prepaid reserve",
          ],
        ].map(([label, value, detail]) => (
          <article
            key={label}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-5 text-2xl font-black tracking-[-0.05em]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-strong)]">{detail}</p>
          </article>
        ))}
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Plan contribution</Eyebrow>
            <h2 className="mt-1 text-lg font-black">
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
                {admin.economics.plans.map((plan) => (
                  <tr
                    key={plan.name}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-5 py-4 text-sm font-black">
                      {plan.name}
                    </td>
                    <td className="px-4 py-4 text-sm">{plan.accounts}</td>
                    <td className="px-4 py-4 text-sm font-bold">
                      ₱{plan.mrr.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      ₱{plan.monthlyCost.toLocaleString()}
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
          <p className="mt-7 text-4xl font-black tracking-[-0.06em]">
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
            <p className="text-xs font-black">
              Rule: variable channels stay variable
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
              SMS is prepaid at ₱0.95 per segment. Email overages are ₱25 per
              1,000. Connected channels pass through provider cost plus
              orchestration.
            </p>
          </div>
        </section>
      </div>
      <section className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-5">
          <Eyebrow>Channel unit economics</Eyebrow>
          <h2 className="mt-1 text-lg font-black">
            Delivery volume, revenue, and cost
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <tbody>
              {admin.economics.channels.map((channel) => {
                const contribution = channel.revenue - channel.cost;
                return (
                  <tr
                    key={channel.name}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-5 py-4 text-sm font-black">
                      {channel.name}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {channel.volume.toLocaleString()} messages
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                      {channel.model}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      ₱{channel.revenue.toLocaleString()} revenue
                    </td>
                    <td className="px-4 py-4 text-sm">
                      ₱{channel.cost.toLocaleString()} cost
                    </td>
                    <td
                      className={`px-4 py-4 text-sm font-black ${contribution >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                    >
                      {contribution >= 0 ? "+" : ""}₱
                      {contribution.toLocaleString()}
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

function SettingsView({ notify }: { notify: Notify }) {
  const [flags, setFlags] = useState({
    automaticPausing: true,
    publicStatus: true,
    newTenantReview: true,
    adminMfa: true,
  });
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
            <h2 className="mt-1 text-lg font-black">
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
                  <p className="text-sm font-black">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {detail}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() =>
                    setFlags((current) => ({ ...current, [key]: !enabled }))
                  }
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
          <article className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
            <div className="flex items-center justify-between">
              <Eyebrow>Provider policies</Eyebrow>
              <Webhook size={19} className="text-[var(--accent)]" />
            </div>
            <div className="mt-6 divide-y divide-white/12 border-y border-white/12">
              {[
                ["SMS ceiling", "₱50,000 / tenant"],
                ["Email complaint pause", "0.08%"],
                ["Webhook retry window", "72 hours"],
                ["Offline replay window", "7 days"],
                ["Audit retention", "7 years"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 py-3 text-xs"
                >
                  <span className="text-white/50">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => notify("Provider policy editor opened.")}
              className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[var(--accent)]"
            >
              Edit provider policies <ArrowRight size={14} />
            </button>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex gap-3">
              <UserRoundCog
                size={19}
                className="mt-0.5 text-[var(--accent-strong)]"
              />
              <div>
                <p className="text-sm font-black">
                  Administrator access review
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                  12 administrators · 2 elevated roles · next quarterly review
                  in 18 days.
                </p>
              </div>
            </div>
            <Button
              tone="quiet"
              className="mt-5"
              onClick={() => notify("Administrator access review opened.")}
            >
              Review access
            </Button>
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
