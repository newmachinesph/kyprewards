import { SiteEyebrow } from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb } from "@/lib/schema";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

// Rights requests are a legal obligation; the address must be actionable.
// The domain used to end in [\w.]+, which is greedy about dots: an address at
// the end of a sentence took the full stop with it, and "privacy@kyprewards.com."
// is not an address anyone's mail client can send to. Each label is matched
// separately so the match can only end on a word character.
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;

function linkifyEmails(text: string) {
  return text.split(new RegExp(`(${EMAIL.source})`, "g")).map((part, index) =>
    new RegExp(`^${EMAIL.source}$`).test(part) ? (
      <a
        key={index}
        href={`mailto:${part}`}
        className="font-bold text-[var(--accent-strong)] underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export function LegalPage({
  eyebrow,
  title,
  summary,
  effective,
  sections,
  path,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  effective: string;
  sections: LegalSection[];
  /** Site-relative path, used for the breadcrumb node. */
  path: string;
}) {
  return (
    <main>
      <StructuredData data={breadcrumb([{ name: title, path }])} />
      <header className="relative overflow-hidden border-b border-[var(--line)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-legal.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-[75%_center]"
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
          <SiteEyebrow>{eyebrow}</SiteEyebrow>
          <div className="mt-12 grid gap-10 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
            <div>
              <h1 className="text-5xl font-extrabold tracking-[-0.03em] sm:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-[var(--muted-strong)]">
                {summary}
              </p>
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
              Effective {effective}
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1100px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.28fr_0.72fr] lg:px-8 lg:py-24">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
            Plain-language note
          </p>
          <p className="mt-4 max-w-[28ch] text-xs leading-relaxed text-[var(--muted)]">
            Written in plain language on purpose. The product is in open
            beta; qualified Philippine counsel reviews these pages before the
            paid tiers open, and any clause still being settled says so where
            it occurs.
          </p>
        </aside>
        <div className="space-y-12">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="border-t border-[var(--line)] pt-7"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
                {section.title}
              </h2>
              <div className="mt-5 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-7 text-[var(--muted-strong)]"
                  >
                    {linkifyEmails(paragraph)}
                  </p>
                ))}
              </div>
              {section.bullets && (
                <ul className="mt-5 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 text-sm leading-7 text-[var(--muted-strong)]"
                    >
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
