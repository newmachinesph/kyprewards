/**
 * Head-to-head comparisons, one per competitor that publishes Philippine peso
 * pricing.
 *
 * Peso pricing is the entry test on purpose. Loopy Loyalty, Stamp Me and
 * Kangaroo Rewards all sell into the Philippines, but they bill in US dollars
 * with no local rails and no Manila support hours, so a merchant comparing
 * monthly cost against them is comparing two different things. The shortlist a
 * Philippine owner actually builds is made of products quoted in pesos.
 *
 * Suki Cards left the list on 12 October 2026: its "pricing in PHP" page now
 * redirects to the home page, and every plan there (English and Filipino) is
 * quoted in US dollars. RUSH publishes peso pricing too, but it starts at
 * ₱15,000 a month for a white-label brand program, which is not the shop this
 * site sells to.
 *
 * Every capability claim describes what the product does. An earlier version of
 * this file described our own side as "demo formats", "the business demo" and
 * "member economics demos" while describing the competitor's side as shipped
 * product, on the pages whose entire job is to win the comparison. The roadmap
 * belongs in `available: false` on the pricing ladder and in the FAQ, not in
 * the capability column of a competitive table. The same rule runs the other
 * way: Core, Grow and Scale are published but not sellable until the beta
 * ends, so any row that quotes them says so.
 */

export type Comparison = {
  slug: string;
  competitor: string;
  descriptor: string;
  summary: string;
  publicPricing: string;
  bestFor: string;
  /** When the competitor's public pages were last read, for the source note. */
  observed: string;
  /** ISO date the comparison page first went up, for the Article schema. */
  published: string;
  facts: Array<{ label: string; competitor: string; kyprewards: string }>;
  sources: Array<{ label: string; href: string }>;
};

/** Repeated on every page that quotes the paid tiers, so it is said the same way. */
const PAID_TIERS =
  "Core ₱499, Grow ₱1,290 and Scale ₱3,490 a month, published now and opening after the beta";

const ALL_EIGHT =
  "A stamp card on the free plan. From Core, all eight types: stamps, points and cashback, member discounts, memberships, coupons, a reward catalog, multipass and gift cards";

const MESSAGING =
  "In-app and push on every plan, campaign email from Core, and SMS credits on any plan at ₱0.95 a segment, with the cost shown before each send";

