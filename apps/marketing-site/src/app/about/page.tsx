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

export const metadata: Metadata = {
  title: "About",
  description:
    "KYPStamping exists to help independent businesses build the kind of customer relationships large brands try to manufacture.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="Why KYPStamping exists"
        title="Local loyalty deserves better than another discount engine."
        description="Independent businesses already create real relationships. KYPStamping gives those relationships a simple digital memory without making them feel transactional."
      >
        <SiteButton href="/contact">Build with us</SiteButton>
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
              why KYPStamping begins with one fast QR moment and keeps the rest
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
          <div className="mt-12 grid gap-px overflow-hidden rounded-[18px] border border-white/10 bg-white/10 sm:grid-cols-2">
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
                text: "Consent, clear roles, and minimal data sharing belong in the workflow—not a policy footer.",
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
          <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-10">
            <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <span className="grid size-12 place-items-center rounded-2xl bg-[rgb(242_161_45/16%)] text-[var(--accent-strong)]">
                  <MapPin />
                </span>
                <h3 className="mt-8 max-w-[18ch] text-3xl font-extrabold tracking-[-0.02em]">
                  Built in Singapore, shaped by neighborhood businesses across
                  the region.
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

      <MarketingCta
        title="Help shape a better loyalty tool."
        description="If you run a local business, we want to understand the moments your current tools miss."
      />
    </main>
  );
}
