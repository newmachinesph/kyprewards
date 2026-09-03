import type { Metadata } from "next";
import {
  BarChart3,
  BellRing,
  CakeSlice,
  Check,
  Gift,
  Heart,
  LockKeyhole,
  Megaphone,
  QrCode,
  ScanLine,
  Settings2,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";
import { FirstStamp } from "@/components/FirstStamp";
import {
  CheckList,
  MarketingCta,
  AnswerBlock,
  PageHero,
  ReceiptDemo,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb, howTo, webPage } from "@/lib/schema";
import { ProductPreview } from "@/components/ProductPreview";
import { VirtualCard } from "@/components/VirtualCard";
import { businessAppUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Digital Stamp Card",
  description:
    "A digital stamp card Philippine shops run free: a welcome stamp waits when they join from your poster, staff confirm visits in seconds, no app or POS change.",
  alternates: { canonical: "/product" },
  openGraph: {
    title: "The digital stamp card — one stamp, then the next",
    description:
      "How a stranger becomes a regular: join from a poster, a welcome stamp waits, the first visit makes it real, every visit after takes three seconds.",
    url: "/product",
    locale: "en_PH",
    type: "article",
  },
};

const workflow = [
  {
    title: "Customer shows one QR",
    detail:
      "Their secure identity works across every business they choose to join.",
    icon: QrCode,
  },
  {
    title: "Staff confirms the visit",
    detail: "The counter flow is fast, permissioned, and easy to teach.",
    icon: ScanLine,
  },
  {
    title: "Progress updates instantly",
    detail:
      "The customer sees the stamp, reward target, and latest message in their wallet.",
    icon: Stamp,
  },
  {
    title: "The relationship gets smarter",
    detail:
      "Owners see patterns and reach the right segment when there is something useful to say.",
    icon: BarChart3,
  },
];

const modules = [
  {
    title: "Customer directory",
    description:
      "See new, regular, VIP, inactive, birthday, and reward-ready customers as living segments.",
    icon: Users,
  },
  {
    title: "Reward builder",
    description:
      "Set stamp targets, reward terms, expiry rules, and optional tiers without touching code.",
    icon: Gift,
  },
  {
    title: "Campaign studio",
    description:
      "Send one clear message to the customers it actually applies to, with consent enforced automatically.",
    icon: Megaphone,
  },
  {
    title: "Birthday moments",
    description:
      "Turn a birthday into a personal visit with a relevant reward and favorite-order context.",
    icon: CakeSlice,
  },
  {
    title: "Favorite orders",
    description:
      "Remember the small details that make regulars feel recognized when they return.",
    icon: Heart,
  },
  {
    title: "Rules and access",
    description:
      "Give staff the tools to serve while owners retain control of programs, settings, and data.",
    icon: Settings2,
  },
];

export default function ProductPage() {
  return (
    <main>
      <StructuredData
        data={[
          howTo({
            name: "How a KYP Stamping loyalty visit works",
            description:
              "The four steps a customer and staff member complete at the counter to record a loyalty visit.",
            steps: [
              {
                name: "Join from the shop's public code",
                text: "The customer scans the poster, sticker or receipt code, or opens the shop's link, and joins with one mobile number. A welcome stamp lands on their card marked pending. No app is installed.",
              },
              {
                name: "Staff confirm the first visit",
                text: "On the first visit staff scan the customer's own code from any phone, tablet or browser beside the existing register. The pending welcome stamp becomes real and the visit earns its own, so the card reads two.",
              },
              {
                name: "Every visit after takes three seconds",
                text: "Staff scan the customer's code or find them by mobile number. The stamp appears in the customer's wallet immediately. A cooldown the shop sets stops the same customer earning twice in a day.",
              },
              {
                name: "The reward is held until it is redeemed",
                text: "When the card completes, the reward is held and the customer approves its release on their phone before staff hand it over. The card then resets and keeps earning.",
              },
            ],
          }),
          webPage({
            name: "KYP Stamping product tour",
            description:
              "How the customer wallet, staff counter flow, and owner workspace fit together.",
            path: "/product",
          }),
          breadcrumb([{ name: "Product", path: "/product" }]),
        ]}
      />
      <PageHero
        image="/images/hero-product.webp"
        eyebrow="The digital stamp card"
        title="One stamp. Then the next."
        description="A stamp card that lives on your customer's phone, runs beside the register you already own, and gives a stranger a reason to come back before they have bought anything. Free to start, and the rules are yours to set."
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/pricing" tone="outline">
          See pricing
        </SiteButton>
      </PageHero>
      <AnswerBlock
        image="/images/answer-product.webp"
        question="How does a digital loyalty stamp card work?"
        answer="A customer joins from your poster with one mobile number, your staff confirm each visit with one scan beside the register you already own, and the card lives on the customer’s phone. No app to install, no plastic to lose, no POS to replace."
        points={[
          {
            label: "They join:",
            text: "scan the poster, enter a number, and a welcome stamp lands on their card marked pending.",
          },
          {
            label: "First visit:",
            text: "staff scan their code; the welcome stamp becomes real and the visit earns another, so the card reads two.",
          },
          {
            label: "Every visit after:",
            text: "one scan, about three seconds. A cooldown you set stops the same customer earning twice in a day.",
          },
          {
            label: "Card full:",
            text: "the reward is held until the customer approves its release on their phone, then the card resets and keeps earning.",
          },
        ]}
        facts={[
          { label: "Customer installs", value: "Nothing — it is a web app" },
          { label: "Counter hardware", value: "Any phone, tablet, or browser" },
          { label: "Time per visit", value: "About 3 seconds" },
          { label: "Welcome stamp", value: "Pending until the first visit" },
        ]}
      />

      <FirstStamp />

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SiteEyebrow>The rules you set</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Eleven settings. Every one on the free plan.
              </h2>
              <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                A stamp card is a promise, and the promise should be yours to
                shape. These are the rules of the card, not upsells — they are
                the same on Launch as on Scale.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {[
                {
                  title: "Welcome stamp, on or off",
                  detail:
                    "A café gives one away gladly. A shop with a ₱3,000 average ticket may not want to, and does not have to. Pending stamps expire after 30 days if the visit never comes.",
                },
                {
                  title: "Target, from 1 to 30",
                  detail:
                    "Set the reward just beyond how often a happy regular already visits. Raise it later and every card already started still finishes on the number it began with.",
                },
                {
                  title: "Cooldown between stamps",
                  detail:
                    "How soon the same customer can earn again. Default once a day, so a card cannot be filled in an afternoon. A restaurant with two services can set two.",
                },
                {
                  title: "Minimum spend per stamp",
                  detail:
                    "Optional. “₱100 for a stamp” keeps a bottle of water from earning the same as a full order. Shown on the card, so nobody argues at the counter.",
                },
                {
                  title: "Stamp expiry, if you want one",
                  detail:
                    "Off unless you set it. Stamps earned free under a loyalty program may expire under RA 10962; a gift check a customer paid for may not. Whatever term you set is on the card before the first stamp.",
                },
                {
                  title: "The reward, in plain words",
                  detail:
                    "“A pastry on us” beats “member benefit.” The customer reads the reward and the number of stamps on their card before they collect the first one.",
                },
                {
                  title: "Held until redeemed",
                  detail:
                    "A full card keeps its reward and starts a fresh card behind it. Nobody is blocked from earning for being loyal, and the customer approves every redemption on their phone.",
                },
                {
                  title: "Reversals, with a name on them",
                  detail:
                    "Wrong customer, double tap, a stamp that should not have happened — one tap undoes it, and the ledger keeps both the stamp and the reversal.",
                },
                {
                  title: "A season, or forever",
                  detail:
                    "A card can run from a start date to an end date — the Ber months, a fiesta week — or with no end at all. Nothing is earned outside the window, the card closes by itself, and the dates are on the card before the first stamp.",
                },
                {
                  title: "When a card closes",
                  detail:
                    "Unfinished stamps expire, or carry over to a successor card you name — your choice. A reward already earned is always honoured, for a grace period you set, 30 days unless you change it. Cancelling an earned reward is not on the menu.",
                },
                {
                  title: "Once, or again and again",
                  detail:
                    "How many times one customer can complete the card in a run: once, a number, or no limit. At the limit the card reads completed and stops earning; a reward already held stays theirs.",
                },
              ].map((item, index) => (
                <article
                  key={item.title}
                  className={`p-6 sm:last:odd:col-span-2 sm:p-8 ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--surface)]"}`}
                >
                  <h3 className="text-lg font-extrabold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p
                    className={`mt-3 text-sm leading-relaxed ${index === 0 ? "text-[var(--ink)]/80" : "text-[var(--muted-strong)]"}`}
                  >
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SiteEyebrow>How every visit moves</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                A loop people understand immediately.
              </h2>
              <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                No plastic, no account lookup at the counter, and no training
                manual between the customer and their stamp.
              </p>
            </div>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {workflow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    className="grid gap-5 py-8 sm:grid-cols-[70px_1fr]"
                  >
                    <span
                      className={`grid size-13 place-items-center rounded-xl ${index === 1 ? "bg-[var(--accent)]" : "bg-[var(--surface)]"}`}
                    >
                      <Icon size={22} />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                        Step 0{index + 1}
                      </p>
                      <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                        {step.detail}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <ProductPreview />
            </div>
            <div>
              <SiteEyebrow inverse>For owners and staff</SiteEyebrow>
              <h2 className="mt-5 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                A business workspace that stays calm as you grow.
              </h2>
              <p className="mt-5 max-w-[50ch] text-base leading-relaxed text-white/70">
                The dashboard puts today&apos;s operations first, then lets you
                go deeper when you need a customer list, campaign, or program
                change.
              </p>
              <div className="mt-8">
                <CheckList
                  inverse
                  items={[
                    "Role-based access for owners, managers, and staff",
                    "Live visit, stamp, and reward metrics",
                    "Actionable segments instead of raw customer exports",
                    "A complete communication and redemption ledger",
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <VirtualCard />

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <SiteEyebrow>For customers</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Every local reward in one pocket.
              </h2>
              <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-[var(--muted-strong)]">
                Customers see cards, rewards, messages, and nearby programs from
                a mobile-first app that works without an app-store download.
              </p>
              <div className="mt-8">
                <CheckList
                  items={[
                    "One personal QR across every joined business",
                    "A clear wallet with visible progress and reward terms",
                    "Business discovery by category and neighborhood",
                    "Notification and marketing controls in the customer’s hands",
                  ]}
                />
              </div>
            </div>
            <div className="relative min-h-[590px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-2)] p-8 sm:p-12">
              <div className="absolute -bottom-24 -left-24 size-80 rounded-full border-[60px] border-[var(--accent)]" />
              <div className="relative mx-auto max-w-[360px]">
                <ReceiptDemo compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <SiteEyebrow>Everything connected</SiteEyebrow>
              <h2 className="mt-4 text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
                The practical tools behind every return.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {modules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <article
                    key={module.title}
                    className={`bg-[var(--surface)] p-6 sm:p-8 ${index === 1 ? "sm:bg-[var(--accent)]" : ""}`}
                  >
                    <span className="grid size-11 place-items-center rounded-2xl bg-[var(--paper)]">
                      <Icon size={19} />
                    </span>
                    <h3 className="mt-10 text-xl font-extrabold tracking-[-0.02em]">
                      {module.title}
                    </h3>
                    <p
                      className={`mt-3 text-sm leading-relaxed ${index === 1 ? "text-[var(--ink)]" : "text-[var(--muted-strong)]"}`}
                    >
                      {module.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <SiteEyebrow inverse>Beyond the stamp card</SiteEyebrow>
              <h2 className="mt-4 max-w-[13ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Start with stamps. Keep every path open.
              </h2>
            </div>
            <p className="max-w-[56ch] text-base leading-relaxed text-white/70">
              The stamp card is where most shops should begin, and plenty never
              need more. When you do, the same engine runs seven other program
              types, and the campaigns and analytics that make a customer list
              worth having.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Seven more program types",
                detail: "Points and cashback, discounts, coupons, memberships, a reward catalog, prepaid multipass and gift cards — from Core.",
              },
              {
                title: "Campaigns that pay for themselves",
                detail: "In-app and push on every plan. Birthday, win-back and quiet-hour campaigns show cost, reach and break-even before you send.",
              },
              {
                title: "Analytics you can act on",
                detail: "Who is new, regular, lapsed and reward-ready. Which branch they came from. What your unredeemed rewards would cost tomorrow.",
              },
              {
                title: "Connect the register when it pays",
                detail: "API, webhooks and POS adapters from Grow, so the till can post sales itself. Most shops run a healthy program long before they need this.",
              },
            ].map((item) => (
              <article key={item.title} className="bg-[var(--ink)] p-6 sm:p-7">
                <h3 className="text-base font-extrabold tracking-[-0.01em]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <SiteButton href="/features" tone="accent">
              See every feature
            </SiteButton>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-10 lg:grid-cols-[0.7fr_1.3fr] lg:p-14">
          <div>
            <span className="grid size-13 place-items-center rounded-xl bg-[rgb(232_163_61/16%)] text-[var(--accent-strong)]">
              <LockKeyhole />
            </span>
            <h2 className="mt-8 text-3xl font-extrabold tracking-[-0.02em]">
              Privacy is part of the product.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Consent-aware by default",
                text: "Campaign audiences include only customers who have opted into marketing.",
              },
              {
                icon: BellRing,
                title: "Clear communication controls",
                text: "Customers manage service updates, reward reminders, and promotions separately.",
              },
              {
                icon: LockKeyhole,
                title: "Minimal data sharing",
                text: "Businesses see only the information a customer chooses to share after joining.",
              },
              {
                icon: Check,
                title: "Auditable business actions",
                text: "Important staff, reward, and campaign activity is recorded for accountability.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title}>
                  <Icon size={18} className="text-[var(--accent-strong)]" />
                  <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="apps"
        className="scroll-mt-24 border-t border-[var(--line)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <SiteEyebrow>Three places one visit shows up</SiteEyebrow>
              <h2 className="mt-4 max-w-[13ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
                Everyone sees the same visit.
              </h2>
              <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                One scan writes one record. The customer sees progress, the
                staff member sees a confirmation, and the owner sees a pattern —
                from the same event, not three systems trying to agree.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {[
                {
                  name: "Your customer's wallet",
                  audience: "On their phone, nothing installed",
                  detail:
                    "One private code that works at every shop they join, live stamp progress, reward terms in plain language, and the controls to change what each shop can see or send.",
                },
                {
                  name: "The counter",
                  audience: "For whoever is on shift",
                  detail:
                    "Scan, confirm, done — about three seconds, from a phone, tablet or browser beside the register you already own. Reversals are one tap and every action carries a name.",
                },
                {
                  name: "The owner's workspace",
                  audience: "For you, after closing",
                  detail:
                    "Programs, customers, campaigns, staff roles and the numbers that decide the next move: who is returning, who has lapsed, what a reward is costing you.",
                },
                {
                  name: "Your shop in Discover",
                  audience: "For customers who have not found you yet",
                  detail:
                    "Your category, neighborhood, hours and live program, listed in the customer app on every plan — including the free one.",
                },
              ].map((app) => (
                <article key={app.name} className="bg-[var(--surface)] p-6 sm:p-8">
                  <p className="font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                    {app.audience}
                  </p>
                  <h3 className="mt-2 text-xl font-extrabold tracking-[-0.02em]">
                    {app.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                    {app.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <SiteButton href="/partners">Apply to join</SiteButton>
            <SiteButton href={`${businessAppUrl}/login`} tone="outline">
              Business sign in
            </SiteButton>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Your stamp card, live before the next busy day."
        description="Tell us how customers return today. We read every application ourselves and set your first card up with you before you sign in."
      />
    </main>
  );
}
