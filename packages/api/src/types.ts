/**
 * The shapes the API returns.
 *
 * Hand-written rather than generated from the OpenAPI schema, deliberately.
 * Generation proves the frontend agrees with what the server *declares*; it
 * cannot catch a handler whose response model and behaviour have drifted, and
 * it would bury these flat, well-named types under
 * `components["schemas"][...]` that every component would then need aliasing
 * back out of. `contract.test.ts` calls the live service and asserts on the
 * real body instead, which is the stronger guarantee.
 *
 * Narrow unions wherever the UI branches on a value: a status that arrives as
 * `string` is a typo that compiles.
 */

/* ── Enumerations the UI branches on ──────────────────────────────── */

export type PlanName = "Launch" | "Core" | "Grow" | "Scale";
export type ProgramStatus = "Live" | "Ready" | "Draft";
export type ProgramType =
  | "Stamps"
  | "Points"
  | "Discount"
  | "Membership"
  | "Coupon"
  | "Rewards"
  | "Multipass"
  | "Gift card";
export type LocationStatus = "Live" | "Setup";
export type CustomerSegment =
  | "VIP"
  | "Regular"
  | "Almost regular"
  | "New"
  | "At risk"
  | "Lapsed"
  | "Reward ready";
export type RiskLevel = "Healthy" | "Watch" | "High";
export type TenantRisk = "Healthy" | "Watch" | "At risk";
export type StaffRole = "Owner" | "Manager" | "Cashier" | "Analyst" | "Campaign";
export type RedemptionStatus = "Approved" | "Reversed";
export type CampaignStatus = "Completed" | "Running" | "Scheduled";
export type ChannelName =
  | "In-app"
  | "Push"
  | "Email"
  | "Viber"
  | "SMS"
  | "WhatsApp"
  | "Messenger";
export type IntegrationStatus = "Connected" | "Available" | "Setup" | "Planned";
export type ServiceStatus = "Operational" | "Degraded";
export type TicketPriority = "High" | "Normal";
export type TicketStatus = "Open" | "Investigating" | "Waiting";
export type AdapterStatus = "Available" | "Approval" | "Pilot" | "Planned";
export type ConnectionHealth = "Healthy" | "Attention" | "Sandbox";
export type Environment = "sandbox" | "production";

/** Outbound delivery attempt state, shared by the merchant log and the
 *  platform recovery queue. */
export type DeliveryStatus =
  | "Delivered"
  | "Ignored safely"
  | "Retrying"
  | "Failed";
export type CredentialStatus = "Active" | "Revoked";

/* ── Session ──────────────────────────────────────────────────────────
   What GET /auth/session answers. Every app calls it on boot; it is the
   only source of truth for who is signed in, because the session itself is
   an httpOnly cookie no script can read. */

export type AccountKind = "business" | "customer" | "admin";

export type SessionInfo = {
  kind: AccountKind;
  /** Staff and admin users have one; a customer account has accountId. */
  userId: string | null;
  accountId: string | null;
  name: string;
  email: string | null;
  /** True between password and TOTP on the admin app. Readable either way,
   *  so the verify screen renders from real state rather than a guess. */
  mfaPending: boolean;
  /** Null until a workspace is selected, and for admins and customers. */
  merchantId: string | null;
  /** The user belongs to more than one merchant and has picked none. */
  needsWorkspace: boolean;
};

export type Workspace = {
  merchantId: string;
  name: string;
  shortName: string;
  role: StaffRole | string;
  location: string;
};

/* ── The integration contract ─────────────────────────────────────── */

export type EventDefinition = { name: string; detail: string };

export type ApiContract = {
  apiBase: string;
  version: string;
  currency: string;
  amountUnit: string;
  idPrefixes: Record<string, string>;
  idempotency: { header: string; format: string; example: string };
  inboundEvents: EventDefinition[];
  outboundEvents: EventDefinition[];
};

/* ── The one visit every app shows ────────────────────────────────── */

export type SharedScenario = {
  label: string;
  customerId: string;
  customer: string;
  businessId: string;
  business: string;
  branch: string;
  branchId: string;
  staff: string;
  organizationId: string;
  merchantId: string;
  externalTransactionId: string;
  purchase: { amount: number; currency: string; display: string; amountCentavos: number };
  loyaltyEvent: {
    id: string;
    type: string;
    effect: string;
    before: string;
    after: string;
    beforeStamps: number;
    afterStamps: number;
    target: number;
    occurredAt: string;
    occurredAtIso: string;
    status: DeliveryStatus;
  };
  delivery: { requestId: string; idempotencyKey: string };
};

