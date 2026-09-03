/**
 * Single source of truth for plan pricing and the feature matrix.
 *
 * Prices come from docs/philippines-loyalty-benchmark.md: GoBalik anchors the
 * entry tier at ₱499, Suki Cards sits around ₱667 once its annual PHP plan is
 * divided by 12, and ZAP Premium caps the market at ₱4,800. Channel rates cover
 * delivery plus the failover and retry around it, and are modelled in the admin
 * revenue view.
 *
 * Customers are unlimited on every tier, including the free one. That used to
 * be the axis — 250 / 1,500 / 10,000 / 50,000 — and nothing else in this market
 * prices that way: GoBalik and ZAP both give an unlimited free tier, and Suki
 * says outright that it charges no per-customer fee. A 250-customer free plan
 * was the worst number on this page.
 *
 * It also measured the wrong thing. A loyalty program exists to accumulate
 * members and they never leave the count, so a member-based bill only ratchets
 * up, and the merchant's incentive becomes enrolling fewer customers — the
 * opposite of what they bought. A member is a database row. A text message
 * costs real pesos to deliver, which is why the channel allowances are the
 * ones that stayed.
 *
 * `available: false` marks a tier as announced but not yet sellable. Only
 * Launch is live today. The others stay on the page deliberately — a merchant
 * choosing a loyalty platform is asking where this goes once their shop grows,
 * and hiding the ladder answers that with silence. They carry no date: a date
 * we miss is worse than a ladder without one.
 */

export type PlanKey = "launch" | "core" | "grow" | "scale";

/**
 * Numeric allowances behind the estimator, in plan order (Launch, Core, Grow,
 * Scale). These mirror the Limits rows of `featureMatrix` — keep them together.
 *
 * No `members` row: it is unlimited everywhere, so it cannot select a plan and
 * the estimator no longer asks for a number it would ignore.
 *
 * No `sms` row either, and that is deliberate. SMS is add-on credit on every
 * tier — the feature matrix, the channel table, the FAQ and llms.txt all say
 * so — and this file used to hand Grow 100 free segments and Scale 500. The
 * estimator subtracted them, so the calculator quietly bundled the one channel
 * the whole pricing argument rests on never being bundled. There is no number
 * to keep here: every segment is charged.
 *
 * Email is the published campaign allowance and nothing else. It read 500 /
 * 5,000 / 25,000 / 100,000 against a table two sections above it publishing
 * — / 1,000 / 3,000 / 10,000, so the same page quoted a merchant two different
 * numbers. The table wins; it is the one a merchant screenshots.
 */
