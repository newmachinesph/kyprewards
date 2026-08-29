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

import { http } from "./http.ts";
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
  ChannelPreferences,
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

/* ── Contract ─────────────────────────────────────────────────────── */

export const getContract = (): Promise<ApiContract> => http("/contract");

/* ── Business workspace ───────────────────────────────────────────────
   Tenant scope comes from the session, so none of these takes a merchant
   id - a caller that could pass one could pass someone else's. */

export const getBusinessProfile = (): Promise<BusinessProfile> => http("/business/profile");

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

export const getActivity = (): Promise<ActivityEntry[]> => http("/customer/activity");

export const getConsentHistory = (): Promise<ConsentEntry[]> => http("/customer/consent");

export const getChannelPreferences = (): Promise<ChannelPreferences> =>
  http("/customer/channels");

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
