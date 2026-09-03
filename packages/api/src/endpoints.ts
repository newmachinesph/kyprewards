/**
 * Every read the four apps make, as one function each.
 *
 * This is the file `@kypstamping/demo-data`'s accessor seam was a placeholder
 * for. The signatures are the same — async, returning the narrowed types —
 * so the hooks in `queries.ts` did not change when they moved across.
 *
 * It lives in this package rather than in `demo-data` because `demo-data`
 * imports the fixture JSON, and a module that reaches for a bundler cannot be
 * unit-tested in bare Node. Nothing here imports anything but `http` and the
 * types, which is what makes `contract.test.ts` able to call the real service.
 *
 * Paths are relative to `NEXT_PUBLIC_API_BASE`, which already ends in
 * `/api/v1`.
 */

import { apiBase, http, toApiError } from "./http.ts";
import type { HttpOptions } from "./http.ts";
import type {
  Adapter,
  ActivityEntry,
  ApiContract,
  AuditEvent,
  Automation,
  ApprovalRequest,
  Benefit,
  Billing,
  Branding,
  CatalogItem,
  CounterTransaction,
  Coupon,
  CustomField,
  Administrator,
  CustomFieldValue,
  DataRequest,
  DeliveryDetail,
  DiscountQuote,
  Feedback,
  FirstStampOffer,
  GiftCard,
  GiftCardEntry,
  HeldProgram,
  MemberSubscription,
  InvitePreview,
  MessagingPolicy,
  BusinessCustomer,
  BusinessLocation,
  AudienceChannel,
  BusinessMetrics,
  BusinessProfile,
  Campaign,
  ChannelEconomics,
  ChannelPreferences,
  Environment,
  ConsentEntry,
  CustomerNotification,
  CustomerProfile,
  DiscoverPlace,
  FavoriteOrder,
  Integration,
  MessageRecord,
  OpeningHours,
  PlanEconomics,
  PlatformMetrics,
  Program,
  ProgramTier,
  NearbyNudge,
  PartnerApplication,
  OnboardingRow,
  OfflineSyncResult,
  OfflineVisit,
  RecoveryItem,
  ProviderPolicy,
  Referral,
  SupportRequest,
  Redemption,
  RedemptionResult,
  ServiceHealth,
  AccountKind,
  SessionInfo,
  StaffMember,
  SupportTicket,
  Tenant,
  TenantConnection,
  WalletCard,
  Workspace,
} from "./types.ts";

/* ── Session ──────────────────────────────────────────────────────────
   Every app calls getSession() on boot. It is readable while mfaPending is
   true, so the admin app can render its verify screen from real state. */

export const getSession = (): Promise<SessionInfo> => http("/auth/session");

export const getWorkspaces = (): Promise<Workspace[]> => http("/auth/workspaces");

/**
 * What every sign-in answers with. `mfaRequired` and `needsWorkspace` are
 * what decide where the user lands next, so the caller never has to guess.
 */
export type LoginResult = {
  kind: AccountKind;
  name: string;
  mfaRequired: boolean;
  needsWorkspace: boolean;
  merchantId: string | null;
};

export const login = (email: string, password: string): Promise<LoginResult> =>
  http("/auth/login", { method: "POST", body: { email, password } });

/** Admin second factor. The session exists but cannot act until this passes. */
export const verifyMfa = (code: string): Promise<LoginResult> =>
  http("/auth/mfa/verify", { method: "POST", body: { code } });

/**
 * Customers sign in with a code, not a password.
 *
 * The answer is the same whether or not the identifier is known - telling a
 * stranger which numbers have wallets is the leak this avoids.
 */
export const requestOtp = (identifier: string): Promise<{ sent: boolean; expiresInSeconds: number }> =>
  http("/auth/otp/request", { method: "POST", body: { identifier } });

export const verifyOtp = (identifier: string, code: string): Promise<LoginResult> =>
  http("/auth/otp/verify", { method: "POST", body: { identifier, code } });

export const selectWorkspace = (merchantId: string): Promise<LoginResult> =>
  http(`/auth/workspaces/${merchantId}/select`, { method: "POST" });

export const logout = (): Promise<void> => http("/auth/logout", { method: "POST" });

/**
 * What the onboarding wizard submits.
 *
 * Provisions the merchant, its branches and a first live program in one call,
 * so the next screen has something to stamp against.
 */
export const createWorkspace = (body: {
  businessName: string;
  category: string;
  city: string;
  locations?: number;
  program?: string;
  method?: string;
}): Promise<LoginResult> => http("/auth/workspaces", { method: "POST", body });

export const requestPasswordReset = (email: string): Promise<{ sent: boolean }> =>
  http("/auth/password/forgot", { method: "POST", body: { email } });

/**
 * Ends every other session for that account, server-side.
 *
 * Resets 204, so there is nothing to read back - a rejected or expired token
 * arrives as a 401 `ApiError`.
 */
export const resetPassword = (token: string, password: string): Promise<void> =>
  http("/auth/password/reset", { method: "POST", body: { token, password } });

/** Readable with the token alone: whoever holds it is who it is for. */
export const getInvite = (token: string): Promise<InvitePreview> =>
  http(`/auth/invites/${encodeURIComponent(token)}`);

