"use client";

import { useState } from "react";
import { sharedScenario } from "@kypstamping/demo-data";
import type { Environment } from "@kypstamping/api";
import { Button, DemoBadge, Eyebrow, FieldLabel, Panel } from "@kypstamping/ui";
import { PlanTag } from "@kypstamping/ui/shell";
import type { NotifyIntent } from "@kypstamping/ui/shell";
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
import {
  createCredential as createCredential_,
  keys,
  rotateCredential as rotateCredential_,
  revokeCredential as revokeCredential_,
  retryDelivery as retryDelivery_,
  revealWebhookSecret,
  rotateWebhookSecret,
  saveWebhookEndpoint,
  sendTestDelivery,
  useApiMutation,
  useBusinessProfile,
  useContract,
  useCredentials,
  useLocations,
  useWebhookDeliveries,
  useWebhookEndpoints,
  type Credential,
  type CredentialCreated,
  type Delivery,
  type WebhookEndpoint,
} from "@kypstamping/api";
import { relativeTime } from "@kypstamping/ui/format";
import { useDemoState } from "@/components/DemoState";

type Notify = (message: string, intent?: NotifyIntent) => void;
type CredentialStatus = Credential["status"];
type DeliveryStatus = Delivery["status"];

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
    id: "pos-webhook",
    name: "POS webhook",
    icon: Store,
    eyebrow: "Any register",
    description: "Post sale and refund events from your existing POS using the shared event contract.",
    availability: "Sandbox ready",
  },
  {
    id: "pos-pull",
    name: "Scheduled pull",
    icon: PlugZap,
    eyebrow: "Any register",
    description: "Let KYPStamping fetch sales on a schedule when your POS cannot send webhooks.",
    availability: "Sandbox ready",
  },
] as const;




