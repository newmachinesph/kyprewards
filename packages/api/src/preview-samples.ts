/**
 * Sample data for preview mode, one function per unbuilt endpoint.
 *
 * All of it is the Sweet Crumbs story the rest of the product already tells,
 * carried forward into the features the backend has not shipped. Every row
 * carries `preview: true`; nothing here is ever shown without the badge that
 * flag drives, and nothing here is shown at all unless
 * `NEXT_PUBLIC_PREVIEW_UNBUILT=true`.
 *
 * Dates are relative to now so a run window or a pending stamp reads as live
 * whenever the page is opened, rather than as a fixture from last month.
 */

import type {
  AddOnSubscription,
  BonusWindow,
  CategoryRate,
  DiscoverFacet,
  FeaturedPlacement,
  GiftTransfer,
  Mission,
  PendingApproval,
  PromoCode,
  PublicShop,
  PushState,
  QrPayment,
  StoreCreditEntry,
  SukiTierProgram,
  WalletCard,
} from "./types.ts";
import type { Page } from "./http.ts";

const DAY = 86_400_000;
const iso = (daysFromNow: number, hour = 9): string => {
  const at = new Date(Date.now() + daysFromNow * DAY);
  at.setHours(hour, 0, 0, 0);
  return at.toISOString();
};
const day = (daysFromNow: number): string => iso(daysFromNow).slice(0, 10);

const SC = { businessId: "biz_sweet_crumbs", business: "Sweet Crumbs" } as const;

/* ── The stamp card ───────────────────────────────────────────────── */

/** Extra wallet cards showing the states the API cannot produce yet. */
export const sampleWalletExtras = (): WalletCard[] => [
  {
    id: "mem_preview_pending",
    programId: "prog_preview_pending",
    program: "Milk tea card",
    businessId: "biz_preview_tea",
    business: "Tita Nene's Milk Tea",
    kind: "Stamps",
    category: "Milk tea",
    progress: 1,
    target: 6,
    balance: "1 of 6",
    reward: "6 cups → a free large",
    status: "Pending",
    rewardsAvailable: 0,
    color: "accent",
    imageUrl: null,
    distanceMetres: 640,
    state: "pending",
    pendingStamp: { expiresAt: iso(27) },
    rules: {
      welcomeStamp: true,
      cooldownMinutes: 1440,
      minSpendCentavos: 0,
      expiryDays: 0,
      startsAt: null,
      endsAt: null,
      onClose: "expire",
      successorProgramId: null,
      rewardGraceDays: 30,
      maxCompletions: 0,
    },
    badge: true,
    plan: "Launch",
    preview: true,
  },
  {
    id: "mem_preview_run",
    programId: "prog_preview_run",
    program: "Ber months card",
    ...SC,
    kind: "Stamps",
    category: "Bakery",
    progress: 5,
    target: 8,
    balance: "5 of 8",
    reward: "8 visits → a pastry on us",
    status: "Active",
    rewardsAvailable: 0,
    color: "ink",
    imageUrl: null,
    distanceMetres: 1200,
    state: "active",
    nextStampAt: iso(1, 6),
    rules: {
      welcomeStamp: true,
      cooldownMinutes: 1440,
      minSpendCentavos: 10_000,
      expiryDays: 90,
      startsAt: iso(-20),
      endsAt: iso(70),
      onClose: "carryOver",
      successorProgramId: "prog_preview_next",
      rewardGraceDays: 30,
      maxCompletions: 2,
    },
    completions: 1,
    badge: false,
    plan: "Grow",
    tier: {
      name: "Suki",
      rank: 2,
      nextName: "Super suki",
      nextIn: 4,
      basis: "visits",
      benefit: "1.5× stamps on Tuesdays",
    },
    bonusWindow: {
      name: "Double stamps, 2 to 4",
      multiplier: 2,
      endsAt: iso(0, 16),
      live: true,
    },
    missions: [
      {
        missionId: "msn_preview_1",
        name: "Visit three times this month",
        progress: 2,
        target: 3,
        endsOn: day(12),
        bonus: "+2 stamps",
        completed: false,
      },
    ],
    storeCreditCentavos: 15_000,
    preview: true,
  },
  {
    id: "mem_preview_closed",
    programId: "prog_preview_closed",
    program: "Summer card",
    businessId: "biz_preview_salon",
    business: "Glow Salon",
    kind: "Stamps",
    category: "Salon",
    progress: 5,
    target: 5,
    balance: "5 of 5",
    reward: "5 visits → signature treatment",
    status: "Closed",
    rewardsAvailable: 1,
    color: "green",
    imageUrl: null,
    distanceMetres: 3400,
    state: "closed",
    redeemBy: day(18),
    closeOutcome: "expired",
    rules: {
      welcomeStamp: false,
      cooldownMinutes: 1440,
      minSpendCentavos: 0,
      expiryDays: 0,
      startsAt: iso(-100),
      endsAt: iso(-12),
      onClose: "expire",
      successorProgramId: null,
      rewardGraceDays: 30,
      maxCompletions: 1,
    },
    completions: 1,
    badge: false,
    plan: "Core",
    preview: true,
  },
];