export const acceptInvite = (
  token: string,
  body: { name: string; password: string },
): Promise<LoginResult> =>
  http(`/auth/invites/${encodeURIComponent(token)}/accept`, { method: "POST", body });

export const registerBusiness = (body: {
  name: string;
  email: string;
  password: string;
  /** The sign-up form's terms checkbox. Sent so the acceptance is recorded
   *  against the account, with the version they accepted. */
  acceptedTerms: boolean;
}): Promise<LoginResult> => http("/auth/register/business", { method: "POST", body });

export const registerCustomer = (body: {
  name: string;
  mobile: string;
  email?: string;
  /** As above: the checkbox the form already enforces, now recorded. */
  acceptedTerms: boolean;
}): Promise<{ sent: boolean }> =>
  http("/auth/register/customer", { method: "POST", body });

/* ── Public ───────────────────────────────────────────────────────────
   Unauthenticated. What a printed counter poster leads to. */

export type JoinPage = {
  businessId: string;
  business: string;
  shortName: string;
  category: string;
  branchId: string;
  branch: string;
  city: string;
  address: string;
  hours: OpeningHours[];
  /** "8 visits → Free pastry", or empty when no program is live yet. */
  reward: string;
};

/** Slug is `<short-name>-<branch>`, exactly what is printed on the poster. */
export const getJoinPage = (slug: string): Promise<JoinPage> =>
  http(`/public/join/${encodeURIComponent(slug)}`);

/* ── Contract ─────────────────────────────────────────────────────── */

export const getContract = (): Promise<ApiContract> => http("/contract");

/* ── Business workspace ───────────────────────────────────────────────
   Tenant scope comes from the session, so none of these takes a merchant
   id - a caller that could pass one could pass someone else's. */

export const getBusinessProfile = (): Promise<BusinessProfile> => http("/business/profile");

export const getBranding = (): Promise<Branding> => http("/business/branding");

/** An empty object when nothing has been toggled yet, never a 404. */
export const getSettings = (): Promise<Record<string, boolean>> => http("/business/settings");

export const setSetting = (key: string, value: boolean): Promise<{ id: string; enabled: boolean }> =>
  http("/business/settings", { method: "PATCH", body: { key, value } });

export const getMessagingPolicy = (): Promise<MessagingPolicy> =>
  http("/business/messaging-policy");

export const setMessagingPolicy = (body: Partial<MessagingPolicy>): Promise<MessagingPolicy> =>
  http("/business/messaging-policy", { method: "PUT", body });

export const updateLocation = (
  branchId: string,
  body: Partial<{
    name: string;
    city: string;
    address: string;
    status: string;
    latitude: number;
    longitude: number;
  }>,
): Promise<BusinessLocation> =>
  http(`/business/locations/${branchId}`, { method: "PATCH", body });

export const setBrandingColor = (color: string): Promise<Branding> =>
  http("/business/branding", { method: "PUT", body: { color } });

export const uploadBrandingImage = (file: File): Promise<Branding> => {
  const form = new FormData();
  form.append("file", file);
  // `raw`, not `body`: the browser has to set the multipart boundary itself,
  // and `body` would JSON-stringify a FormData into "[object Object]".
  return http("/business/branding/image", { method: "POST", raw: form });
};

export const getLocations = (): Promise<BusinessLocation[]> => http("/business/locations");

export const getBusinessCustomers = (): Promise<BusinessCustomer[]> => http("/business/customers");

export const getPrograms = (): Promise<Program[]> => http("/business/programs");

export const getAutomations = (): Promise<Automation[]> => http("/business/automations");

export const getCampaigns = (): Promise<Campaign[]> => http("/business/campaigns");

export const getMessages = (): Promise<MessageRecord[]> => http("/business/messages");

export const getRedemptions = (): Promise<Redemption[]> => http("/business/redemptions");

export const getStaff = (): Promise<StaffMember[]> => http("/business/staff");

export const getFavoriteOrders = (): Promise<FavoriteOrder[]> =>
  http("/business/favorite-orders");

export const getIntegrations = (): Promise<Integration[]> => http("/business/integrations");

export const getBusinessMetrics = (): Promise<BusinessMetrics> => http("/business/metrics");

export const getBilling = (): Promise<Billing> => http("/business/billing");

/* ── Analytics ────────────────────────────────────────────────────────
   Measured, not estimated. Every one of these was a hardcoded array in the
   analytics view before it had an endpoint to ask. */

export type Retention = {
  /** Percentage still returning in each of six weeks, week 0 being 100. */
  weeks: number[];
  cohorts: { week: number; active: number }[];
};

export type VisitTrend = {
  period: string;
  total: number;
  /** Index of the busiest bar, so the chart can mark it without recomputing. */
  peakIndex: number;
  bars: { label: string; visits: number }[];
};

export type SegmentShare = { segment: string; members: number; share: number };

export type StaffPerformance = {
  staffId: string;
  name: string;
  role: string;
  visits: number;
  valueCentavos: number;
};

export type BranchPerformance = {
  branchId: string;
  name: string;
  city: string;
  visits: number;
  valueCentavos: number;
  members: number;
};

