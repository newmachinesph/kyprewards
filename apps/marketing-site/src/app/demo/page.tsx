import type { Metadata } from "next";
import { demoData } from "@stampr/demo-data";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CircleDollarSign,
  Compass,
  Megaphone,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Webhook,
} from "lucide-react";
import {
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import {
  adminAppUrl,
  businessAppUrl,
  customerAppUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Interactive Loyalty Platform Demo",
  description:
    "Tour KYPStamping across its customer PWA, business workspace, integration setup, and platform administration using connected frontend demo data.",
  alternates: { canonical: "/demo" },
};

const journey = [
  {
    number: "01",
    role: "Customer",
    title: "Discover and join",
    detail:
      "Find a nearby business, review the reward and permissions, then add it to one private wallet.",
    href: `${customerAppUrl}/#discover`,
    action: "Open customer PWA",
    icon: Smartphone,
    stops: ["Discover", "Join program", "Wallet card", "Personal QR"],
  },
  {
    number: "02",
    role: "Staff",
    title: "Serve the visit",
    detail:
      "Scan the customer, confirm an earn or redemption, and keep the counter safe when connectivity drops.",
    href: `${businessAppUrl}/#scan`,
    action: "Open counter flow",
    icon: ScanLine,
    stops: ["Customer scan", "Reward check", "Confirm visit", "Offline queue"],
  },
  {
    number: "03",
    role: "Owner",
    title: "Grow the relationship",
    detail:
      "Build programs, automate useful moments, watch contribution, and connect the commerce tools already in use.",
    href: `${businessAppUrl}/#integrations`,
    action: "Open business workspace",
    icon: Building2,
    stops: ["Program studio", "Campaign economics", "API keys", "Webhooks"],
  },
  {
    number: "04",
    role: "Platform admin",
    title: "Protect the network",
    detail:
      "Monitor tenants, adapters, retries, privacy work, audit evidence, and unit economics without browsing customer profiles.",
    href: `${adminAppUrl}/#integrations`,
    action: "Open platform control",
    icon: ShieldCheck,
    stops: ["Tenant health", "Adapter registry", "Delivery recovery", "Gross margin"],
  },
];

const sharedScenario = demoData.sharedScenario;

export default function DemoPage() {
  return (
    <main>
      <PageHero
        image="/images/hero-product.webp"
        eyebrow="Connected frontend demo"
        title="See one visit from every side."
        description="KYPStamping is four coordinated experiences, not a dashboard mockup. Follow a customer from discovery to the counter, then see how the business grows the relationship and the platform keeps it trustworthy."
      >
        <SiteButton href={`${customerAppUrl}/#discover`}>
          Start the guided tour
        </SiteButton>
        <SiteButton href={`${businessAppUrl}/#dashboard`} tone="outline">
          Open business overview
        </SiteButton>
      </PageHero>

      <section className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 font-extrabold text-[var(--success)]">
            <Check size={15} strokeWidth={3} /> Fully navigable frontend
          </span>
          <span className="text-[var(--muted-strong)]">
            Local JSON · no live account, payment, message, or customer data
          </span>
        </div>
      </section>

      <section className="border-b border-[var(--line)] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <SiteEyebrow>One source of truth</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                One visit. Four coordinated views.
              </h2>
            </div>
            <div className="lg:justify-self-end">
              <code className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-[10px] font-extrabold text-[var(--paper)]">
                {sharedScenario.loyaltyEvent.id}
              </code>
              <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Every surface reads the same local demo fixture. Follow {sharedScenario.customer}&apos;s {sharedScenario.purchase.display} visit at {sharedScenario.business}, then verify the matching balance, counter receipt, and delivery status.
              </p>
            </div>
          </div>

          <div className="mt-10 grid overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Public website",
                icon: Megaphone,
                title: "The promise",
                value: "A useful return visit, not another plastic card.",
              },
              {
                label: "Customer PWA",
                icon: Smartphone,
                title: sharedScenario.customer,
                value: `${sharedScenario.loyaltyEvent.after} stamps · free pastry at 8`,
              },
              {
                label: "Business app",
                icon: ScanLine,
                title: `${sharedScenario.business} · ${sharedScenario.branch}`,
                value: `${sharedScenario.purchase.display} visit · ${sharedScenario.loyaltyEvent.effect} · ${sharedScenario.staff}`,
              },
              {
                label: "Admin app",
                icon: ShieldCheck,
                title: sharedScenario.loyaltyEvent.type,
                value: `${sharedScenario.loyaltyEvent.status} · ${sharedScenario.delivery.requestId}`,
              },
            ].map((view) => {
              const Icon = view.icon;
              return (
                <article key={view.label} className="bg-[var(--surface)] p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-2xl bg-[var(--surface-2)]">
                      <Icon size={18} />
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--accent-strong)]">
                      {view.label}
                    </span>
                  </div>
                  <h3 className="mt-7 text-sm font-extrabold">{view.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {view.value}
                  </p>
                </article>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
            This is coordinated frontend demo data, not live cross-app persistence. The planned FastAPI service and worker will make the same contract operational.
          </p>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <SiteEyebrow>The pitch path</SiteEyebrow>
              <h2 className="mt-4 max-w-[10ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                A complete loyalty loop in four stops.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)] lg:justify-self-end">
              Each demo opens at the strongest screen for that role. Return to this
              guided page when you want to move to the next audience without losing
              the story.
            </p>
          </div>

          <ol className="mt-12 border-y border-[var(--line)]">
            {journey.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.number}
                  className={`grid gap-6 py-8 lg:grid-cols-[80px_0.75fr_1.05fr_0.8fr] lg:items-center ${
                    index > 0 ? "border-t border-[var(--line)]" : ""
                  }`}
                >
                  <span className="font-mono text-xs font-extrabold text-[var(--accent-strong)]">
                    {step.number}
                  </span>
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
                      <Icon size={19} />
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                        {step.role}
                      </p>
                      <h3 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
                      {step.detail}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {step.stops.map((stop) => (
                        <span
                          key={stop}
                          className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[9px] font-bold text-[var(--muted-strong)]"
                        >
                          {stop}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={step.href}
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--ink)] px-5 text-sm font-extrabold transition hover:bg-[var(--ink)] hover:text-[var(--paper)] lg:justify-self-end"
                  >
                    {step.action} <ArrowRight size={15} />
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SiteEyebrow inverse>Seven-minute walkthrough</SiteEyebrow>
            <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              Show the value before the feature list.
            </h2>
            <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-white/65">
              The strongest pitch starts with a customer action, proves the counter is
              workable, then reveals retention economics and platform control.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/12 sm:grid-cols-2">
            {[
              {
                time: "0:00–1:30",
                icon: Compass,
                title: "Customer value",
                detail: "Discover, join, wallet progress, notifications, and privacy controls.",
              },
              {
                time: "1:30–3:00",
                icon: QrCode,
                title: "Counter confidence",
                detail: "One QR, clear confirmation, safe redemption, and offline readiness.",
              },
              {
                time: "3:00–5:30",
                icon: BarChart3,
                title: "Merchant growth",
                detail: "Programs, lifecycle audiences, channel cost, profit preview, and integrations.",
              },
              {
                time: "5:30–7:00",
                icon: CircleDollarSign,
                title: "Platform case",
                detail: "Tenant health, delivery recovery, audit evidence, pricing, and contribution margin.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.time} className="bg-[var(--ink)] p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <Icon size={19} className="text-[var(--accent)]" />
                    <span className="font-mono text-[9px] font-bold text-white/55">
                      {item.time}
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/58">
                    {item.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-9">
            <SiteEyebrow>What is real today</SiteEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.02em]">
              Product decisions are already testable.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Navigation", "Every role and major workflow can be explored."],
                ["Authentication", "Login, recovery, verification, account creation, workspace choice, and logout work locally."],
                ["Interaction", "Forms, filters, toggles, sheets, and state changes work locally."],
                ["Responsive UX", "Desktop workspaces and the mobile-first PWA adapt deliberately."],
                ["Commercial model", "Plans, channel costs, limits, and margin assumptions are visible."],
              ].map(([title, detail]) => (
                <div key={title} className="border-t border-[var(--line)] pt-4">
                  <p className="text-sm font-extrabold">{title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[18px] bg-[var(--accent)] p-7 sm:p-9">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[var(--ink)]">
              What comes next
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.02em]">
              The backend makes the same flows operational.
            </h2>
            <div className="mt-8 space-y-4">
              {[
                [Webhook, "FastAPI contract", "Tenant-scoped customers, transactions, rewards, and redemptions."],
                [ShieldCheck, "Immutable ledger", "Auditable earn, redeem, refund, void, and adjustment entries."],
                [Megaphone, "Background worker", "Messaging, retries, exports, reconciliation, and scheduled journeys."],
              ].map(([icon, title, detail]) => {
                const Icon = icon as typeof Webhook;
                return (
                  <div key={String(title)} className="flex gap-3 border-t border-[rgb(24_18_12/16%)] pt-4">
                    <Icon size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-extrabold">{String(title)}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink)]/85">
                        {String(detail)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Ready to walk through the whole product?"
        description="Use the guided path yourself, then bring us the questions your team or investors care about most."
      />
    </main>
  );
}
