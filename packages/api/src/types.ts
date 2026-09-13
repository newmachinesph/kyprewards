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
/**
 * Every state the ledger can show, not only the settled ones.
 *
 * The API title-cases the stored status, so a reservation waiting at the
 * counter arrives as "Reserved" and an abandoned one as "Cancelled". Naming
 * only the two end states meant the ledger could render a row this type says
 * cannot exist - which is how "Reserved" ended up displayed with no way to
 * act on it.
 */
export type RedemptionStatus =
  | "Reserved"
  | "Awaiting customer"
  | "Approved"
  | "Cancelled"
  | "Reversed";
export type CampaignStatus = "Completed" | "Running" | "Scheduled" | "Needs audience";
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

/** What an admin-kind user is: runs the platform, or manages assigned shops. */
export type PlatformRole = "admin" | "account_manager";

/** A live support grant: scoped, time-limited, reason-bound, audited. */
export type SupportAccess = {
  id: string;
  merchantId: string;
  merchantName: string;
  reason: string;
  expiresAt: string;
};

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
  /** Admin kinds only; null for everyone else. */
  platformRole: PlatformRole | null;
  /** Set while an admin kind is inside a business on a live grant. The
   *  business portal's gate admits them on it and its banner shows it. */
  support: SupportAccess | null;
};

export type Workspace = {
  merchantId: string;
  name: string;
  shortName: string;
  role: StaffRole | string;
  location: string;
  /** The first branch's city; "" for a shop with no branch yet. */
  city?: string;
};

/* ── The integration contract ─────────────────────────────────────── */

export type EventDefinition = { name: string; detail: string };

/** How a merchant checks that a delivery came from us. */
export type WebhookSignature = {
  algorithm: string;
  signatureHeader: string;
  timestampHeader: string;
  eventHeader: string;
  /** The exact string that gets signed. */
  signedPayload: string;
  encoding: string;
  secretFrom: string;
  toleranceSeconds: number;
  verify: string;
};

export type ApiContract = {
  apiBase: string;
  version: string;
  currency: string;
  amountUnit: string;
  idPrefixes: Record<string, string>;
  idempotency: { header: string; format: string; example: string };
  webhookSignature: WebhookSignature;
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
  /** What Google's share sheet produced; "" until the merchant pastes one. */
  mapsLink: string;
  /** The slug this branch's counter poster prints, chosen once by the API. */
  posterSlug?: string | null;
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
  /** The merchant's own paragraph on their kyp.ph page; "" until they write one. */
  about: string;
  founding?: boolean;
};

