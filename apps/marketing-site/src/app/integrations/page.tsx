import type { Metadata } from "next";
import {
  BadgeCheck,
  Check,
  Clock3,
  Code2,
  KeyRound,
  PlugZap,
  RefreshCcw,
  ShieldCheck,
  SquareTerminal,
  Store,
  Webhook,
  WifiOff,
} from "lucide-react";
import {
  CheckList,
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb } from "@/lib/schema";
import { channelRates } from "@kyprewards/ui/plans";

export const metadata: Metadata = {
  title: "POS Integration, API and Webhooks",
  description:
    "Keep the register you own. Start next to any POS, then connect sales through a REST API, signed webhooks or a POS adapter when it earns its place.",
  alternates: { canonical: "/integrations" },
  openGraph: {
    title: "Works next to any POS: KYP Rewards integrations",
    description:
      "No POS replacement, no per-vendor lock-in. One shared event contract for any register.",
    url: "/integrations",
    locale: "en_PH",
    type: "article",
  },
};

const questions = [
  {
    question: "Do we need to replace our POS?",
    answer:
      "No. Start with the counter flow that runs next to your register, and add a direct connection only when it's worth the effort. That connection is either an API your register calls or a webhook, which is your register telling us about each sale as it happens.",
  },
  {
    question: "Which POS systems are supported?",
    answer:
      "Any register that can post sale webhooks, expose a read API or export sale files can connect, through one shared event contract. KYP Rewards doesn't maintain a separate integration per vendor, so support doesn't depend on a vendor partnership.",
  },
  {
    question: "How are duplicate sales prevented?",
    answer:
      "Every sale and redemption carries an idempotency key, a unique tag for that one event, so if the same sale is sent twice by accident we recognize it and return the first result instead of a second stamp. Every webhook carries a stable event ID for the same reason.",
  },
];

