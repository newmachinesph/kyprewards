"use client";

import { useState } from "react";
import {
  isPreview,
  useBusinessCustomers,
  useCustomFieldValues,
  useCustomFields,
  useReferrals,
  useRfm,
  useStoreCredit,
} from "@kypstamping/api";
import { Button, Pill, PreviewBadge, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { pesoFromCentavos, relativeTime } from "@kypstamping/ui/format";
import { Field, Input, Select } from "@kypstamping/ui/form";
import { PlanTag } from "@kypstamping/ui/shell";
import { ChevronRight, FileDown, Search, Upload, Users } from "lucide-react";
import {
  useCreateReferral,
  useImportCustomers,
  useQualifyReferral,
  useSetCustomFieldValues,
} from "@/components/mutations";
import { planFor, refusal, usePlanGate, type Gate } from "@/lib/plan";
import { creditBalanceOf } from "@/components/views/StoreCreditView";
import { useExport, type Notify } from "@/components/views/shared";

/** Store credit, RFM and tier for the open customer. Each names its plan. */
function CustomerStanding({
  customerId,
  tier,
  gate,
}: {
  customerId: string;
  tier: string | null;
  gate: Gate;
}) {
  const creditPlan = planFor("Store credit");
  const rfmPlan = planFor("RFM and lifecycle scoring");
  const tierPlan = planFor("Suki tiers");
  const { data: entries = [] } = useStoreCredit(customerId);
  const { data: scored = [] } = useRfm();
  const balance = creditBalanceOf(entries, customerId);
  const score = scored.find((member) => member.customerId === customerId);
  const row = (label: string, value: string, plan: typeof creditPlan) => (
    <div key={label} className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="text-white/55">{label}</span>
      <span className="flex items-center gap-2 font-bold">
        {value}
        <PlanTag plan={plan} included={gate.covers(plan)} />
      </span>
    </div>
  );
  return (
    <div className="mt-7">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">Standing</p>
        {isPreview(entries) && <PreviewBadge />}
      </div>
      <div className="mt-2 divide-y divide-white/12 border-y border-white/12">
        {row("Store credit", pesoFromCentavos(balance), creditPlan)}
        {row("RFM score", score ? `${score.recencyScore}${score.frequencyScore}${score.monetaryScore} · ${score.segment}` : "—", rfmPlan)}
        {row("Suki tier", tier ?? "No rung yet", tierPlan)}
      </div>
      {entries.length > 0 && (
        <ul className="mt-3 space-y-1">
          {entries.slice(0, 3).map((entry) => (
            <li key={entry.id} className="flex justify-between gap-2 text-[11px] text-white/70">
              <span className="truncate">{entry.reason}</span>
              <span className="shrink-0 font-semibold">
                {entry.amountCentavos < 0 ? "−" : "+"}
                {pesoFromCentavos(Math.abs(entry.amountCentavos))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The merchant's own columns on a customer, and their referral code.
 *
 * Custom fields are what makes this a CRM rather than a visit counter - a
 * bakery tracks allergies, a salon tracks preferred stylist. The endpoints
 * existed and nothing read or wrote them.
 */
function CustomerExtras({
  customerId,
  customerName,
  notify,
}: {
  customerId: string;
  customerName: string;
  notify: Notify;
}) {
  const gate = usePlanGate();
  const fieldsPlan = planFor("Custom fields");
  const { data: fields = [] } = useCustomFields();
  const { data: values = [] } = useCustomFieldValues(customerId);
  const { data: referrals = [] } = useReferrals();
  const save = useSetCustomFieldValues();
  const invite = useCreateReferral();
  const qualify = useQualifyReferral();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);

  // Keyed by customer: switching selection drops a half-typed draft rather
  // than carrying one person's notes onto another's record.
  const [draftFor, setDraftFor] = useState("");
  if (draftFor !== customerId) {
    setDraftFor(customerId);
    setDraft(null);
  }

  const current =
    draft ?? Object.fromEntries(values.map((value) => [value.key, value.value]));
  const theirs = referrals.filter((referral) => referral.status !== "qualified");

  return (
    <>
      {fields.length > 0 && (
        <div className="mt-7">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
              Your own fields
            </p>
            <PlanTag plan={fieldsPlan} included={gate.covers(fieldsPlan)} />
          </div>
          <div className="mt-3 space-y-2">
            {fields.map((field) => (
              <Field key={field.key} label={field.label} surface="dark">
                <Input
                  value={current[field.key] ?? ""}
                  onChange={(event) =>
                    setDraft({ ...current, [field.key]: event.target.value })
                  }
                />
              </Field>
            ))}
          </div>
          <Button
            tone="ghost"
            className="mt-3 w-full"
            disabled={!draft || save.isPending}
            onClick={() =>
              draft &&
              save.mutate(
                { customerId, values: draft },
                {
                  onSuccess: () => {
                    setDraft(null);
                    notify(`Saved against ${customerName}.`);
                  },
                  onError: (failure) => notify(refusal(failure), "error"),
                },
              )
            }
          >
            {save.isPending ? "Saving\u2026" : draft ? "Save fields" : "Saved"}
          </Button>
        </div>
      )}

      <div className="mt-7">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
          Referral code
        </p>
        {theirs.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {theirs.slice(0, 3).map((referral) => (
              <li key={referral.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="font-mono text-white/75">{referral.code}</span>
                {/* Both sides are paid here, not at sign-up. A claimed code
                    sat at "claimed" forever because nothing in the product
                    could say the friend had actually come back. */}
                {referral.status === "claimed" ? (
                  <button
                    type="button"
                    disabled={qualify.isPending}
                    className="shrink-0 rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/75 transition hover:bg-white/10 disabled:opacity-45"
                    onClick={() =>
                      qualify.mutate(referral.id, {
                        onSuccess: () => notify(`${referral.code} qualified. Both sides paid.`),
                        onError: (failure) => notify(refusal(failure), "error"),
                      })
                    }
                  >
                    Mark qualified
                  </button>
                ) : (
                  <span className="shrink-0 text-white/50">{referral.status}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-white/55">None outstanding.</p>
        )}
        <Button
          tone="ghost"
          className="mt-3 w-full"
          disabled={invite.isPending}
          onClick={() =>
            invite.mutate(
              { customerId },
              {
                onSuccess: (referral) => notify(`Referral code ${referral.code} issued.`),
                onError: (failure) => notify(refusal(failure), "error"),
              },
            )
          }
        >
          Issue a referral code
        </Button>
      </div>
    </>
  );
}

/**
 * A CSV of regulars off the old paper cards.
 *
 * The CRM had no way in but one join at a time from the customer's own
 * phone, which is a week of retyping for a shop that already has a list.
 * Someone whose number already has a wallet is joined rather than
 * duplicated, so re-importing the same file splits nobody's history.
 */
function ImportCustomers({ notify, blocked }: { notify: Notify; blocked: string | null }) {
  const load = useImportCustomers();

  return (
    <label
      title={blocked ?? undefined}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-extrabold transition hover:bg-[var(--surface-2)] focus-within:outline-2 focus-within:outline-[var(--accent-strong)] ${load.isPending || blocked ? "pointer-events-none opacity-60" : ""}`}
    >
      <Upload size={16} />
      {load.isPending ? "Importing…" : blocked ? `Import CSV · ${blocked}` : "Import CSV"}
      <input
        type="file"
        accept=".csv,text/csv"
        disabled={Boolean(blocked)}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          // Cleared so choosing the same file twice fires again - a merchant
          // fixing a rejected row re-picks the file they just edited.
          event.target.value = "";
          load.mutate(file, {
            onSuccess: (result) =>
              notify(
                `${result.created} added, ${result.joined} already had a wallet` +
                  (result.skipped ? `, ${result.skipped} skipped.` : "."),
              ),
            onError: (failure) => notify(refusal(failure), "error"),
          });
        }}
      />
    </label>
  );
}

export function CustomersView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const importPlan = planFor("Customer import");
  const segmentPlan = planFor("Segmentation");
  const { runExport, busy: exporting } = useExport(notify);
  const {
    data: customers = [],
    isPending: customersPending,
    error: customersError,
    refetch: refetchCustomers,
  } = useBusinessCustomers();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = customers.filter(
    (customer) =>
      (segment === "All" || customer.segment === segment) &&
      customer.name.toLowerCase().includes(query.toLowerCase()),
  );
  const selected =
    customers.find((customer) => customer.id === selectedId) ?? customers[0];

  if (!selected) {
    return (
      <ViewFrame
        eyebrow="Customer CRM"
        title="Customers"
        description="Understand the relationship without turning people into a contact export."
      >
        <QueryBoundary
          isPending={customersPending}
          error={customersError}
          onRetry={refetchCustomers}
          label="customers"
          rows={5}
        >
          <p className="text-sm text-[var(--muted-strong)]">
            No customers yet. They appear here as soon as somebody joins from
            your counter code.
          </p>
        </QueryBoundary>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Customer CRM"
      title="Customers"
      description="Segments that update themselves: new, regular, VIP, lapsed, reward-ready. Basic segments on Core, RFM on Grow; export on every plan. Profile access follows the customer’s sharing choices."
      action={
        <div className="flex flex-wrap gap-2">
          <ImportCustomers notify={notify} blocked={gate.reason(importPlan)} />
        <Button
          icon={<FileDown size={16} />}
          disabled={exporting === "customers"}
          onClick={() => runExport("customers")}
        >
          {exporting === "customers" ? "Preparing…" : "Export view"}
        </Button>
        </div>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="grid items-center gap-3 border-b border-[var(--line)] p-4 sm:grid-cols-[1fr_auto_auto]">
            <Input
              icon={<Search size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search customers"
              placeholder="Search customers"
            />
            <PlanTag plan={segmentPlan} included={gate.covers(segmentPlan)} />
            <Select
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              aria-label="Filter customers by lifecycle segment"
            >
              {[
                "All",
                "VIP",
                "Regular",
                "Almost regular",
                "New",
                "At risk",
                "Lapsed",
                "Reward ready",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-4 py-3">Lifecycle</th>
                  <th className="px-4 py-3">Visits</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Last visit</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    tabIndex={0}
                    aria-label={`Open ${customer.name}`}
                    onClick={() => setSelectedId(customer.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(customer.id);
                      }
                    }}
                    className={`cursor-pointer border-b border-[var(--line)] outline-offset-[-2px] transition focus-visible:outline-2 focus-visible:outline-[var(--accent-strong)] last:border-0 ${selected.id === customer.id ? "bg-[rgb(232_163_61/9%)]" : "hover:bg-[var(--paper)]"}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-[11px] font-extrabold">
                          {customer.initials}
                        </span>
                        <div>
                          <p className="text-sm font-extrabold">{customer.name}</p>
                          <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                            {customer.favorite}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Pill
                        tone={
                          customer.risk === "High"
                            ? "danger"
                            : customer.segment === "VIP"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {customer.segment}
                      </Pill>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {customer.visits}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {pesoFromCentavos(customer.lifetimeValueCentavos)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                      {relativeTime(customer.lastVisitAt)}
                    </td>
                    <td className="px-4 py-4">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center">
                <Users className="mx-auto text-[var(--muted)]" />
                <p className="mt-4 text-sm font-extrabold">
                  No customers match this view.
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Clear the search or choose another lifecycle segment.
                </p>
              </div>
            )}
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-xl bg-[var(--accent)] text-lg font-extrabold text-[var(--ink)]">
              {selected.initials}
            </span>
            <div>
              <p className="text-lg font-extrabold">{selected.name}</p>
              <p className="mt-1 text-xs text-white/60">
                {selected.segment} · {selected.risk}
                {/* Which shop they are actually from. The card is centralised
                    across a chain, so the wallet never splits by branch - but
                    the person behind the counter still needs to know that this
                    is a Kapitolyo regular standing in BGC. */}
                {selected.homeBranch ? ` · ${selected.homeBranch}` : ""}
              </p>
              {selected.branches.length > 1 && (
                <p className="mt-1 text-[11px] text-white/55">
                  Also seen at {selected.branches.slice(1).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
            {[
              ["Visits", selected.visits],
              ["Lifetime value", pesoFromCentavos(selected.lifetimeValueCentavos)],
              ["Progress", selected.progress],
              ["Birthday", selected.birthday],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink-soft)] p-4">
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/50">
                  {label}
                </p>
                <p className="mt-1 text-sm font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
              Favorite order
            </p>
            <p className="mt-2 text-sm font-bold">{selected.favorite}</p>
          </div>
          <div className="mt-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
              Reachable by consent
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["Email", selected.emailConsent],
                ["SMS", selected.smsConsent],
                ["Push", selected.pushConsent],
              ].map(([label, allowed]) => (
                <span
                  key={String(label)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${allowed ? "bg-[rgb(15_118_85/28%)] text-[#8ee0c2]" : "bg-white/7 text-white/50"}`}
                >
                  {label} · {allowed ? "Allowed" : "Off"}
                </span>
              ))}
            </div>
          </div>
          <CustomerStanding customerId={selected.id} tier={selected.tier ?? null} gate={gate} />
          <CustomerExtras
            customerId={selected.id}
            customerName={selected.name}
            notify={notify}
          />
        </aside>
      </div>
    </ViewFrame>
  );
}
