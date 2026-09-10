"use client";

/**
 * The read hooks, one per function in `endpoints.ts`.
 *
 * They went from the fixture to the live service without a line changing here,
 * because the seam kept its signatures: every accessor was already async and
 * already returned the narrowed type. Only the module they point at moved.
 *
 * What each hook adds over calling the accessor directly: a stable key that
 * invalidation can target, request de-duplication across components that ask
 * for the same thing, and a typed `{ data, isPending, error }` instead of a
 * bare promise every view has to `useEffect` around.
 */

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import * as api from "./endpoints";
import type {
  Adapter,
  ActivityEntry,
  ApiContract,
  AuditEvent,
  Automation,
  Billing,
  ApprovalRequest,
  Branding,
  BusinessCustomer,
  CatalogItem,
  CounterTransaction,
  Coupon,
  CustomField,
  CustomFieldValue,
  DataRequest,
  Feedback,
  GiftCard,
  GiftCardEntry,
  HeldProgram,
  MessagingPolicy,
  NearbyNudge,
  Referral,
  BusinessLocation,
  AudienceChannel,
  BusinessMetrics,
  BusinessProfile,
  Campaign,
  ChannelEconomics,
  ConsentEntry,
  ChannelPreferences,
  Environment,
  CustomerNotification,
  CustomerProfile,
  DiscoverPlace,
  FavoriteOrder,
  Integration,
  MessageRecord,
  PlanEconomics,
  PlatformMetrics,
  PrivacyMetrics,
  Program,
  ProgramTier,
  RecoveryItem,
  Redemption,
  ServiceHealth,
  StaffMember,
  SupportTicket,
  Tenant,
  TenantConnection,
  WalletCard,
} from "./types";

import { keys, type Coordinates, type CustomerFilters } from "./keys";
import type {
  BranchPerformance,
  CampaignAttribution,
  Credential,
  CustomerBalance,
  Delivery,
  Retention,
  SegmentShare,
  StaffPerformance,
  TimeToSecondVisit,
  VisitTrend,
  WebhookEndpoint,
} from "./endpoints";
import type { Workspace } from "./types";

/**
 * What a caller may override per hook: everything except the two things that
 * define the query. Letting a screen pass its own `queryKey` would put a key
 * outside `keys.ts` and quietly opt that query out of invalidation.
 */
type Options<T> = Omit<UseQueryOptions<T, Error, T>, "queryKey" | "queryFn">;

type Query<T> = UseQueryResult<T, Error>;

/* ── Contract and scenario ────────────────────────────────────────────
   Neither changes while the app is open, so both are effectively static
   and never refetch on their own. */

const FOREVER = { staleTime: Infinity, gcTime: Infinity } as const;

export const useContract = (options?: Options<ApiContract>): Query<ApiContract> =>
  useQuery({ queryKey: keys.contract, queryFn: api.getContract, ...FOREVER, ...options });

/* ── Business workspace ───────────────────────────────────────────── */

export const useBusinessProfile = (options?: Options<BusinessProfile>): Query<BusinessProfile> =>
  useQuery({ queryKey: keys.business.profile(), queryFn: api.getBusinessProfile, ...options });

/** The workspaces this session can open, each with the role it holds there. */
export const useWorkspaces = (options?: Options<Workspace[]>): Query<Workspace[]> =>
  useQuery({ queryKey: keys.session.workspaces(), queryFn: api.getWorkspaces, ...options });

export const useBranding = (options?: Options<Branding>): Query<Branding> =>
  useQuery({ queryKey: keys.business.branding(), queryFn: api.getBranding, ...options });

export const useSettings = (
  options?: Options<Record<string, boolean>>,
): Query<Record<string, boolean>> =>
  useQuery({ queryKey: keys.business.settings(), queryFn: api.getSettings, ...options });

export const useMessagingPolicy = (options?: Options<MessagingPolicy>): Query<MessagingPolicy> =>
  useQuery({
    queryKey: keys.business.messagingPolicy(),
    queryFn: api.getMessagingPolicy,
    ...options,
  });

/**
 * What the member pays after their tier discount.
 *
 * Keyed on the amount, so typing re-quotes rather than debouncing by hand -
 * and skipped entirely when there is no discount program or no amount yet.
 */
