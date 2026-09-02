# Philippine loyalty product benchmark

Research date: 25 August 2026

This is the product-coverage baseline for KYPStamping. It inventories publicly documented capabilities from GoBalik and Suki Cards, then checks the wider Philippine market so KYPStamping does not merely copy one competitor. Product UI can demonstrate these flows before the shared API and workers make them operational.

## What the market already expects

### GoBalik

- Join without installing an app; customer-facing copy also says no registration or sign-up is required.
- QR earning in the entry plan, plus NFC tap and printable/offline QR stamping in the Growth plan.
- Visit-based stamps and spend-based points.
- Multiple branches, staff credentials, business profile, map and Facebook details, and per-business customer identifiers.
- Merchant dashboard for visits, stamps, customers, repeat or "Balik" rate, average return activity, visit frequency, stamp progress, customer status, and a beta Balik Score.
- Searchable customer-performance and stamp-activity tables.
- Reward and transaction reversals, anti-fraud controls, and restrictions on customer-data export.
- Planned branded reward mini-sites, custom domains, advanced retention analytics, and campaign controls.

### Suki Cards

- Apple Wallet and Google Wallet loyalty cards; a separate customer app is not required.
- QR poster and social-link enrollment, short customer form, and a staff PWA scanner.
- Eight program types: stamps, cashback or points, discounts, memberships, coupons, reward catalogs, prepaid multipass, and gift cards.
- Tiered earning and discounts, recurring membership payments, monthly usage limits, partial gift-card redemption, and reward milestones.
- Unlimited push notifications plus individual, segment, all-customer, triggered, birthday, next-visit, feedback, geo, and automated messages.
- Two-sided referrals, birthday journeys, geofence messages, automated review requests, inactivity win-back, and campaign broadcasts.
- CRM with customer profiles, custom fields, filters, segments, RFM analysis, import and export, feedback, and manager reporting.
- Retention, visit, at-risk, redemption, customer, and manager analytics.
- Multiple locations, multiple manager logins, API access, webhooks, integrations, white labeling, card-design help, and onboarding support depending on plan.
- Growth services include automated reviews, website chat, unified inbox, database reactivation, birthday and anniversary journeys, SMS blasts, reports, website, and hosting.

## Wider Philippine baseline

- ZAP adds POS integration, SKU tracking, member tiers, coupons, mobile or card identifiers, top-ups and prepaid value, SMS campaigns, automated birthday and non-visit messages, event and delivery engagement, member import, and assisted rollout.
- NoxaLoyalty pairs QR points and rewards with staff and branch management, and extends into POS and inventory.
- ScalePlus markets no-app QR enrollment, points and punch cards, targeted reminders, POS and email integration, reporting, and an ROI calculator.
- Loyalteey describes a universal customer QR, cross-store discovery, store-specific points, time-limited reward events, four VIP tiers, printable IDs, targeted almost-eligible offers, staff and branch tools, and offline scan-and-sync.

## KYPStamping parity-plus requirement

| Area           | Required parity                                                                                              | KYPStamping advantage                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Enrollment     | QR poster, link, NFC, minimal fields, no app-store dependency                                                | One private customer identity across joined businesses, with PWA and optional wallet pass                            |
| Counter        | Scan, tap, redeem, reverse, branch and staff attribution                                                     | Signed rotating QR, customer confirmation, encrypted offline queue, duplicate checks                                 |
| Programs       | Stamps, points or cashback, discounts, memberships, coupons, catalog rewards, multipass, gift cards          | One program engine with composable earning, tier, eligibility, balance, expiry, and redemption rules                 |
| Wallet         | Program cards, progress, balances, terms, messages                                                           | One wallet for local businesses, discovery, customer-controlled sharing, and Filipino localization                   |
| Engagement     | Push, SMS-capable integrations, birthdays, anniversaries, win-back, next visit, geofence, reviews, referrals | Per-channel consent, quiet hours, frequency budgets, private-feedback routing, and explainable audiences             |
| CRM            | Profiles, custom fields, RFM, lifecycle segments, filters, import and export                                 | Customer-owned core profile plus per-business fields and a full consent ledger                                       |
| Analytics      | Visits, return rate, frequency, progress, redemption, at-risk, manager and branch views                      | Cohorts, time to second visit, incremental revenue, reward liability, fraud indicators, and explainable next actions |
| Operations     | Multi-location, roles, manager seats, audit, imports, white label                                            | Least-privilege roles, approval controls, network-level abuse detection, and portable data                           |
| Integrations   | API, webhooks, POS, ecommerce, messaging, Apple and Google Wallet                                            | Versioned FastAPI contracts, reliable worker retries, idempotency, event replay, and adapter isolation               |
| Philippine fit | PHP pricing, common local industries, QR-first use                                                           | GCash and Maya payment-agnostic flows, low-bandwidth mode, English and Filipino, DPA rights in the product           |

