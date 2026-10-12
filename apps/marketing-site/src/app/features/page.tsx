import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  CalendarCheck2,
  Check,
  Coins,
  CreditCard,
  Crown,
  Fingerprint,
  Gift,
  Globe2,
  HandCoins,
  Languages,
  Megaphone,
  Nfc,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Stamp,
  Store,
  Target,
  TicketPercent,
  Timer,
  Users,
  Wallet,
  WifiOff,
} from "lucide-react";
import {
  MarketingCta,
  AnswerBlock,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { paymentMethodsText } from "@kyprewards/ui/plans";
import { breadcrumb, webPage } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Loyalty Program Features",
  description:
    "Stamp cards, points, discounts, memberships, coupons, a reward catalog, multipass and gift cards: eight program types on one engine for Philippine shops.",
  alternates: { canonical: "/features" },
  openGraph: {
    title: "Every way to keep a customer. One card in their pocket.",
    description:
      "Bring customers in, keep them, win them back, grow what they spend. Stamp cards to suki tiers on one engine, built for Philippine shops.",
    url: "/features",
    locale: "en_PH",
    type: "article",
  },
};

/**
 * Organised by what the owner is trying to do, not by mechanism. A list of
 * forty features reads as a template and nobody finishes it; four outcomes
 * with the levers under each is how an owner actually thinks about a slow
 * Tuesday. The tier each lever arrives with is named in the row so this page
 * and the pricing matrix say the same thing.
 */
