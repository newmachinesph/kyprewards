/**
 * Single source of truth for plan pricing and the feature matrix.
 *
 * Prices and limits come from docs/philippines-loyalty-benchmark.md: GoBalik
 * anchors the entry tier at ₱499, Suki Cards sits around ₱450–₱917 once its
 * annual PHP plans are divided by 12, and ZAP Premium caps the market at
 * ₱4,800. Channel rates are cost-plus over Semaphore (₱0.56/segment ex-VAT)
 * and SES, and are modelled in the admin Revenue & margin view.
 */

export type PlanKey = "launch" | "core" | "grow" | "scale";

/**
 * Numeric allowances behind the estimator, in plan order (Launch, Core, Grow,
 * Scale). These mirror the Limits rows of `featureMatrix` — keep them together.
 */
export const planLimits = [
  { members: 250, locations: 1, email: 500, sms: 0, push: 1000 },
  { members: 1500, locations: 1, email: 5000, sms: 0, push: 10000 },
  { members: 10000, locations: 3, email: 25000, sms: 100, push: 50000 },
  { members: 50000, locations: 10, email: 100000, sms: 500, push: 200000 },
] as const;

/** Published overage rates. Mirrors `channelRates`. */
export const overageRates = {
  smsPerSegment: 0.95,
  emailPer1000: 25,
  pushPer1000: 8,
} as const;

export const plans = [
  {
    key: "launch" as const,
    highlights: [
      "250 active members",
      "One location and one program",
      "QR join, earn, and redeem",
      "Customer PWA and in-app updates",
      "Two staff accounts",
    ],
    name: "Launch",
    monthly: 0,
    yearly: 0,
    description: "Prove the return-visit loop before paying.",
    cta: "Start free",
    featured: false,
  },
  {
    key: "core" as const,
    highlights: [
      "1,500 active members",
      "Two concurrent programs",
      "QR, NFC, and printable counter modes",
      "5,000 emails each month",
      "Scheduled and birthday campaigns",
    ],
    name: "Core",
    monthly: 499,
    yearly: 399,
    description: "For one local business building a dependable customer base.",
    cta: "Choose Core",
    featured: false,
  },
  {
    key: "grow" as const,
    highlights: [
      "10,000 active members",
      "Three locations and all eight program types",
      "Segments, referrals, reviews, and automations",
      "25,000 emails + 100 SMS credits monthly",
      "RFM, cohort, and reward-liability analytics",
    ],
    name: "Grow",
    monthly: 1290,
    yearly: 990,
    description: "For teams ready to automate retention across locations.",
    cta: "Choose Grow",
    featured: true,
  },
  {
    key: "scale" as const,
    highlights: [
      "50,000 active members",
      "Ten locations and 50 staff",
      "API, webhooks, POS, and commerce adapters",
      "100,000 emails + 500 SMS credits monthly",
      "Wallet passes, approvals, and priority onboarding",
    ],
    name: "Scale",
    monthly: 3490,
    yearly: 2790,
    description: "For established multi-location operations and integrations.",
    cta: "Choose Scale",
    featured: false,
  },
];

/** `true` renders a check, `false` an em dash, a string renders as-is. */
export type Cell = boolean | string;

export type FeatureGroup = {
  group: string;
  note?: string;
  rows: { label: string; hint?: string; cells: [Cell, Cell, Cell, Cell] }[];
};