export const useDiscountQuote = (customerId: string, amountCentavos: number) =>
  useQuery({
    queryKey: [...keys.business.all, "discount-quote", customerId, amountCentavos],
    queryFn: () => api.quoteDiscount(customerId, amountCentavos),
    enabled: Boolean(customerId) && amountCentavos > 0,
    retry: false,
  });

export const useHeldPrograms = (customerId: string, options?: Options<HeldProgram[]>) =>
  useQuery({
    queryKey: keys.business.held(customerId),
    queryFn: () => api.getHeldPrograms(customerId),
    enabled: Boolean(customerId),
    ...options,
  });

/** Fetched only when a drawer is actually open: the payload is the reason
 *  the list stays narrow. */
export const useDelivery = (deliveryId: string) =>
  useQuery({
    queryKey: keys.business.delivery(deliveryId),
    queryFn: () => api.getDelivery(deliveryId),
    enabled: Boolean(deliveryId),
  });

export const useTransactions = (
  limit?: number,
  options?: Options<CounterTransaction[]>,
): Query<CounterTransaction[]> =>
  useQuery({
    queryKey: keys.business.transactions(),
    queryFn: () => api.getTransactions(limit),
    ...options,
  });

export const useCoupons = (options?: Options<Coupon[]>): Query<Coupon[]> =>
  useQuery({ queryKey: keys.business.coupons(), queryFn: api.getCoupons, ...options });

export const useCatalog = (programId: string, options?: Options<CatalogItem[]>): Query<CatalogItem[]> =>
  useQuery({
    queryKey: keys.business.catalog(programId),
    queryFn: () => api.getCatalog(programId),
    enabled: Boolean(programId),
    ...options,
  });

/** Points and Discount programs only; anything else answers with an empty ladder. */
export const useTiers = (programId: string, options?: Options<ProgramTier[]>): Query<ProgramTier[]> =>
  useQuery({
    queryKey: keys.business.tiers(programId),
    queryFn: () => api.getTiers(programId),
    enabled: Boolean(programId),
    ...options,
  });

/**
 * One gift card by its printed code, and the ledger behind it.
 *
 * Both are counter reads: a cashier holding a card should see what is on it
 * and where it went before charging against it, rather than typing a code and
 * finding out from the error.
 */
export const useGiftCard = (code: string, options?: Options<GiftCard>): Query<GiftCard> =>
  useQuery({
    queryKey: keys.business.giftCard(code),
    queryFn: () => api.getGiftCard(code),
    enabled: Boolean(code),
    // A wrong code is a 404 and retrying it three times only delays the
    // message the cashier needs.
    retry: false,
    ...options,
  });

export const useGiftCardEntries = (
  code: string,
  options?: Options<GiftCardEntry[]>,
): Query<GiftCardEntry[]> =>
  useQuery({
    queryKey: keys.business.giftCardEntries(code),
    queryFn: () => api.getGiftCardEntries(code),
    enabled: Boolean(code),
    retry: false,
    ...options,
  });

export const useReferrals = (options?: Options<Referral[]>): Query<Referral[]> =>
  useQuery({ queryKey: keys.business.referrals(), queryFn: api.getReferrals, ...options });

export const useFeedback = (options?: Options<Feedback[]>): Query<Feedback[]> =>
  useQuery({ queryKey: keys.business.feedback(), queryFn: api.getFeedback, ...options });

export const useCustomFields = (options?: Options<CustomField[]>): Query<CustomField[]> =>
  useQuery({ queryKey: keys.business.customFields(), queryFn: api.getCustomFields, ...options });

export const useCustomFieldValues = (
  customerId: string,
  options?: Options<CustomFieldValue[]>,
): Query<CustomFieldValue[]> =>
  useQuery({
    queryKey: keys.business.customFieldValues(customerId),
    queryFn: () => api.getCustomFieldValues(customerId),
    enabled: Boolean(customerId),
    ...options,
  });

/**
 * Four-eyes approvals. Scale plan only, so a workspace below it answers 402 -
 * which the caller shows as an upgrade prompt, not an error.
 */
