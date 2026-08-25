import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  Gift,
  HeartHandshake,
  Megaphone,
  QrCode,
  ScanLine,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";
import {
  MarketingCta,
  ProofStrip,
  ReceiptDemo,
  SiteButton,
  SiteEyebrow,
  TextLink,
} from "@/components/MarketingUi";
import { ProductPreview } from "@/components/ProductPreview";
import { industries, resources } from "@/lib/content";

export const metadata: Metadata = {
  title: "Loyalty, made local",
  description:
    "Turn everyday visits into lasting customer relationships with one clear loyalty program for customers, staff, and owners.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main>
      <section className="site-grid overflow-hidden border-b border-[var(--line)]">
        <div className="mx-auto grid min-h-[760px] max-w-[1400px] items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgb(255_253_248/72%)] px-3 py-2 text-[11px] font-bold text-[var(--muted-strong)] backdrop-blur">
              <span className="grid size-5 place-items-center rounded-full bg-[var(--accent)]">
                <Stamp size={11} />
              </span>
              Built for the businesses people remember
            </div>
            <h1 className="mt-8 max-w-[10.5ch] text-6xl font-black leading-[0.9] tracking-[-0.075em] sm:text-7xl lg:text-[92px]">
              Turn one visit into the next.
            </h1>
            <p className="mt-7 max-w-[56ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
              Stampr gives local businesses a loyalty program customers
              understand, staff can run in seconds, and owners can actually
              learn from.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SiteButton href="/contact" tone="dark">
                Start your loyalty program
              </SiteButton>
              <SiteButton href="/demo" tone="outline">
                Take the product tour
              </SiteButton>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-[var(--line)] pt-5 text-xs font-semibold text-[var(--muted-strong)]">
              <span className="flex items-center gap-2">
                <ShieldCheck
                  size={15}
                  className="text-[var(--accent-strong)]"
                />{" "}
                No POS replacement
              </span>
              <span className="flex items-center gap-2">
                <QrCode size={15} className="text-[var(--accent-strong)]" />{" "}
                Works on any phone
              </span>
              <span className="flex items-center gap-2">
                <HeartHandshake
                  size={15}
                  className="text-[var(--accent-strong)]"
                />{" "}
                Consent built in
              </span>
            </div>
          </div>
          <div className="relative min-h-[560px]">
            <div className="absolute -right-28 top-5 size-[480px] rounded-full border-[88px] border-[var(--accent)] opacity-85" />
            <div className="absolute bottom-2 left-0 right-0">
              <ReceiptDemo />
            </div>
          </div>
        </div>
      </section>

      <ProofStrip />

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <SiteEyebrow>One customer loop</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-black leading-[1] tracking-[-0.06em] sm:text-5xl">
                Simple at the counter. Useful everywhere else.
              </h2>
            </div>
            <p className="max-w-[56ch] self-end text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
              The customer shows one secure QR. Staff record the visit. Stampr
              turns that tiny moment into progress, recognition, and a timely
              reason to return.
            </p>
          </div>

          <div className="mt-16 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="relative overflow-hidden rounded-[30px] bg-[var(--ink)] p-7 text-[var(--paper)] sm:p-10">
              <div className="absolute right-0 top-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full border-[46px] border-[var(--accent)]" />
              <span className="relative grid size-12 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
                <ScanLine />
              </span>
              <div className="relative mt-28 max-w-lg">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                  At the counter
                </p>
                <h3 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                  A stamp takes seconds.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Scan the customer&apos;s personal code, confirm the visit, and
                  move on. No plastic cards, phone numbers, or checkout
                  slowdown.
                </p>
              </div>
            </article>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-7">
                <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(227_154_69/14%)] text-[var(--accent-strong)]">
                  <BellRing />
                </span>
                <h3 className="mt-12 text-2xl font-black tracking-[-0.04em]">
                  Customers see progress.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                  Every card, reward, and business relationship stays in one
                  private mobile wallet.
                </p>
              </article>
              <article className="rounded-[30px] bg-[var(--accent)] p-7">
                <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface)]">
                  <ChartNoAxesCombined />
                </span>
                <h3 className="mt-12 text-2xl font-black tracking-[-0.04em]">
                  Owners learn what returns.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
                  See new, regular, inactive, and reward-ready customers without
                  turning your dashboard into a spreadsheet.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <SiteEyebrow inverse>
                Everything in one calm workspace
              </SiteEyebrow>
              <h2 className="mt-5 max-w-[10ch] text-4xl font-black leading-[1] tracking-[-0.06em] sm:text-5xl">
                Know your regulars without guessing.
              </h2>
              <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-white/70">
                See the whole loyalty cycle—from first scan to earned
                reward—then act on the moments that matter.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: Users,
                    text: "Understand customer segments as they change",
                  },
                  { icon: Gift, text: "Track reward progress and redemptions" },
                  {
                    icon: Megaphone,
                    text: "Send targeted, consent-aware campaigns",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.text}
                      className="flex items-center gap-3 text-sm font-semibold text-white/80"
                    >
                      <span className="grid size-9 place-items-center rounded-xl bg-white/8 text-[var(--accent)]">
                        <Icon size={16} />
                      </span>
                      {item.text}
                    </div>
                  );
                })}
              </div>
              <div className="mt-9">
                <SiteButton href="/demo" tone="accent">
                  Tour all four apps
                </SiteButton>
              </div>
            </div>
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SiteEyebrow>Made to fit the visit</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-black leading-[1] tracking-[-0.055em] sm:text-5xl">
                Different businesses. Same human habit.
              </h2>
            </div>
            <TextLink href="/solutions">Explore every solution</TextLink>
          </div>
          <div className="mt-14 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {industries.map((industry, index) => (
              <Link
                key={industry.slug}
                href={`/solutions/${industry.slug}`}
                className="group grid gap-5 py-7 transition hover:px-3 sm:grid-cols-[52px_1fr_auto] sm:items-center"
              >
                <span className="font-mono text-xs font-bold text-[var(--muted)]">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-black tracking-[-0.04em] sm:text-2xl">
                    {industry.name}
                  </h3>
                  <p className="mt-1 max-w-[64ch] text-sm text-[var(--muted-strong)]">
                    {industry.description}
                  </p>
                </div>
                <span className="grid size-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] transition group-hover:translate-x-1 group-hover:bg-[var(--ink)] group-hover:text-[var(--paper)]">
                  <ArrowRight size={17} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <SiteEyebrow>Field notes</SiteEyebrow>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.055em]">
                Build loyalty with intention.
              </h2>
              <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Practical guidance for rewards, campaigns, and customer trust.
              </p>
            </div>
            <div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
              {resources.map((resource) => (
                <Link
                  key={resource.slug}
                  href={`/resources/${resource.slug}`}
                  className="group grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                      {resource.category}
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.035em]">
                      {resource.title}
                    </h3>
                    <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                      {resource.summary}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-full border border-[var(--line)] transition group-hover:bg-[var(--ink)] group-hover:text-[var(--paper)]">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingCta />
    </main>
  );
}
