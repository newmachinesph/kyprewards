"use client";

/**
 * The counter's keyed writes for the program types beyond the stamp card.
 *
 * Same rule as `mutations.ts`: each one moves a balance the till shows, so
 * the workspace is the honest invalidation scope. Every one that takes money
 * or units takes an idempotency key, so a second tap replays the first.
 */

import {
  keys,
  useApiMutation,
  redeemCatalogItem,
  renewMembership,
  subscribeMembership,
  spendCashback,
  voidMultipassEntry,
} from "@kyprewards/api";

/** The workspace, and the counter's balance read, which lives under its own key. */
const COUNTER = [keys.business.all, keys.counter.all];

/** Sell or restart a membership, keyed so a retried tap takes one payment. */
export const useSubscribeMembershipKeyed = () =>
  useApiMutation(
    ({ body, idempotencyKey }: { body: { customerId: string; programId: string }; idempotencyKey: string }) =>
      subscribeMembership(body, idempotencyKey),
    { invalidates: COUNTER },
  );

export const useRenewMembership = () =>
  useApiMutation(
    ({ subscriptionId, idempotencyKey }: { subscriptionId: string; idempotencyKey: string }) =>
      renewMembership(subscriptionId, idempotencyKey),
    { invalidates: COUNTER },
  );

/** Undo a multipass sale or use the till just made, by its entry id. */
export const useVoidMultipassEntry = () =>
  useApiMutation(voidMultipassEntry, { invalidates: COUNTER });

export const useSpendCashback = () =>
  useApiMutation(
    ({
      idempotencyKey,
      ...body
    }: Parameters<typeof spendCashback>[0] & { idempotencyKey: string }) =>
      spendCashback(body, idempotencyKey),
    { invalidates: COUNTER },
  );

/** Spends the units and holds a reward; the till then reserves it. */
export const useChooseCatalogItem = () =>
  useApiMutation(
    ({
      idempotencyKey,
      ...body
    }: Parameters<typeof redeemCatalogItem>[0] & { idempotencyKey: string }) =>
      redeemCatalogItem(body, idempotencyKey),
    { invalidates: COUNTER },
  );
