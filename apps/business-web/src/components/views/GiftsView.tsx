"use client";

import { isPreview, useBusinessGifts } from "@kyprewards/api";
import { Eyebrow, Pill, PreviewNotice, QueryBoundary, ViewFrame } from "@kyprewards/ui";
import { relativeTime } from "@kyprewards/ui/format";
import { PlanTag } from "@kyprewards/ui/shell";
import { planFor, usePlanGate } from "@/lib/plan";

/** The pasalubong log. Customers send; the shop reads. Nothing to write here. */
export function GiftsView() {
  const gate = usePlanGate();
  const needed = planFor("Send a reward as a gift");
  const { data: gifts = [], isPending, error, refetch } = useBusinessGifts();

  return (
    <ViewFrame
      eyebrow="Earning more, on purpose"
      title="Gifts"
      description="Pasalubong, digitally. A member sends a reward or points to another member at the same shop; both are told, both see it on their card, and the ledger keeps the trail."
      action={<PlanTag plan={needed} included={gate.covers(needed)} />}
    >
      {isPreview(gifts) && <PreviewNotice feature="Gifts" detail="There is nothing to write here; customers send from their wallet." />}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Gift log</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">Who sent what to whom</h2>
          </div>
          <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="gifts">
            {gifts.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-strong)]">
                No gifts yet. When a member sends one from their wallet it appears here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      <th className="px-5 py-3">From</th>
                      <th className="px-4 py-3">To</th>
                      <th className="px-4 py-3">Kind</th>
                      <th className="px-4 py-3">Reward or units</th>
                      <th className="px-4 py-3">Message</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gifts.map((gift) => (
                      <tr key={gift.id} className="border-b border-[var(--line)] last:border-0">
                        <td className="px-5 py-4 text-sm font-extrabold">{gift.fromName}</td>
                        <td className="px-4 py-4 text-sm font-bold">{gift.toName}</td>
                        <td className="px-4 py-4 text-xs capitalize">{gift.kind}</td>
                        <td className="px-4 py-4 text-sm">
                          {gift.kind === "reward" ? gift.reward : `${gift.units} points`}
                        </td>
                        <td className="px-4 py-4 text-xs italic text-[var(--muted-strong)]">
                          {gift.message ? `“${gift.message}”` : "—"}
                        </td>
                        <td className="px-4 py-4">
                          <Pill tone={gift.status === "accepted" ? "success" : "warning"}>{gift.status}</Pill>
                        </td>
                        <td className="px-4 py-4 text-xs text-[var(--muted)]">{relativeTime(gift.sentAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </QueryBoundary>
        </section>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>How it works</Eyebrow>
          <ol className="mt-5 space-y-4 text-sm leading-relaxed text-white/70">
            <li><strong className="text-white">1.</strong> A member with a held reward or a points balance opens your card in their wallet and chooses Send as a gift.</li>
            <li><strong className="text-white">2.</strong> They enter the other member&rsquo;s code and a message. The gift moves the moment it is sent; nothing is created or doubled.</li>
            <li><strong className="text-white">3.</strong> Both are told. The receiver sees it on their card and redeems it at your counter like any other reward.</li>
          </ol>
          <p className="mt-6 text-[11px] leading-relaxed text-white/50">
            Gifts stay inside your shop. A reward earned here cannot be sent to a card at another shop.
          </p>
        </aside>
      </div>
    </ViewFrame>
  );
}
