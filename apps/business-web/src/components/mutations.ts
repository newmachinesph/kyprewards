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
  updateBusinessProfile,
  updateProgram,
  type CampaignDraft,
  type ProgramDraft,
  type StaffInvite,
  type ToggleResult,
} from "@kypstamping/api";
import type { Program } from "@kypstamping/demo-data";

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
