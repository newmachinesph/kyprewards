/**
 * The seam.
 *
 * Every store hydrates through these functions, so the switch to the real
 * service is a change in this file rather than an edit to every view. Today
 * each one resolves the local fixture; tomorrow each one is a `fetch` against
 * `contract.apiBase`. The signatures do not change either way — they are
 * already async, already return the narrowed types from `types.ts`, and
 * already fail through `ApiError` rather than throwing raw.
 *
 * The single `as` assertion per accessor is deliberate and lives only here:
 * JSON gives back `string` where the UI branches on a union, and this is the
 * one place that boundary is crossed.
 */

import demoData from "./stampr-demo.json";
import type {
  Adapter,
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
  ActivityEntry,
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
} from "./types";

/** What a failed call looks like once the service exists. Nothing throws it
 *  yet; stores that catch it today will keep working unchanged. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ponytail: resolve, don't simulate. A fake delay would make every demo
// screen slower to prove a point the loading states already handle.
const ok = <T,>(value: T): Promise<T> => Promise.resolve(value);

/* ── Contract and scenario ────────────────────────────────────────── */

export const getContract = (): Promise<ApiContract> =>
  ok(demoData.contract as ApiContract);

export const getSharedScenario = (): Promise<SharedScenario> =>
  ok(demoData.sharedScenario as SharedScenario);

/* ── Business workspace ───────────────────────────────────────────── */

export const getBusinessProfile = (): Promise<BusinessProfile> =>
  ok(demoData.business.profile as BusinessProfile);

export const getLocations = (): Promise<BusinessLocation[]> =>
  ok(demoData.business.locations as BusinessLocation[]);

export const getBusinessCustomers = (): Promise<BusinessCustomer[]> =>
  ok(demoData.business.customers as BusinessCustomer[]);

export const getPrograms = (): Promise<Program[]> =>
  ok(demoData.business.programs as Program[]);

export const getAutomations = (): Promise<Automation[]> =>
  ok(demoData.business.automations as Automation[]);

export const getCampaigns = (): Promise<Campaign[]> =>
  ok(demoData.business.campaigns as Campaign[]);

export const getMessages = (): Promise<MessageRecord[]> =>
  ok(demoData.business.messages as MessageRecord[]);

export const getRedemptions = (): Promise<Redemption[]> =>
  ok(demoData.business.redemptions as Redemption[]);

export const getStaff = (): Promise<StaffMember[]> =>
  ok(demoData.business.staff as StaffMember[]);

export const getFavoriteOrders = (): Promise<FavoriteOrder[]> =>
  ok(demoData.business.favoriteOrders as FavoriteOrder[]);

export const getIntegrations = (): Promise<Integration[]> =>
  ok(demoData.business.integrations as Integration[]);

export const getBusinessMetrics = (): Promise<BusinessMetrics> =>
  ok(demoData.business.metrics as BusinessMetrics);

export const getBilling = (): Promise<Billing> =>
  ok(demoData.business.billing as Billing);

/* ── Customer wallet ──────────────────────────────────────────────── */

export const getCustomerProfile = (): Promise<CustomerProfile> =>
  ok(demoData.customer.profile as CustomerProfile);

export const getWallet = (): Promise<WalletCard[]> =>
  ok(demoData.customer.wallet as WalletCard[]);

export const getDiscover = (): Promise<DiscoverPlace[]> =>
  ok(demoData.customer.discover as DiscoverPlace[]);

export const getNotifications = (): Promise<CustomerNotification[]> =>
  ok(demoData.customer.notifications as CustomerNotification[]);

export const getActivity = (): Promise<ActivityEntry[]> =>
  ok(demoData.customer.activity as ActivityEntry[]);

export const getConsentHistory = (): Promise<ConsentEntry[]> =>
  ok(demoData.customer.consentHistory as ConsentEntry[]);

/* ── Platform administration ──────────────────────────────────────── */

export const getTenants = (): Promise<Tenant[]> =>
  ok(demoData.admin.businesses as Tenant[]);

export const getSupportQueue = (): Promise<SupportTicket[]> =>
  ok(demoData.admin.support as SupportTicket[]);

export const getAuditLedger = (): Promise<AuditEvent[]> =>
  ok(demoData.admin.audit as AuditEvent[]);

export const getServices = (): Promise<ServiceHealth[]> =>
  ok(demoData.admin.services as ServiceHealth[]);

export const getAdapters = (): Promise<Adapter[]> =>
  ok(demoData.admin.adapters as Adapter[]);

export const getTenantConnections = (): Promise<TenantConnection[]> =>
  ok(demoData.admin.tenantConnections as TenantConnection[]);

export const getRecoveryQueue = (): Promise<RecoveryItem[]> =>
  ok(demoData.admin.recoveryQueue as RecoveryItem[]);

export const getPlatformMetrics = (): Promise<PlatformMetrics> =>
  ok(demoData.admin.metrics as PlatformMetrics);

export const getPlanEconomics = (): Promise<PlanEconomics[]> =>
  ok(demoData.admin.economics.plans as PlanEconomics[]);

export const getChannelEconomics = (): Promise<ChannelEconomics[]> =>
  ok(demoData.admin.economics.channels as ChannelEconomics[]);

/* ── Synchronous mirrors ──────────────────────────────────────────────
   Server Components and module-level constants read these. They exist so
   the narrowing above is available without an await; when the service
   lands they become the initial-render fallback and the async accessors
   above become the source. */

export const contract = demoData.contract as ApiContract;
export const sharedScenario = demoData.sharedScenario as SharedScenario;
export const business = demoData.business as unknown as {
  profile: BusinessProfile;
  locations: BusinessLocation[];
  customers: BusinessCustomer[];
  programs: Program[];
  automations: Automation[];
  campaigns: Campaign[];
  messages: MessageRecord[];
  redemptions: Redemption[];
  staff: StaffMember[];
  favoriteOrders: FavoriteOrder[];
  integrations: Integration[];
  metrics: BusinessMetrics;
  billing: Billing;
};
export const customer = demoData.customer as unknown as {
  profile: CustomerProfile;
  wallet: WalletCard[];
  discover: DiscoverPlace[];
  notifications: CustomerNotification[];
  activity: ActivityEntry[];
  consentHistory: ConsentEntry[];
};
export const admin = demoData.admin as unknown as {
  metrics: PlatformMetrics;
  businesses: Tenant[];
  support: SupportTicket[];
  audit: AuditEvent[];
  services: ServiceHealth[];
  adapters: Adapter[];
  tenantConnections: TenantConnection[];
  recoveryQueue: RecoveryItem[];
  economics: { plans: PlanEconomics[]; channels: ChannelEconomics[] };
};
