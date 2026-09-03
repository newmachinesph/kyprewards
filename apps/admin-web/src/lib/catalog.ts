/**
 * The add-ons, credit rates and founding offer as the pricing page sells them.
 *
 * `apps/marketing-site/src/lib/plans.ts` is the spec and this mirrors its
 * numbers in centavos. It lives here because the admin app cannot import
 * another app's source; the day `packages/ui` or `packages/api` exports the
 * catalogue, this file goes.
 */

import type { AddOnSubscription } from "@kypstamping/api";

export type AddOnKey = AddOnSubscription["addOn"] | "email_topup";

export const ADD_ONS: {
  key: AddOnKey;
  name: string;
  priceCentavos: number;
  unit: string;
  plans: string;
  detail: string;
}[] = [
  {
    key: "featured",
    name: "Featured in Discover",
    priceCentavos: 29_900,
    unit: "a month",
    plans: "Launch and Core; included on Grow and Scale",
    detail: "Priority placement in the customer app's Discover list, above the ordinary distance ordering.",
  },
  {
    key: "branch_reporting",
    name: "Extra branch reporting",
    priceCentavos: 15_000,
    unit: "a branch, a month",
    plans: "Core and up",
    detail: "Separate visits, members and revenue for a branch beyond the plan's allowance. Branches themselves are never charged for.",
  },
  {
    key: "setup",
    name: "Setup with a person",
    priceCentavos: 150_000,
    unit: "once · free in beta",
    plans: "Any plan",
    detail: "Read the application, configure the first program with the owner, check the counter flow on their phone. Every founding merchant gets it free.",
  },
  {
    key: "email_topup",
    name: "Email top-up",
    priceCentavos: 2_500,
    unit: "per 1,000",
    plans: "Core and up",
    detail: "Past the monthly campaign allowance. Never cut off mid-send, never pushed up a tier to finish a month.",
  },
];

/** SMS is bought, never bundled. Per segment, in centavos. */
export const SMS_RATES = [
  { bundle: "Pay as you go", segments: null, perSegmentCentavos: 95, totalCentavos: null },
  { bundle: "1,000 segments", segments: 1000, perSegmentCentavos: 90, totalCentavos: 90_000 },
  { bundle: "5,000 segments", segments: 5000, perSegmentCentavos: 85, totalCentavos: 425_000 },
] as const;

/** Core free for three months when it opens, for anyone approved in the beta. */
export const FOUNDING = {
  coreMonthlyCentavos: 49_900,
  freeMonths: 3,
  /** Last day a decision still makes a founding merchant. */
  closesOn: "2026-12-31",
  note: "Core free for three months when it opens",
} as const;

/** Founding status applies to a decision made on or before the closing day. */
export const foundingWindowOpen = (now: Date = new Date()): boolean =>
  now.toISOString().slice(0, 10) <= FOUNDING.closesOn;

/** Tenant ids read `ten_<merchantId>`; add-ons and onboarding carry the bare merchantId. */
export const merchantIdOf = (tenant: { id: string; businessId?: string }): string =>
  tenant.id.replace(/^ten_/, "");