## Sustainable pricing recommendation

Revisited 2 September 2026 after re-checking every competitor's published
pricing. The conclusion changed, and it changed the axis rather than the
numbers.

### What the market charges for

| Vendor      | Free tier                        | Paid entry                    | Customer cap |
| ----------- | -------------------------------- | ----------------------------- | ------------ |
| GoBalik     | Starter, no card required        | Growth ₱499/month             | none advertised |
| Suki Cards  | none — 14-day trial              | Grow ~₱667/month (₱7,999/yr)  | **unlimited, stated explicitly** |
| ZAP         | Express, "free for a limited time" | Premium ₱4,800/month        | unlimited branches, employees, transactions |
| Rush        | none                             | Essentials ₱15,000/month      | 300k monthly active |

Rush is not a competitor at this stage; it is the enterprise ceiling and is
useful only as the top of the range. GoBalik and Suki are the real comparison.

**Not one of them prices on customer count.** They price on capability —
locations, card types, staff logins, message volume. Suki says outright that it
charges no per-customer fee.

### The change

KYPStamping used to price on members: 250 / 1,500 / 10,000 / 50,000. That was
the weakest position on the page. Two competitors offer an unlimited free tier,
so a 250-member free plan was the first number a prospect compared and lost on.

It was also the wrong thing to meter. A loyalty program exists to accumulate
members, and members never leave the count, so a member-based bill only
ratchets upward and the merchant's rational move is to enrol fewer customers —
the exact opposite of what they bought. Worse, the caps were never enforced in
code: `included_members` was written to a usage counter that nothing ever
incremented or checked. They protected no revenue and cost us deals.

Members are unlimited on every tier now, including the free one. The axis is
locations, capability and metered channels.

| Plan   | Monthly | Annual, shown monthly | Role and limits                                                                                     |
| ------ | ------: | --------------------: | --------------------------------------------------------------------------------------------------- |
| Launch |      ₱0 |                    ₱0 | Unlimited customers, one location, one stamp card, 500 emails, no SMS, our badge on the card         |
| Core   |    ₱499 |                  ₱399 | Unlimited customers, all eight program types, own branding, 5,000 emails, SMS from the merchant's own phone |
| Grow   |  ₱1,290 |                  ₱990 | Three locations, unlimited concurrent programs, API and webhooks, 25,000 emails, 100 SMS credits      |
| Scale  |  ₱3,490 |                ₱2,790 | Ten locations, 50 staff, approvals, 100,000 emails, 500 SMS credits                                  |

### What a free merchant costs us

The point of the free tier is that it costs almost nothing marginal.

- **Members: nothing.** A member is a database row.
- **Email: about ₱0.75 a month.** At roughly ₱0.0015 per email, the whole
  500-email allowance is under a peso. Keeping it is cheaper than most
  acquisition channels and it gives the free tier a reason to convert.
- **SMS: none included, deliberately.** At ₱0.56 per segment it is the only
  channel that would make a free merchant expensive.

The one real cost that free merchants already incur is customer
authentication. Every sign-in code sent to a mobile number is a paid Semaphore
SMS, it carries no merchant attribution, and it is counted against no
allowance. With a twelve-hour session a daily visitor re-authenticates daily.
Preferring email for the code where the customer has one, and lengthening the
session, are worth more than any other saving available here — and neither is
done yet.

Core and Grow remain the primary profitable plans. Scale stays below ZAP
Premium's public price while leaving room for support and integration cost.

### The tier that still needs a reason

At ₱1,290 Grow is roughly twice Suki's ₱667 for the same three locations. The
candidate justification is the centralised wallet — one member code working at
every business on the platform, which none of the four competitors offer — but
that should be validated with real merchants before it is priced on.

### Channel unit economics

