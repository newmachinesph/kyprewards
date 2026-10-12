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
        "KYP Rewards is a loyalty platform for local businesses in the Philippines. It gives you a customer wallet that runs in the browser, a workspace for owners and staff, a public page for each shop, and platform administration.",
      ],
      [
        "Is the product live today?",
        "Yes, it's live in open beta. The whole loop works end to end: the counter, the customer wallet, campaigns and analytics. We're taking founding merchants by application so we can set up your first program with you. While the beta runs, everyone is on the free Launch plan, with no card and no trial clock. The paid tiers are published so you can see where this is going, but you can't buy them yet.",
      ],
      [
        "Do customers need an app-store download?",
        "No. The customer side is a Progressive Web App, so it opens in the browser and can be saved to the home screen.",
      ],
      [
        "Do we need to replace our POS?",
        "No, and you never have to. QR scanning runs next to whatever checkout you already use, on a phone, tablet or browser. If you later want the register itself to post sales, the API, signed webhooks and POS adapters come with the Grow plan, though plenty of shops never need that step.",
      ],
    ],
  },
  {
    title: "Programs and operations",
    questions: [
      [
        "How does the welcome stamp work, and can someone abuse the poster?",
        "A customer who joins from your public code gets a pending welcome stamp that only counts once your staff scan them in person, so the poster alone can't be abused. The public code can sit on a poster, a sticker, a receipt or your Instagram bio. The welcome stamp becomes real when staff scan the customer's code on their first visit, and that visit earns its own stamp too, so the card reads two. Scan the public code on ten phones and you get ten pending stamps, worth nothing until ten people walk in. A pending stamp expires after 30 days, and you can switch the welcome stamp off entirely if your average ticket makes giving one away the wrong call.",
      ],
      [
        "Can a customer earn twice in one visit, or fill a card in an afternoon?",
        "Not unless you let them. Every stamp card has a cooldown you set, which is how soon the same customer can earn again at your shop, and the default is once a day. A restaurant that does lunch and dinner can allow two. If staff scan the same customer inside the cooldown, the scan is refused with a plain reason and the time the next stamp is available, so nobody at the counter has to wonder whether it went through.",
      ],
      [
        "What happens when the card is full?",
        "The reward is held on the card, and the customer hears about it at the counter and in their wallet. The card doesn't reset until the reward is redeemed, but a fresh card starts filling behind it, so a regular who hasn't got round to redeeming can keep earning. To redeem, the customer approves it on their phone before staff release the reward. That's the strongest control there is against a reward being used up without them knowing.",
      ],
      [
        "What are suki tiers, missions and bonus windows?",
        "They're three ways to make the next visit the obvious choice. A bonus window is a schedule plus a multiplier, like double stamps from 2 to 4 on a Tuesday or triple stamps through the Ber months, and it's on Core. A mission is a goal with a bonus at the end, such as “visit three times this month”, with progress shown on the customer’s card; missions are on Grow. Suki tiers are levels a customer climbs by visits or spend, named however you'd say them in your shop. Each tier carries a benefit that feels like recognition instead of a coupon: a better earn rate, a reserved reward, first pick of a bonus window. Customers move up automatically and down gently, and tiers are on Grow.",
      ],
      [
        "What is store credit, and how is it different from cashback?",
        "Store credit is peso value that a person on your team issues by hand, while cashback is earned automatically by a rule. You'd issue it as a refund, a make-good for a wrong order, or a thank-you to a regular who waited. It sits on the customer’s card as peso value they can spend at the counter, and every entry records who issued it and why. It's the tool for service recovery, and it's on Core.",
      ],
      [
        "Which loyalty programs can we run?",
        "You can run eight formats from one program engine: stamp cards, points and cashback, tiered discounts, memberships, coupons, a reward catalog, prepaid multipasses and gift cards. Core and above include every format, and the free plan runs a stamp card.",
      ],
      [
        "What if I raise the stamp target while people are mid-card?",
        "Cards already in progress finish on the terms they started with. Raise the target from 8 to 10 and everyone who started at 8 still finishes at 8, while new cards start at 10. Rewards work the same way: change a free pastry to a free coffee and anyone who already earned the pastry still gets the pastry. Moving the goalposts on someone at seven of eight is the fastest way to lose them, so the product won't let you do it by accident.",
      ],
      [
        "Can a stamp card run for a season, like the Ber months?",
        "Yes. Give the card a start date and an end date and it runs only between them; nothing is earned before or after, and it closes by itself when the window ends. Leave the dates off and it runs forever. You decide what happens to unfinished stamps at close: they expire, or they carry over to a successor card you name. A reward someone already earned is always honoured. You set how long after close it can still be redeemed (30 days unless you change it), and no setting cancels it. You also choose how many times one customer can complete the card in a run: once, a set number, or no limit. At the limit their card reads completed and stops earning, and any reward they're holding is unaffected. Like every stamp-card rule, this works on every plan, the free one included, and the customer sees the dates on the card before the first stamp.",
      ],
      [
        "Can multiple locations share a program?",
        "Yes, and there's no cap on branches on any plan, the free one included. A chain is one company with one loyalty card shared across it, so we don't charge you for opening shops. What a paid tier buys is seeing each branch separately: visits, members and revenue per shop, plus which branch a customer came from. Core reports 3 branches separately, Grow 5 and Scale 10.",
      ],
      [
        "What happens if the internet drops at the counter?",
        "A customer can still earn, because their code works saved or printed and staff can record the visit without a signal. The offline counter queue arrives with the Grow tier. It holds visits on the device, shows what's pending and replays them safely when the connection comes back, with duplicate protection so a replayed visit never turns into a second stamp.",
      ],
      [
        "Can my staff stamp their friends?",
        "They can press the button, and what stops them is visibility: every stamp carries a name, a time and a branch in a ledger you can read. The per-staff breakdown comes with the Grow analytics, and any stamp can be reversed in one tap on every plan. The cooldown you set (once a day by default) stops the same customer being stamped twice inside it. We don't claim to prevent it, because nothing short of POS-verified purchases can, and we'd rather say so than imply a control that isn't there. Visibility is what actually stops it, on a paper card and on this one.",
      ],
      [
        "Can owners limit staff access?",
        "Yes, from Core up: the paid tiers add role-based permissions, with separate owner, manager, marketer and counter roles that each have their own rights, and Core also raises staff accounts from two to five. Every plan, the free one included, records who did what by writing reversals and counter actions to a staff activity ledger.",
      ],
    ],
  },
  {
    title: "Campaigns and cost",
    questions: [
      [
        "Which messaging channels are included?",
        "The in-app inbox and push come with every plan. Email campaigns come with the paid tiers (1,000 a month on Core, 3,000 on Grow, 10,000 on Scale) and aren't on the free plan. SMS is sold as credits instead of bundled, because every single send costs real money and folding it into a price hides that until the invoice. Viber and WhatsApp are being connected next; a campaign will try those messaging apps before falling back to SMS, since they cost a fraction as much to deliver. Sign-in codes, reward notices and data exports sit outside all of this: they always send, on every plan, and never touch an allowance.",
      ],
      [
        "Why is SMS not unlimited?",
        "Because every SMS segment costs real money to deliver, every time. Credits at ₱0.95 per 160-character segment keep that cost visible: you see what a send costs before it goes out, not on an invoice afterwards.",
      ],
      [
        "Are push notifications free?",
        "Push is included with an allowance: 1,000 a month on the free plan, rising to 200,000 on Scale, then ₱8 per 1,000 beyond it. Delivery itself is cheap. Consent, orchestration and support aren't, which is why it's an allowance and not unlimited.",
      ],
      [
        "How do I know whether a campaign will pay back?",
        "Before you schedule a campaign, the composer shows the audience size, estimated channel cost, predicted visits, predicted revenue and return on campaign spend.",
      ],
    ],
  },
  {
    title: "Privacy and control",
    questions: [
      [
        "Who controls customer information?",
        "Customers manage their own information from the privacy center in their wallet. There they can review the businesses they've joined, the fields they share, their communication choices, their loyalty history, exports, and deletion or leave requests.",
      ],
      [
        "Does KYP Rewards guarantee legal compliance?",
        "No. Software alone can't guarantee compliance. The product is built to support consent records, purpose limitation, objections, access control, audit history, exports and deletion workflows, but each operator still needs its own legal and operational review.",
      ],
      [
        "Can service and promotional messages be separated?",
        "Yes. Reward and account updates are shown separately from promotional push, email, SMS and nearby reminders.",
      ],
      [
        "Can an administrator read every customer profile?",
        "No. Platform administration works from aggregate views. Scoped support access is time-limited, needs a stated reason, and is written to the audit ledger.",
      ],
      [
        "Does signing up for a stamp card mean a customer agreed to marketing?",
        "No, and under Philippine rules it mustn't. NPC Circular 2023-04 requires consent to be freely given, specific, informed and unambiguous, and data collected for one purpose can't be reused for another without fresh consent. Joining your program is consent to run the program. Promotional email, SMS and push are each asked for separately and recorded separately, and the customer can withdraw any one channel without leaving your program. Campaign audiences are filtered against that record before a send goes out, so a merchant can't message someone who said no by accident.",
      ],
    ],
  },
  {
    title: "Rules and money",
    questions: [
      [
        "Can loyalty points and stamps expire in the Philippines?",
        "Generally yes, and a lot of people get this wrong. The Gift Check Act of 2017 (RA 10962) bans expiry dates on gift checks, but it carves out checks issued under loyalty, rewards and promotional programs, as determined by the DTI. So a stamp or a point earned for free in your program can carry an expiry, while a gift certificate a customer paid pesos for is a different instrument with different rules. KYP Rewards keeps the two apart, and whatever expiry you set shows on the card before the customer collects their first stamp. Confirm your own terms with your lawyer; we build the controls, we don't give legal advice.",
      ],
      [
        "Do we need a DTI permit to run a loyalty program?",
        "Possibly, so ask your lawyer, and ask early. DTI Administrative Order 02 s.2002 defines a sales promotion broadly and names reward and loyalty schemes in that definition, next to raffles and premiums, so a plain reading can cover a collect-ten-get-one card. We know of no enforcement action against a small shop running a stamp card, and at that scale the requirement is widely ignored. We flag it anyway, because it's cheaper to ask before you launch than after.",
      ],
      [
        "How do we pay, and can we use GCash?",
        `Yes. The subscription and add-ons are priced in pesos and paid by ${paymentMethodsText}. There's no dollar conversion, no foreign transaction fee, and the free plan needs no card.`,
      ],
      [
        "How does a customer pay for a membership, a multipass or a gift card?",
        "At your counter, the way they already pay you: cash, GCash to your shop, or your own card terminal. KYP Rewards doesn't take money from your customers. Staff record the purchase on the card, and the ledger tracks what was paid, what's left and when a membership is due for renewal. Our billing runs the other way: it charges the shop for the subscription, never the shopper.",
      ],
      [
        "Who pays for SMS, and what does it actually cost?",
        "You do: ₱0.95 per 160-character segment pay-as-you-go, or ₱0.90 and ₱0.85 if you prepay 1,000 or 5,000. Credits never expire and are never bundled into a plan. Longer messages use more than one segment, and the composer shows you the total before the send goes out. You can also set a hard ceiling per campaign and per month, and sends stop at the ceiling instead of quietly overspending. In-app messages are free on every plan, and push comes with a monthly allowance on every plan (1,000 on the free one), so save SMS for when nothing cheaper will do the job.",
      ],
      [
        "What do founding merchants get?",
        "Founding merchants get Core free for three months when the paid tiers open: five staff accounts, your own branding on the card, three programs at once, birthday campaigns and per-branch reporting. After that it's ₱499 a month or ₱399 billed yearly. Anyone who joins during the beta is a founding merchant. If you'd rather stay on the free plan, nothing changes for you; the offer is there, and it isn't a trap.",
      ],
      [
        "What does the free plan leave out?",
        "The free plan limits you to one program and two staff accounts, shows our badge on the card and has no campaign email, but you still get the whole stamp card with every rule, unlimited customers and unlimited branches. The growth tools sit on the paid tiers: separate branch reporting, segmentation, customer import, role-based permissions, bonus windows, promo codes, store credit, birthday campaigns, NFC and the deeper analytics. The pricing page has the row-by-row list. A single shop can run a stamp card on Launch forever. Core at ₱499 is for when that card is working and you want more from it: five staff, your own branding, three programs at once, birthday campaigns, and each branch reported separately.",
      ],
      [
        "What happens to our customer list if we leave?",
        "You export it in one click, on any plan, the free one included. Your customers are yours. There's no exit fee, no notice period on the free plan, and no version of this where your member list is what keeps you subscribed.",
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
    title: "KYP Rewards FAQ: straight answers for merchants",
    description:
      "Setup, pricing, privacy, points expiry and what's live today, answered without hedging.",
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
        eyebrow="Answers for owners and staff"
        title="The questions owners ask, answered plainly."
        description="For owners, staff and anyone checking us out properly, with straight answers on cost, Philippine rules and exactly what's running today."
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
              KYP Rewards is built so loyalty is clear at the counter and useful
              between visits, the customer stays in control, and the price is one
              a single shop can carry.
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
        title="See the whole relationship behind the stamp."
        description="If your question isn't here, ask us. We answer from Manila on weekdays, usually the same day."
      />
    </main>
  );
}