export const planLimits = [
  { branchAnalytics: 0, email: 0, push: 1000 },
  { branchAnalytics: 3, email: 1000, push: 10000 },
  { branchAnalytics: 5, email: 3000, push: 50000 },
  { branchAnalytics: 10, email: 10000, push: 200000 },
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
      "Printable poster and sticker QR",
      "Welcome stamp, cooldown, reversals, staff ledger",
      "In-app messages and 1,000 push a month",
      "Two staff accounts",
    ],
    name: "Launch",
    monthly: 0,
    yearly: 0,
    description: "Everything you need to run one stamp card, at no cost and with no limit on how many customers join it.",
    cta: "Apply to join",
    featured: false,
    available: true,
  },
  {
    key: "core" as const,
    highlights: [
      "Five staff accounts",
      "Your branding on the card, our badge removed",
      "Three programs at once, all eight types",
      "Bonus windows, promo codes, birthday campaigns",
      "Store credit for refunds and make-goods",
    ],
    name: "Core",
    monthly: 499,
    yearly: 399,
    description: "For the shop whose stamp card is working and wants more from it.",
    cta: "Choose Core",
    featured: false,
    available: false,
  },
  {
    key: "grow" as const,
    highlights: [
      "Fifteen staff, unlimited programs",
      "Suki tiers, missions, referrals, win-back",
      "Segments, cohorts and RFM scoring",
      "API, webhooks, offline queue, wallet passes",
      "Featured in Discover, five branches reported",
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
      "Fifty staff, ten branches reported",
      "10,000 emails and 200,000 push a month",
      "Approval controls for privileged actions",
      "Priority support and a person for onboarding",
      "Everything in Grow",
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
        hint: "A chain is one company and the loyalty card is centralized across it, so we do not charge for having shops. What a paid plan buys is seeing each of them separately — see Branch analytics below.",
        cells: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"],
      },
      {
        label: "Branch analytics",
        hint: "Separate reporting per shop: visits, revenue and members for each branch, and which branch a customer came from. Beyond your plan's allowance, extra branches are billed per branch.",
        cells: [false, "3 branches", "5 branches", "10 branches"],
      },
      {
        label: "Staff accounts",
        hint: "The first thing a single shop outgrows. Two covers an owner and one helper; a café with baristas across two shifts needs five before it needs anything else on this page.",
        cells: ["2", "5", "15", "50"],
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
        hint: "A coffee card and a pastry card are two programs. Core runs three side by side, of any type.",
        cells: ["1", "3", "Unlimited", "Unlimited"],
      },
    ],
  },
  {
    group: "The stamp card",
    note: "Every setting below is on every plan, including the free one. These are the rules of the card, not upsells.",
    rows: [
      {
        label: "Welcome stamp",
        hint: "A pending stamp lands the moment someone joins from your poster, and becomes real when your staff confirm their first visit. Turn it off if your ticket is too high to give one away.",
        cells: ["On or off", "On or off", "On or off", "On or off"],
      },
      {
        label: "Stamp target",
        cells: ["1 to 30", "1 to 30", "1 to 30", "1 to 30"],
      },
      {
        label: "Cooldown between stamps",
        hint: "How soon the same customer can earn again at your shop. Default once a day, so a card cannot be filled in one afternoon by a friendly staff member. A restaurant with lunch and dinner service can set two.",
        cells: ["You set it", "You set it", "You set it", "You set it"],
      },
      {
        label: "Minimum spend per stamp",
        hint: "Optional. \u201c₱100 minimum for a stamp\u201d keeps a coffee and a bottle of water from earning the same as a full order. Shown on the card so nobody argues at the counter.",
        cells: ["You set it", "You set it", "You set it", "You set it"],
      },
      {
        label: "Stamp expiry",
        hint: "Off unless you set one. RA 10962 lets stamps and points earned free under a loyalty program expire; a gift check a customer paid for cannot. Whatever term you set is shown on the card before the first stamp.",
        cells: ["Optional, you set it", "Optional, you set it", "Optional, you set it", "Optional, you set it"],
      },
      {
        label: "Rewards held until redeemed",
        hint: "A completed card holds its reward and keeps earning on a fresh card behind it. Nobody is blocked from earning for being loyal.",
        cells: [true, true, true, true],
      },
      {
        label: "Customer approves each redemption",
        hint: "One tap on the customer's phone before a reward is released. The strongest control there is against a reward being burned without the customer knowing.",
        cells: [true, true, true, true],
      },
      {
        label: "In-flight cards keep their target",
        hint: "Raise the target from 8 to 10 and every card already started still finishes at 8. New cards start at 10.",
        cells: [true, true, true, true],
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
        label: "Memberships with renewal tracking",
        hint: "Recurring benefits with a renewal date on the card. The customer pays you at the counter; we never charge your customers.",
        cells: [false, true, true, true],
      },
      { label: "Reward catalog", cells: [false, true, true, true] },
      { label: "Prepaid multipass", cells: [false, true, true, true] },
      {
        label: "Gift cards and reward vouchers",
        hint: "Kept apart deliberately. A reward voucher you issue free under the program can carry an expiry; a gift check a customer paid for is a different instrument under RA 10962. Confirm your terms with your own counsel.",
        cells: [false, true, true, true],
      },
    ],
  },
  {
    group: "Earning more, on purpose",
    note: "The levers that turn a stamp card into a reason to choose you over the shop next door. Each one is a rule you set once.",
    rows: [
      {
        label: "Bonus windows",
        hint: "Double stamps from 2 to 4 on a Tuesday, triple on the Ber months, extra on a slow branch. A schedule, a multiplier, and an end date — the composer shows what it will cost before you switch it on.",
        cells: [false, true, true, true],
      },
      {
        label: "Promo codes",
        hint: "A public code — WELCOME, FIESTA, the name of the barangay — that grants a stamp, points or a coupon once per member. Put it on a flyer, a tarp, a Facebook post.",
        cells: [false, true, true, true],
      },
      {
        label: "Store credit",
        hint: "Peso credit you issue by hand, separate from cashback: a refund, a make-good for a bad order, a thank-you. Spendable at the counter, with a reason and a name on every entry.",
        cells: [false, true, true, true],
      },
      {
        label: "Suki tiers",
        hint: "Levels a customer climbs by visits or spend — you name them, three or four is plenty — with a benefit at each: a better earn rate, a reserved reward, first pick of a bonus window. Automatic up, gentle down.",
        cells: [false, false, true, true],
      },
      {
        label: "Missions",
        hint: "\u201cVisit three times this month.\u201d \u201cTry the three new drinks.\u201d A goal, a window and a bonus. Progress is on the customer\u2019s card; the bonus arrives by itself.",
        cells: [false, false, true, true],
      },
      {
        label: "Earn by category or item",
        hint: "Different rates for coffee and food, services and retail, or one hero item you want to move. Needs items entered at the counter or a connected register.",
        cells: [false, false, true, true],
      },
      {
        label: "Send a reward as a gift",
        hint: "Pasalubong, digitally: a member sends a reward or points to another member at the same shop. Both are told, both see it on their card, and the ledger keeps the trail.",
        cells: [false, false, true, true],
      },
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
      {
        label: "Printable poster and sticker QR",
        hint: "Your join code, laid out for a poster, a sticker and a table tent, as a PDF any print shop can run. The poster is how the free plan grows, so it is on the free plan.",
        cells: [true, true, true, true],
      },
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
        label: "Favorite orders",
        hint: "The regular's usual, noted once and shown to staff at the counter — and the context a birthday offer is built on.",
        cells: [true, true, true, true],
      },
      {
        label: "Segmentation",
        cells: [false, "Basic", "Advanced", "Advanced"],
      },
      {
        label: "RFM and lifecycle scoring",
        hint: "RFM is how recently, how often and how much each customer buys, scored automatically so your best regulars and your quietly lapsing ones surface without a spreadsheet.",
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
      { label: "Scheduled campaigns", cells: ["In-app", true, true, true] },
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
        label: "Email campaigns",
        hint: "A monthly campaign allowance on the paid tiers. Past it, buy more — you are never cut off mid-send or pushed up a tier to finish a month. Sign-in codes, reward notices, staff invitations and data-export links are separate: they always send, on every plan including the free one, and never count against this.",
        cells: ["—", "1,000", "3,000", "10,000"],
      },
      {
        label: "SMS credits",
        hint: "Bought, not bundled. SMS costs real money on every single send, and folding credits into a plan hides that until the invoice arrives. Buy what you need, see the cost before each send, and keep whatever you do not use.",
        cells: ["Add-on", "Add-on", "Add-on", "Add-on"],
      },
      {
        label: "Viber and WhatsApp campaigns",
        hint: "Chosen automatically per customer, from ₱0.42 a message — cheaper than SMS and read sooner. Being connected next; the campaign composer will try them before falling back to SMS.",
        cells: [false, "Coming", "Coming", "Coming"],
      },
      {
        label: "SMS from your own phone",
        hint: "Opens with Core once the consent flow around it is finished: a companion app that sends from your shop's own SIM and load, so a text costs what your telco charges rather than a per-message platform fee. Android only — iOS does not let an app send SMS. You are the sender: your number, your telco's terms, your responsibility for consent. Sign-in codes never use this route.",
        cells: [false, "Android app", "Android app", "Android app"],
      },
      {
        label: "Automatic fallback to our gateway",
        hint: "When your phone is off, out of load, or out of signal, the message goes out through our carrier gateway against your SMS credits instead of failing quietly.",
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
        label: "KYP Stamping badge on customer cards",
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
          "Email",
          "Email",
          "Priority email",
          "Priority + onboarding",
        ],
      },
    ],
  },
];

