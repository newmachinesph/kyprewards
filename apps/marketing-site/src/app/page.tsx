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
  SiteButton,
  SiteEyebrow,
  TextLink,
} from "@/components/MarketingUi";
import { LoyaltyLoop } from "@/components/LoyaltyLoop";
import { ProductPreview } from "@/components/ProductPreview";
import { VirtualCard } from "@/components/VirtualCard";
import { industries, resources } from "@/lib/content";
import { paymentMethodsText } from "@kypstamping/ui/plans";

export const metadata: Metadata = {
  // `absolute` so the root layout's "%s | KYP Rewards" template does not
  // append the brand a second time — it is already the first word here.
  title: {
    absolute:
      "KYP Rewards — Free Digital Stamp Cards for Philippine Shops",
  },
  description:
    "Free digital stamp cards for Philippine cafés, salons, restaurants and shops. Unlimited customers, nothing to install, no POS to replace. From ₱0.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "KYP Rewards — Loyalty, made local",
    description:
      "Turn one visit into the next. A loyalty program your customers understand, your staff can run in seconds, and you can actually learn from. Free to start, unlimited customers.",
    url: "/",
    siteName: "KYP Rewards",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KYP Rewards — Loyalty, made local",
    description:
      "Free digital stamp cards for Philippine shops. Unlimited customers, nothing to install, no POS to replace.",
  },
};

