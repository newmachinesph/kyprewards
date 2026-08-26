import type { Metadata } from "next";
import {
  BadgePercent,
  BarChart3,
  BellRing,
  CalendarCheck2,
  Check,
  Coins,
  CreditCard,
  Crown,
  DatabaseZap,
  Fingerprint,
  Gift,
  Globe2,
  MessageSquareText,
  Nfc,
  PlugZap,
  QrCode,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Stamp,
  Store,
  TicketPercent,
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
import { breadcrumb, webPage } from "@/lib/schema";
import { businessAppUrl, customerAppUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore KYPStamping loyalty programs, QR and NFC visits, customer wallet, automations, analytics, integrations, offline tools, and privacy controls.",
  alternates: { canonical: "/features" },
};

const programs = [
  {
    icon: Stamp,
    name: "Stamp cards",
    detail: "Reward repeat visits with a clear target from 1 to 30 stamps.",
  },
  {
    icon: Coins,
    name: "Points & cashback",
    detail: "Earn by visit, item, or peso spent with optional earning tiers.",
  },
  {
    icon: BadgePercent,
    name: "Member discounts",
    detail: "Offer one rate or unlock better rates as loyalty grows.",
  },
  {
    icon: Crown,
    name: "Memberships",
    detail: "Run VIP access, recurring plans, and monthly benefit limits.",
  },
  {
    icon: TicketPercent,
    name: "Coupons",
    detail:
      "Issue single-use offers with a clear window and redemption ledger.",
  },
  {
    icon: Gift,
    name: "Reward catalog",
    detail:
      "Let customers choose from milestones, perks, products, or services.",
  },
  {
    icon: CalendarCheck2,
    name: "Multipass",
    detail:
      "Sell prepaid visit bundles for classes, services, or regular orders.",
  },
  {
    icon: CreditCard,
    name: "Gift cards",
    detail: "Track balances, partial redemptions, transfers, and expiry terms.",
  },
];

const automations = [
  [
    "Birthday & anniversary",
    "Celebrate at the right moment with a relevant, consented offer.",
  ],
  [
    "Win-back journeys",
    "Reach a customer when they move beyond their normal return window.",
  ],
  [
    "Next-visit reminders",
    "Use each business's real visit rhythm instead of arbitrary blasts.",
  ],
  [
    "Reward-in-reach",
    "Nudge customers who are one action away from a useful benefit.",
  ],
  [
    "Referrals",
    "Give both the regular and their friend a controlled reward after a real visit.",
  ],
  [
    "Review requests",
    "Ask after a confirmed good experience and route private feedback first.",
  ],
  [
    "Location moments",
    "Offer opt-in nearby reminders with quiet hours and frequency limits.",
  ],
  [
    "Segment campaigns",
    "Reach new, regular, VIP, at-risk, or custom audiences separately.",
  ],
];

const insightRows = [
  [
    "Retention",
    "Return rate, visit frequency, cohorts, and time to second visit",
  ],
  [
    "Customers",
    "RFM segments, lifecycle, custom fields, favorite orders, and consent",
  ],
  [
    "Programs",
    "Completion, breakage, reward cost, redemption, and tier movement",
  ],
  [
    "Campaigns",
    "Delivered, opened, visited, redeemed, unsubscribed, and revenue",
  ],
  [
    "Operations",
    "Branch, staff, channel, SKU, reversals, and suspicious activity",
  ],
];

const operations = [
  {
    icon: Store,
    title: "Branches & staff",
    detail:
      "Location-level programs, roles, limits, manager views, and an action audit trail.",
  },
  {
    icon: PlugZap,
    title: "POS-ready connections",
    detail:
      "Start beside any checkout, then connect through API, webhooks, imports, and POS adapters.",
  },
  {
    icon: DatabaseZap,
    title: "Portable customer records",
    detail:
      "Permissioned import, export, correction, deletion, and consent history—not a data trap.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud-aware rewards",
    detail:
      "Rotating codes, confirmation, rate limits, reversals, device signals, and review queues.",
  },
];

export default function FeaturesPage() {
  return (
    <main>
      <StructuredData
        data={[
          webPage({
            name: "KYPStamping features",
            description:
              "Eight program formats, counter methods, lifecycle automation, analytics, and Philippine operations.",
            path: "/features",
          }),
          breadcrumb([{ name: "Features", path: "/features" }]),
        ]}
      />
      <PageHero
        image="/images/hero-features.webp"
        eyebrow="The full loyalty system"
        title="Every way to reward. One local relationship."
        description="Run simple stamps today, then add points, memberships, gift value, referrals, and automations without making customers juggle another account for every shop."
      >
        <SiteButton href={businessAppUrl}>Explore the business demo</SiteButton>
        <SiteButton href={customerAppUrl} tone="outline">
          Open the customer wallet
        </SiteButton>
      </PageHero>
      <AnswerBlock
        question="What types of loyalty program can a small business run?"
        answer="KYPStamping runs eight formats from one program engine: stamp cards, points and cashback, tiered discounts, memberships, coupons, a reward catalog, prepaid multipasses, and gift cards. A business can run several at once — a stamp card for regulars and a birthday coupon for everyone else — without managing separate tools."
        facts={[
          { label: "Program formats", value: "8, one engine" },
          { label: "Run at once", value: "Unlimited on Grow and up" },
          { label: "Counter methods", value: "QR, NFC, printed, offline" },
          { label: "Customer wallet", value: "PWA plus wallet pass" },
        ]}
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SiteEyebrow>Program studio</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Eight proven program shapes.
              </h2>
              <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Choose the behavior you want to encourage. KYPStamping keeps the
                experience consistent for staff and customers across every
                program type.
              </p>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--surface)]">
              {programs.map((program, index) => {
                const Icon = program.icon;
                return (
                  <article
                    key={program.name}
                    className={`grid gap-4 p-5 sm:grid-cols-[52px_0.7fr_1.3fr] sm:items-center sm:p-6 ${index > 0 ? "border-t border-[var(--line)]" : ""} ${index === 0 ? "bg-[var(--accent)]" : ""}`}
                  >
                    <span className="grid size-12 place-items-center rounded-2xl bg-[var(--paper)]">
                      <Icon size={20} />
                    </span>
                    <h3 className="text-lg font-extrabold tracking-[-0.02em]">
                      {program.name}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${index === 0 ? "text-[var(--ink)]/75" : "text-[var(--muted-strong)]"}`}
                    >
                      {program.detail}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
          <div>
            <SiteEyebrow inverse>The counter flow</SiteEyebrow>
            <h2 className="mt-5 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              Fast when online. Safe when it is not.
            </h2>
            <p className="mt-5 max-w-[50ch] text-base leading-relaxed text-white/70">
              Customers can join from a poster, social link, NFC tap, or staff
              scan. A visit takes seconds, and an encrypted offline queue keeps
              the line moving through an internet outage.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "No app-store download",
                "Works without a signal",
                "Printed cards available",
                "Works beside any POS",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/12 bg-white/[0.055] p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-sm font-extrabold">Visit capture</p>
                <p className="mt-1 text-xs text-white/55">
                  Choose the fastest method at each location
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--ink)]">
                <WifiOff size={13} /> Offline ready
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: QrCode,
                  title: "One customer QR",
                  text: "A secure ID across every business they join.",
                },
                {
                  icon: Nfc,
                  title: "NFC tap",
                  text: "A quick second option for a busy counter.",
                },
                {
                  icon: ScanLine,
                  title: "Join code",
                  text: "Poster and link enrollment with minimal fields.",
                },
                {
                  icon: Smartphone,
                  title: "PWA + wallet pass",
                  text: "Full wallet in the browser; quick access in Apple or Google Wallet.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-5"
                  >
                    <Icon size={20} className="text-[var(--accent)]" />
                    <h3 className="mt-7 text-base font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/60">
                      {item.text}
                    </p>
                  </article>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 p-4">
              <RefreshCcw size={18} className="shrink-0 text-[var(--accent)]" />
              <p className="text-xs leading-relaxed text-white/70">
                <strong className="text-white">
                  Automatic reconciliation.
                </strong>{" "}
                Offline visits are signed, checked for duplicates, and synced
                when the connection returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <SiteEyebrow>Lifecycle automation</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Useful timing, not noisy marketing.
              </h2>
              <p className="mt-5 max-w-[45ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Every journey respects channel consent, quiet hours, frequency
                limits, and location relevance before a message can go out.
              </p>
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <BellRing
                  className="mt-0.5 shrink-0 text-[var(--accent-strong)]"
                  size={19}
                />
                <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
                  <strong className="text-[var(--ink)]">
                    In-app and push are built in.
                  </strong>{" "}
                  SMS, email, and messaging integrations can be added by channel
                  without changing the customer record.
                </p>
              </div>
            </div>
            <div className="border-y border-[var(--line)]">
              {automations.map(([title, detail], index) => (
                <article
                  key={title}
                  className={`grid gap-2 py-5 sm:grid-cols-[44px_0.72fr_1.28fr] sm:items-center ${index > 0 ? "border-t border-[var(--line)]" : ""}`}
                >
                  <span className="font-mono text-[10px] font-bold text-[var(--accent-strong)]">
                    0{index + 1}
                  </span>
                  <h3 className="text-base font-extrabold">{title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
                    {detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--paper)]">
              <div className="flex items-center justify-between border-b border-[var(--line)] p-6">
                <div>
                  <SiteEyebrow>Analytics model</SiteEyebrow>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">
                    From visits to business value
                  </h2>
                </div>
                <BarChart3 size={22} className="text-[var(--accent-strong)]" />
              </div>
              {insightRows.map(([label, value], index) => (
                <div
                  key={label}
                  className={`grid gap-2 p-5 sm:grid-cols-[0.55fr_1.45fr] sm:p-6 ${index > 0 ? "border-t border-[var(--line)]" : ""}`}
                >
                  <p className="text-sm font-extrabold">{label}</p>
                  <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-between rounded-[18px] bg-[var(--accent)] p-7 sm:p-9">
              <div>
                <SiteEyebrow>Explainable actions</SiteEyebrow>
                <h2 className="mt-4 max-w-[10ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
                  Know what to do next—and why.
                </h2>
                <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-[var(--ink)]/75">
                  KYPStamping turns patterns into small, reviewable recommendations.
                  Every suggested audience shows its reason, estimated reach,
                  reward cost, and opt-in status before launch.
                </p>
              </div>
              <div className="mt-12 rounded-2xl bg-[var(--surface)] p-5">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                  <MessageSquareText size={14} /> Next best action
                </div>
                <p className="mt-4 text-lg font-extrabold">
                  Bring back 32 almost-regulars
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                  They have visited twice in 21 days and usually return on
                  Tuesdays. 28 have promotion consent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-3xl">
            <SiteEyebrow>Philippines-ready operations</SiteEyebrow>
            <h2 className="mt-4 max-w-[14ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              Built for the whole business, not one QR poster.
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
            {operations.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`bg-[var(--surface)] p-7 sm:p-9 ${index === 1 ? "md:bg-[var(--accent)]" : ""}`}
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-[var(--paper)]">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-10 text-xl font-extrabold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p
                    className={`mt-3 max-w-[48ch] text-sm leading-relaxed ${index === 1 ? "text-[var(--ink)]/75" : "text-[var(--muted-strong)]"}`}
                  >
                    {item.detail}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-12 grid gap-5 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-7 sm:grid-cols-[auto_1fr] sm:items-start sm:p-9">
            <span className="grid size-13 place-items-center rounded-xl bg-[rgb(232_163_61/16%)] text-[var(--accent-strong)]">
              <Fingerprint />
            </span>
            <div>
              <h3 className="text-2xl font-extrabold tracking-[-0.02em]">
                Customer rights are product controls.
              </h3>
              <p className="mt-3 max-w-[78ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Customers can see which businesses they joined, change marketing
                and location permissions, access or correct their profile,
                export their records, leave a program, and request deletion.
                Owners get consent history and role-based access—not
                unrestricted customer data.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Transparency",
                  "Legitimate purpose",
                  "Proportionality",
                  "Access & correction",
                  "Portability",
                  "Deletion requests",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-2 text-xs font-bold text-[var(--muted-strong)]"
                  >
                    <Check size={13} className="text-[var(--accent-strong)]" />{" "}
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-5 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Globe2 size={20} className="text-[var(--accent-strong)]" />
              <p className="text-sm font-extrabold">
                API · webhooks · POS adapters · CSV import/export · Apple Wallet
                · Google Wallet
              </p>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Connect when the business is ready.
            </p>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Start simple. Keep every path open."
        description="Launch a stamp card in one location, then grow into the program, automation, analytics, and integration depth your business actually needs."
      />
    </main>
  );
}