export const featureMatrix: FeatureGroup[] = [
  {
    group: "Plan basics",
    rows: [
      {
        label: "Locations",
        cells: ["1", "1", "3", "10"],
      },
      {
        label: "Staff accounts",
        cells: ["2", "3", "10", "50"],
      },
      {
        label: "Active loyalty members",
        hint: "People currently enrolled in a live program. Archived records do not count.",
        cells: ["250", "1,500", "10,000", "50,000"],
      },
      {
        label: "Stamp, point, and redemption transactions",
        cells: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"],
      },
      {
        label: "Active programs at once",
        cells: ["1", "2", "Unlimited", "Unlimited"],
      },
    ],
  },
  {
    group: "Program types",
    note: "One program engine with composable earning, tier, eligibility, expiry, and redemption rules.",
    rows: [
      { label: "Stamp cards", cells: [true, true, true, true] },
      { label: "Points and cashback", cells: [false, true, true, true] },
      { label: "Discounts and tiered pricing", cells: [false, true, true, true] },
      { label: "Coupons", cells: [false, true, true, true] },
      {
        label: "Memberships with recurring billing",
        cells: [false, false, true, true],
      },
      { label: "Reward catalog", cells: [false, false, true, true] },
      { label: "Prepaid multipass", cells: [false, false, true, true] },
      { label: "Gift cards", cells: [false, false, true, true] },
    ],
  },
  {
    group: "Counter and enrollment",
    rows: [
      {
        label: "QR join, earn, and redeem",
        cells: [true, true, true, true],
      },
      {
        label: "Customer code, online and offline",
        hint: "A saved or printed code identifies the customer so they can earn without a signal. Redeeming a reward asks the customer to approve it in the app.",
        cells: [true, true, true, true],
      },
      {
        label: "Reversals with a full staff ledger",
        cells: [true, true, true, true],
      },
      { label: "NFC tap-to-stamp", cells: [false, true, true, true] },
      { label: "Printable and poster QR", cells: [false, true, true, true] },
      {
        label: "Offline counter queue with signed sync",
        cells: [false, false, true, true],
      },
      {
        label: "Apple and Google Wallet passes",
        cells: [false, false, true, true],
      },
    ],
  },
  {
    group: "Customers",
    rows: [
      {
        label: "Customer profiles",
        cells: ["Basic", true, true, true],
      },
      { label: "Custom fields", cells: [false, true, true, true] },
      {
        label: "Segmentation",
        cells: [false, "Basic", "Advanced", "Advanced"],
      },
      {
        label: "RFM and lifecycle scoring",
        cells: [false, false, true, true],
      },
      { label: "Import and export", cells: [false, true, true, true] },
      {
        label: "Consent ledger and privacy rights",
        hint: "Consent, export, and deletion requests are built in on every plan — they are not an upsell.",
        cells: [true, true, true, true],
      },
    ],
  },
  {
    group: "Campaigns and automation",
    rows: [
      {
        label: "In-app inbox messages",
        cells: [true, true, true, true],
      },
      {
        label: "Quiet hours and frequency caps",
        cells: [true, true, true, true],
      },
      {
        label: "Spend and reach preview before sending",
        hint: "Every send shows eligible recipients, estimated spend, predicted return visits, and break-even.",
        cells: [true, true, true, true],
      },
      { label: "Scheduled campaigns", cells: [false, true, true, true] },
      {
        label: "Birthday and anniversary journeys",
        cells: [false, true, true, true],
      },
      {
        label: "Automated journeys",
        cells: [false, false, true, true],
      },
      {
        label: "Win-back for lapsed customers",
        cells: [false, false, true, true],
      },
      { label: "Geofence nudges", cells: [false, false, true, true] },
      { label: "Two-sided referrals", cells: [false, false, true, true] },
      {
        label: "Private feedback and review requests",
        cells: [false, false, true, true],
      },
    ],
  },
  {
    group: "Included message volume",
    note: "Per month, resets on your billing date. Overage and unused-plan rates are in the add-on table below.",
    rows: [
      {
        label: "In-app messages",
        cells: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"],
      },
      {
        label: "Push notifications",
        cells: ["1,000", "10,000", "50,000", "200,000"],
      },
      { label: "Emails", cells: ["500", "5,000", "25,000", "100,000"] },
      {
        label: "SMS credits",
        hint: "SMS has a real per-message carrier cost, so it is credit-based on every plan.",
        cells: ["—", "—", "100", "500"],
      },
    ],
  },
  {
    group: "Analytics",
    rows: [
      {
        label: "Visits, return rate, and frequency",
        cells: ["Basic", true, true, true],
      },
      {
        label: "Program and reward performance",
        cells: [false, true, true, true],
      },
      {
        label: "Cohorts and time to second visit",
        cells: [false, false, true, true],
      },
      {
        label: "Reward liability",
        hint: "What your outstanding unredeemed rewards would cost if every customer claimed them tomorrow.",
        cells: [false, false, true, true],
      },
      {
        label: "Staff and branch performance",
        cells: [false, false, true, true],
      },
      {
        label: "Campaign attribution and incremental revenue",
        cells: [false, false, true, true],
      },
      {
        label: "Cross-location analytics",
        cells: [false, false, "Basic", true],
      },
    ],
  },
  {
    group: "Operations and integrations",
    rows: [
      {
        label: "Business profile in Discover",
        cells: [true, true, true, true],
      },
      { label: "Data export", cells: [true, true, true, true] },
      {
        label: "Role-based staff permissions",
        cells: [false, true, true, true],
      },
      {
        label: "Custom branding",
        cells: [false, "Basic", true, true],
      },
      {
        label: "KYPStamping badge on customer cards",
        hint: "The free plan carries our badge. Paid plans shrink it, then remove it.",
        cells: ["Shown", "Small", "Hidden", "Hidden"],
      },
      {
        label: "Approval controls for privileged actions",
        cells: [false, false, false, true],
      },
      { label: "API access", cells: [false, false, false, true] },
      { label: "Webhooks", cells: [false, false, false, true] },
      {
        label: "POS and commerce adapters",
        cells: [false, false, false, true],
      },
      {
        label: "Support",
        cells: [
          "Community",
          "Email",
          "Priority email",
          "Priority + onboarding",
        ],
      },
    ],
  },
];

export const channelRates = [
  {
    channel: "In-app inbox",
    provider: "KYPStamping wallet",
    included: "Unlimited on every plan",
    overage: "No charge",
    detail:
      "Delivered inside the customer's KYPStamping wallet. No provider fee, fair-use policy applies.",
  },
  {
    channel: "Push notifications",
    provider: "Firebase Cloud Messaging",
    included: "1,000 → 200,000 per month",
    overage: "₱8 per 1,000",
    detail:
      "Firebase charges nothing to deliver; the rate covers orchestration, scheduling, and abuse prevention.",
  },
  {
    channel: "Email",
    provider: "Amazon SES",
    included: "500 → 100,000 per month",
    overage: "₱25 per 1,000",
    detail:
      "Covers domain reputation, suppression lists, complaint handling, templates, and delivery logs.",
  },
  {
    channel: "SMS",
    provider: "Semaphore",
    included: "100 on Grow, 500 on Scale",
    overage: "₱0.95 per 160-character segment",
    detail:
      "Carrier cost is roughly ₱0.56 ex-VAT per segment. The margin covers multipart messages, provider failover, and payment fees.",
  },
  {
    channel: "Viber",
    provider: "Viber business messages",
    included: "Pay as you send",
    overage: "₱0.42 per message",
    detail:
      "Used ahead of SMS whenever a customer is reachable there, which is the cheapest way to cut campaign cost without losing reach.",
  },
  {
    channel: "WhatsApp, Messenger",
    provider: "Meta",
    included: "Not available yet",
    overage: "Planned",
    detail:
      "Blocked on a verified Meta Business account. Pricing will be published once the channel is approved and built.",
  },
];