const outcomes = [
  {
    key: "in",
    eyebrow: "01 · Bring them in",
    title: "Turn a stranger into a member before they have bought anything.",
    lead: "Most programs open with a form at the worst possible moment. Yours opens with a stamp already waiting.",
    levers: [
      {
        icon: QrCode,
        title: "One public join code, everywhere",
        detail:
          "Poster, sticker, receipt, table tent, Facebook page, Instagram bio. It grants a membership and a pending welcome stamp, nothing of value, so it doesn't matter how far it spreads.",
        tier: "Free",
      },
      {
        icon: Stamp,
        title: "The welcome stamp",
        detail:
          "Lands the moment they join, marked pending; becomes real when your staff confirm the first visit, which earns its own stamp too. Switch it off if your ticket is too high to give one away.",
        tier: "Free",
      },
      {
        icon: TicketPercent,
        title: "Promo codes",
        detail:
          "WELCOME, FIESTA, the name of the barangay. A public code that grants a stamp, points or a coupon once per member. Put it on a tarp, a flyer, a Facebook post.",
        tier: "Core",
      },
      {
        icon: Users,
        title: "Two-sided referrals",
        detail:
          "The regular and the friend both get something, but only after the friend's first confirmed visit, so nobody can farm it.",
        tier: "Grow",
      },
      {
        icon: Store,
        title: "Listed in Discover",
        detail:
          "Every shop with a live program and a complete profile (photo, description, address and hours) shows up in the customer app by category and neighborhood, on every plan. Featured placement above the distance ordering on Grow, or as an add-on.",
        tier: "Free",
      },
    ],
  },
  {
    key: "keep",
    eyebrow: "02 · Keep them coming",
    title: "Make the next visit the obvious choice over the shop next door.",
    lead: "A stamp card is the start. These are the levers that make it a habit.",
    levers: [
      {
        icon: Timer,
        title: "Bonus windows",
        detail:
          "Double stamps from 2 to 4 on a Tuesday. Triple through the Ber months. Extra on the slow branch. A schedule, a multiplier and an end date; the customer sees it on their card before they queue.",
        tier: "Core",
      },
      {
        icon: Target,
        title: "Missions",
        detail:
          "“Visit three times this month.” “Try the three new drinks.” A goal, a window and a bonus, with progress on the customer's card. One bonus buys three visits a discount would have paid for one at a time.",
        tier: "Grow",
      },
      {
        icon: Crown,
        title: "Suki tiers",
        detail:
          "Levels a customer climbs by visits or spend. You name them (three is plenty), and each carries a benefit that feels like recognition: a better earn rate, a reserved reward, first pick of a bonus window. Automatic up, gentle down.",
        tier: "Grow",
      },
      {
        icon: CalendarCheck2,
        title: "Birthday and anniversary",
        detail:
          "A relevant reward at the right moment, with favorite-order context, sent only to members who asked for promotions.",
        tier: "Core",
      },
      {
        icon: ShieldCheck,
        title: "Rules that keep the card honest",
        detail:
          "Minimum spend per stamp. A cooldown so a card is not filled in an afternoon. Rewards held until the customer approves them. Every one on the free plan.",
        tier: "Free",
      },
    ],
  },
  {
    key: "back",
    eyebrow: "03 · Bring them back",
    title:
      "Reach the right customer, at the right moment, for the least money.",
    lead: "Every message shows its cost, its reach and its break-even before it sends. Consent is checked first, always.",
    levers: [
      {
        icon: Users,
        title: "Segments that update themselves",
        detail:
          "New, regular, VIP, lapsed, reward-ready, one visit from a mission. Basic segments on Core; on Grow, RFM scoring: how recently, how often and how much each customer buys.",
        tier: "Core",
      },
      {
        icon: Timer,
        title: "Automated win-back",
        detail:
          "When someone passes their usual return window (30, 60 or 90 days, or the shop's own rhythm), an offer goes out by itself. That includes the message we'd send first: “one more visit keeps your suki status.”",
        tier: "Grow",
      },
      {
        icon: Megaphone,
        title: "Quiet-hour campaigns",
        detail:
          "Pick the audience, name the window, see the predicted visits and the cost, set a spend ceiling, send. On Grow, measure the return visits against a normal day.",
        tier: "Core",
      },
      {
        icon: Smartphone,
        title: "Five channels, priced in the open",
        detail:
          "In-app free on every plan, and push with a monthly allowance on every plan. Email with the paid tiers. Viber and WhatsApp from ₱0.42, being connected and not live yet. SMS as credits at ₱0.95, cost shown first.",
        tier: "Free",
      },
      {
        icon: Fingerprint,
        title: "Consent is per purpose",
        detail:
          "Joining is not consent to marketing. NPC Circular 2023-04 says so and the product is built that way: two permissions, stored apart, withdrawable per channel.",
        tier: "Free",
      },
    ],
  },
  {
    key: "grow",
    eyebrow: "04 · Grow what they spend",
    title: "Move from visits to value when the shop is ready for it.",
    lead: "Seven more program types on the same engine, plus the peso-level tools a growing shop actually uses.",
    levers: [
      {
        icon: Coins,
        title: "Points and cashback",
        detail:
          "Earn by visit, item or peso. Optional earn-rate tiers. Redeem as a discount at the counter or against a reward catalog.",
        tier: "Core",
      },
      {
        icon: HandCoins,
        title: "Store credit",
        detail:
          "Peso credit you issue by hand, apart from cashback: a refund, a make-good for a bad order, a thank-you. Spendable at the counter, with a reason and a name on every entry.",
        tier: "Core",
      },
      {
        icon: Gift,
        title: "Send a reward as a gift",
        detail:
          "Pasalubong, digitally. A member sends a reward or points to another member at the same shop; both are told, both see it, the ledger keeps the trail.",
        tier: "Grow",
      },
      {
        icon: BadgePercent,
        title: "Earn by category or item",
        detail:
          "Different rates for coffee and food, services and retail, or one hero item you want to move. Needs items at the counter or a connected register.",
        tier: "Grow",
      },
      {
        icon: CreditCard,
        title: "Memberships, multipass, gift cards",
        detail:
          "Recurring benefits, prepaid visit bundles, and stored-value gift cards, kept apart from free reward vouchers because RA 10962 treats them differently.",
        tier: "Core",
      },
    ],
  },
] as const;

const programs = [
  { icon: Stamp, name: "Stamp cards" },
  { icon: Coins, name: "Points & cashback" },
  { icon: BadgePercent, name: "Member discounts" },
  { icon: Crown, name: "Memberships" },
  { icon: TicketPercent, name: "Coupons" },
  { icon: Gift, name: "Reward catalog" },
  { icon: CalendarCheck2, name: "Multipass" },
  { icon: CreditCard, name: "Gift cards" },
];

