/**
 * The shapes the planned FastAPI service has to return.
 *
 * `typeof demoData` infers everything from JSON, so a status the code
 * branches on arrives as `string` and a typo compiles. These declarations are
 * the contract instead: narrow unions where the UI switches on a value, and
 * one place to change when an endpoint's shape moves.
 *
 * `api.ts` is the only file that asserts the fixture into these types. Every
 * other consumer receives them already narrowed.
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
  renewal: string;
  renewalIso: string;
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
  lifetimeValue: number;
  lastVisit: string;
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
  liability: number;
};

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  audience: number;
  channel: string;
  status: string;
  revenue: number;
};

export type Campaign = {
  id: string;
  name: string;
  audience: string;
  channels: string[];
  sent: number;
  visited: number;
  revenue: number;
  cost: number;
  status: CampaignStatus | string;
};

export type MessageRecord = {
  id: string;
  campaign: string;
  customer: string;
  channel: ChannelName | string;
  status: string;
  sentAt: string;
  cost: number;
};

export type Redemption = {
  id: string;
  customer: string;
  reward: string;
  branch: string;
  staff: string;
  value: number;
  time: string;
  status: RedemptionStatus;
};

export type StaffMember = {
  id: string;
  name: string;
  initials: string;
  role: StaffRole | string;
  location: string;
  lastActive: string;
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
  averageOrder: number;
  memberRevenue: number;
  campaignRevenue: number;
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
  issued: string;
  amount: number;
  status: string;
};

export type Billing = {
  plan: PlanName;
  monthly: number;
  cycle: string;
  nextInvoice: string;
  nextInvoiceIso: string;
  method: { kind: string; brand: string; last4: string; expiry: string };
  allowances: Allowance[];
  smsCreditBalance: number;
  invoices: Invoice[];
};

/* ── Merchant-owned integration state ─────────────────────────────── */

export type Credential = {
  id: string;
  label: string;
  clientKey: string;
  branch: string;
  scopes: string[];
  lastUsed: string;
  status: CredentialStatus;
  /** Sandbox keys are hidden while the production preview is selected. */
  environment: Environment;
};

export type Delivery = {
  id: string;
  event: string;
  source: string;
  status: DeliveryStatus;
  detail: string;
  requestId: string;
};

/* ── Customer ─────────────────────────────────────────────────────── */

export type CustomerProfile = {
  id: string;
  name: string;
  initials: string;
  city: string;
  memberSince: string;
  memberSinceIso: string;
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
  distance: string;
};

export type DiscoverPlace = {
  id: string;
  businessId: string;
  image: string;
  name: string;
  category: string;
  neighborhood: string;
  distance: string;
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
  time: string;
  receivedAtIso: string;
  kind: string;
  read: boolean;
};

export type ActivityEntry = {
  id: string;
  businessId: string;
  business: string;
  action: string;
  detail: string;
  date: string;
  occurredAtIso: string;
  value: string;
  reference: string;
};

export type ConsentEntry = {
  id: string;
  change: string;
  scope: string;
  when: string;
  whenIso: string;
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
  mrr: number;
  health: number;
  risk: TenantRisk;
  joined: string;
};

export type SupportTicket = {
  id: string;
  title: string;
  business: string;
  category: string;
  priority: TicketPriority;
  age: string;
  ageMinutes: number;
  owner: string;
  status: TicketStatus | string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  time: string;
  ip: string;
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
  monthlyRecurringRevenue: number;
  grossMargin: number;
  netRevenueRetention: number;
  smsLiability: number;
  supportSla: number;
};

export type PlanEconomics = {
  name: PlanName;
  accounts: number;
  mrr: number;
  monthlyCost: number;
  margin: number;
};

export type ChannelEconomics = {
  name: string;
  volume: number;
  revenue: number;
  cost: number;
  model: string;
};