/* ── Business ─────────────────────────────────────────────────────── */

export type OpeningHours = { days: string; time: string };

export type BusinessLocation = {
  id: string;
  name: string;
  city: string;
  address: string;
  staff: number;
  members: number;
  status: LocationStatus;
  hours: OpeningHours[];
};

export type BusinessProfile = {
  id: string;
  name: string;
  shortName: string;
  category: string;
  owner: string;
  plan: PlanName;
  billing: string;
  renewalOn: string;
  timezone: string;
  currency: string;
  organizationId: string;
  merchantId: string;
  adminTenantId: string;
};

export type BusinessCustomer = {
  id: string;
  name: string;
  initials: string;
  segment: CustomerSegment;
  visits: number;
  lifetimeValueCentavos: number;
  lastVisitAt: string;
  progress: string;
  favorite: string;
  birthday: string;
  emailConsent: boolean;
  smsConsent: boolean;
  pushConsent: boolean;
  risk: RiskLevel;
};

export type Program = {
  id: string;
  type: ProgramType;
  name: string;
  status: ProgramStatus;
  members: number;
  completion: number;
  redemption: number;
  /** Outstanding reward value, derived from the ledger. Read-only. */
  liabilityCentavos: number;
  target: number;
  rewardName: string;
  rewardValueCentavos: number;
};

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  audience: number;
  channel: string;
  status: string;
  revenueCentavos: number;
};

export type Campaign = {
  id: string;
  name: string;
  audience: string;
  channels: string[];
  sent: number;
  visited: number;
  revenueCentavos: number;
  costCentavos: number;
  status: CampaignStatus | string;
  /** Carried from the composer so the history row can explain itself. */
  sendTime: string | null;
  frequencyPolicy: string | null;
};

export type MessageRecord = {
  id: string;
  campaign: string;
  customer: string;
  channel: ChannelName | string;
  status: string;
  sentAt: string;
  costCentavos: number;
};

export type Redemption = {
  id: string;
  customer: string;
  reward: string;
  branch: string;
  staff: string;
  valueCentavos: number;
  occurredAt: string;
  status: RedemptionStatus;
};

export type StaffMember = {
  id: string;
  name: string;
  initials: string;
  role: StaffRole | string;
  location: string;
  /** Null for a member who was invited and has never signed in. */
  lastActiveAt: string | null;
  status: string;
};

export type FavoriteOrder = {
  item: string;
  orders: number;
  regulars: number;
  change: number;
};

export type Integration = {
  id: string;
  name: string;
  category: string;
  status: IntegrationStatus;
  detail: string;
};

export type BusinessMetrics = {
  visitsToday: number;
  newRegulars: number;
  stampsIssued: number;
  redemptions: number;
  repeatRate: number;
  averageOrderCentavos: number;
  memberRevenueCentavos: number;
  campaignRevenueCentavos: number;
};

export type Allowance = {
  label: string;
  used: number;
  included: number;
  unit: string;
};

export type Invoice = {
  id: string;
  period: string;
  issuedOn: string;
  amountCentavos: number;
  status: string;
};

export type Billing = {
  plan: PlanName;
  monthlyCentavos: number;
  cycle: string;
  nextInvoiceOn: string;
  method: { kind: string; brand: string; last4: string; expiry: string };
  allowances: Allowance[];
  smsCreditBalance: number;
  invoices: Invoice[];
};

/* ── Merchant-owned integration state ─────────────────────────────────
   Credential and Delivery live in `endpoints.ts`, beside the calls that
   produce them: both carry secrets, and their shapes are the API's. */

/* ── Customer ─────────────────────────────────────────────────────── */

export type CustomerProfile = {
  id: string;
  name: string;
  initials: string;
  city: string;
  memberSince: string;
  memberCode: string;
  birthday: string;
  email: string;
  mobile: string;
};

