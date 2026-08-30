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
import { businessAppUrl } from "@/lib/site";
import { channelRates } from "@/lib/plans";

export const metadata: Metadata = {
  title: "POS, API and Webhook Integrations",
  description:
    "Start KYPStamping beside any POS, then connect sales through a versioned API, signed webhooks, file imports, or scheduled pulls.",
  alternates: { canonical: "/integrations" },
};

const questions = [
  {
    question: "Do we need to replace our POS?",
    answer:
      "No. Businesses can begin with the KYPStamping sidecar counter flow, then add a direct API or webhook connection when it creates enough operational value.",
  },
  {
    question: "Which POS systems are supported?",
    answer:
      "KYPStamping does not maintain per-vendor integrations. Any register that can post sale webhooks, expose a read API, or export sale files connects through one shared event contract, so support does not depend on a vendor partnership.",
  },
  {
    question: "How are duplicate sales prevented?",
    answer:
      "The planned FastAPI contract requires idempotency keys for transaction and redemption commands, stable event IDs for webhooks, and duplicate-safe worker processing.",
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
        eyebrow="POS-agnostic by design"
        title="Keep loyalty portable when checkout tools change."
        description="Start beside the register without replacing it. Move to a direct API, signed webhooks, or an approved POS adapter when the business is ready. The loyalty ledger and customer experience stay the same."
      >
        <SiteButton href={`${businessAppUrl}/login`}>
          Explore integration setup
        </SiteButton>
        <SiteButton href="/contact" tone="outline">
          Discuss your POS
        </SiteButton>
      </PageHero>

      <section className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <SiteEyebrow>Choose the lightest path</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Integrate at your own pace.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)] lg:justify-self-end">
              The product does not force a small merchant into an enterprise
              integration project. Each path reaches the same customer, program,
              redemption, and ledger model.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
            {[
              {
                icon: SquareTerminal,
                eyebrow: "Ready first",
                title: "KYPStamping sidecar terminal",
                detail: "Run QR earning and redemption beside any checkout from a phone, tablet, or browser.",
                status: "No POS change",
              },
              {
                icon: Code2,
                eyebrow: "Developer path",
                title: "Versioned REST API",
                detail: "Send customers, sales, refunds, voids, rewards, and redemption commands through /api/v1.",
                status: "Sandbox planned",
              },
              {
                icon: Webhook,
                eyebrow: "Event path",
                title: "Signed webhooks",
                detail: "Receive register events and deliver loyalty changes with traceable retry and replay behavior.",
                status: "Reliable delivery",
              },
              {
                icon: Store,
                eyebrow: "Partner path",
                title: "Isolated POS adapters",
                detail: "Map provider-specific formats at the boundary so reward logic never depends on one vendor.",
                status: "Approval dependent",
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
                Five ways to reach a customer, each priced honestly.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              Messaging runs on named providers, not a black box. Every plan
              includes a monthly allowance per channel; past it you pay the
              add-on rate. Consent, quiet hours, and frequency caps apply on
              every channel including the free ones.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
            {channelRates.map((rate) => (
              <article
                key={rate.channel}
                className="flex flex-col bg-[var(--surface)] p-7"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                  {rate.provider}
                </p>
                <h3 className="mt-3 text-xl font-extrabold tracking-[-0.02em]">
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
            <SiteEyebrow>A contract built for recovery</SiteEyebrow>
            <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              Safe when networks and providers are not.
            </h2>
            <p className="mt-5 max-w-[50ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              A loyalty balance is a promise. The integration layer must explain every
              change, reject accidental duplicates, and recover without asking staff to guess.
            </p>
            <div className="mt-8">
              <CheckList
                items={[
                  "Tenant, merchant, branch, and terminal scopes",
                  "One-time secrets with rotation and revocation",
                  "Idempotency for sales and redemption commands",
                  "Reserve, commit, and cancel redemption states",
                  "Immutable adjustments, refunds, and reversals (planned)",
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
              <code>{`POST /api/v1/transactions
Authorization: Bearer sk_test_••••••••
Idempotency-Key: sale_sc_10482
X-Merchant-ID: mrc_sweet_crumbs

{
  "external_transaction_id": "SC-10482",
  "customer_phone": "+639171234567",
  "branch_id": "br_legazpi",
  "amount": 48500,
  "currency": "PHP"
}`}</code>
            </pre>
            <div className="grid gap-px border-t border-white/12 bg-white/12 sm:grid-cols-2">
              {[
                [KeyRound, "Scoped credentials", "Keys can be limited by branch and action."],
                [BadgeCheck, "Signed events", "Planned: timestamped HMAC to block replay outside the allowed window."],
                [RefreshCcw, "Duplicate-safe", "The same idempotency key returns the original result."],
                [Clock3, "Retry evidence", "Every attempt keeps status, latency, and request context."],
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
            <SiteEyebrow>Planned operational guarantees</SiteEyebrow>
            <h2 className="mt-4 max-w-[13ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              The fallback is part of the product.
            </h2>
          </div>
          <div className="mt-12 border-y border-[var(--line)]">
            {[
              {
                icon: WifiOff,
                title: "The internet drops",
                detail: "The sidecar stores a signed local queue, shows pending status, then reconciles safely when connectivity returns.",
              },
              {
                icon: RefreshCcw,
                title: "A webhook endpoint fails",
                detail: "The worker retries with backoff, records each attempt, and exposes a manual replay after the destination recovers.",
              },
              {
                icon: ShieldCheck,
                title: "A credential may be exposed",
                detail: "An owner rotates or revokes the scoped key while unaffected terminals continue using their own credentials.",
              },
              {
                icon: Check,
                title: "A sale is refunded",
                detail: "The ledger appends a reversal tied to the original sale instead of silently rewriting the customer balance.",
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
            <SiteEyebrow>Clear claims</SiteEyebrow>
            <h2 className="mt-4 max-w-[10ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
              Preview the setup. Connect any register.
            </h2>
            <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              The demo shows how a register connection will be configured. It does not
              represent a live connection before the shared API and worker are built.
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
        title="Start beside the POS. Integrate when it pays."
        description="Explore the complete credential and webhook setup in the business demo, or tell us which checkout tools your merchants already use."
      />
    </main>
  );
}
