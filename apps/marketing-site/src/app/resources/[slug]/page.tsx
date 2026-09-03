import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, Stamp } from "lucide-react";
import { MarketingCta, SiteEyebrow } from "@/components/MarketingUi";
import { resources } from "@/lib/content";
import { StructuredData } from "@/components/StructuredData";
import { article, breadcrumb } from "@/lib/schema";

type Props = { params: Promise<{ slug: string }> };

// Only the slugs in generateStaticParams exist. Without this an unknown
// slug rendered not-found content with a 200, so search engines index
// arbitrary URLs as real pages.
export const dynamicParams = false;

export function generateStaticParams() {
  return resources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = resources.find((item) => item.slug === slug);
  if (!resource) return { title: "Resource not found" };
  return {
    title: resource.title,
    description: resource.summary,
    alternates: { canonical: `/resources/${resource.slug}` },
    openGraph: {
      title: resource.title,
      description: resource.summary,
      url: `/resources/${resource.slug}`,
      locale: "en_PH",
      type: "article",
      section: resource.category,
    },
  };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const resource = resources.find((item) => item.slug === slug);
  if (!resource) notFound();
  const currentIndex = resources.findIndex((item) => item.slug === slug);
  const next = resources[(currentIndex + 1) % resources.length];

  return (
    <>
      <StructuredData
        data={[
          article({
            headline: resource.title,
            description: resource.summary,
            path: `/resources/${resource.slug}`,
            section: resource.category,
            published: "2026-08-25",
            modified: "2026-08-26",
          }),
          breadcrumb([
            { name: "Resources", path: "/resources" },
            { name: resource.title, path: `/resources/${resource.slug}` },
          ]),
        ]}
      />
    <main>
      <article>
        <header className="relative overflow-hidden border-b border-[var(--line)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-article.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-[65%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,var(--paper)_10%,rgb(250_248_243/93%)_52%,rgb(250_248_243/74%)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,var(--paper))]"
        />
          <div className="relative mx-auto max-w-[1100px]">
            <Link
              href="/resources"
              className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-[var(--muted-strong)] transition hover:text-[var(--ink)]"
            >
              <ArrowLeft size={15} /> All resources
            </Link>
            <div className="mt-16 grid gap-10 lg:grid-cols-[0.28fr_0.72fr]">
              <div>
                <SiteEyebrow>{resource.category}</SiteEyebrow>
                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                  <Clock3 size={14} /> {resource.readTime}
                </div>
              </div>
              <div>
                <h1 className="max-w-[15ch] text-5xl font-extrabold leading-[0.97] tracking-[-0.03em] sm:text-6xl">
                  {resource.title}
                </h1>
                <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[var(--muted-strong)]">
                  {resource.summary}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1100px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.28fr_0.72fr] lg:px-8 lg:py-24">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <span className="grid size-13 place-items-center rounded-xl bg-[var(--ink)] text-[var(--accent)]">
              <Stamp />
            </span>
            <p className="mt-5 max-w-[24ch] text-xs leading-relaxed text-[var(--muted)]">
              Field notes from the KYP Stamping team for owners building thoughtful
              repeat business.
            </p>
          </aside>
          <div>
            <p className="text-2xl font-semibold leading-relaxed tracking-[-0.025em]">
              {resource.intro}
            </p>
            <div className="mt-14 space-y-14">
              {resource.sections.map((section, index) => (
                <section
                  key={section.heading}
                  className="border-t border-[var(--line)] pt-7"
                >
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                    0{index + 1}
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.02em]">
                    {section.heading}
                  </h2>
                  <p className="mt-5 text-base leading-8 text-[var(--muted-strong)]">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
            <div className="mt-16 rounded-2xl bg-[var(--accent)] p-7 sm:p-9">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink)]">
                Next field note
              </p>
              <Link
                href={`/resources/${next.slug}`}
                className="group mt-5 flex items-end justify-between gap-6"
              >
                <span className="max-w-[18ch] text-2xl font-extrabold leading-tight tracking-[-0.02em]">
                  {next.title}
                </span>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[var(--surface)] transition group-hover:translate-x-1">
                  <ArrowRight size={16} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </article>

      <MarketingCta
        title="Turn the field note into a live program."
        description="KYP Stamping gives you the tools to launch, measure, and refine the return-visit loop without replacing the way your business already works."
      />
    </main>
    </>
  );
}