export const useApprovals = (options?: Options<ApprovalRequest[]>): Query<ApprovalRequest[]> =>
  useQuery({
    queryKey: keys.business.approvals(),
    queryFn: api.getApprovals,
    retry: false,
    ...options,
  });

export const useRfm = (options?: Options<Awaited<ReturnType<typeof api.getRfm>>>) =>
  useQuery({ queryKey: keys.business.rfm(), queryFn: api.getRfm, ...options });

export const useLocations = (options?: Options<BusinessLocation[]>): Query<BusinessLocation[]> =>
  useQuery({ queryKey: keys.business.locations(), queryFn: api.getLocations, ...options });

/**
 * `filters` is in the key, so changing a search term is a new query rather
 * than a mutation of the current one. `placeholderData` keeps the previous
 * page on screen while the next resolves — a list that empties for one frame
 * on every keystroke reads as broken.
 */
export const useBusinessCustomers = (
  filters: CustomerFilters = {},
  options?: Options<BusinessCustomer[]>,
): Query<BusinessCustomer[]> =>
  useQuery({
    queryKey: keys.business.customers(filters),
    queryFn: api.getBusinessCustomers,
    placeholderData: (previous) => previous,
    ...options,
  });

export const usePrograms = (options?: Options<Program[]>): Query<Program[]> =>
  useQuery({ queryKey: keys.business.programs(), queryFn: api.getPrograms, ...options });

export const useAutomations = (options?: Options<Automation[]>): Query<Automation[]> =>
  useQuery({ queryKey: keys.business.automations(), queryFn: api.getAutomations, ...options });

export const useCampaigns = (options?: Options<Campaign[]>): Query<Campaign[]> =>
  useQuery({ queryKey: keys.business.campaigns(), queryFn: api.getCampaigns, ...options });

export const useMessages = (options?: Options<MessageRecord[]>): Query<MessageRecord[]> =>
  useQuery({ queryKey: keys.business.messages(), queryFn: api.getMessages, ...options });

export const useRedemptions = (options?: Options<Redemption[]>): Query<Redemption[]> =>
  useQuery({ queryKey: keys.business.redemptions(), queryFn: api.getRedemptions, ...options });

export const useStaff = (options?: Options<StaffMember[]>): Query<StaffMember[]> =>
  useQuery({ queryKey: keys.business.staff(), queryFn: api.getStaff, ...options });

export const useFavoriteOrders = (options?: Options<FavoriteOrder[]>): Query<FavoriteOrder[]> =>
  useQuery({
    queryKey: keys.business.favoriteOrders(),
    queryFn: api.getFavoriteOrders,
    ...options,
  });

export const useIntegrations = (options?: Options<Integration[]>): Query<Integration[]> =>
  useQuery({ queryKey: keys.business.integrations(), queryFn: api.getIntegrations, ...options });

/** The dashboard's headline counters. Short stale time — this is the number a
 *  merchant watches move while stamping. */
export const useSetupProgress = (
  options?: Options<{ id: string; enabled: boolean }>,
): Query<{ id: string; enabled: boolean }> =>
  useQuery({
    queryKey: keys.business.analytics.setupProgress(),
    queryFn: api.getSetupProgress,
    ...options,
  });

export const useAudience = (options?: Options<AudienceChannel[]>): Query<AudienceChannel[]> =>
  useQuery({
    queryKey: keys.business.analytics.audience(),
    queryFn: api.getAudience,
    ...options,
  });

export const useBusinessMetrics = (options?: Options<BusinessMetrics>): Query<BusinessMetrics> =>
  useQuery({
    queryKey: keys.business.metrics(),
    queryFn: api.getBusinessMetrics,
    staleTime: 15_000,
    ...options,
  });

export const useBilling = (options?: Options<Billing>): Query<Billing> =>
  useQuery({ queryKey: keys.business.billing(), queryFn: api.getBilling, ...options });

/* ── Analytics ────────────────────────────────────────────────────── */

export const useRetention = (options?: Options<Retention>): Query<Retention> =>
  useQuery({
    queryKey: keys.business.analytics.retention(),
    queryFn: api.getRetention,
    ...options,
  });

