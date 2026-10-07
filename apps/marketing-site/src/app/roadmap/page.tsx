import type { Metadata } from "next";
import { Check, Clock3, Sparkles } from "lucide-react";
import {
  MarketingCta,
  AnswerBlock,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { featureMatrix, plans } from "@kyprewards/ui/plans";
import { breadcrumb, webPage } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Roadmap — What Is Live, What Opens Next",
  description:
    "What runs today on the free beta, what opens with each paid tier, and what waits until a merchant asks. Generated from the pricing data, so it cannot drift.",
  alternates: { canonical: "/roadmap" },
  openGraph: {
    title: "KYP Rewards roadmap — live, next, later",
    description:
      "No dates we would miss. What runs today, what opens with paid tiers, and what waits for a merchant to ask.",
    url: "/roadmap",
    locale: "en_PH",
    type: "article",
  },
};

/**
 * The roadmap is derived, not written. A row that is on the free plan is live;
 * a row that first appears on a paid tier opens with that tier; anything
 * hand-listed below is later. Writing it by hand is how a roadmap and a
 * pricing page come to disagree, and this site has had enough of that.
 */
/** Rows that describe a state of the plan rather than a capability of the product. */
const notCapabilities = new Set(["KYP Rewards badge on customer cards", "Support"]);

const live = featureMatrix.flatMap((group) =>
  group.rows
    .filter((row) => !notCapabilities.has(row.label))
    .filter((row) => row.cells[0] !== false && row.cells[0] !== "—")
    .map((row) => ({ group: group.group, label: row.label })),
);

const opening = featureMatrix.flatMap((group) =>
  group.rows
    .filter((row) => row.cells[0] === false || row.cells[0] === "—")
    .map((row) => {
      const firstIndex = row.cells.findIndex(
        (cell, index) => index > 0 && cell !== false && cell !== "—",
      );
      return {
        group: group.group,
        label: row.label,
        tier: firstIndex > 0 ? plans[firstIndex].name : plans[1].name,
        coming: row.cells.some((cell) => cell === "Coming"),
      };
    }),
);

const later = [
  {
    title: "Interface in Filipino",
    detail:
      "Counter and owner screens in Filipino as well as English. The single biggest thing between this and a carinderia, and it is being done properly rather than machine-translated.",
  },
  {
    title: "Rolling counter code",
    detail:
      "A live join code on the counter tablet that refreshes every minute, for shops that want the welcome stamp granted only to someone physically present. Parked until a merchant asks; the pending-stamp model already removes the abuse case.",
  },
  {
    title: "Receipt codes",
    detail:
      "A one-off code printed on the receipt by a connected register, claimable at home. Needs the POS integration first.",
  },
  {
    title: "Purchase-verified stamps",
    detail:
      "When the register posts the sale, a stamp can require one. Turns staff-fraud from detected into prevented. Depends on the POS adapters on Grow.",
  },
  {
    title: "Partner rewards across shops",
    detail:
      "One card already works at every shop a customer joins. Letting two shops honor each other’s rewards is the obvious next step and the one we will only build with two real shops who want it.",
  },
];

function groupBy<T extends { group: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    map.set(row.group, [...(map.get(row.group) ?? []), row]);
  }
  return [...map.entries()];
}

export default function RoadmapPage() {
  return (
    <main>
      <StructuredData
        data={[
          webPage({
            name: "KYP Rewards roadmap",
            description:
              "What is live on the free beta, what opens with the paid tiers, and what comes later.",
            path: "/roadmap",
          }),
          breadcrumb([{ name: "Roadmap", path: "/roadmap" }]),
        ]}
      />
      <PageHero
        seam
        image="/images/hero-resources.webp"
        eyebrow="Live, next, later"
        title="What runs today, and what we are not pretending does."
        description="This page is generated from the same data as the pricing table, so the two cannot disagree. There are no dates on it: a date we miss is worse than a list without one. A merchant deciding whether to put their customer list on this deserves to know exactly where it is."
      >
        <SiteButton href="/partners">Apply to join</SiteButton>
        <SiteButton href="/pricing" tone="outline">
          See every plan
        </SiteButton>
      </PageHero>
      <AnswerBlock
        question="Is KYP Rewards ready to use today?"
        answer="Yes, for a stamp card. The free Launch plan is live and in open beta: the whole stamp-card loop with every rule, the printable join code, the staff ledger, in-app and push messages, and the Data Privacy Act controls. Everything on a paid tier is built or being built and opens with that tier after the beta; nothing on this site describes a feature we have not committed to."
        facts={[
          { label: "Live today", value: `${live.length} capabilities, free` },
          { label: "Opens with paid tiers", value: `${opening.length} capabilities` },
          { label: "Later, on request", value: `${later.length} items` },
          { label: "Dates", value: "None — on purpose" },
        ]}
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              {/* A literal rgb with alpha, not a var() with a /10 modifier —
                  Tailwind cannot derive alpha from a CSS variable and the
                  pill rendered with no background at all. */}
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgb(232_163_61/16%)] px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                <Check size={13} /> Live now
              </span>
              <h2 className="mt-5 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                On the free plan, in production.
              </h2>
              <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Everything a single shop needs to run one stamp card with
                unlimited customers and unlimited branches. Join by application
                and a person sets it up with you.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {groupBy(live).map(([group, rows]) => (
                <article
                  key={group}
                  className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-6"
                >
                  <p className="font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {group}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {rows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-start gap-2.5 text-sm text-[var(--ink)]"
                      >
                        <Check
                          size={15}
                          strokeWidth={3}
                          className="mt-0.5 shrink-0 text-[var(--accent-strong)]"
                        />
                        {row.label}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgb(232_163_61/16%)] px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                <Sparkles size={13} /> Opens with the paid tiers
              </span>
              <h2 className="mt-5 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                After the beta, tier by tier.
              </h2>
              <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Each capability names the tier it arrives with. Founding
                merchants get Core free for three months when it opens. A row
                marked <em>connecting</em> is a channel we are wiring up rather
                than a feature we are building.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {groupBy(opening).map(([group, rows]) => (
                <article
                  key={group}
                  className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--paper)] p-6"
                >
                  <p className="font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {group}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {rows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="text-[var(--ink)]">{row.label}</span>
                        <span className="shrink-0 rounded-full border border-[var(--line-strong)] px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--muted-strong)]">
                          {row.coming ? "connecting" : row.tier}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                <Clock3 size={13} /> Later, when a merchant asks
              </span>
              <h2 className="mt-5 max-w-[12ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
                Things we know about and have not built.
              </h2>
              <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Listed so you know we have thought about them, and so we cannot
                quietly pretend later that we always meant to. Each one waits
                for a real shop with a real need, because that is how it gets
                built the right shape.
              </p>
            </div>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {later.map((item) => (
                <article key={item.title} className="py-6">
                  <h3 className="text-lg font-extrabold tracking-[-0.01em]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1100px] rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-7 sm:p-9">
          <SiteEyebrow>How to read this page</SiteEyebrow>
          <p className="mt-4 max-w-[78ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            Live means running for merchants today. Opens with a tier means
            built or being built, and sellable when that tier opens after the
            beta. Later means we will build it when a real merchant asks and not
            before. We do not publish dates, because a date we miss costs you
            trust and a list without one costs you nothing. If something you
            need is missing entirely, tell us on the application form; the
            founding merchants are choosing what comes next.
          </p>
        </div>
      </section>

      <MarketingCta
        title="Start on what is live. Grow into what is next."
        description="Apply, and we set your first stamp card up together this week. When the paid tiers open, founding merchants get Core free for three months."
      />
    </main>
  );
}