/** How a merchant settles the bill. Dollar-billed competitors cannot say this. */
export const paymentMethods = [
  "GCash",
  "Maya",
  "Visa or Mastercard",
  "Bank transfer, InstaPay or PESONet",
] as const;

/**
 * What a shop that joins during the beta gets when the paid tiers open. Three
 * months is long enough to be real and short enough to be honest about; a
 * "for life" lock is a promise nobody should make before the first invoice.
 */
export const foundingOffer = {
  headline: "Founding merchants get Core free for three months when it opens.",
  detail:
    "Join during the beta and, when the paid tiers open, your shop moves to Core at no charge for its first three months — five staff, your own branding, three programs, birthday campaigns — then ₱499 a month, or ₱399 billed yearly. Stay on Launch instead if you prefer; nothing changes for you.",
};

/**
 * Add-ons: bought on any plan, priced separately from the subscription.
 *
 * The free plan is a real product a single shop can run forever, which is the
 * right thing to sell and a hard thing to make money on. These are the places a
 * shop that is doing well spends a little more — visibility, help, and volume —
 * without the subscription itself ever charging for growth. Every one of them
 * is digital or a person's time: nothing here needs a warehouse.
 */
export const addOns = [
  {
    name: "Featured in Discover",
    price: "₱299 / month",
    detail:
      "Priority placement in the customer app's Discover list, above the ordinary distance ordering. Included on Grow and Scale; buy it on Launch or Core.",
    plans: "Launch and Core",
  },
  {
    name: "Extra branch reporting",
    price: "₱150 / branch / month",
    detail:
      "Separate visits, members and revenue for a branch beyond your plan's allowance. Branches themselves are never charged for.",
    plans: "Core and up",
  },
  {
    name: "Setup with a person",
    price: "₱1,500 once · free in beta",
    detail:
      "We read your application, configure your first program with you, and check the counter flow on your own phone before you go live. Every founding merchant gets this free.",
    plans: "Any plan",
  },
  {
    name: "SMS credits",
    price: "₱0.95 · ₱0.90 · ₱0.85 per segment",
    detail:
      "Pay as you go at ₱0.95. Prepay 1,000 segments for ₱900 or 5,000 for ₱4,250 and keep whatever you do not use. Cost is shown before every send.",
    plans: "Any plan",
  },
  {
    name: "Email top-up",
    price: "₱25 / 1,000",
    detail:
      "Past your monthly campaign allowance, buy more. Never cut off mid-send, never pushed up a tier to finish a month.",
    plans: "Core and up",
  },
];