export const useVisitTrend = (
  period = "week",
  options?: Options<VisitTrend>,
): Query<VisitTrend> =>
  useQuery({
    queryKey: keys.business.analytics.visits(period),
    queryFn: () => api.getVisitTrend(period),
    ...options,
  });

export const useSegments = (options?: Options<SegmentShare[]>): Query<SegmentShare[]> =>
  useQuery({
    queryKey: keys.business.analytics.segments(),
    queryFn: api.getSegments,
    ...options,
  });

export const useStaffPerformance = (
  options?: Options<StaffPerformance[]>,
): Query<StaffPerformance[]> =>
  useQuery({
    queryKey: keys.business.analytics.staff(),
    queryFn: api.getStaffPerformance,
    ...options,
  });

export const useBranchPerformance = (
  options?: Options<Page<BranchPerformance>>,
): Query<Page<BranchPerformance>> =>
  useQuery({
    queryKey: keys.business.analytics.branches(),
    queryFn: api.getBranchPerformance,
    ...options,
  });

export const useCampaignAttribution = (
  options?: Options<CampaignAttribution[]>,
): Query<CampaignAttribution[]> =>
  useQuery({
    queryKey: keys.business.analytics.campaigns(),
    queryFn: api.getCampaignAttribution,
    ...options,
  });

export const useTimeToSecondVisit = (
  options?: Options<TimeToSecondVisit>,
): Query<TimeToSecondVisit> =>
  useQuery({
    queryKey: keys.business.analytics.timeToSecondVisit(),
    queryFn: api.getTimeToSecondVisit,
    ...options,
  });

/* ── Counter ──────────────────────────────────────────────────────── */

/**
 * Where one customer's card stands, for the counter.
 *
 * Disabled until somebody has been scanned - `undefined` is the honest state
 * before that, and firing a request for it would 404.
 */
export const useCustomerBalance = (
  customerId: string | undefined,
  options?: Options<CustomerBalance>,
): Query<CustomerBalance> =>
  useQuery({
    queryKey: keys.counter.balance(customerId ?? ""),
    queryFn: () => api.getCustomerBalance(customerId as string),
    enabled: Boolean(customerId),
    // A card the cashier is looking at right now. Anything cached is stale.
    staleTime: 0,
    ...options,
  });

/* ── Customer wallet ──────────────────────────────────────────────── */

export const useCustomerProfile = (options?: Options<CustomerProfile>): Query<CustomerProfile> =>
  useQuery({ queryKey: keys.customer.profile(), queryFn: api.getCustomerProfile, ...options });

export const useDataRequests = (options?: Options<DataRequest[]>): Query<DataRequest[]> =>
  useQuery({
    queryKey: keys.customer.dataRequests(),
    queryFn: api.getDataRequests,
    ...options,
  });

export const useWallet = (options?: Options<WalletCard[]>): Query<WalletCard[]> =>
  useQuery({ queryKey: keys.customer.wallet(), queryFn: api.getWallet, ...options });

export const useDiscover = (
  near?: Coordinates,
  options?: Options<DiscoverPlace[]>,
): Query<DiscoverPlace[]> =>
  useQuery({
    queryKey: keys.customer.discover(near),
    // Wrapped, not passed by reference: useQuery calls the query function with
    // its own context object, which would arrive here as `near`.
    queryFn: () => api.getDiscover(near),
    ...options,
  });

export const useNearby = (near?: Coordinates, options?: Options<NearbyNudge[]>) =>
  useQuery({
    queryKey: keys.customer.nearby(near),
    queryFn: () => api.getNearby(near!),
    enabled: Boolean(near),
    ...options,
  });

export const useNotifications = (
  options?: Options<CustomerNotification[]>,
): Query<CustomerNotification[]> =>
  useQuery({
    queryKey: keys.customer.notifications(),
    queryFn: api.getNotifications,
    ...options,
  });

export const useActivity = (options?: Options<ActivityEntry[]>): Query<ActivityEntry[]> =>
  useQuery({ queryKey: keys.customer.activity(), queryFn: api.getActivity, ...options });

