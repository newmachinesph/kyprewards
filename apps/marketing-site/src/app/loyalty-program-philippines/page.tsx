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
    "A useful entry point is ₱0–₱499 per month for a single location, and a free tier should not cap how many customers join - a loyalty program exists to accumulate members, so paying per member is paying for your own success. Budget SMS separately because each segment has a real delivery cost; use in-app, push and email first when they fit the message.",
  ],
  [
    "Which program type is best?",
    "Frequent, predictable visits suit stamps or points. Higher-value services may suit membership, cashback, multipass, or a carefully timed coupon. Gift cards work when customers buy value for someone else.",
  ],
  [
    "How quickly can a business launch?",
    "A QR-based program can be configured and demonstrated in an afternoon. A production launch should also include staff training, final terms, privacy notices, channel consent, and reward-margin review.",
  ],
];

export const metadata: Metadata = {
  title: "Digital Loyalty Program Philippines",
  description:
    "A practical guide to choosing and pricing a digital loyalty program for cafés, salons, restaurants, and independent retailers in the Philippines.",
  alternates: { canonical: "/loyalty-program-philippines" },
  openGraph: {
    title: "Digital Loyalty Program Philippines | KYPStamping",
    description:
      "Choose a loyalty model, channel mix, and sustainable budget for a Philippine local business.",
    locale: "en_PH",
  },
};

export default function LoyaltyPhilippinesPage() {
  return (
    <main>
      <StructuredData data={breadcrumb([{ name: "Loyalty programs in the Philippines", path: "/loyalty-program-philippines" }])} />
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "KYPStamping digital loyalty platform",
            areaServed: { "@type": "Country", name: "Philippines" },
            serviceType: "Customer loyalty program software",
            offers: {
              "@type": "AggregateOffer",
              lowPrice: 0,
              highPrice: 3490,
              priceCurrency: "PHP",
              offerCount: 4,
            },
            provider: { "@type": "Organization", name: "KYPStamping" },
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
        title="A loyalty program people can use—and a business can afford."
        description="For Philippine cafés, salons, restaurants, and retailers: start with a simple return-visit loop, choose channels by value, and keep every reward and message economically visible."
      >
        <SiteButton href="/pricing">Model your monthly cost</SiteButton>
        <SiteButton href="/product" tone="outline">
          Explore the product
        </SiteButton>
      </PageHero>
      <AnswerBlock
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
              sentence, takes seconds at checkout, gives customers control of
              their contact choices, and costs less than the gross profit
              created by the return visits it influences. KYPStamping starts at
              ₱0 for one location with no limit on customers, rises to ₱499/month
              for an established shop running every program type, and meters SMS
              separately because it is the only channel that costs real money
              every time it is used.
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
                  "Stamps",
                  "Simple, frequent visits such as coffee or bakery purchases",
                ],
                [
                  "Points / rewards",
                  "Mixed baskets where spend or product actions vary",
                ],
                [
                  "Cashback",
                  "Higher-value repeat purchases with clear future credit",
                ],
                [
                  "Discount membership",
                  "Regulars who value an always-on benefit",
                ],
                ["Coupons", "Specific actions, products, or time windows"],
                [
                  "Multipass",
                  "Prepaid classes, treatments, meals, or services",
                ],
                [
                  "Gift cards",
                  "One customer purchasing value for another",
                ],
                [
                  "VIP membership",
                  "Recognition, access, tiers, and non-discount benefits",
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
                    "Durable program news and offers. Monthly allowance per plan, then ₱8 per 1,000.",
                },
                {
                  icon: Smartphone,
                  title: "Web push",
                  detail:
                    "Timely reminders for opted-in devices. Monthly allowance per plan, then ₱8 per 1,000.",
                },
                {
                  icon: BarChart3,
                  title: "Email",
                  detail:
                    "Longer stories and summaries. Allowance by plan, then ₱25 per 1,000.",
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
                    "Viber and WhatsApp, chosen per customer. From ₱0.42 a message.",
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