export const channelRates = [
  {
    channel: "In-app inbox",
    included: "Unlimited on every plan",
    overage: "No charge",
    detail:
      "Lands in the customer's wallet, where their card already is. Nothing to install and nothing to pay.",
  },
  {
    channel: "Push notifications",
    included: "1,000 → 200,000 per month",
    overage: "₱8 per 1,000",
    detail:
      "Reaches a customer who has closed the wallet, so a reminder arrives while there is still time to act on it.",
  },
  {
    channel: "Messaging apps",
    included: "Connecting next — pay as you send",
    overage: "From ₱0.42 per message",
    detail:
      "Viber and WhatsApp, chosen automatically per customer. Cheaper than SMS and better looking, and most people read them sooner. Being connected now; the composer will try them before SMS.",
  },
  {
    channel: "SMS",
    included: "Add-on credits, on every plan",
    overage: "₱0.95 per 160-character segment",
    detail:
      "The one channel that works on any phone, with no app and no data. Used when nothing cheaper will reach them.",
  },
  {
    channel: "Email",
    included: "1,000 → 10,000 campaigns per month",
    overage: "Add-on bundles",
    detail:
      "Sign-in codes, reward notices and data exports always send, on every plan, and never touch the allowance. The allowance is for campaigns, and only the paid tiers carry one.",
  },
];