export const useChannelPreferences = (
  options?: Options<ChannelPreferences>,
): Query<ChannelPreferences> =>
  useQuery({
    queryKey: keys.customer.channels(),
    queryFn: api.getChannelPreferences,
    ...options,
  });

export const useConsentHistory = (options?: Options<ConsentEntry[]>): Query<ConsentEntry[]> =>
  useQuery({
    queryKey: keys.customer.consentHistory(),
    queryFn: api.getConsentHistory,
    ...options,
  });

/* ── Integrations ─────────────────────────────────────────────────── */

export const useCredentials = (
  environment: Environment,
  options?: Options<Credential[]>,
): Query<Credential[]> =>
  useQuery({
    queryKey: keys.integrations.credentials(environment),
    queryFn: () => api.getCredentials(environment),
    ...options,
  });

export const useWebhookEndpoints = (
  environment: Environment,
  options?: Options<WebhookEndpoint[]>,
): Query<WebhookEndpoint[]> =>
  useQuery({
    queryKey: keys.integrations.webhookEndpoints(environment),
    queryFn: () => api.getWebhookEndpoints(environment),
    ...options,
  });

/** Deliveries retry on their own, so a stale list misrepresents the queue. */
export const useWebhookDeliveries = (
  environment: Environment,
  options?: Options<Delivery[]>,
): Query<Delivery[]> =>
  useQuery({
    queryKey: keys.integrations.webhookDeliveries(environment),
    queryFn: () => api.getWebhookDeliveries(environment),
    staleTime: 10_000,
    ...options,
  });

/* ── Platform administration ──────────────────────────────────────── */

export const useTenants = (options?: Options<Tenant[]>): Query<Tenant[]> =>
  useQuery({ queryKey: keys.admin.tenants(), queryFn: api.getTenants, ...options });

export const useSupportQueue = (options?: Options<SupportTicket[]>): Query<SupportTicket[]> =>
  useQuery({ queryKey: keys.admin.support(), queryFn: api.getSupportQueue, ...options });

export const useAuditLedger = (options?: Options<AuditEvent[]>): Query<AuditEvent[]> =>
  useQuery({ queryKey: keys.admin.audit(), queryFn: api.getAuditLedger, ...options });

/** Health goes stale fast — a green tile from a minute ago is a lie. */
export const useServices = (options?: Options<ServiceHealth[]>): Query<ServiceHealth[]> =>
  useQuery({
    queryKey: keys.admin.services(),
    queryFn: api.getServices,
    staleTime: 10_000,
    ...options,
  });

export const useAdapters = (options?: Options<Adapter[]>): Query<Adapter[]> =>
  useQuery({ queryKey: keys.admin.adapters(), queryFn: api.getAdapters, ...options });

export const useTenantConnections = (
  options?: Options<TenantConnection[]>,
): Query<TenantConnection[]> =>
  useQuery({
    queryKey: keys.admin.tenantConnections(),
    queryFn: api.getTenantConnections,
    ...options,
  });

export const useRecoveryQueue = (options?: Options<RecoveryItem[]>): Query<RecoveryItem[]> =>
  useQuery({ queryKey: keys.admin.recoveryQueue(), queryFn: api.getRecoveryQueue, ...options });

export const usePlatformMetrics = (options?: Options<PlatformMetrics>): Query<PlatformMetrics> =>
  useQuery({ queryKey: keys.admin.metrics(), queryFn: api.getPlatformMetrics, ...options });

export const usePrivacyMetrics = (options?: Options<PrivacyMetrics>): Query<PrivacyMetrics> =>
  useQuery({ queryKey: keys.admin.privacy(), queryFn: api.getPrivacyMetrics, ...options });

export const useOnboarding = () =>
  useQuery({ queryKey: keys.admin.onboarding(), queryFn: api.getOnboarding });

export const useProviderPolicy = () =>
  useQuery({ queryKey: keys.admin.providerPolicy(), queryFn: api.getProviderPolicy });

/** The network-wide switches, as the database has them. */
export const usePlatformFlags = () =>
  useQuery({ queryKey: keys.admin.flags(), queryFn: api.getPlatformFlags });

export const useAdministrators = () =>
  useQuery({ queryKey: keys.admin.administrators(), queryFn: api.getAdministrators });