- SMS is prepaid, with included monthly credits only on Grow and Scale. Recommended overage is ₱0.95 for each 160-character segment. This is deliberately above Semaphore's documented ₱0.56 credit cost to cover tax ambiguity, multipart messages, provider failover, support, and payment fees.
- Email has a plan allowance and a recommended ₱25 per 1,000 overage. The underlying provider price may be lower, but delivery operations include domain reputation, suppression, complaint handling, templates, logs, and support.
- In-app and web push are included under a fair-use policy. Firebase Cloud Messaging has no provider delivery charge, but orchestration and abuse prevention are not costless.
- Connected channels such as Viber, WhatsApp, or Messenger should use provider pass-through cost plus an orchestration margin instead of an “unlimited” promise.
- Every campaign preview should show eligible recipients, segments, estimated spend, budget ceiling, predicted returning visits, predicted gross profit, and break-even visits before scheduling.

These are product and financial assumptions for validation, not final tax or legal advice. Actual contribution margin should be recalculated after provider contracts, support load, infrastructure, payment fees, and observed send patterns are known.

## Customer lifecycle coverage

1. Discover a nearby business or scan its poster.
2. Review program terms and choose the minimum profile details to share.
3. Join in the PWA, then optionally add a quick-access Apple or Google Wallet pass.
4. Show one rotating KYPStamping QR, tap NFC, or use an approved printed fallback.
5. Staff sees the customer, eligible programs, purchase context, and confirmation step.
6. The visit, points, stamps, tier, or balance updates immediately or enters a signed offline queue.
7. The customer sees progress, value, expiry, messages, and a complete activity history.
8. Relevant journeys can run only when purpose, channel consent, quiet hours, and frequency limits permit them.
9. The customer can change consent, correct or export data, leave a business, or request deletion.

## Business lifecycle coverage

1. Create a business and branches, choose staff roles, and publish profile details.
2. Select one of eight program templates or combine rules in an advanced program.
3. Generate counter, poster, link, NFC, and social enrollment surfaces.
4. Process earn, redeem, reverse, gift, transfer, top-up, and membership events with an audit trail.
5. Build audiences from lifecycle, RFM, location, value, program progress, favorite item, tier, and consent.
6. Launch manual or automated journeys with cost, reach, and eligibility previews.
7. Measure returns by business, branch, staff, program, cohort, reward, campaign, channel, and SKU.
8. Connect POS and commerce tools through API, webhooks, files, or supported adapters.

## Implementation order

### Frontend prototype — current phase

- Public feature architecture and market-complete positioning.
- Business program studio, automation center, counter methods, analytics, and operations views.
- Customer multi-program wallet, universal QR, discovery, wallet-pass entry points, and privacy-rights center.

### Shared FastAPI and worker — next phase

- Tenant, branch, staff, customer, consent, program, ledger, campaign, and integration models.
- Idempotent earn, redeem, reverse, balance, referral, membership, and offline-sync commands.
- Segmentation, automation scheduling, messaging, webhooks, analytics aggregation, review queues, exports, and deletion jobs.

### Integration phase

- Wallet passes, SMS and email providers, maps, GCash and Maya-compatible payment references, POS adapters, ecommerce, review destinations, and custom domains.

## Sources

- GoBalik: https://www.gobalik.com/
- GoBalik merchant onboarding: https://www.gobalik.com/become-a-merchant
- GoBalik dashboard demo: https://testflight.gobalik.com/
- GoBalik privacy: https://www.gobalik.com/privacy
- GoBalik terms: https://www.gobalik.com/terms
- Suki Cards: https://suki.cards/
- Suki Cards help center: https://help.suki.cards/
- Suki Cards Philippine pricing: https://suki.cards/pricing-in-php/
- ZAP: https://www.zap.com.ph/
- ZAP business features: https://customer.zap.com.ph/business
- NoxaLoyalty: https://www.noxaloyalty.com/
- ScalePlus Rewards: https://scaleplusrewards.com/
- Loyalteey App Store listing: https://apps.apple.com/ph/app/loyalteey/id6763690883
- National Privacy Commission data-subject rights: https://privacy.gov.ph/data-subject-rights/
- National Privacy Commission Data Privacy Act overview: https://privacy.gov.ph/data-privacy-act/
- National Privacy Commission consent guidelines: https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf
- National Privacy Commission right to object: https://privacy.gov.ph/right-to-object/
- Semaphore SMS FAQ: https://api.semaphore.co/faq
- AWS SES pricing: https://aws.amazon.com/ses/pricing/
- Resend pricing: https://resend.com/docs/knowledge-base/what-is-resend-pricing
- Firebase pricing: https://firebase.google.com/pricing
