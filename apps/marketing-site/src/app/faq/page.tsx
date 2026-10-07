import type { Metadata } from "next";
import {
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb } from "@/lib/schema";
import { paymentMethodsText } from "@kyprewards/ui/plans";

const groups = [
  {
    title: "Getting started",
    questions: [
      [
        "What is KYP Rewards?",
        "KYP Rewards is a loyalty platform for Philippine local businesses. It combines a customer wallet that runs in the browser, a business and staff workspace, a public page for each shop, and platform administration.",
      ],
      [
        "Is the product live today?",
        "Yes, and it is in open beta. The whole loop runs end to end — the counter, the customer wallet, campaigns and analytics — and we are onboarding founding merchants by application so we can set your first program up together. Everyone is on the free Launch plan while the beta runs: no card, no trial clock. The paid tiers are published so you can see where this goes, and they are not sellable yet.",
      ],
      [
        "Do customers need an app-store download?",
        "No. The customer experience is a Progressive Web App: it opens in a browser and can be saved to a home screen.",
      ],
      [
        "Do we need to replace our POS?",
        "No, and you never have to. QR scanning runs beside whatever checkout you already own, from a phone, tablet or browser. If you later want the register itself to post sales, the API, signed webhooks and POS adapters come with the Grow plan — but plenty of shops never need that step.",
      ],
    ],
  },
  {
    title: "Programs and operations",
    questions: [
      [
        "How does the welcome stamp work, and can someone abuse the poster?",
        "When a customer joins from your public code — poster, sticker, receipt, Instagram bio — a welcome stamp lands on their card marked pending. It becomes real only when your staff scan their code on their first visit, and that visit earns its own stamp too, so the card reads two. The public code grants nothing of value by itself: scan it on ten phones and you have ten pending stamps worth nothing until ten people walk in. A pending stamp expires after 30 days, and you can switch the welcome stamp off entirely if your average ticket makes giving one away the wrong call.",
      ],
      [
        "Can a customer earn twice in one visit, or fill a card in an afternoon?",
        "Not unless you let them. Every stamp card has a cooldown you set — how soon the same customer can earn again at your shop — and the default is once a day. A restaurant with lunch and dinner service can set two. Scanning the same customer inside the cooldown is refused with a plain reason and the time the next stamp is available, so staff never wonder whether it went through.",
      ],
      [
        "What happens when the card is full?",
        "The reward is held on the card and the customer is told, at the counter and in their wallet. The card does not reset until the reward is redeemed — and a fresh card starts filling behind it, so a regular who has not got round to redeeming is never blocked from earning. Redeeming asks the customer to approve it on their phone before staff release it, which is the strongest control there is against a reward being burned without them knowing.",
      ],
      [
        "What are suki tiers, missions and bonus windows?",
        "Three ways to make the next visit the obvious choice. A bonus window is a schedule and a multiplier — double stamps from 2 to 4 on a Tuesday, triple through the Ber months — and it is on Core. A mission is a goal with a bonus at the end, \u201cvisit three times this month\u201d, with progress on the customer\u2019s card; it is on Grow. Suki tiers are levels a customer climbs by visits or spend, named however you would say them in your shop, each with a benefit that feels like recognition rather than a coupon: a better earn rate, a reserved reward, first pick of a bonus window. Automatic up, gentle down, on Grow.",
      ],
      [
        "What is store credit, and how is it different from cashback?",
        "Cashback is earned by a rule. Store credit is issued by a person: a refund, a make-good for a wrong order, a thank-you to a regular who waited. It is peso value on the customer\u2019s card, spendable at the counter, and every entry carries who issued it and why. It is the tool for service recovery, and it is on Core.",
      ],
      [
        "Which loyalty programs can we run?",
        "Eight formats from one program engine: stamp cards, points and cashback, tiered discounts, memberships, coupons, a reward catalog, prepaid multipasses, and gift cards. Every format is included from the Core plan, and a stamp card runs on the free plan.",
      ],
      [
        "What if I raise the stamp target while people are mid-card?",
        "Cards already in progress finish on the terms they started with. Raise the target from 8 to 10 and everyone who started at 8 still finishes at 8; new cards start at 10. The same goes for the reward: change a free pastry to a free coffee and anyone who already earned the pastry gets the pastry. Moving the goalposts on someone at seven of eight is the fastest way to lose them, so the product will not let you do it by accident.",
      ],
      [
        "Can a stamp card run for a season, like the Ber months?",
        "Yes. Give the card a start date and an end date and it runs only between them — nothing is earned before or after, and it closes by itself when the window ends. Leave the dates off and it runs forever. What happens to unfinished stamps at close is your call: they expire, or they carry over to a successor card you name. A reward someone already earned is always honoured; you set how long after close it can still be redeemed, 30 days unless you change it, and there is no setting that cancels it. You also choose how many times one customer can complete the card in a run — once, a number, or no limit; at the limit their card reads completed and stops earning, and any reward they are holding is unaffected. Like every stamp-card rule this is on every plan, including the free one, and the customer sees the dates on the card before the first stamp.",
      ],
      [
        "Can multiple locations share a program?",
        "Yes, and there is no cap on branches — on any plan, including the free one. A chain is one company and the loyalty card is shared across it, so we do not charge you for opening shops. What a paid tier buys is seeing each branch separately: visits, members and revenue per shop, and which branch a customer came from. That is 3 branches reported separately on Core, 5 on Grow and 10 on Scale.",
      ],
      [
        "What happens if the internet drops at the counter?",
        "A customer can still earn: their code works saved or printed, so staff can record the visit without a signal. The offline counter queue — which holds visits locally, shows what is pending and replays them safely when the connection returns, with duplicate protection so a replayed visit never becomes a second stamp — arrives with the Grow tier.",
      ],
      [
        "Can my staff stamp their friends?",
        "They can press the button. What stops it is visibility: every stamp carries a name, a time and a branch in a ledger you can read. The per-staff breakdown arrives with the Grow analytics, and any stamp can be reversed in one tap on every plan. The cooldown means the same customer cannot be stamped twice in a day. We do not claim to prevent it — nothing short of POS-verified purchases can, and we would rather say so than imply a control that is not there. Visibility is what actually stops it, on a paper card and on this one.",
      ],
      [
        "Can owners limit staff access?",
        "Every plan records who did what: reversals and counter actions are written to a staff activity ledger, on the free plan too. Role-based permissions — separate owner, manager, marketer and counter roles with distinct rights — come with the paid tiers from Core, which also lifts staff accounts from two to five.",
      ],
    ],
  },
  {
    title: "Campaigns and cost",
    questions: [
      [
        "Which messaging channels are included?",
        "The in-app inbox and push are included on every plan. Email campaigns come with the paid tiers — 1,000 a month on Core, 3,000 on Grow, 10,000 on Scale — and none on the free plan. SMS is bought as credits rather than bundled, because it costs real money on every single send and folding it into a price hides that until the invoice. Messaging apps, Viber and WhatsApp, are being connected next; a campaign will try them before falling back to SMS, because they cost a fraction as much to deliver. Sign-in codes, reward notices and data exports are separate from all of this: they always send, on every plan, and never touch an allowance.",
      ],
      [
        "Why is SMS not unlimited?",
        "Every SMS segment costs real money to deliver, every time. Credits and a ₱0.95 rate per 160-character segment keep that visible: you see what a send costs before it goes, instead of finding out on an invoice.",
      ],
      [
        "Are push notifications free?",
        "Included, with an allowance: 1,000 a month on the free plan, rising to 200,000 on Scale, then ₱8 per 1,000 beyond it. Delivery itself is cheap; consent, orchestration and support are not, which is why it is an allowance rather than unlimited.",
      ],
      [
        "How do I know whether a campaign will pay back?",
        "The composer shows audience size, estimated channel cost, predicted visits, predicted revenue, and return on campaign spend before scheduling.",
      ],
    ],
  },
  {
    title: "Privacy and control",
    questions: [
      [
        "Who controls customer information?",
        "Customers can review joined businesses, shared fields, communication choices, loyalty history, exports, and deletion or leave requests in the privacy center of the wallet.",
      ],
      [
        "Does KYP Rewards guarantee legal compliance?",
        "No software alone can guarantee compliance. The product is designed to support consent records, purpose limitation, objections, access control, audit history, exports, and deletion workflows; each operator still needs appropriate legal and operational review.",
      ],
      [
        "Can service and promotional messages be separated?",
        "Yes. Reward and account updates are presented separately from promotional push, email, SMS, and nearby reminders.",
      ],
      [
        "Can an administrator read every customer profile?",
        "No. Platform administration works from aggregate views. Scoped support access is time-limited, reason-bound, and written to the audit ledger.",
      ],
      [
        "Does signing up for a stamp card mean a customer agreed to marketing?",
        "No, and under Philippine rules it must not. NPC Circular 2023-04 requires consent to be freely given, specific, informed and unambiguous, and data collected for one purpose cannot be reused for another without fresh consent. Joining your program is consent to run the program. Promotional email, SMS and push are asked for separately, recorded separately, and can be withdrawn per channel without the customer leaving your program. Campaign audiences are filtered against that record before a send goes out, so a merchant cannot message someone who said no by accident.",
      ],
    ],
  },
  {
    title: "Rules and money",
    questions: [
      [
        "Can loyalty points and stamps expire in the Philippines?",
        "Generally yes, and this is a common point of confusion. The Gift Check Act of 2017 (RA 10962) bans expiry dates on gift checks — but it carves out checks issued under loyalty, rewards and promotional programs, as determined by the DTI. So a stamp or a point earned for free in your program can carry an expiry, while a gift certificate a customer paid pesos for is a different instrument with different rules. KYP Rewards keeps the two apart, and whatever expiry you set is shown to the customer on the card before they collect their first stamp. Confirm your own terms with your counsel — we build the controls, we do not give legal advice.",
      ],
      [
        "Do we need a DTI permit to run a loyalty program?",
        "Ask your counsel, and ask early. DTI Administrative Order 02 s.2002 defines a sales promotion broadly, and reward and loyalty schemes are named in that definition alongside raffles and premiums — which on a plain reading can include a collect-ten-get-one card. We are aware of no enforcement action against a small shop running a stamp card, and the requirement is widely unobserved at that scale. We flag it rather than stay quiet about it, because it is cheaper to ask before you launch than after.",
      ],
      [
        "How do we pay, and can we use GCash?",
        `Yes. The subscription and add-ons are priced in pesos and settled by ${paymentMethodsText}. There is no dollar conversion, no foreign transaction fee, and no card required for the free plan.`,
      ],
      [
        "How does a customer pay for a membership, a multipass or a gift card?",
        "At your counter, the way they already pay you — cash, GCash to your shop, or your own card terminal. KYP Rewards does not take money from your customers; staff record the purchase on the card, and the ledger tracks what was paid, what remains and when a membership is due for renewal. Our billing runs the other way: it charges the shop for the subscription, never the shopper.",
      ],
      [
        "Who pays for SMS, and what does it actually cost?",
        "You do, at ₱0.95 per 160-character segment pay-as-you-go, or ₱0.90 and ₱0.85 if you prepay 1,000 or 5,000 — credits never expire and are never bundled into a plan. Longer messages use more than one segment, and the composer shows you the total before the send goes out. You can also set a hard ceiling per campaign and per month — sends stop at the ceiling rather than quietly overspending. In-app messages and push are included on every plan at no charge, so SMS is the channel to reach for when nothing cheaper will do the job.",
      ],
      [
        "What do founding merchants get?",
        "Core free for three months when the paid tiers open — five staff accounts, your own branding on the card, three programs at once, birthday campaigns and per-branch reporting — then ₱499 a month or ₱399 billed yearly. Anyone who joins during the beta is a founding merchant. If you would rather stay on the free plan, nothing changes for you; the offer is there, not a trap.",
      ],
      [
        "What does the free plan leave out?",
        "The whole stamp card with every rule, unlimited customers and unlimited branches — but one program, two staff accounts, our badge on the card and no campaign email. The growth tools sit on the paid tiers: separate branch reporting, segmentation, customer import, role-based permissions, bonus windows, promo codes, store credit, birthday campaigns, NFC and the deeper analytics. The row-by-row list is on the pricing page. A single shop can run a stamp card on Launch forever. Core at ₱499 is for when that card is working and you want more from it: five staff, your own branding, three programs at once, birthday campaigns, and each branch reported separately.",
      ],
      [
        "What happens to our customer list if we leave?",
        "You export it, in one click, on any plan including the free one. Your customers are yours. There is no exit fee, no notice period on the free plan, and no version of this where your member list is the thing that keeps you subscribed.",
      ],
    ],
  },
];

