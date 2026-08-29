"use client";

/**
 * The read hooks, one per accessor in `@kypstamping/demo-data`'s `api.ts`.
 *
 * They call that seam rather than `fetch` on purpose. Today the seam resolves
 * the fixture, so these hooks work against the demo exactly as the screens do
 * now; at integration each accessor body becomes an `http()` call and not one
 * line in this file changes. That is the whole reason the seam exists, and it
 * is why the caching, keys and retry policy can be settled before the service
 * is wired.
 *
 * What each hook adds over calling the accessor directly: a stable key that
 * invalidation can target, request de-duplication across components that ask
 * for the same thing, and a typed `{ data, isPending, error }` instead of a
 * bare promise every view has to `useEffect` around.
 */

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import * as api from "@kypstamping/demo-data";
import type {
  Adapter,
  ActivityEntry,
  ApiContract,
  AuditEvent,
  Automation,
  Billing,
  BusinessCustomer,
  BusinessLocation,
  BusinessMetrics,
  BusinessProfile,
  Campaign,
  ChannelEconomics,
  ConsentEntry,
  CustomerNotification,
  CustomerProfile,
  DiscoverPlace,
  FavoriteOrder,
  Integration,
  MessageRecord,
  PlanEconomics,
  PlatformMetrics,
  Program,
  RecoveryItem,
  Redemption,
  ServiceHealth,
  SharedScenario,
  StaffMember,
  SupportTicket,
  Tenant,
  TenantConnection,
  WalletCard,
} from "@kypstamping/demo-data";

import { keys, type CustomerFilters } from "./keys";

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

export const useSharedScenario = (options?: Options<SharedScenario>): Query<SharedScenario> =>
  useQuery({ queryKey: keys.scenario, queryFn: api.getSharedScenario, ...FOREVER, ...options });

/* ── Business workspace ───────────────────────────────────────────── */

export const useBusinessProfile = (options?: Options<BusinessProfile>): Query<BusinessProfile> =>
  useQuery({ queryKey: keys.business.profile(), queryFn: api.getBusinessProfile, ...options });

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
export const useBusinessMetrics = (options?: Options<BusinessMetrics>): Query<BusinessMetrics> =>
  useQuery({
    queryKey: keys.business.metrics(),
    queryFn: api.getBusinessMetrics,
    staleTime: 15_000,
    ...options,
  });

export const useBilling = (options?: Options<Billing>): Query<Billing> =>
  useQuery({ queryKey: keys.business.billing(), queryFn: api.getBilling, ...options });

/* ── Customer wallet ──────────────────────────────────────────────── */

export const useCustomerProfile = (options?: Options<CustomerProfile>): Query<CustomerProfile> =>
  useQuery({ queryKey: keys.customer.profile(), queryFn: api.getCustomerProfile, ...options });

export const useWallet = (options?: Options<WalletCard[]>): Query<WalletCard[]> =>
  useQuery({ queryKey: keys.customer.wallet(), queryFn: api.getWallet, ...options });

export const useDiscover = (options?: Options<DiscoverPlace[]>): Query<DiscoverPlace[]> =>
  useQuery({ queryKey: keys.customer.discover(), queryFn: api.getDiscover, ...options });

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

export const useConsentHistory = (options?: Options<ConsentEntry[]>): Query<ConsentEntry[]> =>
  useQuery({
    queryKey: keys.customer.consentHistory(),
    queryFn: api.getConsentHistory,
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
