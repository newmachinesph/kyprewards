import type { ReactNode } from "react";
import { PageIntro, Section } from "@/components/Ui";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

// Rights requests are a legal obligation, so an address printed in one has to
// be clickable. Each label is matched separately so a match can only end on a
// word character - a greedy domain took the full stop at the end of a
// sentence with it, and "privacy@kyp.ph." is not an address a mail client can
// send to.
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;

function linkifyEmails(text: string): ReactNode[] {
  return text.split(new RegExp(`(${EMAIL.source})`, "g")).map((part, index) =>
    new RegExp(`^${EMAIL.source}$`).test(part) ? (
      <a
        key={index}
        href={`mailto:${part}`}
        className="font-bold underline underline-offset-2 hover:text-[var(--accent-strong)]"
      >
        {part}
      </a>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function LegalPage({
  eyebrow,
  title,
  summary,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  /** The date this wording took effect, as a reader would say it. */
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} description={summary}>
        <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Last updated {updated}
        </p>
      </PageIntro>

      <Section className="py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
              On this page
            </p>
            <ol className="mt-4 grid gap-2">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#${slug(section.title)}`}
                    className="focus-ring flex gap-3 rounded-md text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--ink)]"
                  >
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="grid gap-10">
            {sections.map((section) => (
              <section key={section.title} id={slug(section.title)} className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-[-0.01em] sm:text-2xl">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)] sm:text-base"
                  >
                    {linkifyEmails(paragraph)}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 grid gap-2">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-3 text-sm leading-relaxed text-[var(--muted-strong)]"
                      >
                        <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                        {linkifyEmails(bullet)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

const slug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