const operations = [
  {
    icon: Users,
    title: "Staff roles and a ledger with names on it",
    detail:
      "Owner, manager, marketer, counter. Every stamp, reversal and redemption carries who, when and which branch, on every plan. Stamps per staff member becomes a report on Grow.",
  },
  {
    icon: Store,
    title: "Unlimited branches, one card",
    detail:
      "A chain is one company. Customers earn and redeem anywhere; you see each branch on its own from Core, and where each member actually shops.",
  },
  {
    icon: BarChart3,
    title: "Analytics that decide the next move",
    detail:
      "Return rate, time to second visit, cohorts, reward liability in pesos, campaign attribution, and the branch and staff views that show where the program is working.",
  },
  {
    icon: WifiOff,
    title: "A counter that survives the internet",
    detail:
      "The customer's saved code works with no signal on every plan. The offline queue that holds and replays visits, with duplicate protection, arrives on Grow.",
  },
  {
    icon: Nfc,
    title: "QR, NFC, printed, and any register",
    detail:
      "Scan from a phone, tablet or browser beside whatever POS you own. NFC tap on Core. API, webhooks and POS adapters on Grow, for when the till should post the sale itself.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud made visible, and where possible prevented",
    detail:
      "Cooldowns, minimum spend, a welcome stamp that stays pending until staff confirm it, customer-approved redemption, reversals and a named ledger. We say plainly which controls detect and which prevent.",
  },
];

const philippines = [
  {
    icon: Wallet,
    title: "Pesos, paid the way you already pay",
    detail: `Priced in pesos, billed in pesos, settled by ${paymentMethodsText}. Dollar-billed tools can't say that.`,
  },
  {
    icon: Languages,
    title: "English or Filipino at the counter",
    detail:
      "The counter and owner screens in Filipino as well as English. It's the biggest thing standing between this and a carinderia, and it's on the roadmap, done properly, not machine-translated.",
    roadmap: true,
  },
  {
    icon: Smartphone,
    title: "Viber and Facebook, as well as email",
    detail:
      "Your join link fits right in a Facebook page bio, and we're connecting Viber and WhatsApp as campaign channels next, because that's where Filipino customers actually read.",
  },
  {
    icon: Crown,
    title: "Suki is the model",
    detail:
      "Filipino shops invented tiered loyalty long before software did. We named the tiers, the win-back message and the recognition for that culture instead of translating them into it.",
  },
  {
    icon: Globe2,
    title: "Works on a ₱5,000 Android with patchy data",
    detail:
      "A web app, nothing to install, and a saved code that works with no signal. The customer's phone is never the reason a stamp did not happen.",
  },
  {
    icon: Fingerprint,
    title: "Built for the Data Privacy Act",
    detail:
      "Every right RA 10173 gives a customer is a control in the product. No competitor in this market says that, because none of them built for it.",
  },
];