export type CampaignAttribution = {
  id: string;
  name: string;
  sent: number;
  visited: number;
  conversionRate: number;
  revenueCentavos: number;
  costCentavos: number;
  /**
   * Null when the send cost nothing.
   *
   * An in-app or push campaign has no spend, and revenue over zero is not a
   * ratio - the API returns null rather than infinity or a zero that reads
   * like a failure. This was typed `number` while nothing rendered it, and the
   * first screen that did crashed on `.toFixed`.
   */
  returnOnSpend: number | null;
  /** "attributed", never "incremental" - the API is careful about the claim. */
  basis: string;
};

export type TimeToSecondVisit = {
  members: number;
  averageDays: number;
  medianDays: number;
};

export const getAudience = (): Promise<AudienceChannel[]> => http("/business/audience");

export const getRetention = (): Promise<Retention> => http("/business/analytics/retention");

export const getVisitTrend = (period = "week"): Promise<VisitTrend> =>
  http("/business/analytics/visits", { query: { period } });

export const getSegments = (): Promise<SegmentShare[]> =>
  http("/business/analytics/segments");

export const getStaffPerformance = (): Promise<StaffPerformance[]> =>
  http("/business/analytics/staff");

export const getBranchPerformance = (): Promise<BranchPerformance[]> =>
  http("/business/analytics/branches");

export const getCampaignAttribution = (): Promise<CampaignAttribution[]> =>
  http("/business/analytics/campaigns");

export const getTimeToSecondVisit = (): Promise<TimeToSecondVisit> =>
  http("/business/analytics/time-to-second-visit");

/* ── Customer wallet ──────────────────────────────────────────────── */

export const getCustomerProfile = (): Promise<CustomerProfile> => http("/customer/profile");

export const getWallet = (): Promise<WalletCard[]> => http("/customer/wallet");

/**
 * Coordinates are optional. Without them every `distance` comes back null,
 * which is the honest answer - a distance from an unknown point is not a
 * distance.
 */
export const getDiscover = (near?: { lat: number; lng: number }): Promise<DiscoverPlace[]> =>
  http("/customer/discover", { query: near });

export const getNotifications = (): Promise<CustomerNotification[]> =>
  http("/customer/notifications");

/** Branches within a short walk that have something waiting. */
export const getNearby = (near: { lat: number; lng: number }): Promise<NearbyNudge[]> =>
  http("/customer/nearby", { query: near });

/**
 * One stamp for a stranger, before anything is asked of them.
 *
 * Unauthenticated on purpose, and shareable: a poster passed between friends
 * is how a shop gets found. Nothing is written yet - the stamp settles when
 * they register, which is also what stops it being claimed twice.
 */
export const offerFirstStamp = (slug: string): Promise<FirstStampOffer> =>
  http(`/public/join/${encodeURIComponent(slug)}/first-stamp`, { method: "POST" });

/**
 * The same poster, read rather than claimed.
 *
 * Rendering the offer needs no token; only taking it does. The page used to
 * POST on mount, so a link shared on Facebook minted a row for the preview
 * crawler and for everyone who opened it and changed their mind.
 */
export const readFirstStamp = (slug: string): Promise<FirstStampOffer> =>
  http(`/public/join/${encodeURIComponent(slug)}/first-stamp`);

/** Turns the offered stamp into a real one. Needs a wallet. */
export const claimFirstStamp = (claimToken: string): Promise<WalletCard> =>
  http("/customer/first-stamp/claim", { method: "POST", body: { claimToken } });

export const getActivity = (): Promise<ActivityEntry[]> => http("/customer/activity");

export const getConsentHistory = (): Promise<ConsentEntry[]> => http("/customer/consent");

export const getChannelPreferences = (): Promise<ChannelPreferences> =>
  http("/customer/channels");

/* ── Customer writes ──────────────────────────────────────────────────
   Everything here is the customer acting on their own record. The API scopes
   each one to the session, so none of them takes an account id. */

export const updateCustomerProfile = (body: {
  name?: string;
  email?: string;
  mobile?: string;
  city?: string;
}): Promise<CustomerProfile> => http("/customer/profile", { method: "PATCH", body });

/**
 * One consent switch at a time.
 *
 * Each flip is its own request because each is its own consent event under
 * the Data Privacy Act - a batched save would lose which one the customer
 * actually changed and when.
 */
export const setChannelPreference = (
  key: keyof ChannelPreferences,
  value: boolean,
): Promise<ChannelPreferences> =>
  http("/customer/channels", { method: "PATCH", body: { key, value } });

export const joinBusiness = (merchantId: string): Promise<WalletCard> =>
  http(`/customer/discover/${merchantId}/join`, { method: "POST" });

/** Leaves the program. The ledger stays; the card goes. */
export const leaveBusiness = (membershipId: string): Promise<void> =>
  http(`/customer/wallet/${membershipId}/leave`, { method: "POST" });

export const markNotificationsRead = (): Promise<void> =>
  http("/customer/notifications/read", { method: "POST" });

/** "export" hands back a file; "delete" starts the erasure clock. */
export const getDataRequests = (): Promise<DataRequest[]> => http("/customer/data-requests");

/**
 * A time-limited link, not a public object.
 *
 * The export is one person's entire history across every business they have
 * joined, so the URL expires rather than working forever for anyone who ever
 * saw it.
 */
export const getDataExportLink = (
  requestId: string,
): Promise<{ url: string; expiresInHours: number }> =>
  http(`/customer/data-requests/${requestId}/download`);

