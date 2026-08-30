"use client";

/**
 * Every write this app makes, with the queries it invalidates.
 *
 * They live together rather than beside their call sites so that "what does
 * this change" is answerable by reading one file. The rule is the narrowest
 * prefix that is still correct: renaming a staff member should not refetch
 * the customer list, and toggling an automation should not refetch billing.
 *
 * `useApiMutation` handles the invalidation; these just name it.
 */

import {
  keys,
  useApiMutation,
  createCampaign,
  createProgram,
  duplicateProgram,
  inviteStaff,
  recordTestStamp,
  recordVisit,
  toggleAutomation,
  toggleIntegration,
  addCatalogItem,
  addCustomField,
  cancelRedemption,
  createCustomer,
  createReferral,
  decideApproval,
  issueCoupon,
  importCustomers,
  issueGiftCard,
  purchaseMultipass,
  redeemCatalogItem,
  redeemCoupon,
  redeemGiftCard,
  requestApproval,
  setCustomFieldValues,
  subscribeMembership,
  useMembershipBenefit,
  useMultipass,
  commitRedemption,
  reserveRedemption,
  setMessagingPolicy,
  setSetting,
  updateBusinessProfile,
  updateLocation,
  voidVisit,
  uploadBrandingImage,
  updateProgram,
  type CampaignDraft,
  type ProgramDraft,
  type StaffInvite,
  type ToggleResult,
} from "@kypstamping/api";
import type { Program } from "@kypstamping/api";

export const useToggleAutomation = () =>
  useApiMutation<ToggleResult, string>(toggleAutomation, {
    invalidates: [keys.business.automations()],
  });

export const useToggleIntegration = () =>
  useApiMutation<ToggleResult, string>(toggleIntegration, {
    invalidates: [keys.business.integrations()],
  });

export const useCreateProgram = () =>
  useApiMutation((body: ProgramDraft) => createProgram(body), {
    invalidates: [keys.business.programs()],
  });

export const useUpdateProgram = () =>
  useApiMutation(
    ({ id, patch }: { id: string; patch: Partial<ProgramDraft> }) => updateProgram(id, patch),
    {
      // A program's target and reward feed the liability figure on the
      // analytics screen, so that goes too.
      invalidates: [keys.business.programs(), keys.business.metrics()],
    },
  );

export const useDuplicateProgram = () =>
  useApiMutation<Program, string>(duplicateProgram, {
    invalidates: [keys.business.programs()],
  });

export const useCreateCampaign = () =>
  useApiMutation((body: CampaignDraft) => createCampaign(body), {
    // A scheduled campaign shows up in the message log as it sends.
    invalidates: [keys.business.campaigns(), keys.business.messages()],
  });

export const useInviteStaff = () =>
  useApiMutation((body: StaffInvite) => inviteStaff(body), {
    invalidates: [keys.business.staff()],
  });

export const useUpdateProfile = () =>
  useApiMutation(updateBusinessProfile, { invalidates: [keys.business.profile()] });

/**
 * The storefront photo customers see on the discover card.
 *
 * The API answers with a freshly signed URL, so the cache has to take the
 * response rather than keep the one it already had - the old link is for the
 * old object and expires on its own schedule.
 */
/**
 * A workspace toggle. Optimistic, because a switch that waits for the network
 * to move reads as broken - and the whole payload is one boolean.
 */
/**
 * Undo a stamp. Same scope as recording one, for the same reason: it moves
 * the customer's balance, today's counters, and whatever reward it earned.
 */
export const useVoidVisit = () =>
  useApiMutation(
    ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      voidVisit(id, idempotencyKey),
    { invalidates: [keys.business.all] },
  );

/**
 * Take a reward out of circulation without spending it.
 *
 * Nothing leaves the customer's balance until the commit, so a counter that
 * reserves and then loses power gives the reward back rather than eating it.
 */
export const useReserveRedemption = () =>
  useApiMutation(
    ({ idempotencyKey, ...body }: Parameters<typeof reserveRedemption>[0] & {
      idempotencyKey: string;
    }) => reserveRedemption(body, idempotencyKey),
    { invalidates: [keys.business.all] },
  );

export const useCommitRedemption = () =>
  useApiMutation(
    ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      commitRedemption(id, idempotencyKey),
    { invalidates: [keys.business.all] },
  );

export const useCancelRedemption = () =>
  useApiMutation(cancelRedemption, { invalidates: [keys.business.all] });

