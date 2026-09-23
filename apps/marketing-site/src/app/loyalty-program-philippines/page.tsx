import type { Metadata } from "next";
import {
  BarChart3,
  Check,
  MessageCircle,
  MessageSquareText,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  WalletCards,
} from "lucide-react";
import {
  MarketingCta,
  AnswerBlock,
  PageHero,
  SiteButton,
  SiteEyebrow,
  TextLink,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb } from "@/lib/schema";

const questions = [
  [
    "What is a digital loyalty program?",
    "A digital loyalty program records eligible visits or purchases and gives customers progress toward a clearly described benefit without relying on a disposable paper card.",
  ],
  [
    "What should a Philippine small business budget?",
    "A useful entry point is ₱0–₱499 per month for a single location, and a free tier should not cap how many customers join — a loyalty program exists to accumulate members, so paying per member is paying for your own success. Budget SMS separately because each segment has a real delivery cost; use in-app, push and email first when they fit the message.",
  ],
  [
    "Which program type is best?",
    "Frequent, predictable visits suit stamps or points. Higher-value services may suit membership, cashback, multipass, or a carefully timed coupon. Gift cards work when customers buy value for someone else.",
  ],
  [
    "How quickly can a business launch?",
    "A QR-based program can be configured in an afternoon. Going live properly also means staff training, final reward terms, a privacy notice, channel consent, and a look at whether the reward margin holds.",
  ],
  [
    "Can loyalty points expire in the Philippines?",
    "Generally yes. The Gift Check Act of 2017 (RA 10962) bans expiry on gift checks but carves out checks issued under loyalty, rewards and promotional programs, so a free-earned stamp or point is treated differently from a gift certificate a customer paid for. Set a term you can explain in one sentence, show it on the card before the first stamp, and confirm your own wording with counsel.",
  ],
  [
    "Does a loyalty signup count as consent to send marketing?",
    "No. NPC Circular 2023-04 requires consent to be specific and informed, and data collected for one purpose cannot be reused for another without asking again. Joining the program and agreeing to promotions are two questions. Ask them separately, record them separately, and let the customer withdraw either one per channel.",
  ],
];

export const metadata: Metadata = {
  title: "Digital Loyalty Programs in the Philippines",
  description:
    "What a loyalty program costs in the Philippines, which mechanic fits your shop, what the Data Privacy Act and DTI require, and whether points can expire.",
  alternates: { canonical: "/loyalty-program-philippines" },
  openGraph: {
    title: "Digital Loyalty Programs in the Philippines — the practical guide",
    description:
      "What it costs, which mechanic fits your shop, and what the Data Privacy Act and DTI actually require.",
    url: "/loyalty-program-philippines",
    locale: "en_PH",
    type: "article",
  },
};

