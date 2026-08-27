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
import { businessAppUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Product",
  description:
    "Explore KYPStamping’s customer wallet, business workspace, QR stamping, campaigns, rewards, analytics, and privacy controls.",
  alternates: { canonical: "/product" },
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
            name: "How a KYPStamping loyalty visit works",
            description:
              "The four steps a customer and staff member complete at the counter to record a loyalty visit.",
            steps: [
              {
                name: "Customer shows one QR",
                text: "The customer opens their KYPStamping wallet and shows a single QR code that works across every business they have joined. It can also be saved or printed for use without a signal.",
              },
              {
                name: "Staff confirms the visit",
                text: "Staff scan the code from a phone, tablet, or browser beside the existing register, and confirm the purchase before anything is recorded.",
              },
              {
                name: "Progress updates instantly",
                text: "The stamp, points, or reward balance updates in the customer wallet immediately, or queues securely offline if the connection drops.",
              },
              {
                name: "The relationship gets smarter",
                text: "The visit joins the business's analytics so owners can see patterns and message the right segment when there is something useful to say.",
              },
            ],
          }),
          webPage({
            name: "KYPStamping product tour",
            description:
              "How the customer wallet, staff counter flow, and owner workspace fit together.",
            path: "/product",
          }),
          breadcrumb([{ name: "Product", path: "/product" }]),
        ]}
      />
      <PageHero
        image="/images/hero-product.webp"
        eyebrow="The complete loyalty loop"
        title="One small scan. A much better return visit."
        description="KYPStamping connects the moment at the counter with the customer wallet, business workspace, and thoughtful follow-up that happen afterward."
      >
        <SiteButton href="/contact">Start your program</SiteButton>
        <SiteButton href={businessAppUrl} tone="outline">
          Open business demo
        </SiteButton>
      </PageHero>
      <AnswerBlock
        question="How does a digital loyalty stamp card work?"
        answer="A customer shows one QR code from their phone, staff scan it beside the existing register, and the stamp appears in the customer's wallet straight away. There is no app to install, no plastic card to lose, and no POS to replace — the whole exchange takes about three seconds at the counter."
        facts={[
          { label: "Customer installs", value: "Nothing — it is a web app" },
          { label: "Counter hardware", value: "Any phone, tablet, or browser" },
          { label: "Time per visit", value: "About 3 seconds" },
          { label: "Works offline", value: "Yes, queued and signed" },
        ]}
      />

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
            <div className="relative min-h-[590px] overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--surface-2)] p-8 sm:p-12">
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

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-10 lg:grid-cols-[0.7fr_1.3fr] lg:p-14">
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

      <MarketingCta
        title="See your loyalty program take shape."
        description="Tell us how customers return today. We’ll help you design a program that fits the rhythm of your business."
      />
    </main>
  );
}
