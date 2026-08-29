/**
 * The fixture, narrowed.
 *
 * The async accessors that used to live here are now `endpoints.ts` in
 * `@kypstamping/api`, calling the real service. What remains is the demo data
 * itself and the synchronous mirrors the not-yet-migrated components read.
 *
 * `sharedScenario` stays a fixture on purpose: it is the one visit all four
 * apps narrate, a demo device rather than an endpoint, and the API has no
 * route for it.
 */

import demoData from "./kypstamping-demo.json";
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

export { ApiError } from "@kypstamping/api";

export const getSharedScenario = (): Promise<SharedScenario> =>
  Promise.resolve(demoData.sharedScenario as SharedScenario);

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