export const samplePendingApprovals = (): PendingApproval[] => [
  {
    id: "red_preview_1",
    ...SC,
    reward: "A pastry on us",
    valueCentavos: 9_500,
    branch: "Kapitolyo",
    staff: "Jan",
    requestedAt: iso(0, new Date().getHours()),
    expiresAt: iso(0, new Date().getHours() + 1),
    preview: true,
  },
];

/* ── Core and Grow levers ─────────────────────────────────────────── */

export const sampleBonusWindows = (): BonusWindow[] => [
  {
    id: "bw_preview_1",
    name: "Double stamps, slow afternoons",
    multiplier: 2,
    days: ["Tue", "Wed"],
    fromHour: 14,
    toHour: 16,
    startsOn: day(-14),
    endsOn: day(30),
    branchIds: null,
    status: "live",
    estimatedCostCentavos: 18_600,
    stampsGranted: 42,
    preview: true,
  },
  {
    id: "bw_preview_2",
    name: "Triple through the Ber months",
    multiplier: 3,
    days: [],
    fromHour: 0,
    toHour: 24,
    startsOn: "2026-09-01",
    endsOn: "2026-12-31",
    branchIds: ["branch_bgc"],
    status: "scheduled",
    estimatedCostCentavos: 124_000,
    stampsGranted: 0,
    preview: true,
  },
];

export const samplePromoCodes = (): PromoCode[] => [
  {
    id: "pc_preview_1",
    code: "WELCOME",
    grants: "stamp",
    amount: 1,
    couponName: null,
    startsOn: day(-30),
    endsOn: null,
    redemptions: 118,
    limitPerMember: 1,
    status: "active",
    preview: true,
  },
  {
    id: "pc_preview_2",
    code: "FIESTA",
    grants: "coupon",
    amount: 1,
    couponName: "₱50 off any cake",
    startsOn: day(-3),
    endsOn: day(10),
    redemptions: 27,
    limitPerMember: 1,
    status: "active",
    preview: true,
  },
];

export const sampleStoreCredit = (): StoreCreditEntry[] => [
  {
    id: "scr_preview_1",
    customerId: "cus_1001",
    customer: "Jacqueline Daniel",
    amountCentavos: 15_000,
    balanceAfterCentavos: 15_000,
    reason: "Wrong order on Sunday, make-good",
    issuedBy: "Mara Santos",
    occurredAt: iso(-3, 11),
    preview: true,
  },
  {
    id: "scr_preview_2",
    customerId: "cus_1002",
    customer: "Miguel Reyes",
    amountCentavos: -8_000,
    balanceAfterCentavos: 2_000,
    reason: "Spent at the counter",
    issuedBy: "Jan",
    occurredAt: iso(-1, 15),
    preview: true,
  },
];

export const sampleSukiTiers = (): SukiTierProgram => ({
  basis: "visits",
  downgradeAfterDays: 90,
  tiers: [
    { id: "tier_1", name: "Bago", rank: 1, threshold: 0, benefit: "The stamp card", earnRateBps: 10_000, members: 812, preview: true },
    { id: "tier_2", name: "Suki", rank: 2, threshold: 10, benefit: "1.5× stamps on Tuesdays", earnRateBps: 12_500, members: 231, preview: true },
    { id: "tier_3", name: "Super suki", rank: 3, threshold: 30, benefit: "First pick of every bonus window, a reserved reward", earnRateBps: 15_000, members: 44, preview: true },
  ],
  preview: true,
});

