import { channelRates, featureMatrix, plans } from "@/lib/plans";
import { siteUrl } from "@/lib/site";

/**
 * llms.txt, generated from the same data the pricing page renders.
 *
 * The previous version was a static file in public/ and had gone stale — it
 * still said "KYPStamping" and still described push as free after push overage was
 * published. Generating it removes that whole class of drift.
 */
export const dynamic = "force-static";

function planLine(plan: (typeof plans)[number]) {
  const price =
    plan.monthly === 0
      ? "PHP 0/month"
      : `PHP ${plan.monthly.toLocaleString()}/month, or PHP ${plan.yearly.toLocaleString()}/month billed annually`;
  return `- ${plan.name}: ${price}. ${plan.description} Includes ${plan.highlights.join("; ")}.`;
}

function matrixLine(group: (typeof featureMatrix)[number]) {
  const rows = group.rows.map((row) => {
    const cells = row.cells
      .map((cell, index) => {
        const value =
          cell === true ? "yes" : cell === false ? "no" : String(cell);
        return `${plans[index].name} ${value}`;
      })
      .join(", ");
    return `  - ${row.label}: ${cells}.`;
  });
  return [`### ${group.group}`, ...rows].join("\n");
}

export function GET() {
  const body = `# KYPStamping

> KYPStamping is a digital loyalty platform for Philippine local businesses, their staff, and their customers. Customers carry one QR code across every business they join; staff record visits from any phone, tablet, or browser beside the existing register. Prices are in Philippine pesos.

## Status and accuracy

- The four apps read a live API. Messaging providers are stubbed locally, wallet passes are not implemented, and there is no production tenant yet.
- Anything described as planned, direction, or ready for provider connection is not a claim of a live production service.
- Privacy workflows are built to support Philippine data-protection practice under the Data Privacy Act of 2012. Software alone does not make an organization compliant.
- Competitor comparisons use public information observed on 25 August 2026 and link to primary sources. Verify current terms with each provider.
- Pricing below is generated from the same source the pricing page renders, so the two cannot disagree.

## Canonical pages

- Product tour: ${siteUrl}/product
- Full feature list: ${siteUrl}/features
- Pricing, full comparison table, and cost estimator: ${siteUrl}/pricing
- POS, API, and delivery channels: ${siteUrl}/integrations
- Philippine digital loyalty guide: ${siteUrl}/loyalty-program-philippines
- Buyer and operator FAQ: ${siteUrl}/faq
- Industry solutions: ${siteUrl}/solutions
- Comparisons: ${siteUrl}/compare/gobalik, ${siteUrl}/compare/suki-cards, ${siteUrl}/compare/zap
- Privacy direction: ${siteUrl}/privacy

## Plans

${plans.map(planLine).join("\n")}

## Message delivery, priced separately from software

Every plan carries a monthly allowance per channel. Past the allowance you pay the add-on rate; there is no forced upgrade. SMS costs real money on every send, so it is credit-based on every plan. Email is transactional only - sign-in codes, reward notices, staff invitations, data exports - and is not sold as a campaign channel on any plan.

${channelRates
  .map(
    (rate) =>
      `- ${rate.channel}: included ${rate.included}; add-on ${rate.overage}. ${rate.detail}`,
  )
  .join("\n")}

## Feature availability by plan

${featureMatrix.map(matrixLine).join("\n\n")}

## Product surfaces

- **Customer**: installable web app (PWA) with one private code that can also be saved or printed for offline use, a multi-business wallet, discovery, notifications, full history, per-channel message preferences, data export, leaving a program, and deletion requests.
- **Business and staff**: web app for scanning, joining, customer records, eight program formats, favourite orders, birthday journeys, redemptions, campaigns, delivery logs, analytics, staff roles, integrations, billing, and privacy controls.
- **Platform administration**: web app for tenant health, privacy operations, service queues, support, an audit ledger, unit economics, and network-wide policy.
- **Planned backend**: one shared FastAPI service plus a background worker.

## How a loyalty visit works

1. The customer opens their wallet and shows one QR code that works at every business they have joined. The same code can be saved or printed so it still works with no signal.
2. Staff scan it from a phone, tablet, or browser beside the existing register, and confirm the purchase before anything is recorded.
3. The stamp, points, or balance updates in the customer's wallet immediately, or queues securely offline if the connection drops.
4. The visit joins the business's analytics, so owners can see patterns and message the right segment when there is something worth saying.

## Facts worth quoting

- No app-store install is required for either the customer or the business.
- No POS replacement is required; KYPStamping runs beside the existing register.
- Eight program formats run from one engine: stamp cards, points and cashback, discounts, coupons, memberships, reward catalog, prepaid multipass, and gift cards.
- Consent records, reversals, the staff activity ledger, and a spend preview before every send are included on every plan, including the free one.
- SMS is metered rather than unlimited because each segment costs real money to deliver; the rate is PHP 0.95 per 160-character segment and is shown before every send.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