export const comparisons: Comparison[] = [
  {
    slug: "zap",
    competitor: "ZAP",
    descriptor: "A Philippine loyalty platform built around food businesses",
    summary:
      "ZAP sells two plans. Loyalty Express costs nothing for a limited time and covers points, cashback, customer profiles and email notifications; Premium, at ₱4,800 a month, adds POS integration, SKU setup, coupons, member tiers, analytics, SMS and setup done by ZAP's team. KYP Rewards' free plan has no end date, and its paid tiers sit between ZAP's two prices.",
    publicPricing: "Loyalty Express ₱0 (limited time); Premium ₱4,800/month",
    bestFor:
      "Multi-location food businesses that want POS and SKU integration, coupons and member tiers in one plan, with ZAP's team doing the setup.",
    observed: "12 October 2026",
    published: "2026-08-25",
    facts: [
      {
        label: "Entry price",
        competitor: "Loyalty Express at ₱0 a month, labelled free for a limited time",
        kyprewards:
          "Launch at ₱0 with unlimited customers and branches, no card needed and no end date",
      },
      {
        label: "Step up",
        competitor: "Premium at ₱4,800 a month, the only paid plan listed",
        kyprewards: PAID_TIERS,
      },
      {
        label: "Program mechanics",
        competitor:
          "Points and cashback on Express; coupons, customizable mechanics and member tiering on Premium",
        kyprewards: ALL_EIGHT,
      },
      {
        label: "Messaging",
        competitor:
          "Email notifications on both plans, SMS on Premium only; no per-message rate published",
        kyprewards: MESSAGING,
      },
      {
        label: "Checkout",
        competitor: "POS integration and SKU setup on Premium",
        kyprewards:
          "Runs beside any register from a phone, tablet or browser; API, webhooks and POS adapters on Grow",
      },
      {
        label: "Growth limits",
        competitor:
          "Unlimited employees, branches and transactions on both plans; no member cap listed",
        kyprewards: "Unlimited customers and branches on every plan, including the free one",
      },
    ],
    sources: [
      { label: "ZAP pricing", href: "https://www.zap.com.ph/pricing" },
    ],
  },
  {
    slug: "qashier",
    competitor: "Qashier Treats",
    descriptor: "Loyalty as an add-on to a Philippine POS subscription",
    summary:
      "Qashier Treats is a points and cashback program that lives inside Qashier's POS. It costs ₱590 a month, but only on top of an Essential or Growth plan at ₱1,790 or ₱2,790 a month, billed annually and before VAT. For a shop already on Qashier that's a cheap way to add loyalty. KYP Rewards runs beside whatever register you own, and its free plan doesn't need a POS subscription at all.",
    publicPricing: "Treats ₱590/month, on top of POS from ₱1,790/month",
    bestFor:
      "Shops already running Qashier POS, who get points, cashback, a discovery map and automated emails without adding a second system.",
    observed: "12 October 2026",
    published: "2026-08-25",
    facts: [
      {
        label: "What you have to buy",
        competitor:
          "Treats at ₱590 a month plus a Qashier plan: Essential ₱1,790 or Growth ₱2,790 a month, billed annually, prices before VAT",
        kyprewards:
          "The loyalty program only. Launch is free, and no tier needs a POS purchase",
      },
      {
        label: "Checkout",
        competitor:
          "An add-on to Qashier's own POS, which runs on a Qashier terminal or a compatible Android tablet",
        kyprewards:
          "Runs beside any register from a phone, tablet or browser; API, webhooks and POS adapters on Grow",
      },
      {
        label: "Program formats",
        competitor:
          "Points per peso spent and cashback, used as a discount on the next purchase; the shop decides whether points expire",
        kyprewards: ALL_EIGHT,
      },
      {
        label: "Discovery",
        competitor:
          "A free listing on the Treats Explorer map, which Qashier says reaches over 130,000 customers",
        kyprewards:
          "Listed in Discover on every plan; featured placement on Grow and Scale, or ₱299 a month on Launch and Core",
      },
      {
        label: "Messaging",
        competitor:
          "Automated Marketing emails based on spending habits, included with Treats",
        kyprewards: MESSAGING,
      },
      {
        label: "Customer privacy controls",
        competitor: "Not described on the pages cited",
        kyprewards:
          "Marketing consent recorded apart from joining and withdrawable per channel; export and deletion requests on every plan",
      },
    ],
    sources: [
      { label: "Qashier Treats", href: "https://qashier.com/ph/treats/" },
      {
        label: "Qashier software pricing",
        href: "https://qashier.com/ph/software-pricing/",
      },
    ],
  },
  {
    slug: "storehub",
    competitor: "StoreHub",
    descriptor: "A full POS platform with loyalty built in",
    summary:
      "StoreHub sells the whole counter: POS, inventory, reporting and integrated payments, with loyalty, membership and automated SMS marketing listed as built in. If you're replacing your register anyway, that is a lot in one bill. If you aren't, the entry price is ₱2,249 a month for one store and one register, and KYP Rewards adds loyalty beside the checkout you already run.",
    publicPricing: "From ₱2,249, ₱4,499 or ₱8,999 per month",
    bestFor:
      "Businesses replacing their POS and inventory system who want loyalty and SMS marketing in the same package, with support every day including holidays.",
    observed: "12 October 2026",
    published: "2026-08-25",
    facts: [
      {
        label: "What you are buying",
        competitor:
          "A POS platform, with loyalty and membership listed as built-in features",
        kyprewards:
          "A loyalty platform. Your checkout, inventory and payments stay as they are",
      },
      {
        label: "Entry cost",
        competitor:
          "From ₱2,249 a month on Starter, with 1 store and 1 register; terms of 12, 24 or 36 months with bonus months",
        kyprewards:
          "₱0 on Launch with unlimited customers and branches. Paid tiers from ₱499 a month, opening after the beta",
      },
      {
        label: "More locations",
        competitor:
          "Extra stores are add-ons on Advanced and Pro; extra registers are add-ons on every plan",
        kyprewards:
          "Unlimited branches on every plan; 3, 5 or 10 reported separately on Core, Grow and Scale",
      },
      {
        label: "Customer data",
        competitor:
          "A customer database on Starter; export not described on the pricing page",
        kyprewards: "Customer export on every plan, including the free one",
      },
      {
        label: "Message pricing",
        competitor:
          "Automated SMS marketing listed; no per-message rate on the pricing page",
        kyprewards:
          "₱0.95 per SMS segment, or ₱0.90 and ₱0.85 prepaid, with the cost shown before each send",
      },
    ],
    sources: [
      {
        label: "StoreHub Philippine pricing",
        href: "https://www.storehub.com/ph/pricing",
      },
    ],
  },
  {
    slug: "gobalik",
    competitor: "GoBalik",
    descriptor: "A Philippine digital stamp card with a free plan",
    summary:
      "GoBalik now has a free Starter plan, with Lite at ₱279 and Growth at ₱499 a month. Customers scan a QR and type an ID the shop picks, with no app and no account, and its Balik Score grades how loyal each customer is. KYP Rewards' free plan adds unlimited branches, a staff ledger and in-app and push messages; GoBalik lists SMS and email marketing as coming soon.",
    publicPricing: "Starter ₱0; Lite ₱279/month; Growth ₱499/month",
    bestFor:
      "A single shop that wants a stamp or points card with no app and no customer account, and printed stamps for customers who have no data at the counter.",
    observed: "12 October 2026",
    published: "2026-08-25",
    facts: [
      {
        label: "Entry price",
        competitor: "Starter at ₱0, which GoBalik says is free indefinitely",
        kyprewards: "Launch at ₱0 with unlimited customers, no card needed",
      },
      {
        label: "Paid plans",
        competitor:
          "Lite ₱279 and Growth ₱499 a month; Pro listed as coming soon, Enterprise by quote",
        kyprewards: PAID_TIERS,
      },
      {
        label: "Branches and staff",
        competitor:
          "1 branch and 2 staff on Starter and Lite; Growth covers 2 branches with 2 staff each, extra branches billed monthly",
        kyprewards:
          "Unlimited branches and 2 staff accounts on Launch; 5 staff on Core",
      },
      {
        label: "Program formats",
        competitor: "Balik Stamps or Balik Points",
        kyprewards: ALL_EIGHT,
      },
      {
        label: "Customer access",
        competitor:
          "Scan a QR and enter an ID the shop chooses: mobile number, plate number or member ID. No app, no account",
        kyprewards:
          "A web app saved to the home screen, with one personal code that works at every shop the customer joins",
      },
      {
        label: "Messaging",
        competitor:
          "SMS and email marketing not on Starter or Lite, coming soon on Growth",
        kyprewards: MESSAGING,
      },
      {
        label: "Staff records",
        competitor: "Staff audit logs from Growth",
        kyprewards:
          "A staff activity ledger and one-tap reversals on every plan, including the free one",
      },
    ],
    sources: [{ label: "GoBalik plans and FAQ", href: "https://www.gobalik.com/" }],
  },
  {
    slug: "scaleplus",
    competitor: "ScalePlus Rewards",
    descriptor: "QR loyalty for Philippine small businesses, priced by member count",
    summary:
      "ScalePlus Rewards sells QR loyalty to Philippine small businesses in pesos and prices it by member count: free up to 50 members, then ₱1,490 a month for 1,000, ₱2,490 for 3,000 and ₱4,900 for 10,000. Points, tiers and cashback arrive with the first paid plan. KYP Rewards doesn't count members on any plan, so the bill stays put while the program fills up.",
    publicPricing: "Starter ₱0 (50 members); ₱1,490, ₱2,490 or ₱4,900/month",
    bestFor:
      "Shops that want points, tiers and cashback from the first paid plan, cards customers can add to Google Wallet, and a Loyverse, Square or Shopify POS link on Scale.",
    observed: "12 October 2026",
    published: "2026-10-12",
    facts: [
      {
        label: "Free plan",
        competitor:
          "Starter at ₱0 for up to 50 members, 1 location and a punch card",
        kyprewards:
          "Launch at ₱0 with unlimited customers, unlimited branches and a stamp card",
      },
      {
        label: "Member limits",
        competitor:
          "1,000, 3,000 or 10,000 members on the paid plans; new sign-ups stop at the cap until you upgrade",
        kyprewards: "Unlimited members on every plan, with no per-member fee",
      },
      {
        label: "Paid plans",
        competitor:
          "Growth ₱1,490, Plus ₱2,490 and Scale ₱4,900 a month; annual billing saves 17%",
        kyprewards: `${PAID_TIERS}; ₱399, ₱990 and ₱2,790 billed yearly`,
      },
      {
        label: "Locations",
        competitor:
          "1, 1, 2 and 5 included by plan; extra locations ₱599 a month each",
        kyprewards:
          "Unlimited branches on every plan; 3, 5 or 10 reported separately by tier, then ₱150 a month per extra reported branch",
      },
      {
        label: "Program formats",
        competitor:
          "Punch card on Starter; points, tiers and cashback or combo rules from Growth",
        kyprewards: `${ALL_EIGHT}. Suki tiers on Grow`,
      },
      {
        label: "SMS",
        competitor:
          "₱100 of credit a month on Plus and ₱500 on Scale, then ₱0.65 per send; none on Starter or Growth",
        kyprewards:
          "Credits on any plan at ₱0.95 a segment, or ₱0.90 and ₱0.85 prepaid, with the cost shown before each send",
      },
    ],
    sources: [
      {
        label: "ScalePlus Rewards pricing",
        href: "https://scaleplusrewards.com/pricing",
      },
      {
        label: "ScalePlus Rewards home page",
        href: "https://scaleplusrewards.com/",
      },
    ],
  },
];

export function getComparison(slug: string) {
  return comparisons.find((comparison) => comparison.slug === slug);
}