export const usePlatformInvoices = () =>
  useQuery({ queryKey: keys.admin.invoices(), queryFn: api.getPlatformInvoices });

export const usePlatformCampaigns = () =>
  useQuery({ queryKey: keys.admin.campaigns(), queryFn: api.getPlatformCampaigns });

export const usePartnerApplications = (status?: string) =>
  useQuery({
    queryKey: [...keys.admin.partnerApplications(), status ?? "all"],
    queryFn: () => api.getPartnerApplications(status),
  });

export const usePlanEconomics = (options?: Options<PlanEconomics[]>): Query<PlanEconomics[]> =>
  useQuery({ queryKey: keys.admin.economics.plans(), queryFn: api.getPlanEconomics, ...options });

export const useChannelEconomics = (
  options?: Options<ChannelEconomics[]>,
): Query<ChannelEconomics[]> =>
  useQuery({
    queryKey: keys.admin.economics.channels(),
    queryFn: api.getChannelEconomics,
    ...options,
  });

/* ── Ahead of the backend ────────────────────────────────────────────
   Every hook here reads a route the service does not serve yet. `withPreview`
   returns sample data locally when the route answers 404, and the real
   answer the day it exists. See preview.ts. */

import { withPreview, withPreviewExtras } from "./preview";
import * as sample from "./preview-samples";
import type {
  AddOnSubscription,
  BonusWindow,
  CategoryRate,
  CloseBehaviour,
  DiscoverFacet,
  FeaturedPlacement,
  GiftTransfer,
  Mission,
  PendingApproval,
  PromoCode,
  PublicDiscoverQuery,
  PublicShop,
  PushState,
  QrPayment,
  StoreCreditEntry,
  SukiTierProgram,
} from "./types";
import type { Page } from "./http";

/**
 * The wallet, plus the sample cards that show a pending welcome stamp, a run
 * with a tier and a mission, and a closed run. Real cards come first.
 */
export const useWalletWithPreview = (options?: Options<WalletCard[]>): Query<WalletCard[]> =>
  useQuery({
    queryKey: [...keys.customer.wallet(), "preview"],
    queryFn: withPreviewExtras(api.getWallet, sample.sampleWalletExtras),
    ...options,
  });

export const usePendingApprovals = (
  options?: Options<PendingApproval[]>,
): Query<PendingApproval[]> =>
  useQuery({
    queryKey: keys.wallet.approvals(),
    queryFn: withPreview(api.getPendingApprovals, sample.samplePendingApprovals),
    staleTime: 10_000,
    ...options,
  });

export const useClosePreview = (programId: string, onClose: CloseBehaviour) =>
  useQuery({
    queryKey: keys.levers.closePreview(programId, onClose),
    queryFn: withPreview(
      () => api.previewClose(programId, onClose),
      () => ({ openCards: 312, expiring: onClose === "expire" ? 312 : 0, carriedOver: onClose === "carryOver" ? 312 : 0, heldRewards: 41 }),
    ),
    enabled: Boolean(programId),
  });

export const useBonusWindows = (options?: Options<BonusWindow[]>): Query<BonusWindow[]> =>
  useQuery({
    queryKey: keys.levers.bonusWindows(),
    queryFn: withPreview(api.getBonusWindows, sample.sampleBonusWindows),
    ...options,
  });

export const usePromoCodes = (options?: Options<PromoCode[]>): Query<PromoCode[]> =>
  useQuery({
    queryKey: keys.levers.promoCodes(),
    queryFn: withPreview(api.getPromoCodes, sample.samplePromoCodes),
    ...options,
  });

export const useStoreCredit = (
  customerId?: string,
  options?: Options<StoreCreditEntry[]>,
): Query<StoreCreditEntry[]> =>
  useQuery({
    queryKey: keys.levers.storeCredit(customerId),
    queryFn: withPreview(
      () => api.getStoreCredit(customerId),
      () =>
        sample.sampleStoreCredit().filter((e) => !customerId || e.customerId === customerId),
    ),
    ...options,
  });

export const useSukiTiers = (options?: Options<SukiTierProgram>): Query<SukiTierProgram> =>
  useQuery({
    queryKey: keys.levers.sukiTiers(),
    queryFn: withPreview(api.getSukiTiers, sample.sampleSukiTiers),
    ...options,
  });