export const sampleMissions = (): Mission[] => [
  {
    id: "msn_preview_1",
    name: "Visit three times this month",
    goal: "visits",
    targetCount: 3,
    itemNames: [],
    startsOn: day(-18),
    endsOn: day(12),
    bonus: "+2 stamps",
    bonusUnits: 2,
    participants: 260,
    completions: 71,
    status: "live",
    preview: true,
  },
  {
    id: "msn_preview_2",
    name: "Try the three new breads",
    goal: "items",
    targetCount: 3,
    itemNames: ["Ube pandesal", "Cheese ensaymada", "Malunggay loaf"],
    startsOn: day(5),
    endsOn: day(35),
    bonus: "Free coffee",
    bonusUnits: 1,
    participants: 0,
    completions: 0,
    status: "scheduled",
    preview: true,
  },
];

export const sampleGifts = (): GiftTransfer[] => [
  {
    id: "gift_preview_1",
    ...SC,
    fromName: "Jacqueline Daniel",
    toName: "Miguel Reyes",
    kind: "reward",
    reward: "A pastry on us",
    units: 1,
    message: "Pasalubong, para sa iyo",
    sentAt: iso(-2, 18),
    status: "accepted",
    direction: "sent",
    preview: true,
  },
  {
    id: "gift_preview_2",
    ...SC,
    fromName: "Ana Lim",
    toName: "Jacqueline Daniel",
    kind: "points",
    reward: null,
    units: 50,
    message: "Happy birthday!",
    sentAt: iso(-1, 9),
    status: "sent",
    direction: "received",
    preview: true,
  },
];

export const sampleCategoryRates = (): CategoryRate[] => [
  { id: "cat_1", category: "Coffee", rateBps: 10_000, items: ["Americano", "Latte"], preview: true },
  { id: "cat_2", category: "Bread", rateBps: 15_000, items: ["Ube pandesal", "Cheese ensaymada"], preview: true },
  { id: "cat_3", category: "Cakes", rateBps: 20_000, items: ["Whole cakes"], preview: true },
];

export const sampleFeatured = (): FeaturedPlacement => ({
  active: true,
  source: "plan",
  renewsOn: null,
  priceCentavos: 29_900,
  preview: true,
});

/* ── The public marketplace ────────────────────────────────────────── */

const HOURS = [
  { days: "Mon–Sat", time: "7:00 AM – 8:00 PM" },
  { days: "Sun", time: "8:00 AM – 6:00 PM" },
];

