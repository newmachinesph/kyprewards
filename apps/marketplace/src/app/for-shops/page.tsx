import type { Metadata } from "next";
import { BadgeCheck, Clock3, MapPin, QrCode, Store, Users } from "lucide-react";
import { merchantSiteUrl } from "@/lib/site";
import { ActionLink, Eyebrow, PageIntro, Section } from "@/components/Ui";

export const metadata: Metadata = {
  title: "For shops",
  description:
    "Run a shop? Every shop with a live rewards program is listed on KYP, on every plan. Set yours up on KYP Stamping.",
  alternates: { canonical: "/for-shops" },
};

/**
 * The page carried its hero and nothing else, so a shop owner who followed
 * "I run a shop" got a paragraph, two buttons and a band of empty space.
 *
 * Everything below is what the directory actually does, taken from the
 * listing the API returns rather than from a pitch: these are the fields on
 * `PublicShopOut`, and the order really is featured, then nearest, then by
 * name. The merchant argument - plans, pricing, what the card can do - lives
 * on kypstamping.ph and is not repeated here.
 */
const listing = [
  {
    icon: Store,
    title: "Your name, category and photo",
    text: "The name customers use for you, not a legal entity, and the category a shopper filters by.",
  },
  {
    icon: MapPin,
    title: "Every branch, with its neighborhood",
    text: "Each branch appears with its own address and neighborhood, so a shopper browsing Kapitolyo finds the Kapitolyo one.",
  },
  {
    icon: Clock3,
    title: "Your hours, and whether you are open now",
    text: "Opening hours as you set them, with an open-or-closed mark against the shopper's own clock.",
  },
  {
    icon: BadgeCheck,
    title: "The reward, in plain words",
    text: "Not a mechanic. “Eight visits → free pastry”, the same sentence the wallet shows on the card.",
  },
  {
    icon: QrCode,
    title: "A join link per branch",
    text: "The same code your counter poster prints. A shopper joins from the listing without walking in first.",
  },
  {
    icon: Users,
    title: "How many people have joined",
    text: "A count, never a list. No shopper sees who your members are, and no other shop sees them either.",
  },
];

const steps = [
  {
    title: "Apply on KYP Stamping",
    text: "The merchant side of KYP. It asks about your shop, your counter and how to reach you — a few minutes, and no card details.",
  },
  {
    title: "We set the workspace up",
    text: "A person reads every application. Approved, and your workspace is created and your sign-in emailed to you. There is no self-service sign-up: a shop exists here because somebody said yes to it.",
  },
  {
    title: "Switch a card live",
    text: "Set the target, the reward and the rules — the cooldown, any minimum spend, how long stamps last. Print the poster for the counter.",
  },
  {
    title: "You are in Discover",
    text: "No form to fill in here, no listing to submit and nothing to approve a second time. A live card is the whole condition.",
  },
];

export default function ForShops() {
  return (
    <>
      <PageIntro
        eyebrow="For shops"
        title="Your shop, in Discover"
        description={
          <>
            Every shop running a live program is listed here, on every plan including the free one.
            Each listing carries your category, neighborhood, hours and the reward in plain words,
            and leads straight to your join code. Setting up the card, the counter and the poster
            happens on KYP Stamping, the merchant side of KYP.
          </>
        }
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ActionLink href={`${merchantSiteUrl}/partners`}>Go to KYP Stamping</ActionLink>
          <ActionLink href="/discover" tone="outline">
            See the directory
          </ActionLink>
        </div>
      </PageIntro>

      <Section className="py-12 lg:py-16">
        <Eyebrow>What your listing shows</Eyebrow>
        <h2 className="mt-3 max-w-[22ch] text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Enough to walk in, and nothing you did not put there
        </h2>
        <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {listing.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-[var(--surface)] p-6">
              <Icon size={19} aria-hidden="true" className="text-[var(--accent-strong)]" />
              <dt className="mt-5 font-bold">{title}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">{text}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section className="border-t border-[var(--line)] py-12 lg:py-16">
        <Eyebrow>Getting listed</Eyebrow>
        <h2 className="mt-3 max-w-[20ch] text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Four steps, and only the first one is here
        </h2>
        <ol className="mt-8 grid gap-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-7"
            >
              <span className="font-mono text-sm font-bold text-[var(--muted)]">
                0{index + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold tracking-[-0.01em]">{step.title}</h3>
                <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="border-t border-[var(--line)] py-12 lg:py-16">
        <div className="grid gap-8 rounded-2xl bg-[var(--ink)] p-8 text-[var(--paper)] sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <Eyebrow>What it costs</Eyebrow>
            <h2 className="mt-3 max-w-[18ch] text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              Nothing. Being listed is part of running a card.
            </h2>
            <p className="mt-5 max-w-[56ch] text-sm leading-relaxed text-white/70 sm:text-base">
              The free plan is listed on the same terms as every plan above it, and a bigger shop
              does not outrank the one next door for being bigger. Shops are ordered by how near
              they are to whoever is looking, and by name when nobody has shared a position.
              Placement at the top of Discover is a paid add-on on the merchant side — it moves
              the order, never who is listed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ActionLink href={`${merchantSiteUrl}/partners`} tone="accent">
              Apply to join
            </ActionLink>
            <ActionLink href={`${merchantSiteUrl}/pricing`} tone="outline">
              See the plans
            </ActionLink>
          </div>
        </div>
      </Section>
    </>
  );
}