/* ── The other program types ──────────────────────────────────────────
   Each settles differently, and all of them move the same three things: the
   customer's balance, today's counters, and the reward that may follow. The
   workspace is the honest invalidation scope for every one. */

/** Someone standing at the counter who has no wallet yet. */
export const useCreateCustomer = () =>
  useApiMutation(createCustomer, { invalidates: [keys.business.customers()] });

/**
 * A CSV of regulars off the old paper cards.
 *
 * Someone whose number already has a wallet is joined rather than
 * duplicated, so a merchant can re-import the same file without splitting
 * anybody's history.
 */
export const useImportCustomers = () =>
  useApiMutation(importCustomers, { invalidates: [keys.business.all] });

export const useRedeemCoupon = () =>
  useApiMutation(redeemCoupon, { invalidates: [keys.business.all] });

export const useRedeemGiftCard = () =>
  useApiMutation(
    ({ code, ...body }: { code: string; amountCentavos: number; reason?: string }) =>
      redeemGiftCard(code, body),
    { invalidates: [keys.business.all] },
  );

export const useUseMultipass = () =>
  useApiMutation(useMultipass, { invalidates: [keys.business.all] });

export const useUseBenefit = () =>
  useApiMutation(useMembershipBenefit, { invalidates: [keys.business.all] });

export const useSubscribeMembership = () =>
  useApiMutation(subscribeMembership, { invalidates: [keys.business.all] });

export const usePurchaseMultipass = () =>
  useApiMutation(purchaseMultipass, { invalidates: [keys.business.all] });

export const useIssueCoupon = () =>
  useApiMutation(issueCoupon, { invalidates: [keys.business.coupons()] });

export const useIssueGiftCard = () =>
  useApiMutation(issueGiftCard, { invalidates: [keys.business.giftCards()] });

export const useAddCatalogItem = () =>
  useApiMutation(
    ({ programId, ...body }: { programId: string; name: string; costUnits: number; valueCentavos?: number }) =>
      addCatalogItem(programId, body),
    { invalidates: [keys.business.programs()] },
  );

export const useRedeemCatalogItem = () =>
  useApiMutation(redeemCatalogItem, { invalidates: [keys.business.all] });

export const useCreateReferral = () =>
  useApiMutation(createReferral, { invalidates: [keys.business.referrals()] });

export const useAddCustomField = () =>
  useApiMutation(addCustomField, { invalidates: [keys.business.customFields()] });

export const useSetCustomFieldValues = () =>
  useApiMutation(
    ({ customerId, values }: { customerId: string; values: Record<string, string> }) =>
      setCustomFieldValues(customerId, values),
    { invalidates: [keys.business.customers()] },
  );

export const useDecideApproval = () =>
  useApiMutation(
    ({ id, ...body }: { id: string; approve: boolean; reason?: string }) =>
      decideApproval(id, body),
    { invalidates: [keys.business.approvals()] },
  );

export const useRequestApproval = () =>
  useApiMutation(requestApproval, { invalidates: [keys.business.approvals()] });

export const useSetSetting = () =>
  useApiMutation(
    ({ key, value }: { key: string; value: boolean }) => setSetting(key, value),
    { invalidates: [keys.business.settings()] },
  );

export const useSetMessagingPolicy = () =>
  useApiMutation(setMessagingPolicy, { invalidates: [keys.business.messagingPolicy()] });

export const useUpdateLocation = () =>
  useApiMutation(
    ({ id, ...body }: { id: string } & Parameters<typeof updateLocation>[1]) =>
      updateLocation(id, body),
    { invalidates: [keys.business.locations()] },
  );

export const useUploadBrandingImage = () =>
  useApiMutation(uploadBrandingImage, { invalidates: [keys.business.branding()] });

/**
 * A stamp moves nearly everything a merchant looks at: the customer's balance
 * and last visit, today's counters, and the reward that may have just been
 * earned. This is the one write where the whole workspace is the right scope.
 */
export const useRecordVisit = () =>
  useApiMutation(
    ({ idempotencyKey, ...body }: Parameters<typeof recordVisit>[0] & { idempotencyKey: string }) =>
      recordVisit(body, idempotencyKey),
    { invalidates: [keys.business.all] },
  );

export const useRecordTestStamp = () =>
  useApiMutation(recordTestStamp, { invalidates: [keys.business.all] });
