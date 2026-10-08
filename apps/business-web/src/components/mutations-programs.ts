"use client";

/**
 * The program-settings writes: tiers, catalog items and gift cards.
 *
 * Kept apart from `mutations.ts` so the settings screens and the counter can
 * change at the same time without touching one file. Same rule as there: the
 * narrowest prefix that is still correct. Each of these moves a program's
 * liability figure, so the programs list is refetched with it.
 */

import {
  addCatalogItem,
  deleteTier,
  issueGiftCard,
  keys,
  refundGiftCard,
  updateCatalogItem,
  updateTier,
  useApiMutation,
  voidGiftCard,
} from "@kyprewards/api";

export const useUpdateTier = () =>
  useApiMutation(
    ({ programId, tierId, ...body }: { programId: string; tierId: string } & Parameters<typeof updateTier>[2]) =>
      updateTier(programId, tierId, body),
    { invalidates: [keys.business.programs()] },
  );

export const useDeleteTier = () =>
  useApiMutation(
    ({ programId, tierId }: { programId: string; tierId: string }) => deleteTier(programId, tierId),
    { invalidates: [keys.business.programs()] },
  );

/** With its kind: the shared hook predates "discount" items. */
export const useAddCatalogItem = () =>
  useApiMutation(
    ({ programId, ...body }: { programId: string } & Parameters<typeof addCatalogItem>[1]) =>
      addCatalogItem(programId, body),
    { invalidates: [keys.business.programs()] },
  );

/** Edits an item, or retires and restores it with `active`. */
export const useUpdateCatalogItem = () =>
  useApiMutation(
    ({ programId, itemId, ...body }: { programId: string; itemId: string } & Parameters<typeof updateCatalogItem>[2]) =>
      updateCatalogItem(programId, itemId, body),
    { invalidates: [keys.business.programs()] },
  );

/** Issuing loads money onto a card, so the program's liability moves too. */
export const useIssueGiftCard = () =>
  useApiMutation(issueGiftCard, {
    invalidates: [keys.business.giftCards(), keys.business.programs()],
  });

export const useRefundGiftCard = () =>
  useApiMutation(
    ({ code, ...body }: { code: string; amountCentavos: number; reason?: string }) =>
      refundGiftCard(code, body),
    { invalidates: [keys.business.giftCards(), keys.business.programs()] },
  );

export const useVoidGiftCard = () =>
  useApiMutation(
    ({ code, reason }: { code: string; reason?: string }) => voidGiftCard(code, { reason }),
    { invalidates: [keys.business.giftCards(), keys.business.programs()] },
  );
