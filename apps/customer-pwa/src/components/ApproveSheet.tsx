"use client";

import {
  PREVIEW_WRITE_REASON,
  approveRedemption,
  declineRedemption,
  isPreview,
  keys,
  useApiMutation,
  usePendingApprovals,
  type PendingApproval,
} from "@kyprewards/api";
import { Button, Eyebrow, PreviewBadge, QueryBoundary } from "@kyprewards/ui";
import { FormMessage } from "@kyprewards/ui/form";
import { pesoFromCentavos, relativeTime, timeOfDay } from "@kyprewards/ui/format";
import { Gift } from "lucide-react";
import { SheetFrame } from "@/components/Sheet";

/**
 * A reward the counter has reserved and is waiting on.
 *
 * The customer's tap is what releases it: staff see the approval on their
 * side and hand the reward over. Declining cancels the reserve and the reward
 * stays held on the card.
 */
export function ApproveSheet({ close }: { close: () => void }) {
  const approvals = usePendingApprovals();
  const rows = approvals.data ?? [];
  return (
    <SheetFrame title="Approve a reward" labelledBy="approve-title" close={close}>
      <div className="px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6">
        <Eyebrow>At the counter</Eyebrow>
        <h2 id="approve-title" className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">
          Waiting for you
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-strong)]">
          Your approval releases the reward at the counter.
        </p>
        <div className="mt-6">
          <QueryBoundary
            isPending={approvals.isPending}
            error={approvals.error}
            onRetry={() => void approvals.refetch()}
            label="rewards waiting for approval"
            rows={2}
          >
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-7 text-center">
                <Gift className="mx-auto text-[var(--muted)]" aria-hidden="true" />
                <p className="mt-3 text-sm font-extrabold">Nothing waiting.</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  When staff reserve a reward for you, it appears here for one tap.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {rows.map((row) => (
                  <ApprovalRow key={row.id} row={row} />
                ))}
              </ul>
            )}
          </QueryBoundary>
        </div>
      </div>
    </SheetFrame>
  );
}

function ApprovalRow({ row }: { row: PendingApproval }) {
  const preview = isPreview(row);
  const invalidates = [keys.wallet.approvals(), keys.customer.wallet(), keys.customer.activity()];
  const approve = useApiMutation(approveRedemption, { invalidates });
  const decline = useApiMutation(declineRedemption, { invalidates });
  const busy = approve.isPending || decline.isPending;
  const failure = approve.error ?? decline.error;

  return (
    <li className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
            {row.business}
          </p>
          <p className="mt-1 text-lg font-extrabold tracking-[-0.02em]">{row.reward}</p>
          <p className="mt-1 text-xs text-[var(--muted-strong)]">
            Worth {pesoFromCentavos(row.valueCentavos)} · {row.branch} · {row.staff}
          </p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Asked {relativeTime(row.requestedAt)} · the counter holds it until {timeOfDay(row.expiresAt)}
          </p>
        </div>
        {preview && <PreviewBadge className="shrink-0" />}
      </div>
      {/* One live region for both outcomes, present before either happens. */}
      <FormMessage tone={approve.isSuccess ? "success" : "info"} className="mt-4">
        {approve.isSuccess
          ? "Approved. Staff can hand it over now."
          : decline.isSuccess
            ? "Declined. The reward stays on your card."
            : null}
      </FormMessage>
      {!approve.isSuccess && !decline.isSuccess && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            tone="quiet"
            size="lg"
            disabled={preview || busy}
            title={preview ? PREVIEW_WRITE_REASON : undefined}
            onClick={() => decline.mutate(row.id)}
          >
            {decline.isPending ? "Declining…" : "Decline"}
          </Button>
          <Button
            size="lg"
            disabled={preview || busy}
            title={preview ? PREVIEW_WRITE_REASON : undefined}
            onClick={() => approve.mutate(row.id)}
          >
            {approve.isPending ? "Approving…" : "Approve"}
          </Button>
        </div>
      )}
      {preview && <p className="mt-2 text-[11px] text-[var(--muted-strong)]">{PREVIEW_WRITE_REASON}</p>}
      <FormMessage tone="error" className="mt-2">
        {failure?.message}
      </FormMessage>
    </li>
  );
}
