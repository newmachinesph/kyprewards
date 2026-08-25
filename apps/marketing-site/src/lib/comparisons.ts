export type Comparison = {
  slug: string;
  competitor: string;
  descriptor: string;
  summary: string;
  publicPricing: string;
  bestFor: string;
  facts: Array<{ label: string; competitor: string; stampr: string }>;
  sources: Array<{ label: string; href: string }>;
};

export const comparisons: Comparison[] = [
  {
    slug: "gobalik",
    competitor: "GoBalik",
    descriptor: "A focused digital stamp-card option for Philippine businesses",
    summary:
      "GoBalik offers a low-cost QR loyalty starting point. KYPStamping is designed for teams that also want multiple program models, customer-controlled messaging, richer retention workflows, and transparent channel economics.",
    publicPricing:
      "Starter ₱399/month; Growth ₱499/month on its public pricing page",
    bestFor:
      "Businesses that want a narrow digital stamp-card flow at a low monthly price.",
    facts: [
      {
        label: "Customer access",
        competitor: "QR-based; no app or sign-up advertised",
        stampr:
          "Installable web app with one private QR and no app-store download",
      },
      {
        label: "Program formats",
        competitor: "Digital stamp-card focus",
        stampr:
          "Eight demo formats: stamps, cashback, discount, membership, coupons, rewards, multipass, and gift certificates",
      },
      {
        label: "Counter reliability",
        competitor: "NFC and offline mode on Growth",
        stampr:
          "QR, NFC-ready, offline queue, replay status, and an activity ledger in the business demo",
      },
      {
        label: "Campaigns",
        competitor: "Not detailed on the cited pricing page",
        stampr:
          "In-app, push, email, and prepaid SMS with consent and budget checks",
      },
      {
        label: "Locations",
        competitor: "Ask GoBalik for current limits",
        stampr: "1 on Core, 3 on Grow, and 10 on Scale",
      },
    ],
    sources: [
      { label: "GoBalik official website", href: "https://www.gobalik.com/" },
    ],
  },
  {
    slug: "suki-cards",
    competitor: "Suki Cards",
    descriptor: "A wallet-pass loyalty platform with broad program types",
    summary:
      "Suki Cards has strong Apple and Google Wallet support and eight loyalty card types. KYPStamping adds a dedicated customer PWA, operational staff workflows, campaign unit economics, and an administrator control plane in one product direction.",
    publicPricing:
      "₱5,399, ₱7,999, or ₱10,999 per year on its Philippine pricing page",
    bestFor:
      "Businesses prioritizing Apple or Google Wallet cards and an established menu of loyalty types.",
    facts: [
      {
        label: "Customer experience",
        competitor: "Apple and Google Wallet passes",
        stampr:
          "Installable customer PWA plus wallet-pass support planned on Scale",
      },
      {
        label: "Program formats",
        competitor: "Eight card types publicly listed",
        stampr: "The same eight core formats in a unified program builder demo",
      },
      {
        label: "Locations",
        competitor: "1, 3, or 10 by plan",
        stampr: "1, 3, or 10 by paid plan",
      },
      {
        label: "Messaging",
        competitor: "Unlimited push notifications advertised",
        stampr:
          "In-app and push included; email allowance and SMS credits/overage shown before sending",
      },
      {
        label: "Advanced connections",
        competitor: "API, webhooks, white label, and integrations on Business",
        stampr:
          "API, webhooks, POS/commerce adapters, and white label planned on Scale",
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
    slug: "zap",
    competitor: "ZAP",
    descriptor: "A mature Philippine loyalty and customer engagement platform",
    summary:
      "ZAP publicly combines loyalty, POS connectivity, customer analytics, and outbound messaging. KYPStamping is positioned as a lighter, transparent option for local teams that want to begin without a large monthly commitment and grow into automation.",
    publicPricing:
      "Express is free; Premium is ₱4,800/month on its public pricing page",
    bestFor:
      "Larger operators that want a mature local provider and are comfortable with Premium pricing.",
    facts: [
      {
        label: "Entry price",
        competitor: "Free Express tier",
        stampr: "Free Launch demo plan for 250 active members",
      },
      {
        label: "Paid growth",
        competitor: "Premium publicly listed at ₱4,800/month",
        stampr: "Core ₱499, Grow ₱1,290, Scale ₱3,490 monthly",
      },
      {
        label: "Campaigns",
        competitor: "SMS, email, coupons, and automated marketing listed",
        stampr:
          "In-app, push, email, SMS, segments, journeys, and per-send cost/consent checks",
      },
      {
        label: "Analytics",
        competitor: "Customer database and analytics listed",
        stampr:
          "Retention, RFM, cohort, redemption, campaign ROI, and member economics demos",
      },
      {
        label: "Operations",
        competitor: "POS and enterprise services available",
        stampr:
          "Dedicated staff console, offline event queue, permissions, audit, and platform operations demos",
      },
    ],
    sources: [
      { label: "ZAP official pricing", href: "https://www.zap.com.ph/pricing" },
    ],
  },
];

export function getComparison(slug: string) {
  return comparisons.find((comparison) => comparison.slug === slug);
}