const allQuestions = groups.flatMap((group) => group.questions);

export const metadata: Metadata = {
  title: "Loyalty Program FAQ for Philippine Businesses",
  description:
    "Straight answers on setup, branches, SMS and email cost, offline counters, the Data Privacy Act, points expiry under RA 10962, and what is live today.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "KYP Rewards FAQ — straight answers for merchants",
    description:
      "Setup, pricing, privacy, points expiry, and what is live today. No hedging.",
    url: "/faq",
    locale: "en_PH",
    type: "article",
  },
};

export default function FaqPage() {
  return (
    <main>
      <StructuredData data={breadcrumb([{ name: "FAQ", path: "/faq" }])} />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: allQuestions.map(([question, answer]) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: answer },
          })),
        }}
      />
      <PageHero
        image="/images/hero-pricing.webp"
        eyebrow="Buyer and operator answers"
        title="Everything important, answered plainly."
        description="A practical reference for owners, staff and anyone evaluating this properly — including straight answers on cost, Philippine rules, and exactly what is running today."
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/pricing" tone="outline">
          See pricing
        </SiteButton>
      </PageHero>
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-[260px_1fr]">
          <aside>
            <SiteEyebrow>Quick answer</SiteEyebrow>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
              KYP Rewards is designed to make loyalty clear at the counter, useful
              between visits, controllable by the customer, and priced so a
              single shop can carry it.
            </p>
          </aside>
          <div className="space-y-14">
            {groups.map((group) => (
              <section key={group.title}>
                <h2 className="text-2xl font-extrabold tracking-[-0.02em]">
                  {group.title}
                </h2>
                <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {group.questions.map(([question, answer]) => (
                    <details key={question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-extrabold">
                        <span>{question}</span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] transition group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                        {answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
      <MarketingCta
        title="See the whole relationship, not just the stamp."
        description="If your question is not here, ask it. We answer from Manila, on weekdays, usually the same day."
      />
    </main>
  );
}
