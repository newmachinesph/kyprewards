"use client";

import { useMemo, useState } from "react";
import {
  ApiError,
  changePassword,
  useApiMutation,
  useApprovals,
  useBusinessProfile,
  useCustomFields,
  useIntegrations,
  useMessagingPolicy,
  useSettings,
  type MessagingPolicy,
} from "@kypstamping/api";
import { Button, Eyebrow, ViewFrame } from "@kypstamping/ui";
import { longDate } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { pesoFromCentavos } from "@kypstamping/ui/format";
import { signOut } from "@kypstamping/ui/auth";
import { FileDown, KeyRound, LifeBuoy, PlugZap, ShieldCheck } from "lucide-react";
import {
  useAddCustomField,
  useDecideApproval,
  useRaiseSupportRequest,
  useSetMessagingPolicy,
  useSetSetting,
  useToggleIntegration,
} from "@/components/mutations";
import { planFor, refusal, usePlanGate } from "@/lib/plan";
import {
  inputClass,
  useExport,
  type Notify,
  NothingYet,
} from "@/components/views/shared";

/**
 * Quiet hours and frequency caps.
 *
 * This protects the customer rather than the merchant, which is why it is on
 * every plan including the free one.
 */
function MessagingPolicyCard({ notify }: { notify: Notify }) {
  const { data: policy } = useMessagingPolicy();
  const save = useSetMessagingPolicy();
  const [draft, setDraft] = useState<MessagingPolicy | null>(null);
  const shown = draft ?? policy;

  if (!shown) {
    return (
      <article className="h-64 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]" />
    );
  }

  const edit = (field: keyof MessagingPolicy, value: number) =>
    setDraft({ ...shown, [field]: value });

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck size={19} className="mt-0.5 text-[var(--accent-strong)]" />
        <div>
          <p className="text-sm font-extrabold">Messaging limits</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
            Nothing sends inside quiet hours, and nobody hears from you more
            often than these caps allow. Every channel, including the free ones.
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {(
          [
            ["quietFromHour", "Quiet from", 23],
            ["quietToHour", "Quiet until", 23],
            ["maxPerDay", "Max per day", 50],
            ["maxPerWeek", "Max per week", 200],
          ] as const
        ).map(([field, label, max]) => (
          <label
            key={field}
            className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[var(--muted)]"
          >
            {label}
            <input
              type="number"
              min={0}
              max={max}
              value={shown[field]}
              onChange={(event) => edit(field, Number(event.target.value))}
              className="min-h-10 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--accent-strong)]"
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
        Hours are 0-23 in your local time. A cap of zero means no cap.
      </p>
      <Button
        className="mt-5"
        disabled={!draft || save.isPending}
        onClick={() =>
          draft &&
          save.mutate(draft, {
            onSuccess: () => {
              setDraft(null);
              notify("Messaging limits saved.");
            },
            onError: (failure) => notify(refusal(failure), "error"),
          })
        }
      >
        {save.isPending ? "Saving…" : draft ? "Save limits" : "Saved"}
      </Button>
    </article>
  );
}

/** The columns this shop keeps on a customer. Core. */
function CustomFieldsCard({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const needed = planFor("Custom fields");
  const { data: fields = [] } = useCustomFields();
  const add = useAddCustomField();
  const [label, setLabel] = useState("");
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .slice(0, 60);
  const blocked = gate.reason(needed);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold">Your own customer fields</p>
        <PlanTag plan={needed} included={gate.covers(needed)} />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        What this shop needs to remember about someone, beyond visits and spend.
        They appear on every customer record.
      </p>
      {fields.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {fields.map((field) => (
            <li
              key={field.key}
              className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-[10px] font-extrabold"
            >
              {field.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-2">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Allergies"
          className={inputClass}
        />
        <Button
          tone="quiet"
          disabled={!key || add.isPending || Boolean(blocked)}
          title={blocked ?? undefined}
          onClick={() =>
            add.mutate(
              { key, label: label.trim() },
              {
                onSuccess: (field) => {
                  setLabel("");
                  notify(`${field.label} added to every customer record.`);
                },
                onError: (failure) => notify(refusal(failure, needed), "error"),
              },
            )
          }
        >
          Add
        </Button>
      </div>
      {blocked && (
        <p className="mt-2 text-[11px] font-semibold text-[var(--muted-strong)]">
          {blocked}
        </p>
      )}
    </article>
  );
}

/** Privileged actions waiting on a second pair of eyes. Scale only. */
function ApprovalsCard({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const needed = planFor("Approval controls for privileged actions");
  const { data: approvals = [], error } = useApprovals();
  const decide = useDecideApproval();
  const pending = approvals.filter((request) => request.status === "pending");

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold">Four-eyes approvals</p>
        <PlanTag plan={needed} included={gate.covers(needed)} />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        {error
          ? error instanceof ApiError && error.status === 402
            ? `Opens with ${needed}. Privileged actions wait for a second person before they happen.`
            : error.message
          : pending.length
            ? `${pending.length} waiting on a decision.`
            : "Nothing waiting. Privileged actions appear here before they happen."}
      </p>
      <ul className="mt-4 space-y-3">
        {pending.map((request) => (
          <li
            key={request.id}
            className="rounded-xl border border-[var(--line)] p-3"
          >
            <p className="text-xs font-extrabold">{request.action}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted-strong)]">
              {request.target}
              {request.amountCentavos
                ? ` · ${pesoFromCentavos(request.amountCentavos)}`
                : ""}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  ["Reject", false],
                  ["Approve", true],
                ] as const
              ).map(([verb, approve]) => (
                <Button
                  key={verb}
                  tone={approve ? "accent" : "quiet"}
                  disabled={decide.isPending}
                  onClick={() =>
                    decide.mutate(
                      { id: request.id, approve },
                      {
                        onSuccess: () =>
                          notify(
                            `${request.action} ${approve ? "approved" : "rejected"}.`,
                          ),
                        onError: (failure) =>
                          notify(refusal(failure, needed), "error"),
                      },
                    )
                  }
                >
                  {verb}
                </Button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

const NOTIFICATIONS = [
  [
    "notifyRedemptions",
    "Reward redemptions",
    "One line whenever a reward is handed over or reversed",
  ],
  [
    "notifyDailySummary",
    "Daily summary",
    "Visits, stamps and redemptions, every evening",
  ],
  [
    "notifyLowCredits",
    "Low SMS credits",
    "When the balance drops under a day of sends",
  ],
] as const;

const SUPPORT_CATEGORIES = [
  "Counter",
  "Program",
  "Billing",
  "Privacy",
  "Something else",
] as const;

/**
 * Change your own password.
 *
 * An approved shop's first password is generated and emailed to them, and
 * there was nowhere in the app to replace it: the only route was "forgot
 * password", which asks somebody already signed in to go and read their
 * email. A temporary password that cannot be changed stays in an inbox
 * forever.
 */
function PasswordCard({ notify }: { notify: Notify }) {
  const change = useApiMutation(changePassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  // The API's rule, stated where it is typed rather than after a refusal.
  const tooShort = next.length > 0 && next.length < 10;
  const ready = current.length > 0 && next.length >= 10 && !change.isPending;

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-3">
        <KeyRound size={19} className="text-[var(--accent-strong)]" />
        <p className="text-sm font-extrabold">Change your password</p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        Ten characters or more. Every other signed-in device is signed out;
        this one stays.
      </p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!ready) return;
          change.mutate(
            { currentPassword: current, password: next },
            {
              onSuccess: () => {
                notify("Password changed. Other devices were signed out.");
                setCurrent("");
                setNext("");
              },
              onError: (failure) => notify(refusal(failure), "error"),
            },
          );
        }}
      >
        <label className="grid gap-1.5 text-xs font-bold">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            className={inputClass}
          />
        </label>
        {tooShort && (
          <p className="text-[11px] font-semibold text-[var(--danger)]">
            Ten characters or more.
          </p>
        )}
        <Button type="submit" disabled={!ready}>
          {change.isPending ? "Changing…" : "Change password"}
        </Button>
      </form>
    </article>
  );
}

function SupportCard({ notify }: { notify: Notify }) {
  const raise = useRaiseSupportRequest();
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [category, setCategory] = useState<string>("Counter");
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-3">
        <LifeBuoy size={19} className="text-[var(--accent-strong)]" />
        <p className="text-sm font-extrabold">Ask for help</p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        Goes into the queue a person reads. Someone replies by email.
      </p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!subject.trim()) return;
          raise.mutate(
            { subject: subject.trim(), detail: detail.trim(), category },
            {
              onSuccess: (ticket) => {
                notify(`Sent. Reference ${ticket.id}.`);
                setSubject("");
                setDetail("");
              },
              onError: (failure) => notify(refusal(failure), "error"),
            },
          );
        }}
      >
        <label className="grid gap-1.5 text-xs font-bold">
          Subject
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold">
          About
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
          >
            {SUPPORT_CATEGORIES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold">
          What happened
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            rows={3}
            className={`${inputClass} py-2`}
          />
        </label>
        <Button type="submit" disabled={!subject.trim() || raise.isPending}>
          {raise.isPending ? "Sending…" : "Send"}
        </Button>
      </form>
    </article>
  );
}

export function SettingsView({ notify }: { notify: Notify }) {
  const { data: settings = {} } = useSettings();
  const setSetting = useSetSetting();
  const { data: integrations = [] } = useIntegrations();
  const { data: profile } = useBusinessProfile();
  const toggle = useToggleIntegration();
  const { runExport, busy } = useExport(notify);
  const deletion = useRaiseSupportRequest();
  const connected = useMemo(
    () =>
      Object.fromEntries(
        integrations.map((row) => [row.id, row.status === "Connected"]),
      ),
    [integrations],
  );

  const flip = (key: string, label: string) => {
    const next = !settings[key];
    setSetting.mutate(
      { key, value: next },
      {
        onSuccess: () =>
          notify(`${label} ${next ? "turned on" : "turned off"}.`),
        onError: (failure) => notify(refusal(failure), "error"),
      },
    );
  };

  return (
    <ViewFrame
      eyebrow="Workspace settings"
      title="Settings"
      description="Messaging limits, notifications, privacy controls, the services you connect, and a way to reach a person. Billing has its own screen."
    >
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-3">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-5">
              <Eyebrow>Channels & services</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">
                Connect the tools you already use
              </h2>
            </div>
            {integrations.filter((integration) => integration.id !== "int_pos")
              .length === 0 && (
              <NothingYet>
                Nothing to connect yet. Point of sale, messaging and webhooks
                appear here as they are switched on for your plan.
              </NothingYet>
            )}
            <div className="grid sm:grid-cols-2">
              {integrations
                .filter((integration) => integration.id !== "int_pos")
                .map((integration, index) => {
                  const isConnected = connected[integration.id];
                  const isPlanned = integration.status === "Planned";
                  return (
                    <article
                      key={integration.id}
                      className={`p-5 ${index > 1 ? "border-t border-[var(--line)]" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-[var(--line)]" : ""} ${index === 1 ? "border-t border-[var(--line)] sm:border-t-0" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)]">
                          <PlugZap size={17} />
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-label={`Toggle ${integration.name}`}
                          aria-checked={isConnected}
                          disabled={isPlanned}
                          title={isPlanned ? "Not available yet" : undefined}
                          onClick={() =>
                            toggle.mutate(integration.id, {
                              onSuccess: (result) =>
                                notify(
                                  `${integration.name} ${result.enabled ? "connected" : "disconnected"}.`,
                                ),
                              onError: (failure) =>
                                notify(refusal(failure), "error"),
                            })
                          }
                          className={`relative h-6 w-10 shrink-0 rounded-full before:absolute before:-inset-y-2.5 before:-inset-x-2 before:content-[''] ${isPlanned ? "cursor-not-allowed bg-[var(--line)] opacity-60" : isConnected ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                        >
                          <span
                            className={`absolute top-1 size-4 rounded-full bg-white transition ${isConnected ? "left-5" : "left-1"}`}
                          />
                        </button>
                      </div>
                      <p className="mt-6 text-sm font-extrabold">
                        {integration.name}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                        {integration.category}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                        {integration.detail}
                      </p>
                    </article>
                  );
                })}
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <Eyebrow>Notifications</Eyebrow>
            <div className="mt-3 divide-y divide-[var(--line)]">
              {NOTIFICATIONS.map(([key, label, detail]) => (
                <div key={key} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold">{label}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--muted)]">
                      {detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(settings[key])}
                    aria-label={label}
                    disabled={setSetting.isPending}
                    onClick={() => flip(key, label)}
                    className={`relative h-6 w-10 shrink-0 rounded-full ${settings[key] ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                  >
                    <span
                      className={`absolute top-1 size-4 rounded-full bg-white transition ${settings[key] ? "left-5" : "left-1"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between gap-2">
              <Eyebrow>Privacy controls</Eyebrow>
              <PlanTag plan="Launch" included />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--muted-strong)]">
              Consent is per purpose and per channel, kept in a ledger the
              customer can read from their wallet. Export and deletion are on
              every plan.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                tone="quiet"
                icon={<FileDown size={15} />}
                disabled={busy === "customers"}
                onClick={() => runExport("customers")}
              >
                {busy === "customers"
                  ? "Preparing…"
                  : "Export your customer list"}
              </Button>
              <Button
                tone="quiet"
                disabled={deletion.isPending}
                onClick={() =>
                  deletion.mutate(
                    {
                      subject: "Deletion request",
                      detail: `${profile?.name ?? "This workspace"} asks for a customer record, or the workspace, to be erased. A person will confirm the scope by email.`,
                      category: "Privacy",
                    },
                    {
                      onSuccess: (ticket) =>
                        notify(
                          `Deletion request logged. Reference ${ticket.id}.`,
                        ),
                      onError: (failure) => notify(refusal(failure), "error"),
                    },
                  )
                }
              >
                {deletion.isPending ? "Logging…" : "Request a deletion"}
              </Button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
              A deletion goes to a person because it is irreversible; it is
              logged with your name and the time.
            </p>
          </article>
        </section>

        <aside className="space-y-3">
          <article className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
            <Eyebrow>Workspace</Eyebrow>
            <p className="mt-5 text-2xl font-extrabold">
              {profile?.name ?? "—"}
            </p>
            <div className="mt-5 divide-y divide-white/12 border-y border-white/12">
              {[
                ["Plan", profile?.plan ?? "—"],
                ["Renewal", profile ? longDate(profile.renewalOn) : "—"],
                ["Timezone", profile?.timezone ?? "—"],
                ["Owner", profile?.owner ?? "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <span className="text-white/55">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href="/workspaces"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 text-xs font-extrabold"
              >
                Switch workspace
              </a>
              <Button
                tone="quiet"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            </div>
          </article>
          <MessagingPolicyCard notify={notify} />
          <CustomFieldsCard notify={notify} />
          <ApprovalsCard notify={notify} />
          <PasswordCard notify={notify} />
          <SupportCard notify={notify} />
        </aside>
      </div>
    </ViewFrame>
  );
}
