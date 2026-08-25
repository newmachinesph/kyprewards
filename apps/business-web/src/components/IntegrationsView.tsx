"use client";

import { useState, type ReactNode } from "react";
import { demoData } from "@stampr/demo-data";
import { Button, DemoBadge, Eyebrow, FieldLabel, Panel } from "@stampr/ui";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  PlugZap,
  RefreshCcw,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  SquareTerminal,
  Store,
  TestTube2,
  TriangleAlert,
  Webhook,
  X,
} from "lucide-react";
import type { BusinessView } from "@/components/BusinessShell";

type Notify = (message: string) => void;
type Environment = "sandbox" | "production";
type CredentialStatus = "Active" | "Revoked";
type DeliveryStatus = "Delivered" | "Ignored safely" | "Retrying" | "Failed";

type Credential = {
  id: string;
  label: string;
  clientKey: string;
  branch: string;
  scopes: string[];
  lastUsed: string;
  status: CredentialStatus;
};

type Delivery = {
  id: string;
  event: string;
  source: string;
  status: DeliveryStatus;
  detail: string;
  requestId: string;
};

const scopeOptions = [
  { id: "customers:read", label: "Read customers" },
  { id: "transactions:write", label: "Write transactions" },
  { id: "rewards:read", label: "Read rewards" },
  { id: "redemptions:write", label: "Commit redemptions" },
];

const connectionOptions = [
  {
    id: "sidecar",
    name: "KYPStamping terminal",
    icon: SquareTerminal,
    eyebrow: "No POS changes",
    description: "Scan, earn, and redeem beside any register, with an offline-safe queue.",
    availability: "Ready now",
  },
  {
    id: "custom",
    name: "Custom API",
    icon: Code2,
    eyebrow: "For developers",
    description: "Send normalized sales, refunds, and redemption events directly to KYPStamping.",
    availability: "Sandbox ready",
  },
  {
    id: "mosaic",
    name: "Mosaic POS",
    icon: Store,
    eyebrow: "Provider adapter",
    description: "Preview the mapped setup while commercial API access is being approved.",
    availability: "Approval required",
  },
  {
    id: "storehub",
    name: "StoreHub",
    icon: PlugZap,
    eyebrow: "Provider adapter",
    description: "Prepare branch mapping and credentials before provider authorization.",
    availability: "Approval required",
  },
] as const;

const initialCredentials: Credential[] = [
  {
    id: "key_counter_01",
    label: "Main counter",
    clientKey: "st_test_sc_7K9P2D4M",
    branch: "Legazpi Village",
    scopes: ["customers:read", "transactions:write", "rewards:read"],
    lastUsed: "18 seconds ago",
    status: "Active",
  },
  {
    id: "key_staging_02",
    label: "Developer staging",
    clientKey: "st_test_sc_1H3F8W6Q",
    branch: "All sandbox branches",
    scopes: ["customers:read", "transactions:write", "rewards:read", "redemptions:write"],
    lastUsed: "Yesterday, 4:18 PM",
    status: "Active",
  },
];

const initialDeliveries: Delivery[] = [
  {
    id: "evt_01J7SC10482",
    event: "loyalty.transaction.completed",
    source: "Mosaic sandbox",
    status: "Delivered",
    detail: "202 ms · Today, 9:42 AM",
    requestId: "req_7G2K9P",
  },
  {
    id: "evt_01J7SC10481",
    event: "loyalty.transaction.completed",
    source: "Mosaic sandbox",
    status: "Ignored safely",
    detail: "Duplicate event · Today, 9:41 AM",
    requestId: "req_6Q1M3A",
  },
  {
    id: "evt_01J7SC10477",
    event: "reward.redeemed",
    source: "Sweet Crumbs endpoint",
    status: "Retrying",
    detail: "Attempt 2 of 8 · Next retry in 48s",
    requestId: "req_4D8V2N",
  },
  {
    id: "evt_01J7SC10463",
    event: "customer.updated",
    source: "Sweet Crumbs endpoint",
    status: "Failed",
    detail: "HTTP 503 · Yesterday, 6:14 PM",
    requestId: "req_2L5R7C",
  },
];