// "deletion", which is what the API accepts. This said "delete", so every
// erasure request under the Data Privacy Act was answered with a 422 and the
// customer was told nothing. The union was wrong in the same direction, so
// the compiler agreed with the bug.
export const requestData = (kind: "export" | "deletion"): Promise<{ id: string; status: string }> =>
  http("/customer/data-requests", { method: "POST", body: { kind } });

/* ── Platform administration ──────────────────────────────────────── */

export const getTenants = (): Promise<Tenant[]> => http("/admin/tenants");

export const getSupportQueue = (): Promise<SupportTicket[]> => http("/admin/support");

export const getAuditLedger = (): Promise<AuditEvent[]> => http("/admin/audit");

export const getServices = (): Promise<ServiceHealth[]> => http("/admin/services");

export const getAdapters = (): Promise<Adapter[]> => http("/admin/adapters");

export const getTenantConnections = (): Promise<TenantConnection[]> =>
  http("/admin/tenant-connections");

export const getRecoveryQueue = (): Promise<RecoveryItem[]> => http("/admin/recovery-queue");

export const getPlatformMetrics = (): Promise<PlatformMetrics> => http("/admin/metrics");

export const getPlanEconomics = (): Promise<PlanEconomics[]> => http("/admin/economics/plans");

export const getChannelEconomics = (): Promise<ChannelEconomics[]> =>
  http("/admin/economics/channels");

/* ── Writes ───────────────────────────────────────────────────────────
   Every one is scoped to the caller's own merchant by the session, and
   every one names the capability the API will check. A cashier calling
   these gets 403, which is the point. */

export type ToggleResult = { id: string; enabled: boolean };

/** Flips Live/Paused server-side and answers with the state it landed on. */
export const toggleAutomation = (automationId: string): Promise<ToggleResult> =>
  http(`/business/automations/${automationId}`, { method: "PATCH" });

export const toggleIntegration = (integrationId: string): Promise<ToggleResult> =>
  http(`/business/integrations/${integrationId}`, { method: "PATCH" });

export type ProgramDraft = {
  type: string;
  name: string;
  status?: string;
  target?: number;
  rewardName?: string;
  rewardValueCentavos?: number;
  expiryDays?: number;
};

export const createProgram = (body: ProgramDraft): Promise<Program> =>
  http("/business/programs", { method: "POST", body });

export const updateProgram = (
  programId: string,
  body: Partial<ProgramDraft>,
): Promise<Program> => http(`/business/programs/${programId}`, { method: "PATCH", body });

export const duplicateProgram = (programId: string): Promise<Program> =>
  http(`/business/programs/${programId}/duplicate`, { method: "POST" });

export type CampaignDraft = {
  name: string;
  audience: string;
  channels: string[];
  sendTime?: string;
  frequencyPolicy?: string;
};

export const createCampaign = (body: CampaignDraft): Promise<Campaign> =>
  http("/business/campaigns", { method: "POST", body });

export type StaffInvite = {
  name: string;
  email: string;
  role: string;
  location?: string;
};

/** Goes to the signed-in staff member's own address, never one you pass. */
export const sendCampaignTest = (body: {
  body: string;
  subject?: string;
}): Promise<{ sent: boolean }> => http("/business/campaigns/test", { method: "POST", body });

/** Something a person has to answer, into the queue where a person will. */
export const raiseSupportRequest = (body: {
  subject: string;
  detail?: string;
  category?: string;
}): Promise<SupportRequest> => http("/business/support-requests", { method: "POST", body });

export const inviteStaff = (body: StaffInvite): Promise<StaffMember> =>
  http("/business/staff/invites", { method: "POST", body });

export const updateStaff = (
  staffId: string,
  body: { role?: string; location?: string; status?: string },
): Promise<StaffMember> => http(`/business/staff/${staffId}`, { method: "PATCH", body });

export const updateBusinessProfile = (body: {
  name?: string;
  shortName?: string;
  category?: string;
  owner?: string;
  timezone?: string;
}): Promise<BusinessProfile> => http("/business/profile", { method: "PATCH", body });

export const createLocation = (body: {
  name: string;
  city: string;
  address?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
}): Promise<BusinessLocation> => http("/business/locations", { method: "POST", body });

/* ── Counter ──────────────────────────────────────────────────────────
   The money path. Every write here takes an idempotency key, because the
   tablet it runs on loses wifi mid-request and the cashier presses again. */

export type CustomerLookup = {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  memberCode: string;
  isMember: boolean;
};

/** One of member code, phone or email; the API refuses a request carrying
 *  none of them. The counter field takes all three - see
 *  `looksLikeMemberCode` for which one a given entry is. */
export const lookupCustomer = (
  identifier: { phone: string } | { email: string } | { memberCode: string },
): Promise<CustomerLookup> => http("/customers/lookup", { query: identifier });

export type CustomerBalance = {
  customerId: string;
  programId: string;
  programName: string;
  /** Stamps or points held. Floored at zero - see programs.floor_at_zero. */
  balance: number;
  target: number;
  rewardsAvailable: number;
  /** A reward already on hold for this customer, from whichever till reserved
   *  it. The counter kept the hold in the tab that made it, so a reload - or
   *  a colleague on the other till - saw a full card, no reward and no way to
   *  finish, which reads as the reward vanishing mid-handover. */
  heldRedemptionId: string | null;
  heldRewardName: string;
};