function StatusBadge({ status }: { status: DeliveryStatus | CredentialStatus }) {
  const classes = {
    Active: "bg-[rgb(15_118_85/12%)] text-[var(--success)]",
    Revoked: "bg-[var(--surface-2)] text-[var(--muted-strong)]",
    Delivered: "bg-[rgb(15_118_85/12%)] text-[var(--success)]",
    "Ignored safely": "bg-[rgb(24_18_12/8%)] text-[var(--ink-soft)]",
    Retrying: "bg-[rgb(232_163_61/16%)] text-[var(--accent-strong)]",
    Failed: "bg-[rgb(178_59_43/12%)] text-[var(--danger)]",
  } as const;
  const tone =
    classes[status as keyof typeof classes] ??
    "bg-[var(--surface-2)] text-[var(--muted-strong)]";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${tone}`}
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
  // Matches the adapter the platform control room reports for this tenant.
  const [connection, setConnection] = useState<(typeof connectionOptions)[number]["id"]>(
    "custom",
  );
  const {
    webhookUrl,
    setWebhookUrl,
    savedWebhookUrl,
    saveWebhookUrl,
    subscribedEvents,
    setSubscribedEvents,
  } = useDemoState();

  const { data: credentials = [] } = useCredentials(environment);
  const { data: deliveries = [], refetch: refetchDeliveries } =
    useWebhookDeliveries(environment);
  const { data: endpoints = [] } = useWebhookEndpoints(environment);
  // The merchant has one outbound endpoint per environment. Its signing
  // secret is separate from the client keys and has its own rotation.
  const outbound = endpoints[0];
  const revealSecret = useApiMutation<{ secret: string }, string>(revealWebhookSecret);
  const rotateEndpointSecret = useApiMutation<{ secret: string }, string>(
    rotateWebhookSecret,
    { invalidates: [keys.integrations.webhookEndpoints(environment)] },
  );
  // One endpoint per environment, and one key is "the active secret".
  const activeCredential = credentials.find(
    (credential) => credential.status === "Active" && credential.environment === environment,
  );

  const credentialKeys = [keys.integrations.credentials(environment)];
  const create = useApiMutation<CredentialCreated, Parameters<typeof createCredential_>[0]>(
    createCredential_,
    { invalidates: credentialKeys },
  );
  const rotate = useApiMutation<CredentialCreated, string>(rotateCredential_, {
    invalidates: credentialKeys,
  });
  const revoke = useApiMutation<void, string>(revokeCredential_, {
    invalidates: credentialKeys,
  });
  const saveEndpoint = useApiMutation<
    WebhookEndpoint,
    Parameters<typeof saveWebhookEndpoint>[0]
  >((body) => saveWebhookEndpoint(body, environment), {
    invalidates: [keys.integrations.webhookEndpoints(environment)],
  });
  const sendTest = useApiMutation<Delivery, string>(sendTestDelivery, {
    invalidates: [keys.integrations.webhookDeliveries(environment)],
  });
  const retry = useApiMutation<Delivery, string>(retryDelivery_, {
    invalidates: [keys.integrations.webhookDeliveries(environment)],
  });
  const { data: contract } = useContract();
  const { data: profile } = useBusinessProfile();
  const { data: locations = [] } = useLocations();
  const [keyLabel, setKeyLabel] = useState("Main counter backup");
  const [branchScope, setBranchScope] = useState(sharedScenario.branch);
  const [selectedScopes, setSelectedScopes] = useState([
    "customers:read",
    "transactions:write",
    "rewards:read",
  ]);
  const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);
  const [inboundSecret, setInboundSecret] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const secretPrefix = environment === "sandbox" ? "sk_test" : "sk_live_demo";
  const providerSlug = connection === "sidecar" ? "terminal" : connection;
  const inboundUrl = `${(contract?.apiBase ?? "")}/integrations/${providerSlug}/webhook`;
  // Every value below is the shared scenario's own visit, so the request the
  // merchant copies matches the event the wallet and the control room show.
  const quickstart = `curl --request POST \\
  --url ${(contract?.apiBase ?? "")}/transactions \\
  --header 'Authorization: Bearer ${secretPrefix}_••••••••' \\
  --header '${(contract?.idempotency.header ?? "Idempotency-Key")}: ${sharedScenario.delivery.idempotencyKey}' \\
  --header 'X-Merchant-ID: ${sharedScenario.merchantId}' \\
  --data '{
    "external_transaction_id": "${sharedScenario.externalTransactionId}",
    "customer_phone": "+639171234567",
    "branch_id": "${sharedScenario.branchId}",
    "amount": ${sharedScenario.purchase.amountCentavos},
    "currency": "${sharedScenario.purchase.currency}"
  }'`;

  // A production preview must not list sandbox keys as if they worked there.
  const visibleCredentials = credentials.filter(
    (credential) => credential.environment === environment,
  );
  const webhookDirty = webhookUrl.trim() !== savedWebhookUrl;

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
      notify("Add a key name before creating the sample credential.", "error");
      return;
    }
    if (selectedScopes.length === 0) {
      notify("Choose at least one permission scope.", "error");
      return;
    }
    create.mutate(
      {
        label: keyLabel.trim(),
        scopes: selectedScopes,
        branch: branchScope,
        environment,
      },
      {
        onSuccess: (credential) => {
          // The only moment the secret exists in readable form. The list
          // afterwards carries a preview and nothing more.
          setOneTimeSecret(credential.secret);
          notify("Credential created. Copy the secret now - it is not shown again.");
        },
        onError: (failure) => notify(failure.message, "error"),
      },
    );
  }

  function rotateCredential(id: string) {
    rotate.mutate(id, {
      onSuccess: (credential) => {
        setOneTimeSecret(credential.secret);
        notify("Secret rotated. The previous one stopped working immediately.");
      },
      onError: (failure) => notify(failure.message, "error"),
    });
  }

  function revokeCredential(id: string, label: string) {
    // Irreversible: a revoked key cannot be restored, so ask first.
    if (
      !window.confirm(
        `Revoke "${label}"? Any integration using this key stops working immediately, and it cannot be restored.`,
      )
    ) {
      return;
    }
    revoke.mutate(id, {
      onSuccess: () => notify(`${label} revoked. Anything using it stops now.`),
      onError: (failure) => notify(failure.message, "error"),
    });
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
      notify("Use an HTTPS destination before sending a sample webhook.", "error");
      return;
    }
    if (subscribedEvents.length === 0) {
      notify("Select at least one outbound event.", "error");
      return;
    }
    setTestSending(true);
    notify("Saving the endpoint and sending a signed delivery\u2026");
    // Saved first: a test against an endpoint the server has not been told
    // about would report on the previous URL.
    saveEndpoint.mutate(
      { url: webhookUrl, events: subscribedEvents },
      {
        onSuccess: (endpoint) => {
          saveWebhookUrl();
          sendTest.mutate(endpoint.id, {
            onSuccess: (delivery) => {
              setTestSending(false);
              notify(
                delivery.status === "Delivered"
                  ? "Signed delivery accepted by your endpoint."
                  : `Delivery ${delivery.status.toLowerCase()}: ${delivery.detail}`,
                delivery.status === "Delivered" ? "info" : "error",
              );
            },
            onError: (failure) => {
              setTestSending(false);
              notify(failure.message, "error");
            },
          });
        },
        onError: (failure) => {
          setTestSending(false);
          notify(failure.message, "error");
        },
      },
    );
  }

  function retryDelivery(id: string) {
    retry.mutate(id, {
      onSuccess: () => notify("Delivery moved to the retry queue."),
      onError: (failure) => notify(failure.message, "error"),
    });
  }

  return (
    <main className="mx-auto min-h-[calc(100dvh-64px)] max-w-[1400px] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>Connect your counter</Eyebrow>
            {/* API, webhooks, and POS adapters are a Scale feature on the
                pricing page — say so here instead of showing them unmarked. */}
            <PlanTag plan="Scale" />
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            POS & API integrations
          </h1>
          <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            Choose how sales reach KYPStamping, issue least-privilege keys, sign webhooks,
            and trace every event without tying loyalty to one POS vendor. Sweet Crumbs is
            on Grow, so this workspace has it switched on as a preview.
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
                API base · /{contract?.version ?? ""}
              </span>
            </div>
            <h2 className="mt-6 max-w-2xl text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
              Your integration boundary, visible at a glance.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
              Client secrets are shown once, at creation or rotation. The API
              stores only a hash, so a lost secret is rotated rather than
              recovered.
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
            ["Organization", profile?.organizationId ?? ""],
            ["Merchant", profile?.merchantId ?? ""],
            ["Branch access", `${locations.length} branches`],
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
                {locations.map((location) => (
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
                Create key
              </Button>
              <Button
                tone="quiet"
                icon={<RotateCcw size={15} />}
                disabled={!activeCredential || rotate.isPending}
                onClick={() => activeCredential && rotateCredential(activeCredential.id)}
              >
                {rotate.isPending ? "Rotating…" : "Rotate active secret"}
              </Button>
            </div>
          </div>

          {oneTimeSecret && (
            <div className="border-b border-[rgb(143_85_16/22%)] bg-[rgb(232_163_61/12%)] p-5 sm:p-6" role="status">
              <div className="flex items-start gap-3">
                <KeyRound size={18} className="mt-0.5 shrink-0 text-[var(--accent-strong)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">Copy this secret now</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                    This is the only time it is shown. The API keeps a hash, so
                    it cannot be retrieved - only rotated.
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-[rgb(143_85_16/25%)] bg-[var(--surface)] p-2 pl-3">
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
            {visibleCredentials.length === 0 && (
              <p className="p-6 text-xs leading-relaxed text-[var(--muted-strong)]">
                No {environment === "sandbox" ? "sandbox" : "production preview"} keys
                yet. Create one above — keys issued in one environment never work
                in the other.
              </p>
            )}
            {visibleCredentials.map((credential) => (
              <article key={credential.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold">{credential.label}</h3>
                      <StatusBadge status={credential.status} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {credential.branch} · Last used {relativeTime(credential.lastUsedAt)}
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
                {(contract?.inboundEvents ?? []).map((event) => (
                  <span
                    key={event.name}
                    title={event.detail}
                    className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 font-mono text-[10px] font-bold"
                  >
                    {event.name}
                  </span>
                ))}
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
                {(contract?.outboundEvents ?? []).map((event) => {
                  const checked = subscribedEvents.includes(event.name);
                  return (
                    <label
                      key={event.name}
                      title={event.detail}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvent(event.name)}
                        className="accent-[var(--ink)]"
                      />
                      <span className="min-w-0 break-all font-mono text-[9px] font-bold">
                        {event.name}
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
                disabled={!webhookDirty}
                onClick={() => {
                  if (!webhookUrl.trim().startsWith("https://")) {
                    notify("An outbound endpoint has to be HTTPS.", "error");
                    return;
                  }
                  saveEndpoint.mutate(
                    { url: webhookUrl.trim(), events: subscribedEvents },
                    {
                      onSuccess: () => {
                        saveWebhookUrl();
                        notify("Outbound endpoint saved.");
                      },
                      onError: (failure) => notify(failure.message, "error"),
                    },
                  );
                }}
              >
                {webhookDirty ? "Save endpoint" : "Endpoint saved"}
              </Button>
              {outbound && (
                <>
                  <Button
                    tone="quiet"
                    icon={<KeyRound size={15} />}
                    disabled={revealSecret.isPending}
                    onClick={() =>
                      revealSecret.mutate(outbound.id, {
                        onSuccess: ({ secret }) => setOneTimeSecret(secret),
                        onError: (failure) => notify(failure.message, "error"),
                      })
                    }
                  >
                    Show signing secret
                  </Button>
                  <Button
                    tone="quiet"
                    icon={<RotateCcw size={15} />}
                    disabled={rotateEndpointSecret.isPending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Rotate the signing secret? Your endpoint will reject deliveries until it is updated with the new one.",
                        )
                      ) {
                        return;
                      }
                      rotateEndpointSecret.mutate(outbound.id, {
                        onSuccess: ({ secret }) => {
                          setOneTimeSecret(secret);
                          notify("Signing secret rotated. Update your endpoint now.");
                        },
                        onError: (failure) => notify(failure.message, "error"),
                      });
                    }}
                  >
                    Rotate signing secret
                  </Button>
                </>
              )}
            </div>
            {webhookDirty && (
              <p className="text-[10px] font-bold text-[var(--accent-strong)]">
                Unsaved change. Deliveries still go to {savedWebhookUrl}.
              </p>
            )}
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
            onClick={() => {
              setRefreshing(true);
              void refetchDeliveries().finally(() => {
                setRefreshing(false);
                notify("Delivery log refreshed.");
              });
            }}
            disabled={refreshing}
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
                  onClick={() => notify(`${delivery.id} inspection drawer opened.`, "review")}
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
            onClick: () => copyValue((contract?.apiBase ?? ""), "Planned API base"),
          },
          {
            icon: TriangleAlert,
            title: "Using an unusual POS?",
            detail: "Any register that can post webhooks or expose a read API connects through the same event contract.",
            action: "Review readiness",
            onClick: () => notify("Integration readiness checklist opened in demo mode.", "review"),
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
