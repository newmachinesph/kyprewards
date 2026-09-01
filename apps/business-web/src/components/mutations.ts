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
  addTier,
  addCustomField,
  cancelMembership,
  cancelRedemption,
  claimReferral,
  createCustomer,
  createReferral,
  decideApproval,
  issueCoupon,
  importCustomers,
  issueGiftCard,
  purchaseMultipass,
  redeemCatalogItem,
  raiseSupportRequest,
  redeemCoupon,
  refundVisit,
  requestFeedback,
  sendCampaignTest,
  redeemGiftCard,
  qualifyReferral,
  requestApproval,
  setBrandingColor,
  setCustomFieldValues,
  subscribeMembership,
  transferGiftCard,
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
 * Give a settled sale back.
 *
 * `void` is the counter cancelling what it just took; this is the reversal of
 * something already settled, which is why it lives on the ledger screen and
 * not on the till. Same idempotency rule: a double tap must not refund twice.
 */
export const useRefundVisit = () =>
  useApiMutation(
    ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      refundVisit(id, idempotencyKey),
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

/** One question by email after a visit, answered without an account. */
/** To yourself, before you send it to thousands of people. */
export const useSendCampaignTest = () => useApiMutation(sendCampaignTest);

/** Raises a real ticket in the platform's support queue. */
export const useRaiseSupportRequest = () => useApiMutation(raiseSupportRequest);

export const useRequestFeedback = () =>
  useApiMutation(requestFeedback, { invalidates: [keys.business.feedback()] });

export const useRedeemCoupon = () =>
  useApiMutation(redeemCoupon, { invalidates: [keys.business.all] });

/** Hands a card to a different holder. Balance and history travel with it. */
export const useTransferGiftCard = () =>
  useApiMutation(
    ({ code, ...body }: { code: string; toAccountId: string; toName?: string }) =>
      transferGiftCard(code, body),
    { invalidates: [keys.business.giftCards()] },
  );

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

/**
 * End a recurring membership.
 *
 * A staff capability rather than a customer one - the API asks for
 * `customers:write` - so the till is where it belongs, next to the benefit it
 * stops paying out.
 */
export const useCancelMembership = () =>
  useApiMutation(cancelMembership, { invalidates: [keys.business.all] });

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

export const useAddTier = () =>
  useApiMutation(
    ({ programId, ...body }: { programId: string; name: string; threshold: number; rateBps: number }) =>
      addTier(programId, body),
    // The programs prefix covers every program's tier list; the ladder a tier
    // joins also changes what the program earns, so both want refetching.
    { invalidates: [keys.business.programs()] },
  );

export const useRedeemCatalogItem = () =>
  useApiMutation(redeemCatalogItem, { invalidates: [keys.business.all] });

export const useCreateReferral = () =>
  useApiMutation(createReferral, { invalidates: [keys.business.referrals()] });

/**
 * The other two thirds of a two-sided referral.
 *
 * Issuing a code was wired and nothing could ever redeem one: a friend's
 * claim and the qualifying visit that actually pays both sides had no way in.
 * Both are counter actions - the API asks for staff capabilities, not the
 * customer's.
 */
export const useClaimReferral = () =>
  useApiMutation(claimReferral, { invalidates: [keys.business.referrals()] });

export const useQualifyReferral = () =>
  useApiMutation(qualifyReferral, { invalidates: [keys.business.all] });

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

/**
 * The wallet card's colour token.
 *
 * `PUT /business/branding` and its accessor both existed; the profile dialog
 * only ever sent the photo, so the colour half of "Custom branding" could not
 * be changed from anywhere in the product.
 */
export const useSetBrandingColor = () =>
  useApiMutation(setBrandingColor, { invalidates: [keys.business.branding()] });

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
