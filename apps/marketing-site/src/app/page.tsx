import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  Crown,
  Fingerprint,
  Gift,
  HeartHandshake,
  Languages,
  Megaphone,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import {
  MarketingCta,
  ReceiptDemo,
  SiteButton,
  SiteEyebrow,
  TextLink,
} from "@/components/MarketingUi";
import { ProductPreview } from "@/components/ProductPreview";
import { VirtualCard } from "@/components/VirtualCard";
import { industries, resources } from "@/lib/content";

export const metadata: Metadata = {
  // `absolute` so the root layout's "%s | KYP Stamping" template does not
  // append the brand a second time — it is already the first word here.
  title: {
    absolute:
      "KYP Stamping — Free Digital Stamp Cards for Philippine Shops",
  },
  description:
    "Free digital stamp cards for Philippine cafés, salons, restaurants and shops. Unlimited customers, nothing to install, no POS to replace. From ₱0.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "KYP Stamping — Loyalty, made local",
    description:
      "Turn one visit into the next. A loyalty program your customers understand, your staff can run in seconds, and you can actually learn from. Free to start, unlimited customers.",
    url: "/",
    siteName: "KYP Stamping",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KYP Stamping — Loyalty, made local",
    description:
      "Free digital stamp cards for Philippine shops. Unlimited customers, nothing to install, no POS to replace.",
  },
};

