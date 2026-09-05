import type { Metadata } from "next";
import Form from "next/form";
import { Search, ShieldCheck, Stamp, UserRoundCheck } from "lucide-react";
import { customerAppUrl, merchantSiteUrl } from "@/lib/site";
import { ActionLink, Eyebrow, Section } from "@/components/Ui";
import { CategoryChips, FeaturedRow, LocationButton } from "@/components/HomeSections";

export const metadata: Metadata = {
  title: { absolute: "KYP — rewards from the shops around you" },
  alternates: { canonical: "/" },
};

const steps = [
  {
    icon: Stamp,
    title: "Join from the poster",
    text: "Scan the code at the counter, or open the shop's link, and join with one mobile number. Nothing to install.",
  },
  {
    icon: ShieldCheck,
    title: "A welcome stamp, pending",
    text: "It lands on your card marked pending. On its own it is worth nothing; it is waiting for your first visit.",
  },
  {
    icon: UserRoundCheck,
    title: "Staff confirm it",
    text: "On your first visit staff scan your code. The pending stamp becomes real, the visit earns another, and the card reads two.",
  },
];

export default function Home() {
  return (
    <>
      <section className="border-b border-[var(--line)] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:py-24">
          <div>
            <Eyebrow>Philippines</Eyebrow>
            <h1 className="mt-5 max-w-[14ch] text-5xl font-bold leading-[0.98] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
              Rewards from the shops around you
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
              The cafe by the office, the salon near home, the bakery you stop at on Sundays. One card
              for all of them, in your browser, with no app for each shop.
            </p>
            <Form action="/discover" className="mt-8 flex max-w-[520px] gap-2">
              <label className="relative flex-1">
                <span className="sr-only">Search shops</span>
                <Search
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  type="search"
                  name="search"
                  // Short enough to survive a 390px phone beside the Search
                  // button, where "Search by shop or category" was cut off
                  // mid-word.
                  placeholder="Shop or category"
                  className="focus-ring min-h-13 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] pl-11 pr-4 text-sm"
                />
              </label>
              <button
                type="submit"
                className="focus-ring inline-flex min-h-13 items-center rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-6 text-sm font-extrabold text-[var(--paper)] transition hover:bg-[var(--ink-soft)]"
              >
                Search
              </button>
            </Form>
            <div className="mt-8">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
                Browse by category
              </p>
              <div className="mt-3">
                <CategoryChips />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-8">
            <Eyebrow>Nearby first</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em]">
              Close enough to walk to
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
              Shops are listed nearest first once you share where you are. We ask only when you tap
              the button, and the position stays in this tab until you close it.
            </p>
            <div className="mt-6">
              <LocationButton />
            </div>
          </div>
        </div>
      </section>

      <Section className="py-14 lg:py-20">
        <FeaturedRow />
      </Section>

      <Section className="border-t border-[var(--line)] py-14 lg:py-20">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 max-w-[20ch] text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Three steps, and the first one is free
        </h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="bg-[var(--surface)] p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <Icon size={20} aria-hidden="true" className="text-[var(--ink-soft)]" />
                <span className="font-mono text-[11px] font-bold text-[var(--muted)]">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold tracking-[-0.01em]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <ActionLink href="/how-it-works" tone="outline">
            The whole flow
          </ActionLink>
        </div>
      </Section>

      <Section className="pb-16 lg:pb-24">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[var(--ink)] p-7 text-[var(--paper)] sm:p-9">
            <Eyebrow>Shoppers</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
              Already joined a shop?
            </h2>
            <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-white/70">
              Your wallet holds every card, your code, and the rewards waiting to be approved.
            </p>
            <div className="mt-6">
              <ActionLink href={`${customerAppUrl}/login`} tone="outline">
                Open my wallet
              </ActionLink>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-9">
            <Eyebrow>Shops</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">I run a shop</h2>
            <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              Every shop with a live program is listed here, on the free plan too. Set one up on the
              merchant site.
            </p>
            <div className="mt-6">
              <ActionLink href={`${merchantSiteUrl}/partners`} tone="outline">
                Go to KYP Stamping
              </ActionLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