/** What the counter shows before it stamps: where this card stands now. */
export const getCustomerBalance = (customerId: string): Promise<CustomerBalance> =>
  http(`/customers/${customerId}/balance`);

export type VisitResult = {
  id: string;
  customerId: string;
  customerName: string;
  amountCentavos: number;
  stampsBefore: number;
  stampsAfter: number;
  target: number;
  programId: string;
  // An object, not a string. Declared as a string, the till's busiest
  // message - the one naming what to hand over - interpolated it and read
  // "[object Object] is ready to redeem."
  rewardEarned: { id: string; name: string; valueCentavos: number } | null;
  occurredAt: string;
  status: string;
};

export const recordVisit = (
  body: {
    customerId?: string;
    memberCode?: string;
    branchId?: string;
    amountCentavos?: number;
    externalReference?: string;
  },
  idempotencyKey: string,
): Promise<VisitResult> =>
  http("/transactions", { method: "POST", body, idempotencyKey } satisfies HttpOptions);

/**
 * Reverses a stamp that should not have happened.
 *
 * Void is for a sale cancelled before it settled, refund for one already
 * settled - the API writes a different ledger reason for each, and the
 * customer's balance moves back either way.
 *
 * The idempotency key is required: a cashier who taps undo twice on a slow
 * connection must not take two stamps off.
 */
export const voidVisit = (transactionId: string, idempotencyKey: string): Promise<VisitResult> =>
  http(`/transactions/${transactionId}/void`, { method: "POST", idempotencyKey });

/**
 * The till's own history, newest first.
 *
 * Written because `refundVisit` had nothing to name: every reversal path
 * existed, but no screen in the product could point at a settled sale.
 */
export const getTransactions = (limit = 50): Promise<CounterTransaction[]> =>
  http("/business/transactions", { query: { limit } });

export const refundVisit = (transactionId: string, idempotencyKey: string): Promise<VisitResult> =>
  http(`/transactions/${transactionId}/refund`, { method: "POST", idempotencyKey });

/* ── Redemptions ──────────────────────────────────────────────────────
   reserve -> commit, or reserve -> cancel. Reserving takes the reward out of
   circulation without spending it, so a register that dies mid-handover
   leaves something that can be given back rather than a balance already
   eaten. */

export const reserveRedemption = (
  body: { customerId: string; rewardId?: string; branchId?: string },
  idempotencyKey: string,
): Promise<RedemptionResult> =>
  http("/redemptions/reserve", { method: "POST", body, idempotencyKey });

export const commitRedemption = (
  redemptionId: string,
  idempotencyKey: string,
): Promise<RedemptionResult> =>
  http(`/redemptions/${redemptionId}/commit`, { method: "POST", idempotencyKey });

export const cancelRedemption = (redemptionId: string): Promise<RedemptionResult> =>
  http(`/redemptions/${redemptionId}/cancel`, { method: "POST" });

/**
 * Reconcile visits taken while a POS had no signal.
 *
 * Not for a browser: every entry must be HMAC-signed with the workspace's
 * signing secret, which is server-side and must never reach a client. This
 * is for a till sidecar that holds one. The web counter queues locally and
 * replays through `recordVisit` with its own idempotency key instead, which
 * gives the same settle-once guarantee without the secret.
 *
 * Every entry is reported on individually: a batch that half-succeeds is the
 * normal case, and one duplicate must not discard the other nineteen sales.
 */
export const syncOfflineVisits = (entries: OfflineVisit[]): Promise<OfflineSyncResult> =>
  http("/counter/offline-sync", { method: "POST", body: { entries } });

/**
 * Bulk import from a CSV with name, mobile and email columns.
 *
 * Someone whose number already has a wallet is joined rather than
 * duplicated - a second account would split their history.
 */
export const importCustomers = (file: File): Promise<{
  created: number;
  joined: number;
  skipped: number;
  errors: string[];
}> => {
  const form = new FormData();
  form.append("file", file);
  return http("/business/customers/import", { method: "POST", raw: form });
};

/** Adds someone at the counter who has no wallet yet. */
/**
 * A walk-in, added at the till.
 *
 * The response carries the member code the API minted. It used to be typed as
 * `{id, name}` and the counter rebuilt the code from the id - which stopped
 * being possible the moment the code became a column of its own.
 */
export const createCustomer = (body: {
  name: string;
  mobile?: string;
  email?: string;
}): Promise<{
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  memberCode: string;
  isMember: boolean;
}> => http("/customers", { method: "POST", body });

/** The onboarding wizard's "prove it works" step. */
export const recordTestStamp = (): Promise<VisitResult> =>
  http("/business/onboarding/test-stamp", { method: "POST" });

/** Whether the merchant's setup checklist has had its test stamp run. Named
 *  for the merchant's checklist, not "onboarding": `getOnboarding` is already
 *  the platform console's application queue, and one name for two unrelated
 *  things is how Branch Performance ended up announcing itself as Staff
 *  Performance. */
export const getSetupProgress = (): Promise<{ id: string; enabled: boolean }> =>
  http("/business/onboarding");

