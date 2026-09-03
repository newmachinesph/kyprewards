import type { Metadata } from "next";
import {
  Building2,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import {
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb, organizationId } from "@/lib/schema";

export const metadata: Metadata = {
  title: "About KYP Stamping",
  description:
    "Why we are building a loyalty platform for Philippine shops, what guides it, and exactly where we are today: open beta, free, onboarding by application.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About KYP Stamping — local loyalty, built in Manila",
    description:
      "Why this exists, what guides it, and exactly where we are today.",
    url: "/about",
    locale: "en_PH",
    type: "article",
  },
};

export default function AboutPage() {
  return (
    <main>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About KYP Stamping",
            description:
              "Why KYP Stamping exists and how it approaches local loyalty in the Philippines.",
            inLanguage: "en-PH",
            mainEntity: { "@id": organizationId },
          },
          breadcrumb([{ name: "About", path: "/about" }]),
        ]}
      />
      <PageHero
        image="/images/hero-about.webp"
        eyebrow="Why KYP Stamping exists"
        title="Local loyalty deserves better than another discount engine."
        description="Independent businesses already create real relationships. KYP Stamping gives those relationships a simple digital memory without making them feel transactional."
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/product" tone="outline">
          See how it works
        </SiteButton>
      </PageHero>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <SiteEyebrow>Our point of view</SiteEyebrow>
            <h2 className="mt-4 max-w-[11ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
              The best loyalty already feels personal.
            </h2>
          </div>
          <div className="space-y-8 text-lg leading-8 text-[var(--muted-strong)]">
            <p>
              A regular does not return because a database calls them active.
              They return because the coffee is right, the service feels
              familiar, and someone remembers what they like.
            </p>
            <p>
              Technology should protect that feeling, not crowd it out. That is
              why KYP Stamping begins with one fast QR moment and keeps the rest
              quiet: visible progress for the customer, useful context for
              staff, and clear decisions for the owner.
            </p>
            <p>
              We are building for the shop on the corner, the studio upstairs,
              the restaurant worth crossing town for, and every team that earns
              its repeat business one visit at a time.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SiteEyebrow inverse>What guides the product</SiteEyebrow>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-white/10 sm:grid-cols-2">
            {[
              {
                icon: Store,
                title: "Local first",
                text: "A feature earns its place when it helps a real owner, staff member, or returning customer.",
              },
              {
                icon: HeartHandshake,
                title: "Useful over loud",
                text: "Good loyalty feels like recognition. Campaign volume is never the measure of success.",
              },
              {
                icon: ShieldCheck,
                title: "Trust is product work",
                text: "Consent, clear roles, and minimal data sharing belong in the workflow — not a policy footer.",
              },
              {
                icon: Users,
                title: "Simple enough for the rush",
                text: "If a counter action needs a manual, the interaction is not finished.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`p-7 sm:p-9 ${index === 1 ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--ink)]"}`}
                >
                  <Icon
                    size={23}
                    className={index === 1 ? "" : "text-[var(--accent)]"}
                  />
                  <h3 className="mt-16 text-2xl font-extrabold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p
                    className={`mt-3 max-w-[46ch] text-sm leading-relaxed ${index === 1 ? "text-[var(--ink)]" : "text-white/70"}`}
                  >
                    {item.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.62fr_1.38fr]">
          <div>
            <SiteEyebrow>Starting from Southeast Asia</SiteEyebrow>
            <h2 className="mt-4 text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
              Designed near the counter.
            </h2>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-10">
            <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <span className="grid size-12 place-items-center rounded-2xl bg-[rgb(232_163_61/16%)] text-[var(--accent-strong)]">
                  <MapPin />
                </span>
                <h3 className="mt-8 max-w-[18ch] text-3xl font-extrabold tracking-[-0.02em]">
                  Built in Manila, shaped by neighborhood businesses across
                  the Philippines.
                </h3>
              </div>
              <Building2
                size={84}
                strokeWidth={0.8}
                className="text-[var(--line-strong)]"
              />
            </div>
            <div className="mt-10 border-t border-[var(--line)] pt-7">
              <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                We are beginning with the businesses where loyalty is already
                visible: cafés, bakeries, salons, wellness studios, restaurants,
                and independent retail. The platform will grow by staying close
                to how those teams actually work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <SiteEyebrow>Where we are today</SiteEyebrow>
              <h2 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em]">
                Early, and saying so.
              </h2>
              <p className="mt-5 max-w-[40ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                You are going to ask, so here it is before you have to.
              </p>
            </div>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {[
                {
                  q: "Is it built?",
                  a: "Yes. The counter flow, the customer wallet, campaigns, analytics and the privacy controls all run end to end. This is not a landing page in front of a waitlist.",
                },
                {
                  q: "Do you have customers?",
                  a: "Not yet. We are in open beta and onboarding founding merchants by application, which is why there are no logos or testimonials on this site. When we have a shop worth writing about, we will write about that shop — not a stock photo.",
                },
                {
                  q: "What does it cost during beta?",
                  a: "Nothing. Everyone is on the free Launch plan: no card, no trial clock, unlimited customers and unlimited branches. The paid tiers are published so you can see where this goes, and they open after beta.",
                },
                {
                  q: "Who runs it?",
                  a: "A small team in Manila. We read every application ourselves and set up your first program with you, which is the honest advantage of being this early — you will not be talking to a queue.",
                },
                {
                  q: "Where is the roadmap?",
                  a: "At /roadmap, generated from the same data as the pricing table so it cannot drift: what runs today on the free plan, what opens with each paid tier, and what waits until a merchant asks. No dates — a date we miss costs you trust.",
                },
                {
                  q: "What happens to my customer list?",
                  a: "It stays yours. Export it on any plan, including the free one, on any day, for any reason. There is no version of this where your member list is what keeps you subscribed.",
                },
              ].map((item) => (
                <article key={item.q} className="py-6">
                  <h3 className="text-lg font-extrabold tracking-[-0.01em]">
                    {item.q}
                  </h3>
                  <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                    {item.a}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Help shape a better loyalty tool."
        description="If you run a local business, we want to understand the moments your current tools miss. Founding merchants get a say in what gets built next."
      />
    </main>
  );
}
