import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import {
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { PlaybookSignup } from "@/components/PlaybookSignup";
import { resources } from "@/lib/content";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Practical guides for designing rewards, running local campaigns, protecting customer trust, and building repeat visits.",
  alternates: { canonical: "/resources" },
};

const icons = [Lightbulb, FileText, ShieldCheck];

export default function ResourcesPage() {
  return (
    <main>
      <PageHero
        eyebrow="The return-visit library"
        title="Practical ideas for becoming someone’s regular place."
        description="Clear guidance for designing rewards, reaching customers, and earning the kind of trust that lasts longer than a discount."
      >
        <SiteButton href="#guides">Browse the guides</SiteButton>
      </PageHero>

      <section
        id="guides"
        className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <SiteEyebrow>Featured field notes</SiteEyebrow>
              <h2 className="mt-4 max-w-[10ch] text-4xl font-black leading-[1] tracking-[-0.055em]">
                Useful before your first campaign.
              </h2>
              <p className="mt-5 max-w-[38ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                Written for owners doing the work, not loyalty-program
                specialists.
              </p>
            </div>
            <div className="grid gap-3">
              {resources.map((resource, index) => {
                const Icon = icons[index];
                return (
                  <Link
                    key={resource.slug}
                    href={`/resources/${resource.slug}`}
                    className={`group grid min-h-[250px] gap-8 rounded-2xl p-7 transition hover:-translate-y-1 sm:grid-cols-[1fr_auto] ${index === 0 ? "bg-[var(--ink)] text-[var(--paper)]" : index === 1 ? "bg-[var(--accent)]" : "border border-[var(--line)] bg-[var(--surface)]"}`}
                  >
                    <div className="flex flex-col">
                      <p
                        className={`font-mono text-[10px] uppercase tracking-[0.15em] ${index === 0 ? "text-white/70" : index === 1 ? "text-[var(--ink)]" : "text-[var(--muted-strong)]"}`}
                      >
                        {resource.category} · {resource.readTime}
                      </p>
                      <h3 className="mt-5 max-w-[22ch] text-2xl font-black leading-tight tracking-[-0.045em] sm:text-3xl">
                        {resource.title}
                      </h3>
                      <p
                        className={`mt-4 max-w-[62ch] text-sm leading-relaxed ${index === 0 ? "text-white/70" : index === 1 ? "text-[var(--ink)]" : "text-[var(--muted-strong)]"}`}
                      >
                        {resource.summary}
                      </p>
                    </div>
                    <div className="flex items-start justify-between sm:flex-col sm:items-end">
                      <span
                        className={`grid size-12 place-items-center rounded-2xl ${index === 0 ? "bg-white/10 text-[var(--accent)]" : "bg-[var(--surface)]"}`}
                      >
                        <Icon size={20} />
                      </span>
                      <span
                        className={`grid size-11 place-items-center rounded-full border transition group-hover:translate-x-1 ${index === 0 ? "border-white/15" : "border-[var(--line)]"}`}
                      >
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <span className="grid size-13 place-items-center rounded-xl bg-[rgb(242_161_45/16%)] text-[var(--accent-strong)]">
              <BookOpen />
            </span>
            <h2 className="mt-8 max-w-[11ch] text-4xl font-black leading-[1] tracking-[-0.055em]">
              A practical loyalty playbook is coming.
            </h2>
          </div>
          <div>
            <p className="max-w-[54ch] text-base leading-relaxed text-[var(--muted-strong)]">
              We’re assembling the field-tested launch checklist we use with new
              businesses: reward math, counter setup, staff briefing, customer
              welcome, and the first thirty days.
            </p>
            <div className="mt-7">
              <PlaybookSignup />
            </div>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Put the ideas into practice."
        description="Start with the core visit-and-reward loop, then add campaigns only when you have something useful to say."
      />
    </main>
  );
}
