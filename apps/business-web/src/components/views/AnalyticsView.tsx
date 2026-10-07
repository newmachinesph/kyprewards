"use client";

import { useState } from "react";
import {
  EMPTY_BUSINESS_METRICS,
  keys,
  purchaseBranchReporting,
  useApiMutation,
  useBilling,
  useBranchPerformance,
  useBranchReporting,
  useBusinessCustomers,
  useBusinessMetrics,
  useCampaignAttribution,
  useFeedback,
  useLocations,
  usePrograms,
  useRetention,
  useRfm,
  useSegments,
  useStaffPerformance,
  useTimeToSecondVisit,
  type QrPayment,
} from "@kyprewards/api";
import { Button, Eyebrow, Pill, QueryBoundary, ViewFrame } from "@kyprewards/ui";
import { FormMessage } from "@kyprewards/ui/form";
import { longDate, pesoCompactFromCentavos, pesoFromCentavos, relativeTime } from "@kyprewards/ui/format";
import { PlanTag } from "@kyprewards/ui/shell";
import { branchAllowance, planFor, refusal, retryOnce, usePlanGate, type Gate } from "@/lib/plan";
import { PaymentSheet } from "@/components/views/PaymentSheet";

function Tag({ label, gate }: { label: string; gate: Gate }) {
  const needed = planFor(label);
  return <PlanTag plan={needed} included={gate.covers(needed)} />;
}

