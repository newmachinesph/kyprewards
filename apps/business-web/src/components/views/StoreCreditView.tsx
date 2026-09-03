"use client";

import { useState } from "react";
import {
  idempotencyKey,
  isPreview,
  issueStoreCredit,
  keys,
  useApiMutation,
  useBusinessCustomers,
  useStoreCredit,
  type StoreCreditEntry,
} from "@kypstamping/api";
import { Button, Eyebrow, PreviewNotice, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { pesoFromCentavos, relativeTime } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { HandCoins } from "lucide-react";
import { planFor, refusal, retryOnce, usePlanGate, writeBlock } from "@/lib/plan";
import {
  BlockedNote,
  Field,
  inputClass,
  newReference,
  onlyMoney,
  pesosToCentavos,
  useSessionInfo,
  type Notify,
} from "@/components/views/shared";

/** The latest running balance per customer, from the ledger. */
export function creditBalanceOf(entries: StoreCreditEntry[], customerId: string) {
  const theirs = entries
    .filter((entry) => entry.customerId === customerId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return theirs[0]?.balanceAfterCentavos ?? 0;
}

export function StoreCreditView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const needed = planFor("Store credit");
  const { data: entries = [], isPending, error, refetch } = useStoreCredit();
  const { data: customers = [] } = useBusinessCustomers();
  const { data: session } = useSessionInfo();
  const preview = isPreview(entries);
  const blocked = writeBlock(gate, needed, preview);

  // One reference per issue attempt: a retry after a timeout replays the same
  // entry rather than crediting twice.
  const [reference, setReference] = useState(newReference);
  const issue = useApiMutation(
    (body: Parameters<typeof issueStoreCredit>[0]) =>
      retryOnce(() => issueStoreCredit(body, idempotencyKey("credit", reference))),
    { invalidates: [keys.levers.all] },
  );

  const [customerId, setCustomerId] = useState("");
  const [pesos, setPesos] = useState("");
  const [reason, setReason] = useState("");
  const amountCentavos = pesosToCentavos(pesos);
  const ready = customerId && amountCentavos > 0 && reason.trim().length > 2;

  const outstanding = new Map<string, number>();
  for (const entry of entries) {
    if (!outstanding.has(entry.customerId)) {
      outstanding.set(entry.customerId, creditBalanceOf(entries, entry.customerId));
    }
  }
  const liability = [...outstanding.values()].reduce((sum, value) => sum + value, 0);

  return (
    <ViewFrame
      eyebrow="Earning more, on purpose"
      title="Store credit"
      description="Peso credit you issue by hand, apart from cashback: a refund, a make-good for a bad order, a thank-you. Spendable at the counter, with a reason and a name on every entry."
      action={<PlanTag plan={needed} included={gate.covers(needed)} />}
    >
      {preview && <PreviewNotice feature="Store credit" />}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] p-5">
            <div>
              <Eyebrow>Ledger</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Every entry, across customers</h2>
            </div>
            <p className="text-xs text-[var(--muted-strong)]">
              Outstanding <strong>{pesoFromCentavos(liability)}</strong> across {outstanding.size}{" "}
              customer{outstanding.size === 1 ? "" : "s"}
            </p>
          </div>
          <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="store credit">
            {entries.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-strong)]">
                No credit issued yet. Each entry keeps who issued it and why.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Balance after</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Issued by</th>
                      <th className="px-4 py-3">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-[var(--line)] last:border-0">
                        <td className="px-5 py-4 text-sm font-extrabold">{entry.customer}</td>
                        <td className={`px-4 py-4 text-sm font-bold ${entry.amountCentavos < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                          {entry.amountCentavos < 0 ? "−" : "+"}
                          {pesoFromCentavos(Math.abs(entry.amountCentavos))}
                        </td>
                        <td className="px-4 py-4 text-sm">{pesoFromCentavos(entry.balanceAfterCentavos)}</td>
                        <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">{entry.reason}</td>
                        <td className="px-4 py-4 text-xs">{entry.issuedBy}</td>
                        <td className="px-4 py-4 text-xs text-[var(--muted)]">{relativeTime(entry.occurredAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </QueryBoundary>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <Eyebrow>Issue credit</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">Add pesos to a customer</h2>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (blocked || !ready) return;
              issue.mutate(
                { customerId, amountCentavos, reason: reason.trim() },
                {
                  onSuccess: (saved) => {
                    notify(`${pesoFromCentavos(saved.amountCentavos)} issued to ${saved.customer}.`);
                    setPesos("");
                    setReason("");
                    setReference(newReference());
                  },
                  onError: (failure) => notify(refusal(failure, needed), "error"),
                },
              );
            }}
          >
            <Field label="Customer">
              <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className={inputClass}>
                <option value="">Choose a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Amount in pesos">
              <input value={pesos} onChange={(event) => setPesos(onlyMoney(event.target.value))} inputMode="decimal" placeholder="150" className={inputClass} />
            </Field>
            <Field label="Reason" hint="Required. It is on the entry for good.">
              <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Wrong order on Sunday, make-good" className={inputClass} />
            </Field>
            <p className="text-xs text-[var(--muted-strong)]">
              Issued by <strong>{session?.name ?? "you"}</strong>
            </p>
            <Button type="submit" icon={<HandCoins size={15} />} disabled={Boolean(blocked) || !ready || issue.isPending} title={blocked ?? undefined}>
              {issue.isPending ? "Issuing…" : `Issue ${amountCentavos > 0 ? pesoFromCentavos(amountCentavos) : "credit"}`}
            </Button>
            <BlockedNote reason={blocked} />
            <p className="text-[11px] leading-relaxed text-[var(--muted)]">
              Spending happens at the counter: scan the customer and the credit is offered against the sale.
            </p>
          </form>
        </section>
      </div>
    </ViewFrame>
  );
}