export const useMissions = (options?: Options<Mission[]>): Query<Mission[]> =>
  useQuery({
    queryKey: keys.levers.missions(),
    queryFn: withPreview(api.getMissions, sample.sampleMissions),
    ...options,
  });

export const useBusinessGifts = (options?: Options<GiftTransfer[]>): Query<GiftTransfer[]> =>
  useQuery({
    queryKey: keys.levers.gifts(),
    queryFn: withPreview(api.getBusinessGifts, sample.sampleGifts),
    ...options,
  });

export const useCustomerGifts = (options?: Options<GiftTransfer[]>): Query<GiftTransfer[]> =>
  useQuery({
    queryKey: keys.wallet.gifts(),
    queryFn: withPreview(api.getCustomerGifts, sample.sampleGifts),
    ...options,
  });

export const useCategoryRates = (
  programId: string,
  options?: Options<CategoryRate[]>,
): Query<CategoryRate[]> =>
  useQuery({
    queryKey: keys.levers.categoryRates(programId),
    queryFn: withPreview(() => api.getCategoryRates(programId), sample.sampleCategoryRates),
    enabled: Boolean(programId),
    ...options,
  });

export const useFeaturedPlacement = (
  options?: Options<FeaturedPlacement>,
): Query<FeaturedPlacement> =>
  useQuery({
    queryKey: keys.levers.featured(),
    queryFn: withPreview(api.getFeaturedPlacement, sample.sampleFeatured),
    ...options,
  });

/* The public marketplace. No session; safe to call from kyp.ph. */

export const usePublicDiscover = (
  query: PublicDiscoverQuery = {},
  options?: Options<Page<PublicShop>>,
): Query<Page<PublicShop>> =>
  useQuery({
    queryKey: keys.public.discover(query),
    queryFn: withPreview(() => api.getPublicDiscover(query), () => sample.samplePublicDiscover(query)),
    placeholderData: (previous) => previous,
    ...options,
  });

export const usePublicShop = (slug: string, options?: Options<PublicShop>): Query<PublicShop> =>
  useQuery({
    queryKey: keys.public.shop(slug),
    queryFn: withPreview(
      () => api.getPublicShop(slug),
      () => {
        const found = sample.samplePublicShop(slug);
        if (!found) throw new Error("No shop with that address");
        return found;
      },
    ),
    enabled: Boolean(slug),
    retry: false,
    ...options,
  });

export const usePublicCategories = (options?: Options<DiscoverFacet[]>): Query<DiscoverFacet[]> =>
  useQuery({
    queryKey: keys.public.categories(),
    queryFn: withPreview(api.getPublicCategories, sample.sampleCategories),
    ...options,
  });

export const usePublicNeighborhoods = (
  options?: Options<DiscoverFacet[]>,
): Query<DiscoverFacet[]> =>
  useQuery({
    queryKey: keys.public.neighborhoods(),
    queryFn: withPreview(api.getPublicNeighborhoods, sample.sampleNeighborhoods),
    ...options,
  });

/* Billing */

/** Polled while the QR is on screen; stops once it settles. */
export const usePayment = (intentId: string, options?: Options<QrPayment>): Query<QrPayment> =>
  useQuery({
    queryKey: keys.billing.payment(intentId),
    queryFn: withPreview(
      () => api.getPayment(intentId),
      () => sample.sampleQrPayment(0, intentId),
    ),
    enabled: Boolean(intentId),
    refetchInterval: (query) =>
      query.state.data && query.state.data.status !== "awaiting" ? false : 4_000,
    ...options,
  });

export const useAddOns = (options?: Options<AddOnSubscription[]>): Query<AddOnSubscription[]> =>
  useQuery({
    queryKey: keys.billing.addOns(),
    queryFn: withPreview(api.getAddOns, sample.sampleAddOns),
    ...options,
  });

export const usePushState = (options?: Options<PushState>): Query<PushState> =>
  useQuery({
    queryKey: keys.wallet.push(),
    queryFn: withPreview(api.getPushState, sample.samplePushState),
    ...options,
  });
