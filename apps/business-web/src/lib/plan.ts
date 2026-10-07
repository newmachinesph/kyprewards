"use client";

/**
 * Plan gating, read from the API's plan and the mirrored `plans.ts`.
 *
 * Every tier's feature renders its full screen; what a plan changes is
 * whether the writes on it are enabled. The tier a feature needs comes from
 * `featureMatrix`, never from a number typed into a view.
 */

import {
  ApiError,
  PREVIEW_WRITE_REASON,
  useBusinessProfile,
  type PlanName,
} from "@kyprewards/api";
import { PLAN_RANK } from "@kyprewards/api/forms";
import { featureMatrix, planLimits, plans } from "@kyprewards/ui/plans";

export const PLAN_NAMES = plans.map((plan) => plan.name) as PlanName[];

const rank = (plan: string) => Math.max(0, PLAN_RANK.indexOf(plan));

/** One cell of the feature matrix, by row label and plan. */
export function matrixCell(label: string, plan: PlanName) {
  for (const group of featureMatrix) {
    const row = group.rows.find((entry) => entry.label === label);
    if (row) return row.cells[rank(plan)];
  }
  return undefined;
}

/** `"15"` → 15, `"Unlimited"` → 0 (the API's own convention for no cap). */
const cellCount = (cell: unknown) =>
  typeof cell === "string" && /^\d/.test(cell) ? Number(cell.replace(/,/g, "")) : 0;

export const staffCap = (plan: PlanName) => cellCount(matrixCell("Staff accounts", plan));
export const programCap = (plan: PlanName) =>
  cellCount(matrixCell("Active programs at once", plan));
export const branchAllowance = (plan: PlanName) => planLimits[rank(plan)].branchAnalytics;
export const pushAllowance = (plan: PlanName) => planLimits[rank(plan)].push;
export const emailAllowance = (plan: PlanName) => planLimits[rank(plan)].email;

/** The lowest plan whose matrix cell for `label` is not `false`. */
export function planFor(label: string): PlanName {
  for (const group of featureMatrix) {
    const row = group.rows.find((entry) => entry.label === label);
    if (!row) continue;
    const index = row.cells.findIndex((cell) => cell !== false);
    return PLAN_NAMES[index < 0 ? 0 : index];
  }
  return "Launch";
}

export type Gate = {
  /** The workspace's plan, as the API reports it. */
  plan: PlanName;
  covers: (needed: PlanName) => boolean;
  /** `null` when the plan covers it; the helper text otherwise. */
  reason: (needed: PlanName) => string | null;
};

export function usePlanGate(): Gate {
  const { data: profile } = useBusinessProfile();
  const plan = profile?.plan ?? "Launch";
  const covers = (needed: PlanName) => rank(needed) <= rank(plan);
  return {
    plan,
    covers,
    reason: (needed) => (covers(needed) ? null : `Opens with ${needed}`),
  };
}

/**
 * Why a write is disabled, in priority order: the plan first (the merchant
 * can act on that), then the preview flag. `null` means the button is live.
 */
export function writeBlock(
  gate: Gate,
  needed: PlanName | null,
  preview: boolean,
): string | null {
  if (needed && !gate.covers(needed)) return gate.reason(needed);
  if (preview) return PREVIEW_WRITE_REASON;
  return null;
}

/** A 402 is a plan gate, worded as one. Anything else is the API's message. */
export function refusal(failure: unknown, needed?: PlanName): string {
  if (failure instanceof ApiError && failure.status === 402) {
    return needed ? `Opens with ${needed}.` : failure.message;
  }
  return failure instanceof Error ? failure.message : "That did not work.";
}

/**
 * A 429 is wait and retry once. `Retry-After` is not exposed on the error, so
 * the wait is a fixed two seconds, which is what the limiter's window needs.
 */
export async function retryOnce<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (failure) {
    if (!(failure instanceof ApiError) || failure.status !== 429) throw failure;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return call();
  }
}
