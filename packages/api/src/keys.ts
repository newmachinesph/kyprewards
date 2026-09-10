/**
 * Every query key in the product, in one file.
 *
 * Keys are what invalidation targets, so scattering the arrays across call
 * sites is how a mutation ends up refreshing three of the four lists that
 * actually changed. Each domain's `all` is a prefix of its members, which is
 * what makes `invalidateQueries({ queryKey: keys.business.all })` mean
 * "everything in this workspace" without listing it.
 */

export const keys = {
  contract: ["contract"] as const,
  scenario: ["scenario"] as const,

  session: {
    all: ["session"] as const,
    current: () => [...keys.session.all, "current"] as const,
    workspaces: () => [...keys.session.all, "workspaces"] as const,
  },

  business: {
    all: ["business"] as const,
    profile: () => [...keys.business.all, "profile"] as const,
    branding: () => [...keys.business.all, "branding"] as const,
    settings: () => [...keys.business.all, "settings"] as const,
    messagingPolicy: () => [...keys.business.all, "messaging-policy"] as const,
    coupons: () => [...keys.business.all, "coupons"] as const,
    giftCards: () => [...keys.business.all, "gift-cards"] as const,
    giftCard: (code: string) => [...keys.business.giftCards(), code] as const,
    giftCardEntries: (code: string) =>
      [...keys.business.giftCard(code), "entries"] as const,
    catalog: (programId: string) => [...keys.business.program(programId), "catalog"] as const,
    tiers: (programId: string) => [...keys.business.program(programId), "tiers"] as const,
    referrals: () => [...keys.business.all, "referrals"] as const,
    feedback: () => [...keys.business.all, "feedback"] as const,
    customFields: () => [...keys.business.all, "custom-fields"] as const,
    customFieldValues: (customerId: string) =>
      [...keys.business.customFields(), customerId] as const,
    approvals: () => [...keys.business.all, "approvals"] as const,
    held: (customerId: string) => [...keys.business.all, "held", customerId] as const,
    delivery: (id: string) => [...keys.business.all, "delivery", id] as const,
    rfm: () => [...keys.business.all, "rfm"] as const,
    locations: () => [...keys.business.all, "locations"] as const,
    metrics: () => [...keys.business.all, "metrics"] as const,
    billing: () => [...keys.business.all, "billing"] as const,
    staff: () => [...keys.business.all, "staff"] as const,
    programs: () => [...keys.business.all, "programs"] as const,
    program: (id: string) => [...keys.business.programs(), id] as const,
    automations: () => [...keys.business.all, "automations"] as const,
    campaigns: () => [...keys.business.all, "campaigns"] as const,
    messages: () => [...keys.business.all, "messages"] as const,
    redemptions: () => [...keys.business.all, "redemptions"] as const,
    transactions: () => [...keys.business.all, "transactions"] as const,
    integrations: () => [...keys.business.all, "integrations"] as const,
    favoriteOrders: () => [...keys.business.all, "favorite-orders"] as const,
    /**
     * Filters belong in the key. Two different filters are two different
     * server answers, and sharing one key between them is how a list shows
     * the previous search's rows for a frame.
     */
    customers: (filters: CustomerFilters = {}) =>
      [...keys.business.all, "customers", filters] as const,
    analytics: {
      all: () => [...keys.business.all, "analytics"] as const,
      visits: (period = "week") => [...keys.business.analytics.all(), "visits", period] as const,
      retention: () => [...keys.business.analytics.all(), "retention"] as const,
      audience: () => [...keys.business.analytics.all(), "audience"] as const,
      setupProgress: () => [...keys.business.analytics.all(), "setup-progress"] as const,
      rfm: () => [...keys.business.analytics.all(), "rfm"] as const,
      segments: () => [...keys.business.analytics.all(), "segments"] as const,
      staff: () => [...keys.business.analytics.all(), "staff"] as const,
      branches: () => [...keys.business.analytics.all(), "branches"] as const,
      campaigns: () => [...keys.business.analytics.all(), "campaigns"] as const,
      timeToSecondVisit: () =>
        [...keys.business.analytics.all(), "time-to-second-visit"] as const,
    },
  },

  customer: {
    all: ["customer"] as const,
    profile: () => [...keys.customer.all, "profile"] as const,
    dataRequests: () => [...keys.customer.all, "data-requests"] as const,
    wallet: () => [...keys.customer.all, "wallet"] as const,
    notifications: () => [...keys.customer.all, "notifications"] as const,
    activity: () => [...keys.customer.all, "activity"] as const,
    channels: () => [...keys.customer.all, "channels"] as const,
    consentHistory: () => [...keys.customer.all, "consent-history"] as const,
    /** Coordinates change the answer, so they are part of the key. */
    discover: (near?: Coordinates) => [...keys.customer.all, "discover", near ?? null] as const,
    nearby: (near?: Coordinates) => [...keys.customer.all, "nearby", near ?? null] as const,
  },

  counter: {
    all: ["counter"] as const,
    lookup: (identifier: string) => [...keys.counter.all, "lookup", identifier] as const,
    balance: (customerId: string) => [...keys.counter.all, "balance", customerId] as const,
    rewards: (customerId: string) => [...keys.counter.all, "rewards", customerId] as const,
  },

  admin: {
    all: ["admin"] as const,
    metrics: () => [...keys.admin.all, "metrics"] as const,
    tenants: () => [...keys.admin.all, "tenants"] as const,
    support: () => [...keys.admin.all, "support"] as const,
    audit: () => [...keys.admin.all, "audit"] as const,
    services: () => [...keys.admin.all, "services"] as const,
    adapters: () => [...keys.admin.all, "adapters"] as const,
    tenantConnections: () => [...keys.admin.all, "tenant-connections"] as const,
    recoveryQueue: () => [...keys.admin.all, "recovery-queue"] as const,
    invoices: () => [...keys.admin.all, "invoices"] as const,
    campaigns: () => [...keys.admin.all, "campaigns"] as const,
    partnerApplications: () => [...keys.admin.all, "partner-applications"] as const,
    administrators: () => [...keys.admin.all, "administrators"] as const,
    onboarding: () => [...keys.admin.all, "onboarding"] as const,
    providerPolicy: () => [...keys.admin.all, "provider-policy"] as const,
    flags: () => [...keys.admin.all, "flags"] as const,
    privacy: () => [...keys.admin.all, "privacy"] as const,
    economics: {
      plans: () => [...keys.admin.all, "economics", "plans"] as const,
      channels: () => [...keys.admin.all, "economics", "channels"] as const,
    },
  },

  integrations: {
    all: ["integrations"] as const,
    // Environment is in the key: sandbox and production are different
    // answers, and sharing one key between them showed live keys under a
    // screen labelled Sandbox.
    credentials: (environment: string) =>
      [...keys.integrations.all, "credentials", environment] as const,
    webhookEndpoints: (environment: string) =>
      [...keys.integrations.all, "webhook-endpoints", environment] as const,
    webhookDeliveries: (environment: string) =>
      [...keys.integrations.all, "webhook-deliveries", environment] as const,
  },

  /** Unauthenticated. Read by the marketing site's poster route and kyp.ph. */
  public: {
    all: ["public"] as const,
    join: (slug: string) => [...keys.public.all, "join", slug] as const,
    discover: (query: Record<string, unknown> = {}) =>
      [...keys.public.all, "discover", query] as const,
    shop: (slug: string) => [...keys.public.all, "shop", slug] as const,
    categories: () => [...keys.public.all, "categories"] as const,
    neighborhoods: () => [...keys.public.all, "neighborhoods"] as const,
  },

  /* Ahead of the backend. Each lives under the domain that owns it so the
     domain's `all` prefix still invalidates it. */
  levers: {
    all: ["business", "levers"] as const,
    bonusWindows: () => [...keys.levers.all, "bonus-windows"] as const,
    promoCodes: () => [...keys.levers.all, "promo-codes"] as const,
    storeCredit: (customerId?: string) =>
      [...keys.levers.all, "store-credit", customerId ?? "all"] as const,
    sukiTiers: () => [...keys.levers.all, "suki-tiers"] as const,
    missions: () => [...keys.levers.all, "missions"] as const,
    gifts: () => [...keys.levers.all, "gifts"] as const,
    categoryRates: (programId: string) =>
      [...keys.levers.all, "category-rates", programId] as const,
    featured: () => [...keys.levers.all, "featured"] as const,
    closePreview: (programId: string, onClose: string) =>
      [...keys.levers.all, "close-preview", programId, onClose] as const,
  },
  wallet: {
    approvals: () => [...keys.customer.all, "approvals"] as const,
    gifts: () => [...keys.customer.all, "gifts"] as const,
    push: () => [...keys.customer.all, "push"] as const,
  },
  billing: {
    payment: (intentId: string) => [...keys.business.all, "payment", intentId] as const,
    addOns: () => [...keys.admin.all, "add-ons"] as const,
  },
} as const;

export type CustomerFilters = {
  search?: string;
  segment?: string;
  risk?: string;
  limit?: number;
};

export type Coordinates = { lat: number; lng: number };