export type WalletCard = {
  id: string;
  businessId: string;
  business: string;
  kind: string;
  category: string;
  progress: number;
  target: number;
  balance: string;
  reward: string;
  status: string;
  color: string;
  /** Metres from the position the caller sent, or null when none was. */
  distanceMetres: number | null;
};

export type DiscoverPlace = {
  id: string;
  businessId: string;
  image: string | null;
  name: string;
  category: string;
  neighborhood: string;
  /** Metres from the position the caller sent, or null when none was. */
  distanceMetres: number | null;
  reward: string;
  address: string;
  hours: OpeningHours[];
  joined: boolean;
  open: boolean;
};

export type CustomerNotification = {
  id: string;
  businessId: string;
  business: string;
  title: string;
  body: string;
  receivedAt: string;
  kind: string;
  read: boolean;
};

export type ActivityEntry = {
  id: string;
  businessId: string;
  business: string;
  action: string;
  detail: string;
  occurredAt: string;
  value: string;
  reference: string;
};

/** The customer's own switches. `service` covers the messages a merchant
 *  may always send - a reward expiring, an account change. The rest are
 *  marketing and each one is refusable. */
export type ChannelPreferences = {
  service: boolean;
  promoPush: boolean;
  promoEmail: boolean;
  promoSms: boolean;
  /** Gates geofence nudges specifically; off by default. */
  nearby: boolean;
};

export type ConsentEntry = {
  id: string;
  change: string;
  scope: string;
  occurredAt: string;
};

/* ── Platform ─────────────────────────────────────────────────────── */

export type Tenant = {
  id: string;
  businessId?: string;
  name: string;
  owner: string;
  city: string;
  plan: PlanName;
  members: number;
  mrrCentavos: number;
  health: number;
  risk: TenantRisk;
  joinedOn: string;
};

export type SupportTicket = {
  id: string;
  title: string;
  business: string;
  category: string;
  priority: TicketPriority;
  openedAt: string;
  note: string;
  owner: string;
  status: TicketStatus | string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  ip: string;
  occurredAt: string;
  severity: string;
};

export type ServiceHealth = {
  name: string;
  status: ServiceStatus;
  latency: string;
  uptime: string;
};

export type Adapter = {
  id: string;
  name: string;
  category: string;
  status: AdapterStatus;
  connected: number;
  connectedSandbox: number;
  detail: string;
};

export type TenantConnection = {
  businessId: string;
  business: string;
  adapter: string;
  branches: string;
  credential: string;
  events: number;
  health: ConnectionHealth;
};

export type RecoveryItem = {
  id: string;
  event: string;
  direction: "inbound" | "outbound";
  tenant: string;
  detail: string;
};

export type PlatformMetrics = {
  liveBusinesses: number;
  customerAccounts: number;
  monthlyRecurringRevenueCentavos: number;
  grossMargin: number;
  netRevenueRetention: number;
  smsLiabilityCentavos: number;
  supportSla: number;
};

export type PlanEconomics = {
  name: PlanName;
  accounts: number;
  mrrCentavos: number;
  monthlyCostCentavos: number;
  margin: number;
};

export type ChannelEconomics = {
  name: string;
  volume: number;
  revenueCentavos: number;
  costCentavos: number;
  model: string;
};

/* ── Zero values ──────────────────────────────────────────────────────
   Screens made of counters read one object unconditionally. These are what
   they render before the request answers: a number filling in beats a blank
   page, and a zero is honest about what is known so far. */

export const EMPTY_BUSINESS_METRICS: BusinessMetrics = {
  visitsToday: 0,
  newRegulars: 0,
  stampsIssued: 0,
  redemptions: 0,
  repeatRate: 0,
  averageOrderCentavos: 0,
  memberRevenueCentavos: 0,
  campaignRevenueCentavos: 0,
};

export const EMPTY_PLATFORM_METRICS: PlatformMetrics = {
  liveBusinesses: 0,
  customerAccounts: 0,
  monthlyRecurringRevenueCentavos: 0,
  grossMargin: 0,
  netRevenueRetention: 0,
  smsLiabilityCentavos: 0,
  supportSla: 0,
};

export type Branding = {
  /** A design token from packages/ui, never a hex value. */
  color: string;
  /** Presigned and short-lived when uploaded; a plain path when seeded. */
  imageUrl: string | null;
};

export type InvitePreview = {
  businessName: string;
  role: string;
  location: string;
  email: string;
};