export default function HomePage() {
  return (
    <main>
      <section className="site-grid relative overflow-hidden border-b border-[var(--line)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-bg.webp"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-[70%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,var(--paper)_8%,rgb(250_248_243/86%)_42%,rgb(250_248_243/34%)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,var(--paper))]"
        />
        {/* Gutter outside the 1400px box, like every section below. */}
        <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[760px] max-w-[1400px] items-center gap-14 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-[rgb(255_254_251/72%)] px-4 py-2 text-[11px] font-bold text-[var(--muted-strong)] backdrop-blur">
              Built for the businesses people remember
            </div>
            <h1 className="mt-8 max-w-[10.5ch] text-6xl font-extrabold leading-[0.9] tracking-[-0.03em] sm:text-7xl lg:text-[92px]">
              Turn one visit into the next.
            </h1>
            <p className="mt-7 max-w-[56ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
              A digital stamp card that lives on your customer&apos;s phone. A
              welcome stamp waits for anyone who joins from your poster, staff
              confirm visits in about three seconds, and you finally know who
              comes back.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SiteButton href="/partners" tone="dark">
                Apply to join
              </SiteButton>
              <SiteButton href="/product" tone="outline">
                See how it works
              </SiteButton>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-[var(--line)] pt-5 text-xs font-semibold text-[var(--muted-strong)]">
              <span className="flex items-center gap-2">
                <ShieldCheck
                  size={15}
                  className="text-[var(--accent-strong)]"
                />{" "}
                Free to start, unlimited customers
              </span>
              <span className="flex items-center gap-2">
                <QrCode size={15} className="text-[var(--accent-strong)]" />{" "}
                Keeps the register you already own
              </span>
              <span className="flex items-center gap-2">
                <HeartHandshake
                  size={15}
                  className="text-[var(--accent-strong)]"
                />{" "}
                Built for the Data Privacy Act
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
        </div>
      </section>


      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <SiteEyebrow>One customer loop</SiteEyebrow>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Simple at the counter. Useful everywhere else.
              </h2>
            </div>
            <p className="max-w-[56ch] self-end text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
              A stranger scans your poster and a welcome stamp is waiting for
              them. On their first visit your staff make it real. Every visit
              after is one scan of their own code — and nobody stamps
              themselves.
            </p>
          </div>

          <div className="mt-16 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--ink)] p-7 text-[var(--paper)] sm:p-10">
              <div className="absolute right-0 top-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full border-[46px] border-[var(--accent)]" />
              <span className="relative grid size-12 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
                <ScanLine />
              </span>
              <div className="relative mt-28 max-w-lg">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                  At the counter
                </p>
                <h3 className="mt-3 text-3xl font-extrabold tracking-[-0.02em]">
                  A stamp takes seconds.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Scan the customer&apos;s own code, confirm the visit, move on.
                  No plastic, no form at the till, no checkout slowdown — and a
                  cooldown you set means a card cannot be filled in an
                  afternoon.
                </p>
              </div>
            </article>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-7">
                <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(232_163_61/14%)] text-[var(--accent-strong)]">
                  <BellRing />
                </span>
                <h3 className="mt-12 text-2xl font-extrabold tracking-[-0.02em]">
                  Customers see progress.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                  The card is on their phone, in your colors, with the reward
                  spelled out. A full card holds its reward until they approve
                  it at the counter.
                </p>
              </article>
              <article className="rounded-[var(--radius-card)] bg-[var(--accent)] p-7">
                <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface)]">
                  <ChartNoAxesCombined />
                </span>
                <h3 className="mt-12 text-2xl font-extrabold tracking-[-0.02em]">
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
              <h2 className="mt-5 max-w-[10ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Know your regulars without guessing.
              </h2>
              <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-white/70">
                See the whole loyalty cycle — from first scan to earned
                reward — then act on the moments that matter.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: Users,
                    text: "See who is new, regular, lapsed and one visit from a reward",
                  },
                  {
                    icon: Gift,
                    text: "Run bonus windows, missions and suki tiers from one screen",
                  },
                  {
                    icon: Megaphone,
                    text: "Send the right message, with its cost shown first",
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
                <SiteButton href="/product#apps" tone="accent">
                  See who gets what
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
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
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
                  <h3 className="text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
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

      <VirtualCard />

      <section className="border-t border-[var(--line)] bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <SiteEyebrow inverse>Built for the Philippines</SiteEyebrow>
              <h2 className="mt-4 max-w-[13ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Not translated for the market. Built in it.
              </h2>
            </div>
            <p className="max-w-[56ch] text-base leading-relaxed text-white/70">
              Every global loyalty tool bills in dollars, emails in English and
              assumes a card reader. This one is priced in pesos, paid by GCash,
              reads on a ₱5,000 Android with patchy data, and calls a regular
              what you already call them.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Wallet,
                title: "Pesos, paid by GCash or Maya",
                text: "Priced, billed and settled in pesos — GCash, Maya, card or bank transfer. The free plan starts below every paid tool with published peso pricing, and Core at ₱499 stays within a hundred pesos of the cheapest of them.",
              },
              {
                icon: Crown,
                title: "Suki is the model",
                text: "Tiers a customer climbs, named the way you would say them. The win-back message we would send first is \u201cone more visit keeps your suki status\u201d — because it is true.",
              },
              {
                icon: Smartphone,
                title: "Viber and Facebook, not just email",
                text: "The join link lives in a Facebook page bio, and Viber and WhatsApp are being connected as campaign channels next — because that is where your customers actually read.",
              },
              {
                icon: Languages,
                title: "English or Filipino at the counter",
                text: "Owner and counter screens in Filipino as well as English — on the roadmap, done properly. The one thing between this and a carinderia.",
              },
              {
                icon: Fingerprint,
                title: "Built for the Data Privacy Act",
                text: "Every right RA 10173 gives a customer is a control in the product. Joining is not consent to marketing; NPC Circular 2023-04 says so and the product agrees.",
              },
              {
                icon: HeartHandshake,
                title: "Free, with unlimited customers, forever",
                text: "One stamp card, unlimited branches, unlimited members, a printable poster, every rule. You pay nothing until you choose to, and your list is always yours to export.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`p-7 ${index === 1 ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--ink)]"}`}
                >
                  <Icon
                    size={20}
                    className={index === 1 ? "" : "text-[var(--accent)]"}
                  />
                  <h3 className="mt-8 text-lg font-extrabold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p
                    className={`mt-3 text-sm leading-relaxed ${index === 1 ? "text-[var(--ink)]/80" : "text-white/65"}`}
                  >
                    {item.text}
                  </p>
                </article>
              );
            })}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <SiteButton href="/features" tone="accent">
              See every feature
            </SiteButton>
            <SiteButton href="/roadmap" tone="light">
              See the roadmap
            </SiteButton>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <SiteEyebrow>Field notes</SiteEyebrow>
              <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em]">
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
                    <h3 className="mt-2 text-xl font-extrabold tracking-[-0.02em]">
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