/** A centred section head: pill, heading, optional lede. */
function SectionHead({
  eyebrow,
  title,
  lede,
  inverse = false,
  titleWidth = "20ch",
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  inverse?: boolean;
  titleWidth?: string;
}) {
  return (
    <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
      <SiteEyebrow inverse={inverse}>{eyebrow}</SiteEyebrow>
      <h2
        className="mt-5 text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl"
        style={{ maxWidth: titleWidth }}
      >
        {title}
      </h2>
      {lede && (
        <p
          className={`mt-5 max-w-[60ch] text-base leading-relaxed sm:text-lg ${inverse ? "text-white/70" : "text-[var(--muted-strong)]"}`}
        >
          {lede}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* Hero: the promise, then the loop it describes. */}
      <section className="site-canvas pad-seam relative">
        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center pt-14 text-center lg:pt-20">
            <SiteEyebrow>Built for the businesses people remember</SiteEyebrow>
            <h1 className="mt-7 max-w-[13ch] text-6xl font-extrabold leading-[0.92] tracking-[-0.035em] sm:text-7xl lg:text-[96px]">
              Turn one visit into the{" "}
              <span className="text-[var(--accent-strong)]">next.</span>
            </h1>
            <p className="mt-7 max-w-[56ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
              A digital stamp card that lives on your customer&apos;s phone. A
              welcome stamp waits for anyone who joins from your poster, staff
              confirm visits in about three seconds, and you finally know who
              comes back.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <SiteButton href="/partners" tone="dark">
                Apply to join
              </SiteButton>
              <SiteButton href="/product" tone="outline">
                See how it works
              </SiteButton>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-xs font-semibold text-[var(--muted-strong)]">
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
            <div className="mt-12 w-full lg:mt-6">
              <LoyaltyLoop />
            </div>
          </div>
        </div>
      </section>

      {/* The loop, in three panels. */}
      <section className="seam-top-band px-4 pt-24 pb-28 sm:px-6 lg:px-8 lg:pt-32 lg:pb-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHead
            eyebrow="One customer loop"
            title="Simple at the counter. Useful everywhere else."
            lede="A stranger scans your poster and a welcome stamp is waiting for them. On their first visit your staff make it real. Every visit after is one scan of their own code — and nobody stamps themselves."
          />

          <div className="mt-14 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="panel shadow-soft relative min-h-[520px] overflow-hidden bg-[var(--ink)] text-[var(--paper)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/photo-cafe-counter.webp"
                alt=""
                aria-hidden="true"
                width={1600}
                height={1067}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover object-[60%_center]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgb(24_18_12/78%)_0%,rgb(24_18_12/18%)_45%,rgb(24_18_12/72%)_100%)]"
              />
              <div className="relative flex h-full min-h-[520px] flex-col justify-between p-7 sm:p-10">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/12 text-[var(--accent)] backdrop-blur">
                  <ScanLine />
                </span>
                <div className="max-w-lg">
                  <SiteEyebrow inverse>At the counter</SiteEyebrow>
                  <h3 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
                    A stamp takes seconds.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white sm:text-base">
                    Scan the customer&apos;s own code, confirm the visit, move on.
                    No plastic, no form at the till, no checkout slowdown — and a
                    cooldown you set means a card cannot be filled in an
                    afternoon.
                  </p>
                </div>
              </div>
            </article>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <article className="panel shadow-soft border border-[var(--line)] bg-[var(--surface)] p-7">
                <span className="grid size-11 place-items-center rounded-2xl bg-[rgb(232_163_61/14%)] text-[var(--accent-strong)]">
                  <BellRing />
                </span>
                <h3 className="mt-10 text-2xl font-extrabold tracking-[-0.02em]">
                  Customers see progress.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                  The card is on their phone, in your colors, with the reward
                  spelled out. A full card holds its reward until they approve
                  it at the counter.
                </p>
              </article>
              <article className="panel shadow-soft bg-[var(--accent)] p-7">
                <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface)]">
                  <ChartNoAxesCombined />
                </span>
                <h3 className="mt-10 text-2xl font-extrabold tracking-[-0.02em]">
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

      {/* The owner's side. */}
      <section className="seam-top bg-[var(--paper)] px-4 pt-20 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="panel shadow-lift mx-auto max-w-[1400px] overflow-hidden bg-[var(--ink)] px-6 py-12 text-[var(--paper)] sm:px-10 lg:px-16 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <SiteEyebrow inverse>
                Everything in one calm workspace
              </SiteEyebrow>
              <h2 className="mt-5 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
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
                      className="flex items-center gap-3 text-sm font-semibold text-white/85"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/8 text-[var(--accent)]">
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

      {/* Industries. */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionHead
            eyebrow="Made to fit the visit"
            title="Different businesses. Same human habit."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry, index) => (
              <Link
                key={industry.slug}
                href={`/solutions/${industry.slug}`}
                className="panel shadow-soft focus-ring group flex flex-col border border-[var(--line)] bg-[var(--surface)] p-7 transition duration-200 hover:-translate-y-1 hover:border-[var(--line-strong)]"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-full bg-[var(--band-deep)] font-mono text-xs font-bold text-[var(--accent-strong)]">
                    0{index + 1}
                  </span>
                  <span className="grid size-10 place-items-center rounded-full border border-[var(--line)] transition group-hover:bg-[var(--ink)] group-hover:text-[var(--paper)]">
                    <ArrowRight size={16} />
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
                  {industry.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  {industry.description}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <TextLink href="/solutions">Explore every solution</TextLink>
          </div>
        </div>
      </section>

      <VirtualCard />

      {/* Built here. */}
      <section className="seam-top-band px-4 pt-24 pb-28 sm:px-6 lg:px-8 lg:pt-32 lg:pb-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionHead
            eyebrow="Built for the Philippines"
            title="Not translated for the market. Built in it."
            lede="Every global loyalty tool bills in dollars, emails in English and assumes a card reader. This one is priced in pesos, paid by GCash, reads on a ₱5,000 Android with patchy data, and calls a regular what you already call them."
            titleWidth="22ch"
          />
          <div className="panel shadow-lift mt-12 grid gap-px overflow-hidden border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Wallet,
                title: "Pesos, paid by GCash or Maya",
                text: `Priced, billed and settled in pesos — ${paymentMethodsText}. The free plan starts below every paid tool with published peso pricing, and Core at ₱499 stays within a hundred pesos of the cheapest of them.`,
              },
              {
                icon: Crown,
                title: "Suki is the model",
                text: "Tiers a customer climbs, named the way you would say them. The win-back message we would send first is “one more visit keeps your suki status” — because it is true.",
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
                  className={`p-7 sm:p-8 ${index === 1 ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--ink)] text-[var(--paper)]"}`}
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
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <SiteButton href="/features" tone="dark">
              See every feature
            </SiteButton>
            <SiteButton href="/roadmap" tone="outline">
              See the roadmap
            </SiteButton>
          </div>
        </div>
      </section>

      {/* Field notes. */}
      <section className="seam-top bg-[var(--paper)] px-4 pt-20 pb-6 sm:px-6 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <SiteEyebrow>Field notes</SiteEyebrow>
              <h2 className="mt-5 text-4xl font-extrabold tracking-[-0.03em]">
                Build loyalty with intention.
              </h2>
              <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Practical guidance for rewards, campaigns, and customer trust.
              </p>
            </div>
            <div className="grid gap-3">
              {resources.map((resource) => (
                <Link
                  key={resource.slug}
                  href={`/resources/${resource.slug}`}
                  className="panel shadow-soft focus-ring group grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)] sm:grid-cols-[1fr_auto] sm:items-center"
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