/** Hours are 0-23, local to the merchant's timezone. Zero means "no cap". */
export type MessagingPolicy = {
  quietFromHour: number;
  quietToHour: number;
  maxPerDay: number;
  maxPerWeek: number;
};

/** A reward part-way through being handed over. */
export type RedemptionResult = {
  id: string;
  customerId: string;
  rewardName: string;
  valueCentavos: number;
  status: "reserved" | "approved" | "cancelled" | "reversed";
  reservedAt: string;
  committedAt: string | null;
  cancelledAt: string | null;
};

/* ── The eight program types ──────────────────────────────────────────
   Stamps and Points run through /transactions. These are the other six,
   each with its own settlement rule. */

export type DiscountQuote = {
  customerId: string;
  programId: string;
  tier: string;
  /** Basis points: 250 is 2.5%. Never a float - money maths on floats drifts. */
  rateBps: number;
  grossCentavos: number;
  discountCentavos: number;
  netCentavos: number;
};

export type MemberSubscription = {
  id: string;
  membershipId: string;
  programId: string;
  status: string;
  priceCentavos: number;
  startedOn: string;
  renewsOn: string | null;
  cancelledAt: string | null;
};

/** Multipass uses this too: `remaining` is the balance on the pass. */
export type Benefit = {
  subscriptionId: string;
  period: string;
  used: number;
  included: number;
  remaining: number;
};

export type Coupon = {
  id: string;
  code: string;
  name: string;
  valueCentavos: number;
  /** Basis points off, when the coupon is a percentage rather than an amount. */
  percentBps: number;
  state: "active" | "redeemed" | "expired" | "scheduled";
  validFrom: string;
  validUntil: string;
  redeemedAt: string | null;
};

export type CatalogItem = {
  id: string;
  name: string;
  kind: "milestone" | "perk" | "product" | "service";
  costUnits: number;
  valueCentavos: number;
  active: boolean;
};

export type GiftCard = {
  id: string;
  code: string;
  initialCentavos: number;
  balanceCentavos: number;
  status: string;
  issuedToName: string;
  holderAccountId: string | null;
  expiresOn: string | null;
};

export type GiftCardEntry = {
  id: string;
  kind: string;
  amountCentavos: number;
  reason: string;
  occurredAt: string;
};

export type Referral = {
  id: string;
  code: string;
  status: "pending" | "claimed" | "qualified";
  referrerRewardUnits: number;
  friendRewardUnits: number;
  createdAt: string;
  claimedAt: string | null;
  qualifiedAt: string | null;
};

export type Feedback = {
  id: string;
  status: "requested" | "answered";
  rating: number | null;
  comment: string;
  /** True only above the threshold: an unhappy customer is never routed to a
   *  public review form. */
  reviewInvited: boolean;
  requestedAt: string;
  answeredAt: string | null;
};

export type CustomField = {
  key: string;
  label: string;
  kind: "text" | "number" | "date" | "boolean";
  position: number;
};

export type CustomFieldValue = { key: string; label: string; value: string };

export type ApprovalRequest = {
  id: string;
  action: string;
  target: string;
  amountCentavos: number;
  status: "pending" | "approved" | "rejected";
  requestedByUserId: string;
  approvedByUserId: string | null;
  reason: string;
  requestedAt: string;
  decidedAt: string | null;
};

/**
 * One thing a customer holds with this merchant, as the counter sees it.
 *
 * Membership and multipass share a shape deliberately: the till asks the
 * same question of both - what is this person entitled to right now - and
 * the only difference is whether `remaining` resets with the period or
 * counts down a bundle. A bundle has no subscription of its own, so its
 * `subscriptionId` is empty.
 */
export type HeldProgram = {
  subscriptionId: string;
  programId: string;
  programName: string;
  programType: string;
  status: string;
  period: string;
  used: number;
  included: number;
  remaining: number;
  renewsOn: string | null;
};

/**
 * A branch the customer is standing near, with something waiting.
 *
 * Gated on the wallet's own `nearby` consent toggle: a customer who never
 * switched it on gets an empty list rather than a nudge.
 */
export type NearbyNudge = {
  businessId: string;
  business: string;
  branchId: string;
  branch: string;
  metres: number;
  open: boolean;
  reward: string;
};