function StatusBadge({ status }: { status: DeliveryStatus | CredentialStatus }) {
  const classes = {
    Active: "bg-[rgb(15_118_85/12%)] text-[var(--success)]",
    Revoked: "bg-[var(--surface-2)] text-[var(--muted-strong)]",
    Delivered: "bg-[rgb(15_118_85/12%)] text-[var(--success)]",
    "Ignored safely": "bg-[rgb(36_29_25/8%)] text-[var(--ink-soft)]",
    Retrying: "bg-[rgb(242_161_45/16%)] text-[var(--accent-strong)]",
    Failed: "bg-[rgb(178_59_43/12%)] text-[var(--danger)]",
  } as const;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${classes[status]}`}
    >
      {status}
    </span>
  );
}

export function IntegrationsView({
  notify,
  onNavigate,
}: {
  notify: Notify;
  onNavigate: (view: BusinessView) => void;
}) {
  const [environment, setEnvironment] = useState<Environment>("sandbox");
  const [connection, setConnection] = useState<(typeof connectionOptions)[number]["id"]>(
    "sidecar",
  );
  const [credentials, setCredentials] =
    useState<Credential[]>(initialCredentials);
  const [keyLabel, setKeyLabel] = useState("Main counter backup");
  const [branchScope, setBranchScope] = useState("Legazpi Village");
  const [selectedScopes, setSelectedScopes] = useState([
    "customers:read",
    "transactions:write",
    "rewards:read",
  ]);
  const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);
  const [inboundSecret, setInboundSecret] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState(
    "https://pos.sweetcrumbs.ph/webhooks/stampr",
  );
  const [subscribedEvents, setSubscribedEvents] = useState([
    "loyalty.transaction.completed",
    "reward.redeemed",
  ]);
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [testSending, setTestSending] = useState(false);

  const keyPrefix = environment === "sandbox" ? "st_test" : "st_live_demo";
  const secretPrefix = environment === "sandbox" ? "sk_test" : "sk_live_demo";
  const providerSlug = connection === "sidecar" ? "terminal" : connection;
  const inboundUrl = `https://api.kypstamping.ph/api/v1/integrations/${providerSlug}/webhook`;
  const quickstart = `curl --request POST \\
  --url https://api.kypstamping.ph/api/v1/transactions \\
  --header 'Authorization: Bearer ${secretPrefix}_••••••••' \\
  --header 'Idempotency-Key: sale_sc_10482' \\
  --header 'X-Merchant-ID: mrc_sweet_crumbs' \\
  --data '{
    "external_transaction_id": "SC-10482",
    "customer_phone": "+639171234567",
    "branch_id": "br_legazpi",
    "amount": 48500,
    "currency": "PHP"
  }'`;

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify(`${label} copied.`);
    } catch {
      notify(`${label} is selected for this local demo.`);
    }
  }

  function chooseEnvironment(next: Environment) {
    setEnvironment(next);
    setOneTimeSecret(null);
    setInboundSecret(null);
    notify(
      `${next === "sandbox" ? "Sandbox" : "Production preview"} selected. No live connection was changed.`,
    );
  }

  function toggleScope(scope: string) {
    setSelectedScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope],
    );
  }

  function createCredential() {
    if (!keyLabel.trim()) {
      notify("Add a key name before creating the sample credential.");
      return;
    }
    if (selectedScopes.length === 0) {
      notify("Choose at least one permission scope.");
      return;
    }
    const suffix = String(credentials.length + 3).padStart(2, "0");
    const clientKey = `${keyPrefix}_sc_9N4C6X${suffix}`;
    setCredentials((current) => [
      {
        id: `key_demo_${suffix}`,
        label: keyLabel.trim(),
        clientKey,
        branch: branchScope,
        scopes: selectedScopes,
        lastUsed: "Never used",
        status: "Active",
      },
      ...current,
    ]);
    setOneTimeSecret(`${secretPrefix}_sample_4K8P2M7Q${suffix}`);
    notify("Sample credential created. Copy the demo secret from the one-time panel.");
  }

  function rotateCredential() {
    setOneTimeSecret(`${secretPrefix}_rotated_8R2N6V4C`);
    notify("Sample secret rotated. The previous demo secret is now treated as invalid.");
  }

  function revokeCredential(id: string, label: string) {
    setCredentials((current) =>
      current.map((credential) =>
        credential.id === id
          ? { ...credential, status: "Revoked" as const }
          : credential,
      ),
    );
    notify(`${label} revoked in this demo.`);
  }

  function toggleEvent(eventName: string) {
    setSubscribedEvents((current) =>
      current.includes(eventName)
        ? current.filter((item) => item !== eventName)
        : [...current, eventName],
    );
  }

  function sendTestWebhook() {
    if (!webhookUrl.startsWith("https://")) {
      notify("Use an HTTPS destination before sending a sample webhook.");
      return;
    }
    if (subscribedEvents.length === 0) {
      notify("Select at least one outbound event.");
      return;
    }
    setTestSending(true);
    notify("Sending a signed sample delivery…");
    window.setTimeout(() => {
      setDeliveries((current) => [
        {
          id: `evt_demo_test_${Date.now().toString().slice(-6)}`,
          event: "endpoint.test",
          source: "Sweet Crumbs endpoint",
          status: "Delivered",
          detail: "184 ms · Just now",
          requestId: "req_demo_9P4K2M",
        },
        ...current,
      ]);
      setTestSending(false);
      notify("Sample webhook delivered successfully in demo mode.");
    }, 650);
  }

  function retryDelivery(id: string) {
    setDeliveries((current) =>
      current.map((delivery) =>
        delivery.id === id
          ? {
              ...delivery,
              status: "Retrying" as const,
              detail: "Manual retry queued · Just now",
            }
          : delivery,
      ),
    );
    notify("Sample delivery moved to the retry queue.");
  }

  return (
    <main className="mx-auto min-h-[calc(100dvh-64px)] max-w-[1400px] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Connect your counter</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            POS & API integrations
          </h1>
          <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            Choose how sales reach KYPStamping, issue least-privilege keys, sign webhooks,
            and trace every event without tying loyalty to one POS vendor.
          </p>
        </div>
        <DemoBadge />
      </header>

      <section className="ticket-edge mt-6 overflow-hidden rounded-2xl px-5 py-6 text-[var(--paper)] sm:px-7">
        <div className="grid gap-7 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em]">
                <CircleDot size={12} className="text-[var(--accent)]" /> Sweet Crumbs
              </span>
              <span className="text-xs font-semibold text-white/60">
                Planned API base · /api/v1
              </span>
            </div>
            <h2 className="mt-6 max-w-2xl text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
              Your integration boundary, visible at a glance.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
              Demo values below are safe placeholders. Real client secrets will be
              created once, hashed by the API, and never returned again.
            </p>
          </div>
          <div
            className="inline-grid grid-cols-2 rounded-full border border-white/15 bg-white/7 p-1"
            aria-label="Integration environment"
          >
            {(["sandbox", "production"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={environment === item}
                onClick={() => chooseEnvironment(item)}
                className={`min-h-10 rounded-full px-4 text-xs font-extrabold capitalize transition ${
                  environment === item
                    ? "bg-[var(--accent)] text-[var(--ink)]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item === "production" ? "Production preview" : item}
              </button>
            ))}
          </div>
        </div>
        <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl bg-white/12 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Organization", "org_santos_foods"],
            ["Merchant", "mrc_sweet_crumbs"],
            ["Branch access", "3 branches"],
            ["Environment", environment === "sandbox" ? "Sandbox · test data" : "Preview only · not live"],
          ].map(([term, detail]) => (
            <div key={term} className="bg-[var(--ink)] px-4 py-4">
              <dt className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/45">
                {term}
              </dt>
              <dd className="mt-1 break-all font-mono text-xs font-bold text-white/90">
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Panel className="mt-3 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <Eyebrow>01 · Connection method</Eyebrow>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
              Start with the register you have
            </h2>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-[var(--muted)]">
            Provider cards are setup previews—not claims of a live or approved integration.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {connectionOptions.map((option, index) => {
            const Icon = option.icon;
            const active = connection === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setConnection(option.id);
                  notify(`${option.name} is now the active connection in this demo.`);
                }}
                className={`min-h-64 p-5 text-left transition focus-visible:z-10 ${
                  index > 0 ? "border-t border-[var(--line)] sm:border-t-0 sm:border-l" : ""
                } ${index === 2 ? "sm:border-t xl:border-t-0" : ""} ${
                  active ? "bg-[var(--ink)] text-[var(--paper)]" : "hover:bg-[var(--surface-2)]"
                }`}
              >
                <span
                  className={`grid size-11 place-items-center rounded-2xl ${
                    active ? "bg-white/12" : "bg-[var(--surface-2)]"
                  }`}
                >
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span
                  className={`mt-7 block text-[9px] font-extrabold uppercase tracking-[0.12em] ${
                    active ? "text-[var(--accent)]" : "text-[var(--accent-strong)]"
                  }`}
                >
                  {option.eyebrow}
                </span>
                <span className="mt-1 block text-base font-extrabold">{option.name}</span>
                <span
                  className={`mt-2 block text-xs leading-relaxed ${
                    active ? "text-white/60" : "text-[var(--muted-strong)]"
                  }`}
                >
                  {option.description}
                </span>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.09em]">
                  {active ? <CheckCircle2 size={13} /> : <ArrowRight size={13} />}
                  {active ? "Selected" : option.availability}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.18fr_0.82fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--line)] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Eyebrow>02 · Machine access</Eyebrow>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
                  API credentials
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgb(15_118_85/10%)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--success)]">
                <ShieldCheck size={13} /> Least privilege
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--muted-strong)]">
              Use a different key per terminal or server. Branch and action scopes make
              a leaked credential less useful.
            </p>
          </div>

          <div className="grid gap-4 border-b border-[var(--line)] bg-[var(--paper)] p-5 sm:grid-cols-2 sm:p-6">
            <label>
              <FieldLabel>Key name</FieldLabel>
              <input
                value={keyLabel}
                onChange={(event) => setKeyLabel(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm font-semibold"
              />
            </label>
            <label>
              <FieldLabel>Branch scope</FieldLabel>
              <select
                value={branchScope}
                onChange={(event) => setBranchScope(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm font-semibold"
              >
                {demoData.business.locations.map((location) => (
                  <option key={location.id}>{location.name}</option>
                ))}
                <option>All sandbox branches</option>
              </select>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                Permission scopes
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {scopeOptions.map((scope) => {
                  const selected = selectedScopes.includes(scope.id);
                  return (
                    <label
                      key={scope.id}
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 text-xs font-bold ${
                        selected
                          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                          : "border-[var(--line)] bg-[var(--surface)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleScope(scope.id)}
                        className="sr-only"
                      />
                      <span
                        className={`grid size-5 place-items-center rounded-md border ${
                          selected ? "border-white/30 bg-white/12" : "border-[var(--line-strong)]"
                        }`}
                      >
                        {selected && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span>
                        {scope.label}
                        <span className={`block font-mono text-[9px] ${selected ? "text-white/50" : "text-[var(--muted)]"}`}>
                          {scope.id}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button icon={<KeyRound size={15} />} onClick={createCredential}>
                Create sample key
              </Button>
              <Button tone="quiet" icon={<RotateCcw size={15} />} onClick={rotateCredential}>
                Rotate active secret
              </Button>
            </div>
          </div>

          {oneTimeSecret && (
            <div className="border-b border-[rgb(149_83_12/22%)] bg-[rgb(242_161_45/12%)] p-5 sm:p-6" role="status">
              <div className="flex items-start gap-3">
                <KeyRound size={18} className="mt-0.5 shrink-0 text-[var(--accent-strong)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">Copy this sample secret now</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                    A real secret is shown once. KYPStamping stores only a secure hash after you leave.
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-[rgb(149_83_12/25%)] bg-[var(--surface)] p-2 pl-3">
                    <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold">
                      {oneTimeSecret}
                    </code>
                    <button
                      type="button"
                      aria-label="Copy one-time sample secret"
                      onClick={() => copyValue(oneTimeSecret, "One-time sample secret")}
                      className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--ink)] text-[var(--paper)]"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="Hide one-time secret"
                      onClick={() => setOneTimeSecret(null)}
                      className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-[var(--surface-2)]"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-[var(--line)]">
            {credentials.map((credential) => (
              <article key={credential.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold">{credential.label}</h3>
                      <StatusBadge status={credential.status} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {credential.branch} · Last used {credential.lastUsed}
                    </p>
                  </div>
                  {credential.status === "Active" && (
                    <button
                      type="button"
                      onClick={() => revokeCredential(credential.id, credential.label)}
                      className="text-left text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--danger)]"
                    >
                      Revoke key
                    </button>
                  )}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-2 pl-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]">
                        Client key · safe to identify
                      </span>
                      <code className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold">
                        {credential.clientKey}
                      </code>
                    </span>
                    <button
                      type="button"
                      aria-label={`Copy ${credential.label} client key`}
                      onClick={() => copyValue(credential.clientKey, `${credential.label} client key`)}
                      className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-[var(--surface-2)]"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]">
                      Secret
                    </span>
                    <code className="mt-0.5 block text-xs font-bold">••••••••••••Q4N8</code>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {credential.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="rounded-full bg-[var(--surface-2)] px-2 py-1 font-mono text-[9px] font-bold text-[var(--muted-strong)]"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel className="overflow-hidden">
            <div className="border-b border-[var(--line)] p-5">
              <Eyebrow>How it is set up</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Request path</h2>
            </div>
            <ol className="divide-y divide-[var(--line)]">
              {[
                ["1", "Scope the identity", "Organization → merchant → branch → terminal"],
                ["2", "Sign the request", "Bearer secret plus tenant and idempotency headers"],
                ["3", "Normalize the sale", "One transaction model across every POS adapter"],
                ["4", "Append the ledger", "Immutable earn, redeem, refund, or reversal entry"],
              ].map(([number, title, detail]) => (
                <li key={number} className="flex gap-3 p-5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-xs font-extrabold text-[var(--paper)]">
                    {number}
                  </span>
                  <span>
                    <strong className="block text-sm">{title}</strong>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--muted-strong)]">
                      {detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          <section className="overflow-hidden rounded-2xl bg-[var(--ink)] text-[var(--paper)]">
            <div className="flex items-start justify-between gap-3 border-b border-white/12 p-5">
              <div>
                <Eyebrow>Quickstart</Eyebrow>
                <h2 className="mt-1 text-lg font-extrabold">Record a PHP sale</h2>
              </div>
              <button
                type="button"
                onClick={() => copyValue(quickstart, "Quickstart request")}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/16"
                aria-label="Copy quickstart request"
              >
                <Copy size={15} />
              </button>
            </div>
            <pre className="app-scrollbar max-h-[390px] overflow-auto p-5 text-[11px] leading-relaxed text-white/72">
              <code>{quickstart}</code>
            </pre>
            <div className="flex items-start gap-2 border-t border-white/12 px-5 py-4 text-[10px] leading-relaxed text-white/55">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              +63 E.164 phone format, centavo amounts, and a stable idempotency key
              prevent common integration mistakes.
            </div>
          </section>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--line)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Eyebrow>03 · POS → KYPStamping</Eyebrow>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
                  Inbound webhook
                </h2>
              </div>
              <Webhook size={20} className="text-[var(--accent-strong)]" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
              Give this versioned endpoint and signing requirements to your POS or
              ecommerce developer.
            </p>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <FieldLabel>Planned endpoint</FieldLabel>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-2 pl-3">
                <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold">
                  {inboundUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copyValue(inboundUrl, "Inbound endpoint")}
                  aria-label="Copy inbound endpoint"
                  className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-[var(--surface-2)]"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div>
              <FieldLabel>Signing secret</FieldLabel>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3">
                <code className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold">
                  {inboundSecret ?? "whsec_test_••••••••7D2Q"}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    setInboundSecret("whsec_test_sample_3F8K2P7N");
                    notify("Sample signing secret rotated and shown once.");
                  }}
                  className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]"
                >
                  Rotate
                </button>
              </div>
              {inboundSecret && (
                <p className="mt-2 text-[10px] font-bold text-[var(--accent-strong)]">
                  One-time sample value—copy it before leaving this view.
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Accepted POS events</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {["sale.completed", "sale.voided", "sale.refunded", "customer.linked"].map(
                  (eventName) => (
                    <span
                      key={eventName}
                      className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 font-mono text-[10px] font-bold"
                    >
                      {eventName}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[rgb(15_118_85/9%)] p-4">
              <BadgeCheck size={18} className="mt-0.5 shrink-0 text-[var(--success)]" />
              <div>
                <p className="text-xs font-extrabold">Replay protection planned</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
                  HMAC signature, timestamp window, stable event ID, and idempotent
                  processing are required before a live endpoint is enabled.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--line)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Eyebrow>04 · KYPStamping → your system</Eyebrow>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
                  Outbound webhook
                </h2>
              </div>
              <Link2 size={20} className="text-[var(--accent-strong)]" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
              Subscribe your own endpoint to loyalty, customer, and redemption changes.
            </p>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <label>
              <FieldLabel>HTTPS destination</FieldLabel>
              <input
                type="url"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-xs font-semibold"
              />
            </label>
            <fieldset>
              <legend className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                Send these events
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "loyalty.transaction.completed",
                  "reward.redeemed",
                  "customer.updated",
                  "balance.adjusted",
                ].map((eventName) => {
                  const checked = subscribedEvents.includes(eventName);
                  return (
                    <label
                      key={eventName}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvent(eventName)}
                        className="accent-[var(--ink)]"
                      />
                      <span className="min-w-0 break-all font-mono text-[9px] font-bold">
                        {eventName}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button
                icon={testSending ? <RefreshCcw size={15} className="animate-spin" /> : <TestTube2 size={15} />}
                disabled={testSending}
                onClick={sendTestWebhook}
              >
                {testSending ? "Sending sample…" : "Send test webhook"}
              </Button>
              <Button
                tone="quiet"
                icon={<Check size={15} />}
                onClick={() => notify("Outbound endpoint saved in demo mode.")}
              >
                Save endpoint
              </Button>
            </div>
            <p className="flex items-start gap-2 text-[10px] leading-relaxed text-[var(--muted)]">
              <Clock3 size={13} className="mt-0.5 shrink-0" /> Failed live deliveries will
              retry with exponential backoff and move to a recoverable dead-letter state.
            </p>
          </div>
        </Panel>
      </div>

      <Panel className="mt-3 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <Eyebrow>Delivery desk</Eyebrow>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
              Recent integration events
            </h2>
            <p className="mt-2 text-xs text-[var(--muted-strong)]">
              Payloads stay redacted; IDs and recovery status remain visible to operators.
            </p>
          </div>
          <Button
            tone="quiet"
            icon={<RefreshCcw size={14} />}
            onClick={() => notify("Sample delivery log refreshed.")}
          >
            Refresh log
          </Button>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {deliveries.map((delivery) => (
            <article
              key={delivery.id}
              className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.25fr_0.75fr_0.7fr_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-[10px] font-extrabold text-[var(--accent-strong)]">
                    {delivery.id}
                  </code>
                  <StatusBadge status={delivery.status} />
                </div>
                <p className="mt-2 break-all text-sm font-extrabold">{delivery.event}</p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Source / destination
                </p>
                <p className="mt-1 text-xs font-bold">{delivery.source}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted-strong)]">{delivery.detail}</p>
                <code className="mt-1 block text-[9px] text-[var(--muted)]">
                  {delivery.requestId}
                </code>
              </div>
              {delivery.status === "Failed" ? (
                <button
                  type="button"
                  onClick={() => retryDelivery(delivery.id)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-extrabold"
                >
                  <RotateCcw size={13} /> Retry
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => notify(`${delivery.id} inspection drawer opened.`)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-extrabold"
                >
                  Inspect <ArrowRight size={13} />
                </button>
              )}
            </article>
          ))}
        </div>
      </Panel>

      <section className="mt-3 grid gap-3 pb-2 lg:grid-cols-3">
        {[
          {
            icon: SquareTerminal,
            title: "Use the sidecar now",
            detail: "Keep loyalty separate from the POS while preserving the same ledger and redemption rules.",
            action: "Open counter",
            onClick: () => onNavigate("scan"),
          },
          {
            icon: ServerCog,
            title: "Sandbox contract",
            detail: "Customer lookup, sale, refund, void, balance, reward, and redemption flows share /api/v1.",
            action: "Copy API base",
            onClick: () => copyValue("https://api.kypstamping.ph/api/v1", "Planned API base"),
          },
          {
            icon: TriangleAlert,
            title: "Need provider access?",
            detail: "Adapter availability depends on documented APIs and authorization from the POS provider.",
            action: "Review readiness",
            onClick: () => notify("Provider readiness checklist opened in demo mode."),
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
              <button
                type="button"
                onClick={item.onClick}
                className="mt-5 inline-flex min-h-10 items-center gap-2 text-xs font-extrabold text-[var(--accent-strong)]"
              >
                {item.action} <ExternalLink size={13} />
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