/* ── The other six program types ──────────────────────────────────────
   Stamps and Points settle through /transactions. Each of these has its own
   rule, and a merchant can run several at once. */

/**
 * What this member pays after their tier discount.
 *
 * A discount writes nothing to the ledger - it comes off at the till - so
 * the counter asks for a quote rather than recording a balance change.
 */
export const quoteDiscount = (
  customerId: string,
  amountCentavos: number,
): Promise<DiscountQuote> =>
  http("/discounts/quote", { query: { customerId, amountCentavos } });

/** Subscriptions and bundles, with what is left on each. */
export const getHeldPrograms = (customerId: string): Promise<HeldProgram[]> =>
  http("/memberships", { query: { customerId } });

export const subscribeMembership = (body: {
  customerId: string;
  programId: string;
}): Promise<MemberSubscription> => http("/memberships/subscribe", { method: "POST", body });

export const cancelMembership = (subscriptionId: string): Promise<MemberSubscription> =>
  http(`/memberships/${subscriptionId}/cancel`, { method: "POST" });

/** Draws down one of the period's included benefits. */
export const useMembershipBenefit = (subscriptionId: string): Promise<Benefit> =>
  http(`/memberships/${subscriptionId}/use-benefit`, { method: "POST" });

/** `remaining` is what is left on the bundle, in passes. */
export const purchaseMultipass = (body: {
  customerId: string;
  programId: string;
}): Promise<Benefit> => http("/multipass/purchase", { method: "POST", body });

/** Draws one pass. Takes the same body as the purchase: a pass belongs to a
 *  customer-and-program pair, not to a subscription of its own. */
export const useMultipass = (body: {
  customerId: string;
  programId: string;
}): Promise<Benefit> => http("/multipass/use", { method: "POST", body });

export const issueCoupon = (body: {
  name: string;
  valueCentavos?: number;
  percentBps?: number;
  programId?: string;
  /** Leave unset to issue one anybody can claim. */
  customerId?: string;
  validFrom?: string;
  validUntil?: string;
}): Promise<Coupon> => http("/coupons", { method: "POST", body });

export const getCoupons = (): Promise<Coupon[]> => http("/coupons");

export const redeemCoupon = (body: { code: string; customerId: string }): Promise<Coupon> =>
  http("/coupons/redeem", { method: "POST", body });

export const getCatalog = (programId: string): Promise<CatalogItem[]> =>
  http(`/business/programs/${programId}/catalog`);

export const addCatalogItem = (
  programId: string,
  body: { name: string; kind?: string; costUnits: number; valueCentavos?: number },
): Promise<CatalogItem> =>
  http(`/business/programs/${programId}/catalog`, { method: "POST", body });

export const redeemCatalogItem = (body: {
  itemId: string;
  customerId: string;
}): Promise<CatalogItem> => http("/catalog/redeem", { method: "POST", body });

export const getTiers = (programId: string): Promise<ProgramTier[]> =>
  http(`/business/programs/${programId}/tiers`);

/** 409 for any other program type: only Points and Discount have a ladder. */
export const addTier = (
  programId: string,
  body: { name: string; threshold: number; rateBps: number },
): Promise<ProgramTier> =>
  http(`/business/programs/${programId}/tiers`, { method: "POST", body });

export const issueGiftCard = (body: {
  amountCentavos: number;
  issuedToName?: string;
  holderAccountId?: string;
  programId?: string;
  expiresOn?: string;
}): Promise<GiftCard> => http("/gift-cards", { method: "POST", body });

export const getGiftCard = (code: string): Promise<GiftCard> =>
  http(`/gift-cards/${encodeURIComponent(code)}`);

export const getGiftCardEntries = (code: string): Promise<GiftCardEntry[]> =>
  http(`/gift-cards/${encodeURIComponent(code)}/entries`);

/** Partial spends are normal: a card keeps its remaining balance. */
export const redeemGiftCard = (
  code: string,
  body: { amountCentavos: number; reason?: string },
): Promise<GiftCard> =>
  http(`/gift-cards/${encodeURIComponent(code)}/redeem`, { method: "POST", body });

export const transferGiftCard = (
  code: string,
  body: { toAccountId: string; toName?: string },
): Promise<GiftCard> =>
  http(`/gift-cards/${encodeURIComponent(code)}/transfer`, { method: "POST", body });

/* ── Growth ───────────────────────────────────────────────────────────── */

export const getReferrals = (): Promise<Referral[]> => http("/referrals");

/** Query parameters, not a body: that is how the handler declares them. */
export const createReferral = (query: {
  customerId: string;
  referrerRewardUnits?: number;
  friendRewardUnits?: number;
}): Promise<Referral> => http("/referrals", { method: "POST", query });

export const claimReferral = (body: { code: string; customerId: string }): Promise<Referral> =>
  http("/referrals/claim", { method: "POST", body });

export const qualifyReferral = (referralId: string): Promise<Referral> =>
  http(`/referrals/${referralId}/qualify`, { method: "POST" });

export const getFeedback = (): Promise<Feedback[]> => http("/feedback");

export const requestFeedback = (body: {
  customerId: string;
  transactionId?: string;
}): Promise<Feedback> => http("/feedback", { method: "POST", body });

export const answerFeedback = (
  feedbackId: string,
  body: { rating: number; comment?: string },
): Promise<Feedback> => http(`/feedback/${feedbackId}/answer`, { method: "POST", body });

