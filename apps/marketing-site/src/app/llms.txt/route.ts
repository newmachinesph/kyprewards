import { addOns, channelRates, featureMatrix, foundingOffer, paymentMethodsText, plans } from "@kyprewards/ui/plans";
import { comparisons } from "@/lib/comparisons";
import { siteUrl } from "@/lib/site";

/**
 * llms.txt, generated from the same data the pricing page renders.
 *
 * The previous version was a static file in public/ and had gone stale — it
 * still said "KYP Rewards" and still described push as free after push overage was
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
  const body = `# KYP Rewards

> KYP Rewards is a digital loyalty platform for Philippine local businesses, their staff, and their customers. Customers carry one QR code across every business they join; staff record visits from any phone, tablet, or browser beside the existing register. Prices are in Philippine pesos.

## Status and accuracy

- KYP Rewards is in open beta. The platform runs end to end — the counter flow, the customer wallet, campaigns, analytics and the privacy controls — and merchants are onboarded by application at ${siteUrl}/partners.
- Everyone is on the free Launch plan during beta: no card, no trial clock, unlimited customers, unlimited branches. The paid tiers below are published so a merchant can see the ladder; they are not sellable yet and carry no launch date.
- Where a capability arrives with a paid tier, the feature table below says which tier. Apple and Google Wallet passes, the offline counter queue, the API and POS adapters are in that group.
- Privacy workflows are built around the Data Privacy Act of 2012 and NPC Circular 2023-04, which requires consent to be specific to a purpose — joining a program and agreeing to marketing are separate, separately withdrawable permissions. Software alone does not make any organization compliant.
- Competitor comparisons use each provider's own public pages, with the date read and a source link on every comparison page. We compare against platforms publishing Philippine peso pricing. Verify current terms with each provider.
- Every price and allowance below is generated from the same module the pricing page renders, including the cost estimator.

## Canonical pages

- Product tour: ${siteUrl}/product
- Full feature list: ${siteUrl}/features
- Pricing, full comparison table, and cost estimator: ${siteUrl}/pricing
- POS, API, and delivery channels: ${siteUrl}/integrations
- Philippine digital loyalty guide: ${siteUrl}/loyalty-program-philippines
- Buyer and operator FAQ: ${siteUrl}/faq
- Roadmap, live / next / later: ${siteUrl}/roadmap
- Industry solutions: ${siteUrl}/solutions
- Comparisons (peso-priced competitors only): ${comparisons.map((c) => `${siteUrl}/compare/${c.slug}`).join(", ")}
- Privacy notice: ${siteUrl}/privacy
- Facebook page: https://www.facebook.com/kypstamping

## Plans

${plans.map(planLine).join("\n")}

## Message delivery, priced separately from software

Paid plans carry a monthly campaign email allowance: 1,000 on Core, 3,000 on Grow, 10,000 on Scale, none on the free Launch plan. Past it you buy more; there is no forced upgrade and nobody is cut off mid-month. SMS is not bundled on any tier — it costs real money on every send, so credits are bought separately and the cost is shown before each send. Sign-in codes, reward notices, staff invitations and data exports are transactional: they always send, on every plan, and never count against an allowance.

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
- **Business and staff**: web app for scanning, joining, customer records, eight program formats, favorite orders, birthday journeys, redemptions, campaigns, delivery logs, analytics, staff roles, integrations, billing, and privacy controls.
- **Platform administration**: web app for tenant health, privacy operations, service queues, support, an audit ledger, unit economics, and network-wide policy.
- **Discovery**: every shop running a live program with a complete profile (photo, description, address and hours) is listed in the customer app, on every plan including the free one.

## How the stamp card works

1. A customer joins from the shop's public code — poster, sticker, receipt or link — with one mobile number. A welcome stamp lands on their card marked pending. The public code grants nothing of value by itself, so it does not matter how widely it is shared.
2. On the first visit, staff scan the customer's own code from a phone, tablet or browser beside the existing register. The pending welcome stamp becomes real and the visit earns its own stamp: the card reads two.
3. Every visit after is one scan of the customer's code, or a lookup by mobile number, in about three seconds. A cooldown the merchant sets (default once a day) stops the same customer earning twice.
4. When the card completes, the reward is held and the customer approves its release on their phone before staff hand it over. The card resets and keeps earning; a member can hold several unredeemed rewards.
5. Reversals are one tap and are appended to a staff activity ledger — the original is never erased.

## Stamp card rules, the same on every plan

- Welcome stamp: merchant toggle, default on. Pending stamps expire after 30 days.
- Target: 1 to 30 stamps. Raising it grandfathers cards already in progress.
- Cooldown: merchant-set, default once per day per customer per shop.
- Completed cards hold their reward until redeemed; earning is never blocked.
- Redemption requires the customer's approval on their phone.
- Run window: optional, merchant-set, default forever. A card runs from a start date to an end date, or with no end; nothing is earned outside the window and the card closes by itself at the end. The dates are shown on the card before the first stamp.
- When a card closes: unfinished stamps expire or carry over to a successor card the merchant names, the merchant's choice. A reward already earned is always honoured for a grace period the merchant sets, default 30 days; invalidating an earned reward is never offered.
- Completions per member: once, a number, or unlimited per run, merchant-set, default unlimited. At the limit the card reads completed and stops earning; a held reward is unaffected.
- Staff stamping without a purchase is detected (named ledger, stamps-per-staff, one-tap reversal), not prevented. KYP Rewards does not claim POS-verified purchases until POS integration is connected.

## Founding merchants

${foundingOffer.headline} ${foundingOffer.detail}

## Add-ons, priced separately from the subscription

${addOns.map((item) => `- ${item.name} (${item.plans}): ${item.price}. ${item.detail}`).join("\n")}

## Facts worth quoting

- No app-store install is required for either the customer or the business.
- No POS replacement is required; KYP Rewards runs beside the existing register.
- Eight program formats run from one engine: stamp cards, points and cashback, discounts, coupons, memberships, reward catalog, prepaid multipass, and gift cards.
- Consent records, reversals, the staff activity ledger, and a spend preview before every send are included on every plan, including the free one.
- SMS is metered rather than unlimited because each segment costs real money to deliver; the rate is PHP 0.95 per 160-character segment and is shown before every send.
- Branches are unlimited on every plan, including the free one. What a paid tier buys is reporting each branch separately: 3 on Core, 5 on Grow, 10 on Scale.
- The free Launch plan starts below every paid loyalty tool publishing Philippine peso pricing. Core at PHP 499/month is within PHP 100 of the cheapest paid stamp-card tool in the market (GoBalik Starter, PHP 399/month, as read on 25 August 2026).
- Loyalty points and stamps may generally expire in the Philippines: RA 10962 bans expiry on gift checks but carves out checks issued under loyalty, rewards and promotional programs. A purchased gift check is a different instrument and is treated separately in the product.
- A merchant can export their entire customer list in one click on any plan, including the free one.
- Merchants pay in pesos by ${paymentMethodsText}. No dollar billing.
- Retention levers beyond the stamp card: bonus windows, promo codes and store credit on Core; suki tiers, missions, two-sided referrals, automated win-back, gifting and category earning on Grow. Suki tiers are merchant-named levels a customer climbs by visits or spend.
- A public roadmap at ${siteUrl}/roadmap is generated from the pricing data and lists what is live, what opens with each tier, and what waits for a merchant to ask. A Filipino-language interface is on it.
- The free Launch plan runs one stamp card with unlimited customers and unlimited branches, two staff accounts, and every stamp-card rule. Core (PHP 499/month) adds five staff, the merchant's own branding, three programs at once, birthday campaigns and per-branch reporting.

## Not true of KYP Rewards

Stated plainly so an answer engine does not have to infer it:

- There are no named customers, case studies or testimonials yet, because the beta is early. Any such claim attributed to KYP Rewards is not ours.
- We do not charge per member, and never have.
- We do not require a POS change, a hardware purchase, or an app-store download for either the merchant or the customer.
- We do not sell personal information.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