export type BusinessCustomer = {
  id: string;
  name: string;
  initials: string;
  /** The number on their card. Thirteen digits, never derived from the id. */
  memberCode: string;
  segment: CustomerSegment;
  visits: number;
  lifetimeValueCentavos: number;
  lastVisitAt: string;
  progress: string;
  favorite: string;
  /** Null for the many customers who never gave one. */
  birthday: string | null;
  emailConsent: boolean;
  smsConsent: boolean;
  pushConsent: boolean;
  risk: RiskLevel;
  /** The branch this person shops at most, and everywhere they have been
   *  served. The card itself is centralised across a chain, so this is the
   *  merchant's view, not the customer's. Empty where sales carry no branch. */
  homeBranch: string;
  branches: string[];
  /** Peso credit issued by hand, the membership's balance. Absent before the levers shipped. */
  storeCreditCentavos?: number;
  /** The suki tier's name, or null when the shop runs no ladder. */
  tier?: string | null;
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
  /** The stamp-card rules, once the API carries them. Absent today. */
  rules?: StampRules;
  preview?: boolean;
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

/** How many members a campaign could actually reach on one channel. Both
 *  consents count: the shop's record for that member, and the customer's own
 *  account preference — the same pair the sender enforces. */
export type AudienceChannel = {
  channel: string;
  reachable: number;
};

export type BusinessMetrics = {
  visitsToday: number;
  newRegulars: number;
  almostRegulars: number;
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
  /* From the two platform flags. Absent until the backend carries them,
     which the screens read as closed. */
  paidTiersOpen?: boolean;
  creditPurchasesOpen?: boolean;
  /** `["qrph"]`: the only method the PayMongo account supports. */
  paymentMethods?: string[];
  founding?: boolean;
  foundingCreditMonths?: number;
  /** True once the three free months of Core were granted. */
  foundingCreditApplied?: boolean;
  preview?: boolean;
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
  /** Null for the many customers who never gave one. */
  birthday: string | null;
  email: string;
  /** False until the inbox confirms it; only a confirmed email signs in. */
  emailVerified?: boolean;
  mobile: string;
};

export type WalletCard = {
  /** The membership. Shared by every card from the same shop, so leaving
   *  stays one action; a single card is identified by (id, programId). */
  id: string;
  programId: string;
  program: string;
  businessId: string;
  business: string;
  kind: string;
  category: string;
  progress: number;
  target: number;
  balance: string;
  reward: string;
  status: string;
  /** Rewards actually waiting to be handed over. A full-looking progress bar
   *  is not the same thing: lower a card's target below what people already
   *  hold and every one of them reads "2 of 2" while the counter refuses. */
  rewardsAvailable: number;
  /** A design token from packages/ui - `brandColor()` resolves it. */
  color: string;
  /**
   * The merchant's storefront photo, presigned and short-lived.
   *
   * Null until they upload one, and the card falls back to their colour alone
   * rather than to a placeholder that looks like a broken image.
   */
  imageUrl: string | null;
  /** The mark inside each collected stamp: a preset name, or the shop's own
   *  picture clipped to the circle when `stampImageUrl` is set. */
  stampIcon?: string;
  stampImageUrl?: string | null;
  /** Metres from the position the caller sent, or null when none was. */
  distanceMetres: number | null;

  /* Everything below arrives with the stamp-card contract. Absent today. */
  state?: CardState;
  pendingStamp?: PendingStamp | null;
  rules?: StampRules;
  nextStampAt?: string | null;
  /** After a run closes: when a held reward must be redeemed by. */
  redeemBy?: string | null;
  closeOutcome?: "expired" | "carriedOver" | null;
  successorProgram?: string | null;
  completions?: number;
  /** The KYP Stamping badge shows on Launch shops. */
  badge?: boolean;
  plan?: PlanName;
  tier?: CardTier | null;
  /** What this shop holds on file for promotions to you, per channel. */
  consent?: { email: boolean; sms: boolean; push: boolean } | null;
  bonusWindow?: CardBonusWindow | null;
  missions?: MissionProgress[];
  storeCreditCentavos?: number;
  preview?: boolean;
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
  /** Directions to the branch; "" when the merchant has not pasted one. */
  mapsLink: string;
  hours: OpeningHours[];
  joined: boolean;
  open: boolean;
  /** The merchant's own paragraph; "" until they write one. */
  about: string;
  /** Priority placement, from the plan or the add-on. The API lists these
   *  first; the app never sorts by it. */
  featured: boolean;
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
  founding?: boolean;
  featured?: boolean;
  /** Account managers assigned to this business, by user id. */
  managerIds?: string[];
  /** The caller's own live support grant here, if any. */
  support?: SupportAccess | null;
};

/** Counts only. No administrator reads a customer's record from these. */
export type PrivacyMetrics = {
  consentWithdrawals: number;
  dataExports: number;
  deletionRequests: number;
  pending: number;
};

/** One open erasure request, masked: the console never shows the person in full. */
export type DeletionRequest = {
  id: string;
  status: string;
  requestedAt: string;
  daysOpen: number;
  email: string;
  mobile: string;
  memberships: number;
  /** Rewards reserved at a counter now; erase after the handover. */
  openRedemptions: number;
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
  /** Set when the ticket came in from the public contact form. Empty for one
   *  raised inside the platform, where the merchant is already known. */
  contactName: string;
  contactEmail: string;
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
  almostRegulars: 0,
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
  /** The mark inside a collected stamp: one of `stampIcons`, a tick by default. */
  stampIcon: string;
  /** The shop's own mark, presigned; null until uploaded or while the plan
   *  does not cover branding. Wins over `stampIcon` when set. */
  stampImageUrl: string | null;
  /** The presets the API accepts, so the picker never hardcodes them. */
  stampIcons: string[];
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
  status: "reserved" | "awaiting_customer" | "approved" | "cancelled" | "reversed";
  reservedAt: string;
  committedAt: string | null;
  cancelledAt: string | null;
  /** Set once the customer has approved on their phone. */
  customerApprovedAt?: string | null;
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

/**
 * A rung on the earning ladder of a Points or Discount program.
 *
 * `rateBps` is basis points: 10000 is a 1x multiplier for points and 100% for
 * a discount, so 12500 earns a member half again as much. The API multiplies
 * the program's base rate by the highest tier the member's lifetime visits
 * have cleared, so tiers compose with the base rule rather than replacing it.
 */
export type ProgramTier = {
  id: string;
  name: string;
  /** Lifetime visits that unlock this tier. */
  threshold: number;
  rateBps: number;
};

/**
 * One recorded sale in the counter's history.
 *
 * `status` matters: a reversed sale keeps its row, so a merchant looking for
 * what they refunded finds it rather than its absence.
 */
export type CounterTransaction = {
  id: string;
  customer: string;
  branch: string;
  /** A staff member's name, or the credential id when a POS wrote the sale. */
  staff: string;
  amountCentavos: number;
  /** recorded | voided | refunded. Only `recorded` can still be reversed. */
  status: string;
  occurredAt: string;
  reference: string;
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
  /** Running balance after this entry, which is what makes it a statement. */
  balanceAfterCentavos: number;
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
  /** Who said it. Filled in on the merchant's own list only - the answer
   *  endpoint is unauthenticated and never names the customer. */
  customerId: string;
  customer: string;
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

/** An access, correction, export or deletion request under the DPA. */
export type DataRequest = {
  id: string;
  // What the API stores, which is only these two. "access" and "correction"
  // are named in the endpoint docstring but rejected by its own pattern.
  kind: "export" | "deletion";
  status: "requested" | "processing" | "ready" | "completed" | "rejected";
  requestedAt: string;
  completedAt: string | null;
};

/** One visit taken while the counter had no signal. */
export type OfflineVisit = {
  /**
   * Minted once at the counter and resent on every retry. It is the dedup
   * key, so a sidecar that syncs twice does not stamp twice.
   */
  externalReference: string;
  customerId: string;
  amountCentavos: number;
  branchId?: string;
  occurredAt: string;
  /** HMAC over the reference and timestamp, from the till's signing secret. */
  signature: string;
};

export type OfflineSyncResult = {
  accepted: number;
  duplicates: number;
  rejected: number;
  results: {
    externalReference: string;
    status: "accepted" | "duplicate" | "rejected";
    transactionId: string | null;
    detail: string;
  }[];
};

/** One delivery with what was sent and what came back. */
export type DeliveryDetail = {
  id: string;
  event: string;
  source: string;
  status: string;
  detail: string;
  requestId: string;
  attempts: number;
  createdAt: string;
  direction: string;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  maxAttempts: number;
  nextAttemptAt: string | null;
  deliveredAt: string | null;
};

/**
 * One platform administrator, for the quarterly access review.
 *
 * `activeSessions` is the point of the review: a departed administrator with
 * a live session is exactly what it exists to catch.
 */
export type Administrator = {
  id: string;
  name: string;
  email: string;
  /** Null for a row provisioned before roles existed; it can do nothing. */
  role: PlatformRole | null;
  isActive: boolean;
  mfaEnabled: boolean;
  activeSessions: number;
  lastSeenAt: string | null;
  createdAt: string;
};

export type SupportRequest = {
  id: string;
  subject: string;
  status: string;
  openedAt: string;
};

/** How far a workspace got before it stopped. */
export type OnboardingRow = {
  merchantId: string;
  name: string;
  plan: string;
  createdAt: string;
  hasProgram: boolean;
  hasLocation: boolean;
  hasStaff: boolean;
  hasFirstStamp: boolean;
  stepsDone: number;
  stepsTotal: number;
};

/** Network-wide limits. Basis points, never floats. */
export type ProviderPolicy = {
  smsCeilingCentavos: number;
  emailComplaintPauseBps: number;
  webhookRetryHours: number;
  offlineReplayDays: number;
  auditRetentionDays: number;
  /** Where demo enquiries and partner applications are announced. */
  internalInbox: string;
};

/** A shop asking to join, and what was decided about it. */
export type PartnerApplication = {
  id: string;
  businessName: string;
  category: string;
  branches: number;
  address: string;
  mapsLink: string;
  ownerName: string;
  mobile: string;
  email: string;
  facebook: string;
  volume: string;
  existing: string;
  mechanic: string;
  heardFrom: string;
  status: "new" | "approved" | "rejected";
  reason: string;
  decidedAt: string | null;
  /** Set when approval provisioned the workspace. */
  merchantId: string | null;
  createdAt: string;
  /** Recorded on approval through 31 December 2026. Absent today. */
  founding?: boolean;
  setupNotes?: string;
};

/* ── The stamp-card contract, ahead of the backend ─────────────────────
   Shapes from backend/CONTRACT.md, "The stamp-card contract to implement"
   and the queued D8 conditions. Every field is optional on the types the API
   already returns, because today's responses do not carry them; the screens
   render what arrives and never compute a rule locally. */

export type CardState = "pending" | "active" | "completed" | "closed";
export type CloseBehaviour = "expire" | "carryOver";

/** The merchant's settings on a stamp program. Every plan, shown on the card. */
export type StampRules = {
  welcomeStamp: boolean;
  /** 1440 is once a day. */
  cooldownMinutes: number;
  minSpendCentavos: number;
  /** One number for unclaimed stamps and earned rewards (D2). Zero is never. */
  expiryDays: number;
  startsAt: string | null;
  endsAt: string | null;
  onClose: CloseBehaviour;
  successorProgramId: string | null;
  rewardGraceDays: number;
  /** Zero is unlimited. */
  maxCompletions: number;
};

export type PendingStamp = { expiresAt: string };

/** How a card looks under a suki tier, on the card itself. */
export type CardTier = {
  name: string;
  rank: number;
  nextName: string | null;
  /** Visits or pesos still needed for the next rung, in the tier's basis. */
  nextIn: number | null;
  basis: "visits" | "spend";
  benefit: string;
};

export type CardBonusWindow = {
  name: string;
  multiplier: number;
  endsAt: string;
  /** True while the window is running right now. */
  live: boolean;
};

export type MissionProgress = {
  missionId: string;
  name: string;
  progress: number;
  target: number;
  endsOn: string;
  bonus: string;
  completed: boolean;
};

/** A reward waiting for the customer's approval on their phone. */
export type PendingApproval = {
  id: string;
  businessId: string;
  business: string;
  reward: string;
  valueCentavos: number;
  branch: string;
  staff: string;
  requestedAt: string;
  expiresAt: string;
  preview?: boolean;
};

/** What `POST /transactions` adds once the rules exist. */
export type VisitOutcome = {
  welcomeStampConfirmed?: boolean;
  /** False when the visit recorded but earned nothing: cooldown or spend. */
  earned?: boolean;
  nextStampAt?: string | null;
  reason?: string | null;
  cardState?: CardState;
  completed?: boolean;
};

/* ── The Core and Grow levers ──────────────────────────────────────── */

export type BonusWindow = {
  id: string;
  name: string;
  multiplier: number;
  /** Mon..Sun, empty for every day. */
  days: string[];
  fromHour: number;
  toHour: number;
  startsOn: string;
  endsOn: string | null;
  /** Null for every branch. */
  branchIds: string[] | null;
  status: "scheduled" | "live" | "paused" | "ended";
  estimatedCostCentavos: number;
  stampsGranted: number;
  preview?: boolean;
};

export type PromoCode = {
  id: string;
  code: string;
  grants: "stamp" | "points" | "coupon";
  amount: number;
  couponName: string | null;
  startsOn: string;
  endsOn: string | null;
  redemptions: number;
  limitPerMember: number;
  status: "active" | "paused" | "ended";
  preview?: boolean;
};

/** Peso credit issued by hand, apart from cashback. Signed centavos. */
export type StoreCreditEntry = {
  id: string;
  customerId: string;
  customer: string;
  amountCentavos: number;
  balanceAfterCentavos: number;
  reason: string;
  issuedBy: string;
  occurredAt: string;
  preview?: boolean;
};

export type SukiTier = {
  id: string;
  name: string;
  rank: number;
  threshold: number;
  benefit: string;
  /** 10000 is the base earn rate. */
  earnRateBps: number;
  members: number;
  preview?: boolean;
};

export type SukiTierProgram = {
  basis: "visits" | "spend";
  /** Quiet days before a member drops a rung. */
  downgradeAfterDays: number;
  tiers: SukiTier[];
  preview?: boolean;
};

export type Mission = {
  id: string;
  name: string;
  goal: "visits" | "items" | "spend";
  targetCount: number;
  itemNames: string[];
  startsOn: string;
  endsOn: string;
  bonus: string;
  bonusUnits: number;
  participants: number;
  completions: number;
  status: "scheduled" | "live" | "ended";
  preview?: boolean;
};

export type GiftTransfer = {
  id: string;
  businessId: string;
  business: string;
  fromName: string;
  toName: string;
  kind: "reward" | "points";
  reward: string | null;
  units: number;
  message: string;
  sentAt: string;
  status: "sent" | "accepted";
  direction: "sent" | "received";
  preview?: boolean;
};

export type CategoryRate = {
  id: string;
  category: string;
  rateBps: number;
  items: string[];
  preview?: boolean;
};

/** Whether Discover shows the shop, and what the rule says is missing if not. */
export type DiscoverListing = {
  listed: boolean;
  missing: string[];
};

export type FeaturedPlacement = {
  active: boolean;
  source: "plan" | "addon" | null;
  renewsOn: string | null;
  priceCentavos: number;
  preview?: boolean;
};

/* ── The public marketplace ────────────────────────────────────────── */

export type PublicBranch = {
  /** The join slug printed on that branch's poster. */
  slug: string;
  name: string;
  neighborhood: string;
  city: string;
  address: string;
  mapsLink: string;
  hours: OpeningHours[];
  open: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type PublicShop = {
  slug: string;
  name: string;
  category: string;
  neighborhood: string;
  city: string;
  address: string;
  mapsLink: string;
  hours: OpeningHours[];
  open: boolean;
  image: string | null;
  /** The headline program's reward in plain words. */
  reward: string;
  program: string | null;
  target: number;
  stampIcon?: string;
  stampImageUrl?: string | null;
  featured: boolean;
  distanceMetres: number | null;
  about: string;
  branches: PublicBranch[];
  memberCount: number;
  preview?: boolean;
};

export type DiscoverFacet = { name: string; count: number; preview?: boolean };

export type PublicDiscoverQuery = {
  category?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  search?: string;
  limit?: number;
  cursor?: string;
};

/* ── Billing, behind the two flags ─────────────────────────────────── */

export type QrPayment = {
  intentId: string;
  /** A data URL the screen can put straight into an img. */
  qrImage: string;
  expiresAt: string;
  amountCentavos: number;
  status: "awaiting" | "paid" | "expired" | "failed";
  reference: string;
  preview?: boolean;
};

export type CreditBundle = "payg" | "1000" | "5000";

export type CreditPurchase = {
  bundle: CreditBundle;
  segments: number;
  perSegmentCentavos: number;
  totalCentavos: number;
};

export type AddOnSubscription = {
  id: string;
  merchantId: string;
  business: string;
  addOn: "featured" | "branch_reporting" | "setup";
  status: "active" | "cancelled" | "pending";
  priceCentavos: number;
  renewsOn: string | null;
  /** Which branch an "Extra branch reporting" add-on reports on. */
  branchId?: string | null;
  preview?: boolean;
};

/** One branch bought beyond the plan's reporting allowance. */
export type BranchReportingExtra = {
  id: string;
  branchId: string;
  branch: string;
  status: "active" | "cancelled" | "pending";
  renewsOn: string | null;
};

/** Extra branch reporting, ₱150 a branch a month on Core and up. */
export type BranchReporting = {
  priceCentavos: number;
  /** How many branches the plan reports separately; 0 on Launch. */
  allowance: number;
  extras: BranchReportingExtra[];
};

export type PushState = {
  vapidPublicKey: string;
  subscribed: boolean;
  preview?: boolean;
};

/** What a stranger sees the instant they scan the counter poster. */
export type FirstStampOffer = {
  claimToken: string;
  business: string;
  /** So a signed-in visitor's wallet can be checked against this poster
   *  before they tap. Somebody already holding the card was told "A stamp for
   *  you - keep it", and only found out otherwise after tapping. */
  businessId: string;
  branch: string;
  program: string;
  reward: string;
  stamps: number;
  target: number;
  stampIcon?: string;
  stampImageUrl?: string | null;
};
