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
 * Every capability claim describes what the product does. An earlier version of
 * this file described our own side as "demo formats", "the business demo" and
 * "member economics demos" while describing the competitor's side as shipped
 * product — on the three pages whose entire job is to win the comparison. The
 * roadmap belongs in `available: false` on the pricing ladder and in the FAQ,
 * not in the capability column of a competitive table.
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
  facts: Array<{ label: string; competitor: string; kypstamping: string }>;
  sources: Array<{ label: string; href: string }>;
};

export const comparisons: Comparison[] = [
  {
    slug: "zap",
    competitor: "ZAP",
    descriptor: "The established Philippine loyalty and engagement platform",
    summary:
      "ZAP is the incumbent: a mature local provider combining loyalty, POS connectivity, customer analytics and outbound messaging, with a free entry tier and a ₱4,800 step up. KYP Stamping is the lighter option for a local team that wants the same loop without a five-figure annual commitment, and wants to see what every message costs before it sends.",
    publicPricing: "Express free; Premium ₱4,800/month",
    bestFor:
      "Larger F&B operators who want the most established local provider and are comfortable at ₱4,800 a month.",
    observed: "3 September 2026",
    facts: [
      {
        label: "Entry price",
        competitor: "Free Express tier",
        kypstamping: "Free Launch plan, unlimited customers, no card",
      },
      {
        label: "Step up",
        competitor: "₱4,800/month to Premium — one jump from free",
        kypstamping:
          "₱499, ₱1,290 and ₱3,490 — three steps, so the bill grows with the shop",
      },
      {
        label: "Campaigns",
        competitor: "SMS, email, coupons and automated marketing listed",
        kypstamping:
          "In-app, push, email and SMS, with eligible reach, estimated spend and break-even shown before every send",
      },
      {
        label: "Message pricing",
        competitor: "Bundled into the plan; per-message cost not published",
        kypstamping:
          "Published per channel: ₱0.95 per SMS segment, ₱25 per 1,000 emails, ₱8 per 1,000 push",
      },
      {
        label: "Customer pricing",
        competitor: "No per-member fee advertised",
        kypstamping: "Unlimited members on every tier, including the free one",
      },
    ],
    sources: [
      { label: "ZAP official pricing", href: "https://www.zap.com.ph/pricing" },
    ],
  },
  {
    slug: "qashier",
    competitor: "Qashier Treats",
    descriptor: "Loyalty as an add-on to a Philippine POS subscription",
    summary:
      "Qashier Treats is the closest thing to KYP Stamping on price, and the difference is what you have to buy around it. Treats runs on a Qashier POS account, so the real monthly figure is the add-on plus the terminal software. KYP Stamping runs beside whatever register you already own and replaces nothing.",
    publicPricing: "Treats ₱590/month, on top of POS from ₱1,790/month",
    bestFor:
      "Businesses already running Qashier POS, or willing to switch their whole checkout to get loyalty.",
    observed: "3 September 2026",
    facts: [
      {
        label: "What you have to buy",
        competitor:
          "Treats ₱590/month plus a Qashier POS plan — Essential ₱1,790 or Growth ₱2,790",
        kypstamping:
          "The loyalty program only. Free on Launch, ₱499 on Core, and no POS purchase at any tier",
      },
      {
        label: "Checkout",
        competitor: "Requires Qashier POS; loyalty is tied to that terminal",
        kypstamping:
          "POS-agnostic. Runs beside any register from a phone, tablet or browser, and connects by API or webhook later",
      },
      {
        label: "Program formats",
        competitor: "Points-based earning with redemption as a discount",
        kypstamping:
          "Eight formats from one engine: stamps, points and cashback, discounts, coupons, memberships, reward catalog, multipass and gift cards",
      },
      {
        label: "Discovery",
        competitor: "Treats Explorer map listing for Qashier merchants",
        kypstamping:
          "Listed in Discover on every plan including the free one, with featured placement on Grow and Scale",
      },
      {
        label: "Customer privacy controls",
        competitor: "Not detailed on the cited pages",
        kypstamping:
          "Consent ledger, per-channel withdrawal, export and deletion requests on every plan",
      },
    ],
    sources: [
      { label: "Qashier Treats (Philippines)", href: "https://qashier.com/ph/treats/" },
      {
        label: "Qashier Philippine POS pricing",
        href: "https://qashier.com/ph/pricing-retail-beauty-services/",
      },
    ],
  },
  {
    slug: "storehub",
    competitor: "StoreHub",
    descriptor: "A full POS platform with loyalty bundled in",
    summary:
      "StoreHub sells the whole counter — POS, inventory, payments — with loyalty and SMS marketing included. That is genuinely good value if you are replacing your register anyway. If you are not, you are paying from ₱2,249 a month for a checkout system in order to get a stamp card.",
    publicPricing: "₱2,249, ₱4,499 or ₱8,999 per month",
    bestFor:
      "Businesses replacing their entire POS and inventory stack, who want loyalty included rather than chosen.",
    observed: "3 September 2026",
    facts: [
      {
        label: "What you are buying",
        competitor:
          "A POS platform, with loyalty and membership as included features",
        kypstamping:
          "A loyalty platform. Nothing about your checkout, inventory or payments has to change",
      },
      {
        label: "Entry cost",
        competitor: "₱2,249/month on the Starter plan, billed annually",
        kypstamping: "₱0 on Launch with unlimited customers, then ₱499",
      },
      {
        label: "Switching cost",
        competitor:
          "Loyalty arrives with a new register, so adopting it means retraining the counter",
        kypstamping:
          "Staff keep the register they know and add one scan beside it",
      },
      {
        label: "If you leave",
        competitor: "Loyalty data sits inside the POS you would be replacing",
        kypstamping:
          "Customer export on every plan, including the free one",
      },
      {
        label: "Message pricing",
        competitor: "SMS marketing described as included; rate not published",
        kypstamping:
          "₱0.95 per SMS segment, bought as credits, with the cost shown before each send",
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
    slug: "suki-cards",
    competitor: "Suki Cards",
    descriptor: "Wallet-pass loyalty with a broad menu of card types",
    summary:
      "Suki Cards leads on Apple and Google Wallet passes and publishes an annual peso price. KYP Stamping covers the same eight card types and adds the parts that appear after launch: staff roles and an activity ledger at the counter, campaign cost shown before sending, and privacy controls a customer operates themselves.",
    publicPricing: "₱5,399, ₱7,999 or ₱10,999 per year",
    bestFor:
      "Businesses whose first requirement is an Apple or Google Wallet pass on day one.",
    observed: "25 August 2026",
    facts: [
      {
        label: "Customer experience",
        competitor: "Apple and Google Wallet passes",
        kypstamping:
          "Installable web app with one private code across every joined shop; wallet passes on Grow and Scale",
      },
      {
        label: "Program formats",
        competitor: "Eight card types publicly listed",
        kypstamping: "The same eight formats from one program engine",
      },
      {
        label: "Separate branch reporting",
        competitor: "1, 3 or 10 by plan",
        kypstamping:
          "Unlimited branches on every plan; 3, 5 and 10 reported separately by tier",
      },
      {
        label: "Messaging",
        competitor: "Unlimited push notifications advertised",
        kypstamping:
          "In-app and push included; campaign email by plan; SMS bought as credits with the cost shown before sending",
      },
      {
        label: "Counter operations",
        competitor: "Not detailed on the cited pages",
        kypstamping:
          "Role-based staff permissions, reversals and a full staff activity ledger",
      },
    ],
    sources: [
      {
        label: "Suki Cards Philippine pricing",
        href: "https://suki.cards/pricing-in-php/",
      },
      {
        label: "Suki Cards Filipino product page",
        href: "https://suki.cards/fil/",
      },
    ],
  },
  {
    slug: "gobalik",
    competitor: "GoBalik",
    descriptor: "A low-cost Philippine digital stamp card",
    summary:
      "GoBalik is the cheapest way into a digital stamp card in this market, and for a single shop that wants exactly that, it is a fair answer. KYP Stamping starts lower — at nothing — and carries the program formats, campaign economics and customer privacy controls a shop grows into rather than migrates for.",
    publicPricing: "Starter ₱399/month; Growth ₱499/month",
    bestFor:
      "A single shop that wants a digital stamp card and nothing else, at the lowest paid price in the market.",
    observed: "25 August 2026",
    facts: [
      {
        label: "Entry price",
        competitor: "₱399/month on Starter — no free tier advertised",
        kypstamping: "₱0 on Launch, unlimited customers, no card",
      },
      {
        label: "Program formats",
        competitor: "Digital stamp card",
        kypstamping:
          "Stamp cards free; eight formats from Core, including points, memberships, multipass and gift cards",
      },
      {
        label: "Customer access",
        competitor: "QR-based; no customer app or account advertised",
        kypstamping:
          "Installable web app with one private code that works across every shop the customer joins",
      },
      {
        label: "Campaigns",
        competitor: "Not detailed on the cited pricing page",
        kypstamping:
          "In-app, push, email and SMS with consent, quiet hours, frequency caps and a spend ceiling per campaign",
      },
      {
        label: "Customer privacy controls",
        competitor: "Not detailed on the cited pricing page",
        kypstamping:
          "Consent ledger, per-channel withdrawal, export and deletion requests on every plan",
      },
    ],
    sources: [
      { label: "GoBalik official website", href: "https://www.gobalik.com/" },
    ],
  },
];

export function getComparison(slug: string) {
  return comparisons.find((comparison) => comparison.slug === slug);
}
