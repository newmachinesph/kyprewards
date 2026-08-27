import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { demoData } from "@stampr/demo-data";
import { ArrowRight, Clock3, MapPin, ShieldCheck, Stamp } from "lucide-react";
import { AnswerBlock, PageHero } from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { customerAppUrl, siteUrl } from "@/lib/site";

const business = demoData.business;

// A printed counter poster carries kypstamping.ph/join/<business>-<branch>.
// The slug is the merchant's branch code; anything else is a genuine 404.
function branchFor(slug: string) {
  const prefix = `${business.profile.shortName.toLowerCase().replaceAll(" ", "-")}-`;
  if (!slug.startsWith(prefix)) return null;
  const branchSlug = slug.slice(prefix.length);
  return (
    business.locations.find(
      (location) => location.name.toLowerCase().replaceAll(" ", "-") === branchSlug,
    ) ?? null
  );
}

// Only the branches that actually exist are routable. Anything else is a
// real 404 rather than a soft one, so a mistyped poster code fails loudly.
export const dynamicParams = false;

export function generateStaticParams() {
  const prefix = business.profile.shortName.toLowerCase().replaceAll(" ", "-");
  return business.locations.map((location) => ({
    slug: `${prefix}-${location.name.toLowerCase().replaceAll(" ", "-")}`,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const branch = branchFor(slug);
  if (!branch) return { title: "Join code not found · KYPStamping" };
  return {
    title: `Join ${business.profile.name} · ${branch.name} · KYPStamping`,
    description: `Scan, join, and start collecting stamps at ${business.profile.name} ${branch.name}. No app download required.`,
    alternates: { canonical: `${siteUrl}/join/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const branch = branchFor(slug);
  if (!branch) notFound();

  const program = business.programs.find((item) => item.status === "Live");
  const joinHref = `${customerAppUrl}/#discover`;

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Join ${business.profile.name} — ${branch.name}`,
          url: `${siteUrl}/join/${slug}`,
        }}
      />
      <PageHero
        eyebrow="Join a program"
        title={`Collect stamps at ${business.profile.name}.`}
        description={`You scanned the counter code at ${branch.name}. Joining takes about thirty seconds and works in your browser — there is no app to download.`}
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
                      {business.profile.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted-strong)]">
                      <MapPin size={14} aria-hidden="true" /> {branch.name} · {branch.city}
                    </p>
                  </div>
                </div>
              </div>

              {program && (
                <dl className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Program", program.name],
                    ["Type", program.type],
                    ["Cost to join", "Free"],
                    ["Where it works", "Every Sweet Crumbs branch"],
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
                    text: branch.status === "Live"
                      ? "This branch is accepting stamps today."
                      : "This branch is still being set up, so stamps may not be available yet.",
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

            <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-5 text-xs leading-relaxed text-[var(--muted-strong)]">
              This is a frontend demonstration. Joining opens the customer demo
              wallet; no account is created and no personal data is collected or
              sent anywhere.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