export default function LoyaltyPhilippinesPage() {
  return (
    <main>
      <StructuredData
        data={breadcrumb([
          {
            name: "Loyalty programs in the Philippines",
            path: "/loyalty-program-philippines",
          },
        ])}
      />
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "KYP Rewards digital loyalty platform",
            areaServed: { "@type": "Country", name: "Philippines" },
            serviceType: "Customer loyalty program software",
            offers: {
              "@type": "Offer",
              name: "Launch",
              price: 0,
              priceCurrency: "PHP",
              availability: "https://schema.org/InStock",
            },
            provider: { "@type": "Organization", name: "KYP Rewards" },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: questions.map(([question, answer]) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          },
        ]}
      />
      <PageHero
        image="/images/hero-about.webp"
        eyebrow="Digital loyalty program Philippines"
        title="A loyalty program people can use — and a business can afford."
        description="For Philippine cafés, salons, restaurants, and retailers: start with a simple return-visit loop, choose channels by value, and keep every reward and message economically visible."
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/pricing" tone="outline">
          Model your monthly cost
        </SiteButton>
      </PageHero>
      <AnswerBlock
        image="/images/answer-guide.webp"
        question="What is a digital loyalty program, and do Philippine businesses need an app for one?"
        answer="A digital loyalty program replaces the paper punch card with a record the customer carries on their phone. In the Philippines it usually works through a QR code and a web app, so neither the shop nor the customer installs anything from an app store. The business keeps its existing register; the loyalty record simply sits alongside it."
        facts={[
          { label: "App store install", value: "Not required" },
          { label: "Typical entry cost", value: "₱0 – ₱499 / month" },
          { label: "Per-customer fee", value: "None, on any plan" },
          { label: "Common formats", value: "Stamps, points, discounts" },
          { label: "Privacy law", value: "Data Privacy Act of 2012" },
        ]}
      />

      <section className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1100px] gap-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:gap-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)]">
            <Check size={20} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold">The short answer</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
              The best digital loyalty program is easy to explain in one
              sentence and takes seconds at checkout. It gives customers control
              of their contact choices, and it costs less than the profit from
              the return visits it brings in. KYP Rewards starts at ₱0 with no
              limit on customers. It rises to ₱499 a month for an established
              shop, within a hundred pesos of the cheapest paid tool with
              published peso pricing in this market. SMS is metered separately,
              because it is the one channel that costs real money every time it
              is used.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <SiteEyebrow>Choose the mechanic</SiteEyebrow>
              <h2 className="mt-4 max-w-[10ch] text-4xl font-extrabold leading-none tracking-[-0.03em]">
                Match the reward to the natural buying rhythm.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {[
                [
                  "Stamp cards",
                  "Simple, frequent visits such as coffee, milk tea or bakery purchases. Free on every plan.",
                ],
                [
                  "Points and cashback",
                  "Mixed baskets where spend varies; earn by visit, item or peso, with future credit",
                ],
                [
                  "Discounts and tiered pricing",
                  "Regulars who value an always-on benefit, or a better rate as they climb",
                ],
                ["Coupons", "Specific actions, products, or time windows"],
                [
                  "Memberships",
                  "Recurring benefits and VIP access, renewed monthly and paid at your counter",
                ],
                [
                  "Reward catalog",
                  "Let customers choose from milestones, perks, products or services",
                ],
                [
                  "Prepaid multipass",
                  "Prepaid classes, treatments, meals, or services",
                ],
                [
                  "Gift cards",
                  "One customer purchasing value for another — kept apart from free reward vouchers",
                ],
              ].map(([title, detail]) => (
                <article key={title} className="bg-[var(--surface)] p-6">
                  <WalletCards
                    size={18}
                    className="text-[var(--accent-strong)]"
                  />
                  <h3 className="mt-8 font-extrabold">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SiteEyebrow inverse>Channel strategy</SiteEyebrow>
          <div className="mt-5 grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <h2 className="max-w-[12ch] text-4xl font-extrabold leading-none tracking-[-0.03em] sm:text-5xl">
              Use the least expensive channel that still serves the moment.
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: MessageSquareText,
                  title: "In-app inbox",
                  detail:
                    "Lands in the wallet where their card already is. Unlimited on every plan, including the free one, at no charge.",
                },
                {
                  icon: Smartphone,
                  title: "Web push",
                  detail:
                    "Reaches someone who has closed the wallet. 1,000 a month free, then ₱8 per 1,000.",
                },
                {
                  icon: BarChart3,
                  title: "Email",
                  detail:
                    "Longer stories and summaries. Campaign allowance on the paid tiers, then ₱25 per 1,000.",
                },
                {
                  icon: QrCode,
                  title: "SMS",
                  detail:
                    "High-attention moments. Add-on credits at ₱0.95 per segment, priced before you send.",
                },
                {
                  icon: MessageCircle,
                  title: "Messaging apps",
                  detail:
                    "Viber and WhatsApp, chosen per customer. From ₱0.42 a message. Being connected and not live yet.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/12 bg-white/5 p-5"
                  >
                    <Icon size={19} className="text-[var(--accent)]" />
                    <h3 className="mt-7 font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/65">
                      {item.detail}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SiteEyebrow>Selection checklist</SiteEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em]">
              Evaluate the whole operating system.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
              A polished customer card is only one surface. Staff speed,
              customer rights, delivery economics, and platform controls decide
              whether the program stays healthy.
            </p>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: Store,
                title: "Counter fit",
                detail:
                  "Can staff join, earn, redeem, reverse, and recover from poor connectivity without confusion?",
              },
              {
                icon: ShieldCheck,
                title: "Customer control",
                detail:
                  "Can a person see what is shared, change each channel, leave one program, export data, or request deletion?",
              },
              {
                icon: BarChart3,
                title: "Incremental measurement",
                detail:
                  "Can the owner compare campaign cost with attributable visits, gross profit, and retention?",
              },
              {
                icon: Smartphone,
                title: "No-download access",
                detail:
                  "Can a customer participate immediately and save the experience to a home screen later?",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:grid-cols-[auto_1fr]"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface-2)]">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="font-extrabold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                      {item.detail}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-3xl">
            <SiteEyebrow>The rules, plainly</SiteEyebrow>
            <h2 className="mt-4 max-w-[15ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              Three Philippine rules worth knowing before you launch.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-[var(--muted-strong)]">
              None of this is legal advice, and we are not your counsel. It is
              the short version of what a careful owner asks about — set out
              here because most loyalty vendors say nothing at all.
            </p>
          </div>

          <div className="mt-12 grid gap-3 lg:grid-cols-3">
            {[
              {
                tag: "RA 10173",
                title: "Consent is per purpose, not per signup",
                body: "The Data Privacy Act governs every customer name, number and birthday you collect. NPC Circular 2023-04 requires consent to be freely given, specific, informed and unambiguous — and data gathered for one purpose cannot be reused for another without asking again. Joining a stamp card is consent to run the stamp card. Marketing is a separate question, asked separately, withdrawable per channel.",
                foot: "In KYP Rewards this is not a setting you can switch off: service and promotional consent are recorded apart on every plan, and campaign audiences are filtered against that record before a send.",
              },
              {
                tag: "DAO 02 s.2002",
                title: "A reward scheme can count as a sales promotion",
                body: "DTI defines a sales promotion broadly, and reward and loyalty schemes sit inside that definition alongside raffles and premiums — which on a plain reading can reach a collect-ten-get-one card. We are aware of no enforcement action against a small shop running a stamp card, and the requirement is widely unobserved at that scale.",
                foot: "Worth one question to your counsel before launch rather than after. We flag it because staying quiet about it is the easier thing to do, not the more useful one.",
              },
              {
                tag: "RA 10962",
                title: "Points can expire. Gift checks cannot",
                body: "The Gift Check Act bans expiry dates on gift checks and requires unused balances to be honored — then carves out checks issued under loyalty, rewards and promotional programs. So a stamp earned free in your program may carry an expiry, while a gift certificate a customer paid pesos for is a different instrument under different rules.",
                foot: "The two are kept apart in the product, and whatever expiry you set is shown on the customer's card before they collect their first stamp.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="flex flex-col rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-7"
              >
                <span className="w-fit rounded-full bg-[rgb(232_163_61/16%)] px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                  {item.tag}
                </span>
                <h3 className="mt-6 text-xl font-extrabold leading-tight tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                  {item.body}
                </p>
                <p className="mt-auto border-t border-[var(--line)] pt-4 text-xs leading-relaxed text-[var(--muted)]">
                  {item.foot}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--ink)] px-4 py-16 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1200px]">
          <SiteEyebrow inverse>Why a phone-first card works here</SiteEyebrow>
          <div className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "1.24M",
                "registered MSMEs in the Philippines, 90.7% of them micro",
              ],
              [
                "98.6%",
                "of Filipino internet users own a smartphone — the card is already in their pocket",
              ],
              [
                "8h 52m",
                "average daily time online, among the highest of any country",
              ],
              [
                "~94M",
                "GCash accounts — Filipinos already trust a phone with money",
              ],
            ].map(([stat, label]) => (
              <div key={label} className="bg-[var(--ink)] p-6">
                <p className="font-display text-4xl font-extrabold tracking-[-0.03em] text-[var(--accent)]">
                  {stat}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/65">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-white/55">
            Sources: DTI MSME statistics; DataReportal, Digital Philippines. A
            paper punch card asks a customer to carry something extra. A phone
            does not.
          </p>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-10 lg:grid-cols-[0.6fr_1.4fr]">
            <div>
              <SiteEyebrow>Common questions</SiteEyebrow>
              <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em]">
                Direct answers.
              </h2>
              <div className="mt-6">
                <TextLink href="/faq">Read the complete FAQ</TextLink>
              </div>
            </div>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {questions.map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-extrabold">
                    <span>{question}</span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-[68ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
      <MarketingCta
        title="Build loyalty around profitable returns."
        description="Start on the free plan with unlimited customers, then choose a tier and channel mix that your returning visits can comfortably pay back."
      />
    </main>
  );
}
