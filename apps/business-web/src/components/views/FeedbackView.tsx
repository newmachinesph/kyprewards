"use client";

import { useState } from "react";
import { useFeedback } from "@kypstamping/api";
import { Eyebrow, Pill, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { Chip } from "@kypstamping/ui/form";
import { relativeTime } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { planFor, usePlanGate } from "@/lib/plan";

const NEEDS = planFor("Private feedback and review requests");

/** The filters, in the order a merchant reaches for them: the bad ones first. */
const FILTERS = ["All", "Unhappy", "Happy", "Waiting"] as const;
type Filter = (typeof FILTERS)[number];

/** Below this a rating is a complaint, and the API keeps it private. */
const UNHAPPY_BELOW = 4;

function matches(
  entry: { status: string; rating: number | null },
  filter: Filter,
): boolean {
  if (filter === "All") return true;
  if (filter === "Waiting") return entry.status === "requested";
  if (entry.status !== "answered") return false;
  const rating = entry.rating ?? 0;
  return filter === "Unhappy" ? rating < UNHAPPY_BELOW : rating >= UNHAPPY_BELOW;
}

/**
 * Every answer, not the six worst.
 *
 * Analytics shows the average and the ones that need a reply; this is the
 * whole record, which is what a merchant asks for when somebody complained
 * last month and they want to know whether it was a one-off.
 */
export function FeedbackView() {
  const gate = usePlanGate();
  const { data: feedback = [], isPending, error, refetch } = useFeedback({
    enabled: gate.covers(NEEDS),
  });
  const [filter, setFilter] = useState<Filter>("All");

  const answered = feedback.filter((entry) => entry.status === "answered");
  const average =
    answered.length === 0
      ? 0
      : answered.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / answered.length;

  // The API pages by id, which is random, so the order it returns is not the
  // order anything happened in. Newest first is what this screen is read in.
  const rows = feedback
    .filter((entry) => matches(entry, filter))
    .sort(
      (a, b) =>
        Date.parse(b.answeredAt ?? b.requestedAt) -
        Date.parse(a.answeredAt ?? a.requestedAt),
    );

  return (
    <ViewFrame
      eyebrow="What they said"
      title="Customer feedback"
      description="Every private answer, newest first. Feedback stays between you and the customer; only a rating of four or more is invited to post a public review."
      action={<PlanTag plan={NEEDS} included={gate.covers(NEEDS)} />}
    >
      {!gate.covers(NEEDS) ? (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="text-sm text-[var(--muted-strong)]">
            {gate.reason(NEEDS)}
          </p>
        </section>
      ) : (
        <>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div>
              <Eyebrow>Answered</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">
                {answered.length} of {feedback.length} asked
              </h2>
            </div>
            {answered.length > 0 && (
              <Pill
                tone={average >= 4 ? "success" : average >= 3 ? "warning" : "danger"}
              >
                {average.toFixed(1)} average
              </Pill>
            )}
          </section>

          <section className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <div role="group" aria-label="Customer feedback" className="flex flex-wrap gap-2 border-b border-[var(--line)] p-4">
              {FILTERS.map((item) => (
                <Chip key={item} pressed={filter === item} onClick={() => setFilter(item)}>
                  {item}
                </Chip>
              ))}
            </div>
            <div className="p-4">
              <QueryBoundary
                isPending={isPending}
                error={error}
                onRetry={refetch}
                label="customer feedback"
                rows={4}
              >
                {rows.length === 0 ? (
                  <p className="p-2 text-sm text-[var(--muted-strong)]">
                    {feedback.length === 0
                      ? "Nobody has been asked yet. Ask a customer after their visit and their answer lands here."
                      : "Nothing under this filter."}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {rows.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-4"
                      >
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                            entry.status !== "answered"
                              ? "bg-[var(--paper)] text-[var(--muted)]"
                              : (entry.rating ?? 0) >= UNHAPPY_BELOW
                                ? "bg-[rgb(15_118_85/12%)] text-[var(--success)]"
                                : "bg-[rgb(178_59_43/10%)] text-[var(--danger)]"
                          }`}
                        >
                          {entry.status === "answered" ? entry.rating : "–"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold">
                            {entry.customer || "A customer"}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed">
                            {entry.status !== "answered" ? (
                              <span className="text-[var(--muted)]">
                                Asked, no answer yet
                              </span>
                            ) : (
                              entry.comment || (
                                <span className="text-[var(--muted)]">
                                  Rated, no comment
                                </span>
                              )
                            )}
                          </p>
                          <p className="mt-1.5 text-[10px] text-[var(--muted)]">
                            {relativeTime(entry.answeredAt ?? entry.requestedAt)}
                            {entry.reviewInvited ? " · invited to review publicly" : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </QueryBoundary>
            </div>
          </section>
        </>
      )}
    </ViewFrame>
  );
}