export default function FeaturesPage() {
  return (
    <main>
      <StructuredData
        data={[
          webPage({
            name: "KYP Rewards features",
            description:
              "Acquisition, retention, reactivation and growth levers for Philippine shops, on one loyalty engine.",
            path: "/features",
          }),
          breadcrumb([{ name: "Features", path: "/features" }]),
        ]}
      />
      <PageHero
        seam
        image="/images/hero-features.webp"
        eyebrow="The full loyalty system"
        title="Every way to keep a customer. One card in their pocket."
        description="Start with the stamp card. It's free, and most shops never need more. If you do, there are suki tiers, missions, bonus windows, store credit, referrals, win-back and seven more program types, all on the same engine and the same card."
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/pricing" tone="outline">
          Compare plans
        </SiteButton>
      </PageHero>
      <AnswerBlock
        image="/images/answer-features.webp"
        question="What can a small business actually do with a loyalty program?"
        answer="Four things: bring strangers in, keep regulars coming, bring lapsed customers back, and grow what each one spends. KYP Rewards gives a Philippine shop a lever for each, all on one card the customer already carries."
        points={[
          {
            label: "Bring them in:",
            text: "public join code, welcome stamp, promo codes, two-sided referrals, Discover listing.",
          },
          {
            label: "Keep them coming:",
            text: "bonus windows, missions, suki tiers, birthday rewards, and the card rules that keep it honest.",
          },
          {
            label: "Bring them back:",
            text: "self-updating segments, automated win-back, quiet-hour campaigns, five channels priced first.",
          },
          {
            label: "Grow what they spend:",
            text: "points and cashback, store credit, gifting, category earning, memberships, multipass, gift cards.",
          },
        ]}
        facts={[
          { label: "Program formats", value: "8, one engine" },
          { label: "Levers on the free plan", value: "The whole stamp card" },
          {
            label: "Channels",
            value: "In-app, push, email, SMS; Viber and WhatsApp being connected",
          },
          { label: "Built for", value: "The Philippines" },
        ]}
      />

      {outcomes.map((outcome, index) => (
        <section
          key={outcome.key}
          id={outcome.key}
          className={`scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28 ${
            index % 2 === 1
              ? "border-y border-[var(--line)] bg-[var(--surface)]"
              : ""
          }`}
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <SiteEyebrow>{outcome.eyebrow}</SiteEyebrow>
                <h2 className="mt-4 max-w-[13ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                  {outcome.title}
                </h2>
                <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                  {outcome.lead}
                </p>
              </div>
              <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {outcome.levers.map((lever) => {
                  const Icon = lever.icon;
                  return (
                    <article
                      key={lever.title}
                      className="grid gap-4 py-6 sm:grid-cols-[52px_1fr_auto] sm:items-start"
                    >
                      <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(232_163_61/14%)] text-[var(--accent-strong)]">
                        <Icon size={19} />
                      </span>
                      <div>
                        <h3 className="text-lg font-extrabold tracking-[-0.02em]">
                          {lever.title}
                        </h3>
                        <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                          {lever.detail}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-2.5 py-1 font-mono text-[9px] font-extrabold uppercase tracking-[0.1em] ${
                          lever.tier === "Free"
                            ? "bg-[var(--ink)] text-[var(--paper)]"
                            : "border border-[var(--line-strong)] text-[var(--muted-strong)]"
                        }`}
                      >
                        {lever.tier}
                      </span>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <div>
              <SiteEyebrow inverse>Eight formats, one engine</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                The stamp card is one of eight.
              </h2>
            </div>
            <p className="max-w-[56ch] text-base leading-relaxed text-white/70">
              Same card, same counter, same customer record. A shop runs one on
              Launch, three at once on Core and as many as it likes on Grow:
              say, a stamp card for regulars and a birthday coupon for everyone
              else, without a second tool.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/12 sm:grid-cols-4">
            {programs.map((program, index) => {
              const Icon = program.icon;
              return (
                <div
                  key={program.name}
                  className={`flex items-center gap-3 p-5 ${index === 0 ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--ink)]"}`}
                >
                  <Icon
                    size={18}
                    className={index === 0 ? "" : "text-[var(--accent)]"}
                  />
                  <span className="text-sm font-extrabold">{program.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-3xl">
            <SiteEyebrow>Run it without thinking</SiteEyebrow>
            <h2 className="mt-4 max-w-[14ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              Built for the whole business, not one QR poster.
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 lg:grid-cols-3">
            {operations.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="bg-[var(--surface)] p-7">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[var(--paper)]">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-8 text-lg font-extrabold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                    {item.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <div>
              <SiteEyebrow>Built for the Philippines</SiteEyebrow>
              <h2 className="mt-4 max-w-[13ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Built in Manila, for shops like yours.
              </h2>
            </div>
            <p className="max-w-[56ch] text-base leading-relaxed text-[var(--muted-strong)]">
              Global loyalty tools bill in dollars, email in English and assume
              a card reader. Here&apos;s what changes when the product is made
              in Manila for shops anywhere in the Philippines.
            </p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {philippines.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="flex flex-col rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--paper)] p-7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(232_163_61/14%)] text-[var(--accent-strong)]">
                      <Icon size={19} />
                    </span>
                    {"roadmap" in item && item.roadmap && (
                      <span className="rounded-full border border-[var(--line-strong)] px-2.5 py-1 font-mono text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                        Roadmap
                      </span>
                    )}
                  </div>
                  <h3 className="mt-7 text-lg font-extrabold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                    {item.detail}
                  </p>
                </article>
              );
            })}
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-extrabold">
              <Check size={16} className="text-[var(--accent-strong)]" />
              What&apos;s live and what&apos;s next, from the same data as the
              pricing table.
            </p>
            <Link
              href="/roadmap"
              className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-extrabold text-[var(--accent-strong)]"
            >
              Read the roadmap <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ScanLine size={20} className="text-[var(--accent-strong)]" />
            <p className="text-sm font-extrabold">
              API · webhooks · POS adapters · spreadsheet (CSV) import/export ·
              Apple Wallet · Google Wallet
            </p>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Connect when the business is ready. Most never need to.
          </p>
        </div>
      </section>

      <MarketingCta
        title="Start simple. Grow into the rest."
        description="Launch a stamp card in one shop for free. Add tiers, missions, automation and analytics when your business actually needs them, and not before."
      />
    </main>
  );
}
