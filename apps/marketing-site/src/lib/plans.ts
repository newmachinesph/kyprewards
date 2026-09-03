/**
 * Single source of truth for plan pricing and the feature matrix.
 *
 * Prices come from docs/philippines-loyalty-benchmark.md: GoBalik anchors the
 * entry tier at ₱499, Suki Cards sits around ₱667 once its annual PHP plan is
 * divided by 12, and ZAP Premium caps the market at ₱4,800. Channel rates are
 * cost-plus over Semaphore (₱0.56/segment ex-VAT) and SES, and are modelled in
 * the admin Revenue & margin view.
 *
 * Customers are unlimited on every tier, including the free one. That used to
 * be the axis - 250 / 1,500 / 10,000 / 50,000 - and nothing else in this market
 * prices that way: GoBalik and ZAP both give an unlimited free tier, and Suki
 * says outright that it charges no per-customer fee. A 250-customer free plan
 * was the worst number on this page.
 *
 * It also measured the wrong thing. A loyalty program exists to accumulate
 * members and they never leave the count, so a member-based bill only ratchets
 * up, and the merchant's incentive becomes enrolling fewer customers - the
 * opposite of what they bought. A member is a database row. A text message
 * costs real pesos through Semaphore, which is why the channel allowances are
 * the ones that stayed.
 *
 * `available: false` marks a tier as announced but not yet sellable. Only
 * Launch is live today. The others stay on the page deliberately - a merchant
 * choosing a loyalty platform is asking where this goes once their shop grows,
 * and hiding the ladder answers that with silence.
 */

export type PlanKey = "launch" | "core" | "grow" | "scale";

/**
 * Numeric allowances behind the estimator, in plan order (Launch, Core, Grow,
 * Scale). These mirror the Limits rows of `featureMatrix` — keep them together.
 *
 * No `members` row: it is unlimited everywhere, so it cannot select a plan and
 * the estimator no longer asks for a number it would ignore.
 */
export const planLimits = [
  { branchAnalytics: 0, email: 500, sms: 0, push: 1000 },
  { branchAnalytics: 3, email: 5000, sms: 0, push: 10000 },
  { branchAnalytics: 5, email: 25000, sms: 100, push: 50000 },
  { branchAnalytics: 10, email: 100000, sms: 500, push: 200000 },
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
      "Unlimited customers, no per-member fee",
      "Unlimited branches, one stamp card",
      "500 emails a month, campaigns included",
      "QR join, earn, and redeem",
      "Two staff accounts",
    ],
    name: "Launch",
    monthly: 0,
    yearly: 0,
    description: "Everything you need to run one stamp card, at no cost and with no limit on how many customers join it.",
    cta: "Start free",
    featured: false,
    available: true,
  },
  {
    key: "core" as const,
    highlights: [
      "Unlimited customers",
      "Unlimited branches, three reported separately",
      "All eight program types, two running at once",
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
    available: false,
  },
  {
    key: "grow" as const,
    highlights: [
      "Unlimited customers",
      "Unlimited branches, five reported separately",
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
    available: false,
  },
  {
    key: "scale" as const,
    highlights: [
      "Unlimited customers",
      "Ten branches reported separately, 50 staff",
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
    available: false,
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
        label: "Branches",
        hint: "A chain is one company and the loyalty card is centralised across it, so we do not charge for having shops. What a paid plan buys is seeing each of them separately - see Branch analytics below.",
        cells: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"],
      },
      {
        label: "Branch analytics",
        hint: "Separate reporting per shop: visits, revenue and members for each branch, and which branch a customer came from. Beyond your plan's allowance, extra branches are billed per branch.",
        cells: [false, "3 branches", "5 branches", "10 branches"],
      },
      {
        label: "Staff accounts",
        cells: ["2", "3", "10", "50"],
      },
      {
        label: "Customers",
        hint: "Never capped, never charged for. Growing your membership is the point of the product, not a reason to send you a bigger bill.",
        cells: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"],
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
        cells: [false, true, true, true],
      },
      { label: "Reward catalog", cells: [false, true, true, true] },
      { label: "Prepaid multipass", cells: [false, true, true, true] },
      { label: "Gift cards", cells: [false, true, true, true] },
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
      // Was "Import and export", which contradicted the "Data export" row
      // four groups below: export is free on every plan and a Launch shop can
      // download its customer CSV today. Only the import is gated.
      { label: "Customer import", cells: [false, true, true, true] },
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
      { label: "Scheduled campaigns", cells: ["Email only", true, true, true] },
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
      {
        label: "Emails",
        hint: "What a campaign or a journey costs against your month. Sign-in codes, receipts, reward notices and password resets are transactional — they always send, on every plan, and never count against this.",
        cells: ["500", "5,000", "25,000", "100,000"],
      },
      {
        label: "SMS credits",
        hint: "Sent by us, through a carrier gateway. SMS has a real per-message cost, so it is credit-based on every plan and none is included below Grow.",
        cells: ["—", "—", "100", "500"],
      },
      {
        label: "SMS from your own phone",
        hint: "A companion app that sends from your shop's own SIM and load, so a text costs what your telco charges rather than a per-message platform fee. Android only — iOS does not let an app send SMS. You are the sender: your number, your telco's terms, your responsibility for consent. Sign-in codes never use this route.",
        cells: [false, "Android app", "Android app", "Android app"],
      },
      {
        label: "Automatic fallback to our gateway",
        hint: "When your phone is off, out of load, or out of signal, the message goes out through our carrier gateway against your included credits instead of failing quietly.",
        cells: [false, false, true, true],
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
        label: "Which branch a customer came from",
        hint: "One card across the whole chain, and the merchant still sees where each member actually shops.",
        cells: [false, true, true, true],
      },
    ],
  },
  {
    group: "Operations and integrations",
    rows: [
      {
        label: "Listed in Discover",
        hint: "Every shop running a live program is findable in the customer app, on every plan including the free one. A marketplace that only lists paying shops is empty on the day it launches, which helps nobody.",
        cells: [true, true, true, true],
      },
      {
        label: "Featured placement in Discover",
        hint: "Priority position in the customer app's Discover list, above the ordinary distance ordering.",
        cells: [false, false, true, true],
      },
      { label: "Data export", cells: [true, true, true, true] },
      {
        label: "Role-based staff permissions",
        cells: [false, true, true, true],
      },
      {
        label: "Your own branding on the card",
        cells: [false, true, true, true],
      },
      {
        label: "KYPStamping badge on customer cards",
        hint: "The free plan carries our badge. Every paid plan removes it — your customers should be looking at your shop, not at us.",
        cells: ["Shown", "Hidden", "Hidden", "Hidden"],
      },
      { label: "API access", cells: [false, false, true, true] },
      { label: "Webhooks", cells: [false, false, true, true] },
      {
        label: "POS and commerce adapters",
        cells: [false, false, true, true],
      },
      {
        label: "Approval controls for privileged actions",
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
