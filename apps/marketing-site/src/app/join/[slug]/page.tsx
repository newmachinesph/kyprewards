import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, getJoinPage, type JoinPage } from "@kypstamping/api";
import { ArrowRight, Clock3, MapPin, ShieldCheck, Stamp } from "lucide-react";
import { AnswerBlock, PageHero } from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { customerAppUrl, siteUrl } from "@/lib/site";

/**
 * The page a printed counter poster leads to.
 *
 * It used to read the fixture and pre-render one slug per seeded branch, with
 * `dynamicParams = false` so anything else was a hard 404. That is correct
 * for a demo and wrong for a product: a merchant who opens a branch on
 * Tuesday has printed posters that 404 until the next deploy.
 *
 * `GET /public/join/{slug}` answers for any branch that exists, so the route
 * resolves at request time. A slug that is genuinely unknown still 404s -
 * which is what a mistyped poster code should do.
 */
export const dynamic = "force-dynamic";

/** Null for an unknown slug; anything else is a real failure and rethrown. */
async function loadJoinPage(slug: string): Promise<JoinPage | null> {
  try {
    return await getJoinPage(slug);
  } catch (failure) {
    if (failure instanceof ApiError && failure.status === 404) return null;
    throw failure;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadJoinPage(slug);
  if (!page) return { title: "Join code not found · KYPStamping" };
  return {
    title: `Join ${page.business} · ${page.branch} · KYPStamping`,
    description: `Scan, join, and start collecting stamps at ${page.business} ${page.branch}. No app download required.`,
    alternates: { canonical: `${siteUrl}/join/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function JoinRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await loadJoinPage(slug);
  if (!page) notFound();

  // The wallet's sign-in is the door. Sending the visitor straight to a
  // deep link they are not signed in for only bounces them here again.
  const joinHref = `${customerAppUrl}/login`;

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Join ${page.business} — ${page.branch}`,
          url: `${siteUrl}/join/${slug}`,
        }}
      />
      <PageHero
        eyebrow="Join a program"
        title={`Collect stamps at ${page.business}.`}
        description={`You scanned the counter code at ${page.branch}. Joining takes about thirty seconds and works in your browser — there is no app to download.`}
        image="/images/hero-product.webp"
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.62fr_1.38fr]">
          <div>
            <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              This location
            </p>
          </div>
          <div className="space-y-8">
            <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-card)] bg-[var(--accent)]">
                    <Stamp size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold tracking-[-0.02em]">
                      {page.business}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted-strong)]">
                      <MapPin size={14} aria-hidden="true" /> {page.branch} · {page.city}
                    </p>
                  </div>
                </div>
              </div>

              {page.reward && (
                <dl className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Reward", page.reward],
                    ["Category", page.category],
                    ["Cost to join", "Free"],
                    ["Where it works", `Every ${page.shortName} branch`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[var(--radius-card)] bg-[var(--paper)] p-4"
                    >
                      <dt className="font-mono text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={joinHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-card)] bg-[var(--ink)] px-6 text-sm font-extrabold text-[var(--paper)] transition hover:bg-[#2a2018] active:scale-[0.99]"
                >
                  Continue to join <ArrowRight size={16} aria-hidden="true" />
                </a>
                <Link
                  href="/product"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-card)] border border-[var(--line-strong)] px-6 text-sm font-extrabold transition hover:bg-[var(--surface-2)]"
                >
                  What is KYPStamping?
                </Link>
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
              <h3 className="text-sm font-extrabold">Before you join</h3>
              <ul className="mt-5 divide-y divide-[var(--line)]">
                {[
                  {
                    icon: ShieldCheck,
                    title: "You choose what is shared",
                    text: "The business receives only the details you approve, and you can withdraw permission at any time.",
                  },
                  {
                    icon: Clock3,
                    title: "Opening hours",
                    text: page.hours.length
                      ? `${page.hours.map((slot) => `${slot.days}: ${slot.time}`).join(" · ")}.`
                      : "Ask at the counter for this branch's hours.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-card)] bg-[var(--surface-2)]">
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-extrabold">{item.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                          {item.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <AnswerBlock
              question="Do I need to download an app?"
              answer="No. KYPStamping opens in your browser and can be added to your home screen if you want quicker access. Your stamps are tied to your mobile number, not to a device."
            />
          </div>
        </div>
      </section>
    </>
  );
}