/** Who the numbers are about: RFM quintiles within this merchant's own base. */
function SegmentBreakdown({ gate }: { gate: Gate }) {
  const { data: scored = [], isPending, error, refetch } = useRfm();
  const { data: shares = [] } = useSegments();
  const bySegment = new Map<string, typeof scored>();
  for (const member of scored) {
    bySegment.set(member.segment, [...(bySegment.get(member.segment) ?? []), member]);
  }
  const countOf = new Map(shares.map((row) => [row.segment, row.members]));
  const shareOf = new Map(shares.map((row) => [row.segment, row.share]));
  const total = shares.reduce((sum, row) => sum + row.members, 0) || scored.length;
  const segments = [...bySegment.entries()].sort(
    (a, b) => (countOf.get(b[0]) ?? b[1].length) - (countOf.get(a[0]) ?? a[1].length),
  );

  return (
    <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Eyebrow>Who returns · RFM</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">
            {total} scored member{total === 1 ? "" : "s"}
          </h2>
        </div>
        <Tag label="RFM and lifecycle scoring" gate={gate} />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        Recency, frequency and spend, each scored one to five against your own customers rather than an industry average.
      </p>
      <div className="mt-5">
        <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="RFM scores" rows={2}>
          {segments.length === 0 ? (
            <p className="text-sm text-[var(--muted-strong)]">Nobody scored yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {segments.map(([segment, members]) => (
                <article key={segment} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-extrabold">{segment}</p>
                    <p className="text-lg font-extrabold">
                      {countOf.get(segment) ?? members.length}
                      {shareOf.has(segment) && (
                        <span className="ml-1 text-[11px] font-bold text-[var(--muted-strong)]">{shareOf.get(segment)}%</span>
                      )}
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {members.slice(0, 4).map((member) => (
                      <li key={member.customerId} className="flex justify-between gap-2 text-[11px]">
                        <span className="truncate">{member.name}</span>
                        <span className="shrink-0 font-mono text-[var(--muted-strong)]">
                          {member.recencyScore}{member.frequencyScore}{member.monetaryScore}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {members.length > 4 && <p className="mt-2 text-[10px] text-[var(--muted)]">and {members.length - 4} more</p>}
                </article>
              ))}
            </div>
          )}
        </QueryBoundary>
      </div>
    </section>
  );
}

function WhatTheySaid() {
  const { data: feedback = [] } = useFeedback();
  const answered = feedback.filter((entry) => entry.status === "answered");
  if (feedback.length === 0) return null;
  const average = answered.length === 0 ? 0 : answered.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / answered.length;
  const worstFirst = [...answered].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));

  return (
    <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>What they said</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">{answered.length} of {feedback.length} answered</h2>
        </div>
        {answered.length > 0 && (
          <Pill tone={average >= 4 ? "success" : average >= 3 ? "warning" : "danger"}>{average.toFixed(1)} average</Pill>
        )}
      </div>
      {answered.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted-strong)]">Nobody has answered yet.</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {worstFirst.slice(0, 6).map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${(entry.rating ?? 0) >= 4 ? "bg-[rgb(15_118_85/12%)] text-[var(--success)]" : "bg-[rgb(178_59_43/10%)] text-[var(--danger)]"}`}>
                {entry.rating}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed">{entry.comment || <span className="text-[var(--muted)]">No comment</span>}</p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  {relativeTime(entry.answeredAt)}
                  {entry.reviewInvited ? " · invited to review publicly" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Attributed, never incremental: a visit after a send, not proof it caused one. */
function CampaignAttributionTable({ gate }: { gate: Gate }) {
  const { data: campaigns = [], isPending, error, refetch } = useCampaignAttribution();
  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-end justify-between gap-3 px-6 pb-4 pt-6">
        <div>
          <Eyebrow>Campaign attribution</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">What each send brought back</h2>
        </div>
        <span className="flex items-center gap-2">
          <p className="text-xs text-[var(--muted-strong)]">Attributed, not incremental.</p>
          <Tag label="Campaign attribution and incremental revenue" gate={gate} />
        </span>
      </div>
      <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="campaign attribution" rows={3}>
        {campaigns.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-[var(--muted-strong)]">No campaign has been sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-y border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-6 py-3">Campaign</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Returned</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Attributed revenue</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Return on spend</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-6 py-4 text-sm font-extrabold">{campaign.name}</td>
                    <td className="px-4 py-4 text-sm">{campaign.sent}</td>
                    <td className="px-4 py-4 text-sm">{campaign.visited}</td>
                    <td className="px-4 py-4 text-sm font-bold">{campaign.conversionRate}%</td>
                    <td className="px-4 py-4 text-sm font-bold">{pesoFromCentavos(campaign.revenueCentavos)}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-strong)]">{pesoFromCentavos(campaign.costCentavos)}</td>
                    <td className="px-4 py-4">
                      {campaign.returnOnSpend === null ? (
                        <span className="text-xs text-[var(--muted-strong)]">No spend</span>
                      ) : (
                        <Pill tone={campaign.returnOnSpend >= 1 ? "success" : "warning"}>{campaign.returnOnSpend.toFixed(1)}&times;</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryBoundary>
    </section>
  );
}

function StaffPerformanceTable({ gate }: { gate: Gate }) {
  const { data: staff = [], isPending, error, refetch } = useStaffPerformance();
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Eyebrow>Staff performance</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">Stamps per staff</h2>
        </div>
        <Tag label="Staff and branch performance" gate={gate} />
      </div>
      <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="staff performance" rows={3}>
        {staff.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted-strong)]">No visits recorded yet.</p>
        ) : (
          <ul className="mt-5 divide-y divide-[var(--line)]">
            {staff.map((member) => (
              <li key={member.staffId} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold">{member.name}</span>
                  <span className="text-[11px] text-[var(--muted-strong)]">{member.role}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-extrabold">{pesoFromCentavos(member.valueCentavos)}</span>
                  <span className="text-[11px] text-[var(--muted-strong)]">{member.visits} visit{member.visits === 1 ? "" : "s"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </section>
  );
}

/** One row per branch, up to the plan's allowance; the API keeps the busiest. */
function BranchPerformanceTable({ gate }: { gate: Gate }) {
  const { data: page, isPending, error, refetch } = useBranchPerformance();
  const { data: locations = [] } = useLocations();
  const { data: reporting } = useBranchReporting();
  const { data: billing } = useBilling();
  const [sheet, setSheet] = useState<{ intent: QrPayment; branch: string } | null>(null);
  const [failure, setFailure] = useState("");
  const buy = useApiMutation((branchId: string) => retryOnce(() => purchaseBranchReporting(branchId)), {
    invalidates: [keys.business.analytics.branchReporting(), keys.business.analytics.branches(), keys.business.billing()],
  });
  const allowance = branchAllowance(gate.plan);
  const branches = page?.items ?? [];
  // The API says how many branches it counted and how many it reported;
  // the difference is what the plan withheld, not a guess from the
  // location list (which also counts branches with no visits at all).
  const hidden = page ? Math.max(0, page.total - branches.length) : 0;
  // The branches the plan is not reporting: every location the API did not
  // return a row for. Each can be bought separately at the published rate;
  // the plan's own allowance is never charged for.
  const reported = new Set(branches.map((branch) => branch.branchId));
  const withheld = allowance ? locations.filter((location) => !reported.has(location.id)) : [];
  const extraFor = (branchId: string) => reporting?.extras.find((extra) => extra.branchId === branchId);
  const buyBlocked = billing?.creditPurchasesOpen === true ? null : "Opens with billing";
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Eyebrow>Branch analytics</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">How each location is doing</h2>
        </div>
        <Tag label="Branch analytics" gate={gate} />
      </div>
      <p className="mt-1 text-xs text-[var(--muted-strong)]">
        {allowance ? `${allowance} branches reported on your plan` : "No per-branch reporting on Launch"}
        {locations.length ? ` · you have ${locations.length}` : ""}.
      </p>
      <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="branch performance" rows={3}>
        {branches.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted-strong)]">No visits recorded yet.</p>
        ) : (
          <ul className="mt-5 divide-y divide-[var(--line)]">
            {branches.map((branch) => (
              <li key={branch.branchId} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold">{branch.name}</span>
                  <span className="text-[11px] text-[var(--muted-strong)]">
                    {branch.city} &middot; {branch.members} member{branch.members === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-extrabold">{pesoFromCentavos(branch.valueCentavos)}</span>
                  <span className="text-[11px] text-[var(--muted-strong)]">{branch.visits} visit{branch.visits === 1 ? "" : "s"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {hidden > 0 && branches.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-[var(--muted-strong)]">
            {hidden} branch{hidden === 1 ? "" : "es"} not shown: past the allowance, the API reports the busiest.
          </p>
        )}
        {withheld.length > 0 && reporting && (
          <div className="mt-4 rounded-xl border border-[var(--line)] p-4">
            <p className="text-xs font-extrabold">
              Extra branch reporting · {pesoFromCentavos(reporting.priceCentavos)} a branch a month
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
              Separate visits, members and revenue for a branch beyond your plan&apos;s allowance. Branches themselves are never charged for; only the ones you pick here are.
            </p>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {withheld.map((location) => {
                const extra = extraFor(location.id);
                return (
                  <li key={location.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold">{location.name}</span>
                      <span className="text-[11px] text-[var(--muted-strong)]">
                        {extra?.status === "active"
                          ? `Reported · renews ${extra.renewsOn ? longDate(extra.renewsOn) : "monthly"}`
                          : extra?.status === "pending"
                            ? "Awaiting payment"
                            : "Not reported separately"}
                      </span>
                    </span>
                    {extra?.status === "active" ? (
                      <Pill tone="success">Reported</Pill>
                    ) : (
                      <Button
                        tone="quiet"
                        disabled={Boolean(buyBlocked) || buy.isPending}
                        title={buyBlocked ?? undefined}
                        onClick={() => {
                          setFailure("");
                          buy.mutate(location.id, {
                            onSuccess: (intent) => setSheet({ intent, branch: location.name }),
                            onError: (error) => setFailure(refusal(error)),
                          });
                        }}
                      >
                        {extra?.status === "pending" ? "Show QR again" : "Add reporting"}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {buyBlocked && (
              <p className="mt-2 text-[11px] font-semibold text-[var(--muted-strong)]">{buyBlocked}.</p>
            )}
            <FormMessage tone="error" className="mt-2">{failure}</FormMessage>
          </div>
        )}
      </QueryBoundary>
      {sheet && (
        <PaymentSheet
          intent={sheet.intent}
          title={`Extra branch reporting · ${sheet.branch}`}
          onClose={() => setSheet(null)}
        />
      )}
    </section>
  );
}

/** Where each member actually shops, from the customer list. Core. */
function HomeBranchTable({ gate }: { gate: Gate }) {
  const { data: customers = [] } = useBusinessCustomers();
  const counts = new Map<string, number>();
  for (const customer of customers) {
    const branch = customer.homeBranch || "Unattributed";
    counts.set(branch, (counts.get(branch) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Eyebrow>Home branch</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">Which branch a customer came from</h2>
        </div>
        <Tag label="Which branch a customer came from" gate={gate} />
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted-strong)]">No members yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-[var(--line)]">
          {rows.map(([branch, members]) => (
            <li key={branch} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="font-extrabold">{branch}</span>
              <span className="font-bold">{members} member{members === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AnalyticsView() {
  const gate = usePlanGate();
  const { data: programs = [] } = usePrograms();
  const { data: metrics = EMPTY_BUSINESS_METRICS, error: metricsError } = useBusinessMetrics();
  const rewardIssued = programs.reduce((sum, program) => sum + program.liabilityCentavos, 0);
  const { data: retentionData, isPending: retentionPending, error: retentionError, refetch: refetchRetention } = useRetention();
  const { data: secondVisit } = useTimeToSecondVisit();
  const retention = retentionData?.weeks ?? [];
  const cohorts = retentionData?.cohorts ?? [];

  return (
    <ViewFrame
      eyebrow="Retention intelligence"
      title="Analytics"
      description="Measure the return visit, not vanity reach. Basic on Launch; every panel is here on every plan, and what your plan does not include says so."
    >
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Eyebrow>Visits, return rate and frequency</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Customers who return</h2>
            </div>
            <span className="flex items-center gap-2">
              {secondVisit && secondVisit.members > 0 ? (
                <Pill tone="success">{secondVisit.medianDays}d median to a second visit</Pill>
              ) : null}
              <Tag label="Visits, return rate, and frequency" gate={gate} />
            </span>
          </div>
          <div className="mt-10">
            <QueryBoundary isPending={retentionPending} error={retentionError} onRetry={refetchRetention} label="retention" rows={1}>
              <div className="flex h-64 items-end gap-3">
                {retention.map((value, index) => (
                  <div key={index} className="flex h-full flex-1 flex-col justify-end">
                    <span className="mb-2 text-center text-xs font-extrabold">{value}%</span>
                    <div className={`rounded-t-xl ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`} style={{ height: `${value}%` }} />
                    <span className="mt-2 text-center text-[10px] text-[var(--muted)]">W{index}</span>
                  </div>
                ))}
              </div>
            </QueryBoundary>
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow>Program and reward performance</Eyebrow>
            <Tag label="Program and reward performance" gate={gate} />
          </div>
          {metricsError ? (
            <p className="mt-7 text-sm leading-relaxed text-white/65">{metricsError.message}</p>
          ) : (
            <>
              <p className="mt-7 text-4xl font-extrabold tracking-[-0.03em]">{pesoCompactFromCentavos(metrics.memberRevenueCentavos)}</p>
              <p className="mt-1 text-xs text-white/55">member-attributed revenue this month</p>
              <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
                {[
                  ["Campaign-attributed", pesoCompactFromCentavos(metrics.campaignRevenueCentavos)],
                  ["Average member order", pesoFromCentavos(metrics.averageOrderCentavos)],
                  ["Repeat visit rate", `${metrics.repeatRate}%`],
                  ["Redemptions", String(metrics.redemptions)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-white/55">{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="mt-6 rounded-2xl border border-white/12 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">Reward liability</p>
              <Tag label="Reward liability" gate={gate} />
            </div>
            <p className="mt-2 text-2xl font-extrabold">{pesoFromCentavos(rewardIssued)}</p>
            <p className="mt-1 text-xs text-white/55">
              What outstanding rewards would cost if every customer claimed them tomorrow
              {rewardIssued > 0 && !metricsError ? ` · ${(metrics.memberRevenueCentavos / rewardIssued).toFixed(1)}× covered by member revenue` : ""}.
            </p>
          </div>
        </section>
      </div>
      <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <Eyebrow>Cohorts and time to second visit</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">First visit month → weeks retained</h2>
          </div>
          <Tag label="Cohorts and time to second visit" gate={gate} />
        </div>
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[660px]">
            <div className="grid grid-cols-[120px_repeat(6,1fr)] gap-1 text-center text-[10px] font-bold text-[var(--muted)]">
              <span />
              {[0, 1, 2, 3, 4, 5].map((week) => (
                <span key={week}>W{week}</span>
              ))}
            </div>
            {cohorts.length === 0 ? (
              <p className="mt-4 text-xs text-[var(--muted-strong)]">
                {retentionError ? retentionError.message : "Not enough history yet. A cohort needs a few weeks of visits before it says anything."}
              </p>
            ) : (
              <div className="mt-1 grid grid-cols-[120px_repeat(6,1fr)] gap-1">
                <span className="flex items-center text-xs font-bold">Active members</span>
                {cohorts.map((cell) => {
                  const peak = Math.max(...cohorts.map((item) => item.active), 1);
                  const share = Math.round((cell.active / peak) * 100);
                  return (
                    <span
                      key={cell.week}
                      className="grid min-h-12 place-items-center rounded-lg text-xs font-extrabold"
                      style={{
                        backgroundColor: cell.active ? `rgb(232 163 61 / ${0.12 + share / 130})` : "var(--surface-2)",
                        color: share > 55 ? "var(--ink)" : "var(--muted-strong)",
                      }}
                    >
                      {cell.active || "—"}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {secondVisit && secondVisit.members > 0 && (
          <p className="mt-4 text-xs text-[var(--muted-strong)]">
            Median {secondVisit.medianDays} day{secondVisit.medianDays === 1 ? "" : "s"} to a second visit, average {secondVisit.averageDays}, across {secondVisit.members} member{secondVisit.members === 1 ? "" : "s"}.
          </p>
        )}
      </section>
      <SegmentBreakdown gate={gate} />
      <CampaignAttributionTable gate={gate} />
      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <StaffPerformanceTable gate={gate} />
        <BranchPerformanceTable gate={gate} />
        <HomeBranchTable gate={gate} />
      </div>
      <WhatTheySaid />
    </ViewFrame>
  );
}
