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
import type { HttpOptions } from "./http.ts";
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
  RecoveryItem,
  Redemption,
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

export const registerBusiness = (body: {
  name: string;
  email: string;
  password: string;
}): Promise<LoginResult> => http("/auth/register/business", { method: "POST", body });

export const registerCustomer = (body: {
  name: string;
  mobile: string;
  email?: string;
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
export const requestData = (kind: "export" | "delete"): Promise<{ id: string; status: string }> =>
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

/** One of phone or email; the API refuses a request carrying neither. */
export const lookupCustomer = (
  identifier: { phone: string } | { email: string },
): Promise<CustomerLookup> => http("/customers/lookup", { query: identifier });

export type CustomerBalance = {
  customerId: string;
  programId: string;
  programName: string;
  /** Stamps or points held. Floored at zero - see programs.floor_at_zero. */
  balance: number;
  target: number;
  rewardsAvailable: number;
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
  rewardEarned: string | null;
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

/** The onboarding wizard's "prove it works" step. */
export const recordTestStamp = (): Promise<VisitResult> =>
  http("/business/onboarding/test-stamp", { method: "POST" });

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

export const sendTestDelivery = (endpointId: string): Promise<Delivery> =>
  http(`/webhook-endpoints/${endpointId}/test`, { method: "POST" });

export type Delivery = {
  id: string;
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

export const retryDelivery = (deliveryId: string): Promise<Delivery> =>
  http(`/webhook-deliveries/${deliveryId}/retry`, { method: "POST" });

/* ── Platform writes ──────────────────────────────────────────────── */

export const updateSupportTicket = (
  ticketId: string,
  body: { owner?: string; status?: string; note?: string },
): Promise<SupportTicket> => http(`/admin/support/${ticketId}`, { method: "PATCH", body });

export const setPlatformFlag = (key: string, value: boolean): Promise<ToggleResult> =>
  http("/admin/flags", { method: "PATCH", body: { key, value } });

/** Moves every dead-lettered delivery back into the send queue. */
export const replayRecoveryQueue = (): Promise<{ queued: number }> =>
  http("/admin/recovery-queue/replay", { method: "POST" });