export const getCustomFields = (): Promise<CustomField[]> => http("/business/custom-fields");

export const addCustomField = (body: {
  key: string;
  label: string;
  kind?: string;
  position?: number;
}): Promise<CustomField> => http("/business/custom-fields", { method: "POST", body });

export const getCustomFieldValues = (customerId: string): Promise<CustomFieldValue[]> =>
  http(`/customers/${customerId}/custom-fields`);

export const setCustomFieldValues = (
  customerId: string,
  values: Record<string, string>,
): Promise<CustomFieldValue[]> =>
  http(`/customers/${customerId}/custom-fields`, { method: "PUT", body: { values } });

/* ── Four-eyes approvals ──────────────────────────────────────────────
   Anyone who works here may ask; only settings:write decides, and never
   their own request. */

export const getApprovals = (): Promise<ApprovalRequest[]> => http("/approvals");

export const requestApproval = (body: {
  action: string;
  target?: string;
  amountCentavos?: number;
}): Promise<ApprovalRequest> => http("/approvals", { method: "POST", body });

export const decideApproval = (
  approvalId: string,
  body: { approve: boolean; reason?: string },
): Promise<ApprovalRequest> =>
  http(`/approvals/${approvalId}/decide`, { method: "POST", body });

/* ── Platform ─────────────────────────────────────────────────────────── */

export const getOnboarding = (): Promise<OnboardingRow[]> => http("/admin/onboarding");

export const getProviderPolicy = (): Promise<ProviderPolicy> =>
  http("/admin/provider-policy");

export const setProviderPolicy = (body: Partial<ProviderPolicy>): Promise<ProviderPolicy> =>
  http("/admin/provider-policy", { method: "PUT", body });

export const getAdministrators = (): Promise<Administrator[]> =>
  http("/admin/administrators");

export const getPlatformInvoices = (): Promise<
  { id: string; merchantId: string; period: string; amountCentavos: number; status: string }[]
> => http("/admin/invoices");

export const getPlatformCampaigns = (): Promise<
  {
    id: string;
    merchantId: string;
    name: string;
    status: string;
    sent: number;
    costCentavos: number;
  }[]
> => http("/admin/campaigns");

/** RFM quintiles within this merchant's own base, not an industry benchmark. */
export const getRfm = (): Promise<
  {
    customerId: string;
    name: string;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    totalScore: number;
    segment: string;
  }[]
> => http("/business/analytics/rfm");

/* ── Public forms ─────────────────────────────────────────────────────
   The marketing site, which has no session. Both answer 202 and are
   throttled server-side per email address. */

export const submitContact = (body: {
  name: string;
  email: string;
  business: string;
  message: string;
}): Promise<{ received: boolean }> => http("/public/contact", { method: "POST", body });

/**
 * A shop applying to join. Unauthenticated and throttled per address.
 *
 * One open application per email: a second is nearly always somebody who did
 * not see the first go through, and the API answers 409 for it.
 */
export const submitPartnerApplication = (body: {
  businessName: string;
  category: string;
  branches: number;
  address: string;
  mapsLink?: string;
  ownerName: string;
  mobile: string;
  email: string;
  facebook?: string;
  volume?: string;
  existing?: string;
  mechanic?: string;
  heardFrom?: string;
}): Promise<PartnerApplication> => http("/public/partner-applications", { method: "POST", body });

/**
 * Where they came across us, asked on the confirmation screen.
 *
 * Write-once and unauthenticated: the id is unguessable and arrived with the
 * person who just applied.
 */
export const answerHeardFrom = (
  applicationId: string,
  heardFrom: string,
): Promise<{ received: boolean }> =>
  http(`/public/partner-applications/${applicationId}/heard-from`, {
    method: "PATCH",
    body: { heardFrom },
  });

/* ── Platform: the partner queue ──────────────────────────────────── */

export const getPartnerApplications = (status?: string): Promise<PartnerApplication[]> =>
  http("/admin/partner-applications", { query: { status } });

/** Approving provisions the workspace and mails the sign-in. */
export const decidePartnerApplication = (
  applicationId: string,
  body: { approve: boolean; reason?: string },
): Promise<PartnerApplication> =>
  http(`/admin/partner-applications/${applicationId}/decide`, { method: "POST", body });

export const requestPlaybook = (email: string): Promise<{ received: boolean }> =>
  http("/public/playbook", { method: "POST", body: { email } });

/* ── Exports ──────────────────────────────────────────────────────────
   Four CSV streams. They are downloads rather than JSON, so they go through
   fetch directly and hand the browser a file. */

export type ExportKind = "customers" | "transactions" | "redemptions" | "messages";

/** The admin console's own two. Network-wide, not merchant-scoped. */
export type PlatformExportKind = "audit" | "privacy";

/**
 * Streams one export and saves it, using the filename the API chose.
 *
 * A blob rather than a plain link because the endpoint needs the session
 * cookie and a `download` anchor cannot carry credentials; the object URL is
 * revoked immediately so the file is not held in memory.
 */
export async function downloadExport(kind: ExportKind): Promise<void> {
  return download(`/business/exports/${kind}`);
}

export async function downloadPlatformExport(kind: PlatformExportKind): Promise<void> {
  return download(`/admin/exports/${kind}`);
}

