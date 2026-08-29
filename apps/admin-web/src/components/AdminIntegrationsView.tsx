"use client";

import { useState } from "react";
import { admin, sharedScenario } from "@kypstamping/demo-data";
import type { AdapterStatus, ConnectionHealth } from "@kypstamping/demo-data";
import { Button, Eyebrow, Panel } from "@kypstamping/ui";
import { useAdminState } from "@/components/AdminState";
import {
  Activity,
  BadgeCheck,
  Building2,
  ChevronRight,
  Clock3,
  Code2,
  Filter,
  KeyRound,
  PlugZap,
  RefreshCcw,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  SquareTerminal,
  Store,
  TestTube2,
  Webhook,
} from "lucide-react";
import type { NotifyIntent } from "@kypstamping/ui/shell";

type Notify = (message: string, intent?: NotifyIntent) => void;

/** Icon per adapter id. Everything else about an adapter is fixture data now,
 *  so the connection counts and the environment switch agree. */
const adapterIcons: Record<string, typeof SquareTerminal> = {
  sidecar: SquareTerminal,
  "custom-api": Code2,
  "pos-webhook": Store,
  "pos-pull": PlugZap,
  "ecommerce-webhook": Building2,
};

function Status({ value }: { value: AdapterStatus | ConnectionHealth }) {
  const classes: Record<AdapterStatus | ConnectionHealth, string> = {
    Available: "bg-[rgb(15_118_85/12%)] text-[var(--success)]",
    Healthy: "bg-[rgb(15_118_85/12%)] text-[var(--success)]",
    Pilot: "bg-[rgb(232_163_61/16%)] text-[var(--accent-strong)]",
    Approval: "bg-[rgb(232_163_61/16%)] text-[var(--accent-strong)]",
    Attention: "bg-[rgb(178_59_43/12%)] text-[var(--danger)]",
    Sandbox: "bg-[var(--surface-2)] text-[var(--muted-strong)]",
    Planned: "bg-[var(--surface-2)] text-[var(--muted-strong)]",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${classes[value]}`}
    >
      {value}
    </span>
  );
}

export function AdminIntegrationsView({ notify }: { notify: Notify }) {
  const { environment, setEnvironment, recoveryQueue, replayRecovery } =
    useAdminState();
  const [statusFilter, setStatusFilter] = useState<"All" | AdapterStatus>("All");
  const [replaying, setReplaying] = useState(false);
  const visibleAdapters = admin.adapters.filter(
    (adapter) => statusFilter === "All" || adapter.status === statusFilter,
  );

  /** The environment switch used to change two headline numbers while the
   *  adapter registry and tenant table stayed on production data. */
  const isSandbox = environment === "sandbox";
  const connectionsFor = (adapter: (typeof admin.adapters)[number]) =>
    isSandbox ? adapter.connectedSandbox : adapter.connected;
  const activeConnections = admin.adapters.reduce(
    (sum, adapter) => sum + connectionsFor(adapter),
    0,
  );
  const visibleConnections = isSandbox
    ? admin.tenantConnections.filter((row) => row.health === "Sandbox")
    : admin.tenantConnections;

  function replayFailed() {
    if (recoveryQueue.length === 0) return;
    setReplaying(true);
    const queued = replayRecovery();
    notify(
      `${queued} webhook deliver${queued === 1 ? "y" : "ies"} moved into the replay queue.`,
    );
    window.setTimeout(() => setReplaying(false), 800);
  }

  return (
    <main className="admin-grid min-h-[calc(100dvh-68px)] px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Connection control</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Integrations
            </h1>
            <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              Govern adapters, tenant credentials, webhook delivery, and provider
              readiness without exposing customer payloads or plaintext secrets.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(143_85_16/28%)] bg-[rgb(232_163_61/13%)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[var(--accent-strong)]">
            <TestTube2 size={13} /> Demo control data
          </span>
        </header>

        <section className="mt-6 overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-7">
          <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em]">
                  <Activity size={12} className="text-[var(--accent)]" /> Event fabric
                </span>
                <span className="text-xs font-semibold text-white/50">/api/v1 · worker online</span>
              </div>
              <h2 className="mt-6 max-w-2xl text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
                One contract. Isolated adapters. Recoverable delivery.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/62">
                Provider-specific behavior stops at the adapter boundary. Loyalty
                rules, ledger entries, idempotency, and tenant authorization stay consistent.
              </p>
            </div>
            <div
              className="inline-grid grid-cols-2 rounded-full border border-white/15 bg-white/7 p-1"
              aria-label="Platform integration environment"
            >
              {(["sandbox", "production"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={environment === item}
                  onClick={() => {
                    setEnvironment(item);
                    notify(
                      `${item === "sandbox" ? "Sandbox" : "Production preview"} integration data selected.`,
                    );
                  }}
                  className={`min-h-10 rounded-full px-4 text-xs font-extrabold capitalize ${
                    environment === item
                      ? "bg-[var(--accent)] text-[var(--ink)]"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-7 grid gap-px overflow-hidden rounded-2xl bg-white/12 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Active connections", activeConnections.toLocaleString("en-PH")],
              [
                "Events · 24 hours",
                (isSandbox ? 4218 : 36036).toLocaleString("en-PH"),
              ],
              ["Duplicate-safe", "99.98%"],
              ["Delivery p95", "284 ms"],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink)] p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/55">
                  {label}
                </p>
                <p className="mt-2 text-xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <Panel className="mt-3 overflow-hidden">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-10 place-items-center rounded-2xl bg-[rgb(15_118_85/10%)] text-[var(--success)]">
                  <BadgeCheck size={18} />
                </span>
                <div>
                  <Eyebrow>Observed shared event</Eyebrow>
                  <code className="mt-1 block text-xs font-extrabold">
                    {sharedScenario.loyaltyEvent.id}
                  </code>
                </div>
              </div>
              <p className="mt-4 max-w-[48ch] text-xs leading-relaxed text-[var(--muted-strong)]">
                The same recorded visit shown in the customer wallet and business
                ledger is visible here as operational metadata—without exposing a
                message body, QR token, or plaintext credential.
              </p>
            </div>
            <dl className="grid gap-px overflow-hidden rounded-2xl bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Tenant", sharedScenario.business],
                ["Event", sharedScenario.loyaltyEvent.type],
                ["Effect", `${sharedScenario.loyaltyEvent.effect} · ${sharedScenario.loyaltyEvent.after}`],
                ["Delivery", sharedScenario.loyaltyEvent.status],
              ].map(([term, description]) => (
                <div key={term} className="bg-[var(--surface-2)] p-4">
                  <dt className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--muted-strong)]">
                    {term}
                  </dt>
                  <dd className="mt-2 break-words text-xs font-extrabold">
                    {description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--line)] bg-[var(--surface-2)] px-5 py-3 font-mono text-[9px] font-bold text-[var(--muted-strong)] sm:px-6">
            <span>REQUEST {sharedScenario.delivery.requestId}</span>
            <span>IDEMPOTENCY {sharedScenario.delivery.idempotencyKey}</span>
            <span>{sharedScenario.loyaltyEvent.occurredAt}</span>
          </div>
        </Panel>

        <Panel className="mt-3 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div>
              <Eyebrow>Adapter registry</Eyebrow>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
                Supported connection paths
              </h2>
              <p className="mt-2 text-xs text-[var(--muted-strong)]">
                Status labels distinguish usable paths from pilots, approvals, and plans.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Filter adapter status">
              {(["All", "Available", "Pilot", "Approval", "Planned"] as const).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={statusFilter === status}
                    onClick={() => setStatusFilter(status)}
                    className={`min-h-9 rounded-full px-3 text-[10px] font-extrabold ${
                      statusFilter === status
                        ? "bg-[var(--ink)] text-[var(--paper)]"
                        : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted-strong)]"
                    }`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5">
            {visibleAdapters.map((adapter, index) => {
              const Icon = adapterIcons[adapter.id] ?? PlugZap;
              return (
                <button
                  key={adapter.id}
                  type="button"
                  onClick={() => notify(`${adapter.name} adapter record opened.`, "review")}
                  className={`group min-h-64 p-5 text-left transition hover:bg-[var(--surface-2)] ${
                    index > 0 ? "border-t border-[var(--line)] sm:border-l sm:border-t-0" : ""
                  } ${index === 2 || index === 4 ? "sm:border-t xl:border-t-0" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface-2)]">
                      <Icon size={19} />
                    </span>
                    <Status value={adapter.status} />
                  </div>
                  <p className="mt-7 text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--accent-strong)]">
                    {adapter.category}
                  </p>
                  <h3 className="mt-1 text-sm font-extrabold">{adapter.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {adapter.detail}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.09em]">
                    {connectionsFor(adapter)} connections <ChevronRight size={13} />
                  </span>
                </button>
              );
            })}
          </div>
          {visibleAdapters.length === 0 && (
            <div className="p-10 text-center">
              <Filter className="mx-auto text-[var(--muted)]" />
              <p className="mt-3 text-sm font-extrabold">No adapters match this status.</p>
            </div>
          )}
        </Panel>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-5 sm:p-6">
              <div>
                <Eyebrow>Tenant connections</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold">Health without secret access</h2>
              </div>
              <KeyRound size={19} className="text-[var(--accent-strong)]" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    <th className="px-5 py-3">Business</th>
                    <th className="px-4 py-3">Connection</th>
                    <th className="px-4 py-3">Branches</th>
                    <th className="px-4 py-3">Credential posture</th>
                    <th className="px-4 py-3">Events · 30d</th>
                    <th className="px-4 py-3">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleConnections.map((connection) => (
                    <tr
                      key={connection.businessId}
                      className="border-b border-[var(--line)] last:border-0"
                    >
                      <td className="px-5 py-4 text-sm font-extrabold">{connection.business}</td>
                      <td className="px-4 py-4 text-xs font-bold">{connection.adapter}</td>
                      <td className="px-4 py-4 text-xs">{connection.branches}</td>
                      <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                        {connection.credential}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold">
                        {connection.events.toLocaleString("en-PH")}
                      </td>
                      <td className="px-4 py-4"><Status value={connection.health} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleConnections.length === 0 && (
                <p className="p-8 text-center text-xs font-semibold text-[var(--muted)]">
                  No tenant is connected in the sandbox right now.
                </p>
              )}
            </div>
            <p className="border-t border-[var(--line)] px-5 py-3 text-[10px] font-semibold text-[var(--muted)] sm:px-6">
              Showing {visibleConnections.length} of {activeConnections} connections.
            </p>
          </Panel>

          <div className="space-y-3">
            <section className="rounded-2xl bg-[var(--accent)] p-6">
              <div className="flex items-center justify-between">
                <Eyebrow>Recovery queue</Eyebrow>
                <Webhook size={20} />
              </div>
              <p className="mt-7 text-4xl font-extrabold tracking-[-0.03em]">
                {recoveryQueue.length}
              </p>
              <p className="mt-1 text-sm font-extrabold">
                {recoveryQueue.length === 1 ? "delivery needs" : "deliveries need"} replay
              </p>
              <div className="mt-5 divide-y divide-[rgb(24_18_12/14%)] border-y border-[rgb(24_18_12/14%)]">
                {recoveryQueue.map((item) => (
                  <div key={item.id} className="py-3">
                    <code className="text-[10px] font-extrabold">{item.event}</code>
                    <p className="mt-1 text-[10px] text-[var(--ink)]/85">
                      {item.tenant} · {item.detail}
                    </p>
                  </div>
                ))}
                {recoveryQueue.length === 0 && (
                  <p className="py-4 text-[11px] font-bold text-[var(--ink)]/80">
                    Everything has been queued for replay.
                  </p>
                )}
              </div>
              <Button
                className="mt-5"
                icon={replaying ? <RefreshCcw size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                disabled={replaying || recoveryQueue.length === 0}
                onClick={replayFailed}
              >
                {replaying
                  ? "Queueing replay…"
                  : recoveryQueue.length === 0
                    ? "Nothing to replay"
                    : "Replay failed events"}
              </Button>
            </section>

            <Panel className="p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[var(--success)]" />
                <div>
                  <p className="text-sm font-extrabold">Credential boundary intact</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                    Platform staff see scopes, age, actor, and health—not plaintext
                    secrets or customer event payloads.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-3 grid gap-3 pb-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: BadgeCheck,
              title: "Signed ingress",
              detail: "Planned: timestamped HMAC, replay window, and stable provider event ID.",
            },
            {
              icon: RefreshCcw,
              title: "Idempotent commands",
              detail: "Duplicate sales and redemptions return the first safe result.",
            },
            {
              icon: Clock3,
              title: "Recoverable egress",
              detail: "Exponential retry, delivery evidence, and manual replay controls.",
            },
            {
              icon: ServerCog,
              title: "Adapter isolation",
              detail: "Provider change never rewrites the loyalty ledger or reward rules.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <Icon size={18} className="text-[var(--accent-strong)]" />
                <h2 className="mt-6 text-sm font-extrabold">{item.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                  {item.detail}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