export default function IntegrationsPage() {
  return (
    <main>
      <StructuredData data={breadcrumb([{ name: "Integrations", path: "/integrations" }])} />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: questions.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
      <PageHero
        image="/images/hero-integrations.webp"
        eyebrow="Works with any POS"
        title="Keep your loyalty program when you change registers."
        description="Start next to the register without replacing it. When you're ready, move to a direct API, signed webhooks or an approved POS adapter, which all come with the Grow plan. The loyalty ledger and what customers see stay the same."
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/contact" tone="outline">
          Discuss your POS
        </SiteButton>
      </PageHero>

      <section className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <SiteEyebrow>Pick the lightest option</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Integrate at your own pace.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)] lg:justify-self-end">
              KYP Rewards won’t push a small shop into an enterprise integration
              project. Every path below feeds the same customers, programs,
              redemptions and ledger.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
            {[
              {
                icon: SquareTerminal,
                eyebrow: "Ready first",
                title: "Counter flow next to your register",
                detail: "Run QR earning and redemption next to any checkout, from a phone, tablet or browser.",
                status: "No POS change",
              },
              {
                icon: Code2,
                eyebrow: "Developer path",
                title: "Versioned REST API",
                detail: "Send customers, sales, refunds, voids, rewards and redemption commands through /api/v1.",
                status: "Grow · sandbox planned",
              },
              {
                icon: Webhook,
                eyebrow: "Event path",
                title: "Signed webhooks",
                detail: "Take in register events and send out loyalty changes, with retries and replays you can trace.",
                status: "Grow · signing planned",
              },
              {
                icon: Store,
                eyebrow: "Partner path",
                title: "Isolated POS adapters",
                detail: "Each vendor's format gets translated at the edge, so your reward rules never depend on one vendor.",
                status: "Grow · by approval",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`bg-[var(--surface)] p-7 sm:p-9 ${index === 1 ? "md:bg-[var(--accent)]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-[var(--paper)]">
                      <Icon size={20} />
                    </span>
                    <span className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em]">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-9 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-extrabold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[50ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                    {item.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <div>
              <SiteEyebrow>Delivery channels</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.02em] sm:text-5xl">
                Five ways to reach a customer, each priced in the open.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              The in-app inbox and push come with every plan. Campaign email
              has an allowance on the paid tiers, and SMS is bought as credits
              on any tier. Whatever the channel, you see what a send will cost
              before it goes. Consent, quiet hours and frequency caps apply
              everywhere, even on the channels that cost nothing.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
            {channelRates.map((rate) => (
              <article
                key={rate.channel}
                className="flex flex-col bg-[var(--surface)] p-7"
              >
                <h3 className="text-xl font-extrabold tracking-[-0.02em]">
                  {rate.channel}
                </h3>
                <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                  {rate.detail}
                </p>
                <dl className="mt-auto grid grid-cols-2 gap-4 pt-7 text-sm">
                  <div>
                    <dt className="text-xs text-[var(--muted)]">Included</dt>
                    <dd className="mt-1 font-bold">{rate.included}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--muted)]">Add-on rate</dt>
                    <dd className="mt-1 font-bold text-[var(--accent-strong)]">
                      {rate.overage}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
            {/* Fills the trailing grid cell so the gap-px rule does not show through. */}
            <div className="hidden bg-[var(--surface)] md:block" aria-hidden="true" />
          </div>
          <div className="mt-10">
            <SiteButton href="/pricing#compare" tone="outline">
              See allowances by plan
            </SiteButton>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SiteEyebrow>Built to recover</SiteEyebrow>
            <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              Safe when networks and providers aren’t.
            </h2>
            <p className="mt-5 max-w-[50ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              A loyalty balance is a promise, so the integration layer has to explain
              every change, turn away accidental duplicates and recover without making staff guess.
            </p>
            <div className="mt-8">
              <CheckList
                items={[
                  "Credentials scoped to the whole account, one merchant, one branch or one terminal",
                  "One-time secrets with rotation and revocation",
                  "Duplicate-safe sales and redemptions, by idempotency key",
                  "Reserve, commit and cancel states for redemptions",
                  "Immutable adjustments, refunds and reversals (planned)",
                ]}
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--ink)] text-[var(--paper)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/12 p-6 sm:p-7">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">
                  Planned quickstart
                </p>
                <h3 className="mt-2 text-xl font-extrabold">Record a Philippine sale</h3>
              </div>
              <PlugZap size={20} className="text-[var(--accent)]" />
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-[11px] leading-relaxed text-white/68 sm:p-7">
              {/* Checked against the live endpoint. Every field here used to
                  be wrong: snake_case against a camelCase API, an
                  X-Merchant-ID header that does not exist (the key identifies
                  the merchant), a customer_phone and a currency the schema
                  has no room for, and a real merchant id from our own database. An
                  integrator who copied it got a 422 on every line. */}
              <code>{`POST /api/v1/transactions
Authorization: Bearer sk_live_••••••••
Idempotency-Key: sale_sc_10482

{
  "memberCode": "2966093052778",
  "branchId": "branch_legazpi",
  "amountCentavos": 48500,
  "items": 1,
  "externalReference": "SC-10482"
}`}</code>
            </pre>
            <div className="grid gap-px border-t border-white/12 bg-white/12 sm:grid-cols-2">
              {[
                [KeyRound, "Scoped credentials", "Keys can be limited by branch and action."],
                [BadgeCheck, "Signed events", "Planned: every event signed with a timestamp, so a copied event can't be replayed later."],
                [RefreshCcw, "Duplicate-safe", "The same idempotency key returns the original result."],
                [Clock3, "Retry evidence", "Every attempt records its status, latency and request context."],
              ].map(([icon, title, detail]) => {
                const Icon = icon as typeof KeyRound;
                return (
                  <div key={String(title)} className="bg-[var(--ink)] p-5">
                    <Icon size={17} className="text-[var(--accent)]" />
                    <p className="mt-5 text-sm font-extrabold">{String(title)}</p>
                    <p className="mt-2 text-xs leading-relaxed text-white/55">
                      {String(detail)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-3xl">
            <SiteEyebrow>What Grow guarantees</SiteEyebrow>
            <h2 className="mt-4 max-w-[13ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              The fallback is part of the product.
            </h2>
          </div>
          <div className="mt-12 border-y border-[var(--line)]">
            {[
              {
                icon: WifiOff,
                title: "The internet drops",
                detail: "The counter app keeps a signed queue on the device, shows what's pending, and syncs it safely when the connection comes back.",
              },
              {
                icon: RefreshCcw,
                title: "A webhook endpoint fails",
                detail: "We retry with backoff, record each attempt, and give you a manual replay once the destination is back up.",
              },
              {
                icon: ShieldCheck,
                title: "A credential may be exposed",
                detail: "The owner rotates or revokes that scoped key, and the other terminals keep working on their own credentials.",
              },
              {
                icon: Check,
                title: "A sale is refunded",
                detail: "The ledger adds a reversal linked to the original sale, instead of quietly rewriting the customer's balance.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`grid gap-4 py-6 sm:grid-cols-[52px_0.7fr_1.3fr] sm:items-center ${
                    index > 0 ? "border-t border-[var(--line)]" : ""
                  }`}
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface-2)]">
                    <Icon size={18} />
                  </span>
                  <h3 className="text-base font-extrabold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
                    {item.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <SiteEyebrow>Straight answers</SiteEyebrow>
            <h2 className="mt-4 max-w-[10ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
              Preview the setup. Connect any register.
            </h2>
            <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              The counter flow works today, on any register, with no integration
              at all. The API, webhooks and POS adapters arrive with the Grow
              plan, and most shops run a healthy program long before they need
              them.
            </p>
          </div>
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {questions.map((item) => (
              <article key={item.question} className="py-6">
                <h3 className="text-lg font-extrabold">{item.question}</h3>
                <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta
        title="Start next to the POS. Integrate when it pays."
        description="Start with the counter flow next to the register you own. Tell us which checkout you use, and we'll tell you straight whether connecting it is worth your time."
      />
    </main>
  );
}