async function download(path: string): Promise<void> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: "include",
  });
  if (!response.ok) throw await toApiError(response);

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const named = /filename="?([^"]+)"?/.exec(disposition)?.[1];
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    // The API names its own file; this is only the fallback when a
    // proxy strips the header.
    link.download = named ?? `${path.split("/").pop()}.csv`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ── Billing ──────────────────────────────────────────────────────── */

/** Upgrades only. The API refuses a downgrade rather than silently losing
 *  the allowances a merchant is already using. */
export const changePlan = (plan: string): Promise<Billing> =>
  http("/business/billing/plan", { method: "PATCH", body: { plan } });

export const payInvoice = (invoiceId: string): Promise<{ url: string }> =>
  http(`/business/invoices/${invoiceId}/pay`, { method: "POST" });

/* ── Integrations ─────────────────────────────────────────────────────
   API keys and the outbound webhook. Both carry secrets, and the API only
   ever reveals one at the moment it is created or rotated - the lists carry
   a preview and nothing more. */

export type Credential = {
  id: string;
  label: string;
  clientKey: string;
  branch: string;
  scopes: string[];
  lastUsedAt: string | null;
  status: string;
  environment: Environment;
  /** Last few characters, so a key can be recognised without being readable. */
  secretPreview: string;
};

/** Carries the secret itself. Shown once and never retrievable again. */
export type CredentialCreated = Credential & { secret: string };

/**
 * Scoped to one environment, and it has to be passed.
 *
 * The API defaults to production, so a caller that omits it shows a merchant
 * their live keys while the screen says Sandbox.
 */
export const getCredentials = (environment: Environment): Promise<Credential[]> =>
  http("/integration-credentials", { query: { environment } });

export const createCredential = (body: {
  label: string;
  scopes: string[];
  branch?: string;
  environment?: Environment;
}): Promise<CredentialCreated> =>
  http("/integration-credentials", { method: "POST", body });

export const rotateCredential = (credentialId: string): Promise<CredentialCreated> =>
  http(`/integration-credentials/${credentialId}/rotate`, { method: "POST" });

export const revokeCredential = (credentialId: string): Promise<void> =>
  http(`/integration-credentials/${credentialId}`, { method: "DELETE" });

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  status: string;
  secretPreview: string;
};

export const getWebhookEndpoints = (environment: Environment): Promise<WebhookEndpoint[]> =>
  http("/webhook-endpoints", { query: { environment } });

/**
 * PUT, not POST: a merchant has one outbound endpoint per environment, so
 * saving is the same call whether or not one already exists.
 */
export const saveWebhookEndpoint = (
  body: { url: string; events: string[] },
  environment: Environment,
): Promise<WebhookEndpoint> =>
  http("/webhook-endpoints", { method: "PUT", body, query: { environment } });

export const rotateWebhookSecret = (endpointId: string): Promise<{ secret: string }> =>
  http(`/webhook-endpoints/${endpointId}/rotate-secret`, { method: "POST" });

export const revealWebhookSecret = (endpointId: string): Promise<{ secret: string }> =>
  http(`/webhook-endpoints/${endpointId}/secret`);

/** Stops delivering. The history stays: it is the record of what was sent. */
export const removeWebhookEndpoint = (endpointId: string): Promise<void> =>
  http(`/webhook-endpoints/${endpointId}`, { method: "DELETE" });

export const sendTestDelivery = (endpointId: string): Promise<Delivery> =>
  http(`/webhook-endpoints/${endpointId}/test`, { method: "POST" });

export type Delivery = {
  id: string;
  /** Which endpoint it went to. Null for an inbound delivery. */
  endpointId: string | null;
  event: string;
  source: string;
  status: string;
  detail: string;
  requestId: string;
  attempts: number;
  createdAt: string;
};

export const getWebhookDeliveries = (environment: Environment): Promise<Delivery[]> =>
  http("/webhook-deliveries", { query: { environment } });

/** What was sent, what came back, and what happens next. */
export const getDelivery = (deliveryId: string): Promise<DeliveryDetail> =>
  http(`/webhook-deliveries/${deliveryId}`);

export const retryDelivery = (deliveryId: string): Promise<Delivery> =>
  http(`/webhook-deliveries/${deliveryId}/retry`, { method: "POST" });

/* ── Platform writes ──────────────────────────────────────────────── */

export const updateSupportTicket = (
  ticketId: string,
  body: { owner?: string; status?: string; note?: string },
): Promise<SupportTicket> => http(`/admin/support/${ticketId}`, { method: "PATCH", body });

/**
 * Every network-wide flag and where it currently stands.
 *
 * The console used to seed its switches from four hardcoded `true`s, so a
 * flag turned off in the database still rendered as on, and a reload put an
 * admin's own change back the way it was.
 */
export const getPlatformFlags = (): Promise<ToggleResult[]> => http("/admin/flags");

export const setPlatformFlag = (key: string, value: boolean): Promise<ToggleResult> =>
  http("/admin/flags", { method: "PATCH", body: { key, value } });

/** Moves every dead-lettered delivery back into the send queue. */
export const replayRecoveryQueue = (): Promise<{ queued: number }> =>
  http("/admin/recovery-queue/replay", { method: "POST" });