const shop = (
  slug: string,
  name: string,
  category: string,
  neighborhood: string,
  city: string,
  reward: string,
  target: number,
  extras: Partial<PublicShop> = {},
): PublicShop => ({
  slug,
  name,
  category,
  neighborhood,
  city,
  address: `${neighborhood}, ${city}`,
  hours: HOURS,
  open: true,
  image: null,
  reward,
  program: "Stamp card",
  target,
  featured: false,
  distanceMetres: null,
  about: `${name} is a ${category.toLowerCase()} in ${neighborhood}. Join from the poster at the counter and your first stamp is waiting.`,
  branches: [
    {
      slug: `${slug}-${neighborhood.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: neighborhood,
      neighborhood,
      city,
      address: `${neighborhood}, ${city}`,
      hours: HOURS,
      open: true,
      latitude: null,
      longitude: null,
    },
  ],
  memberCount: 120,
  preview: true,
  ...extras,
});

export const samplePublicShops = (): PublicShop[] => [
  shop("sweet-crumbs", "Sweet Crumbs", "Bakery", "Kapitolyo", "Pasig", "8 visits → a pastry on us", 8, {
    featured: true,
    memberCount: 1_087,
    distanceMetres: 1_200,
    about: "A neighborhood bakery in Kapitolyo since 2019. Ube pandesal before eight, cheese ensaymada all day, and a stamp card that pays out in pastries.",
    branches: [
      { slug: "sweet-crumbs-kapitolyo", name: "Kapitolyo", neighborhood: "Kapitolyo", city: "Pasig", address: "12 East Capitol Drive, Kapitolyo, Pasig", hours: HOURS, open: true, latitude: 14.5716, longitude: 121.0602 },
      { slug: "sweet-crumbs-bgc", name: "BGC", neighborhood: "Bonifacio Global City", city: "Taguig", address: "5th Avenue, BGC, Taguig", hours: HOURS, open: true, latitude: 14.5495, longitude: 121.0509 },
      { slug: "sweet-crumbs-makati", name: "Makati", neighborhood: "Poblacion", city: "Makati", address: "Kalayaan Avenue, Poblacion, Makati", hours: HOURS, open: false, latitude: 14.5654, longitude: 121.0293 },
    ],
  }),
  shop("tita-nenes", "Tita Nene's Milk Tea", "Milk tea", "Kapitolyo", "Pasig", "6 cups → a free large", 6, { distanceMetres: 640, memberCount: 342 }),
  shop("glow-salon", "Glow Salon", "Salon", "Ortigas", "Pasig", "5 visits → signature treatment", 5, { distanceMetres: 3_400, memberCount: 211 }),
  shop("bean-there", "Bean There", "Café", "Poblacion", "Makati", "10 cups → one on us", 10, { distanceMetres: 5_100, memberCount: 508, featured: true }),
  shop("aling-rosas", "Aling Rosa's Sari-sari", "Sari-sari", "San Antonio", "Pasig", "10 visits → ₱50 off", 10, { distanceMetres: 900, memberCount: 96 }),
  shop("harbor-grind", "Harbor Grind Coffee", "Café", "Salcedo Village", "Makati", "8 cups → a free brew", 8, { distanceMetres: 6_200, memberCount: 377 }),
  shop("lola-cora", "Lola Cora's Carinderia", "Carinderia", "Kapitolyo", "Pasig", "7 lunches → a free lunch", 7, { distanceMetres: 700, memberCount: 154 }),
  shop("wash-day", "Wash Day Laundry", "Laundry", "Ugong", "Pasig", "6 loads → one free", 6, { distanceMetres: 2_300, memberCount: 88 }),
];

export const samplePublicShop = (slug: string): PublicShop | undefined =>
  samplePublicShops().find((s) => s.slug === slug);

export const samplePublicDiscover = (query: {
  category?: string;
  neighborhood?: string;
  search?: string;
} = {}): Page<PublicShop> => {
  const q = query.search?.toLowerCase();
  const items = samplePublicShops()
    .filter((s) => !query.category || s.category === query.category)
    .filter((s) => !query.neighborhood || s.neighborhood === query.neighborhood)
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || (a.distanceMetres ?? 0) - (b.distanceMetres ?? 0));
  return { items, total: items.length, nextCursor: null };
};

const facet = (field: "category" | "neighborhood"): DiscoverFacet[] => {
  const counts = new Map<string, number>();
  for (const s of samplePublicShops()) counts.set(s[field], (counts.get(s[field]) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count, preview: true }));
};
export const sampleCategories = (): DiscoverFacet[] => facet("category");
export const sampleNeighborhoods = (): DiscoverFacet[] => facet("neighborhood");

/* ── Billing ──────────────────────────────────────────────────────── */

/** A 21-module QR drawn as SVG, so the payment sheet has a real-looking code. */
const qrDataUrl = (): string => {
  let bits = 0x9e3779b9;
  const cells: string[] = [];
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      bits = (bits * 1103515245 + 12345) & 0x7fffffff;
      const finder =
        (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      const on = finder ? !((x === 1 || x === 5 || y === 1 || y === 5) && x > 0 && x < 6 && y > 0 && y < 6) && x !== 7 && y !== 7 : bits % 3 === 0;
      if (on) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 25 25" shape-rendering="crispEdges"><rect x="-2" y="-2" width="25" height="25" fill="#fff"/><g fill="#000">${cells.join("")}</g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const sampleQrPayment = (amountCentavos: number, reference: string): QrPayment => ({
  intentId: `pi_preview_${reference}`,
  qrImage: qrDataUrl(),
  expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
  amountCentavos,
  status: "awaiting",
  reference,
  preview: true,
});

export const sampleAddOns = (): AddOnSubscription[] => [
  { id: "addon_1", merchantId: "mrc_sweet_crumbs", business: "Sweet Crumbs", addOn: "featured", status: "active", priceCentavos: 0, renewsOn: null, preview: true },
  { id: "addon_2", merchantId: "mrc_bean_there", business: "Bean There", addOn: "featured", status: "active", priceCentavos: 29_900, renewsOn: day(14), preview: true },
  { id: "addon_3", merchantId: "mrc_glow", business: "Glow Salon", addOn: "branch_reporting", status: "active", priceCentavos: 15_000, renewsOn: day(9), preview: true },
  { id: "addon_4", merchantId: "mrc_harbor", business: "Harbor Grind Coffee", addOn: "setup", status: "pending", priceCentavos: 0, renewsOn: null, preview: true },
];

export const samplePushState = (): PushState => ({
  vapidPublicKey: "",
  subscribed: false,
  preview: true,
});
