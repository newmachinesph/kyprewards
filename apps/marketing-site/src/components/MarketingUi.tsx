import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, QrCode } from "lucide-react";

/**
 * The section tag. A small pill rather than bare uppercase text: it sits
 * centred over a heading as often as it sits above a left-aligned one, and a
 * pill reads the same in both places.
 */
export function SiteEyebrow({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}) {
  return (
    <span className={`eyebrow-pill ${inverse ? "eyebrow-pill-inverse" : ""}`}>
      {children}
    </span>
  );
}

export function SiteButton({
  href,
  children,
  tone = "dark",
  arrow = true,
}: {
  href: string;
  children: ReactNode;
  tone?: "dark" | "accent" | "light" | "outline";
  arrow?: boolean;
}) {
  const tones = {
    dark: "border border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)] shadow-[0_2px_0_rgb(24_18_12/18%)] hover:-translate-y-0.5 hover:bg-[var(--ink-soft)]",
    accent:
      "border border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)] shadow-[0_2px_0_rgb(0_0_0/12%)] hover:-translate-y-0.5 hover:bg-[#d88c38]",
    light:
      "border border-white/35 bg-[var(--surface)] text-[var(--ink)] shadow-[0_2px_0_rgb(0_0_0/14%)] hover:-translate-y-0.5 hover:bg-white",
    outline:
      "shadow-soft border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--ink)]",
  };
  const external = href.startsWith("http");
  const className = `focus-ring inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-7 text-sm font-extrabold transition duration-200 active:translate-y-0 active:scale-[0.98] ${tones[tone]}`;
  const content = (
    <>
      {children}
      {arrow && <ArrowUpRight size={16} aria-hidden="true" />}
    </>
  );
  return external ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  seam = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Path under /images. Rendered behind the copy, faded to paper. */
  image?: string;
  /** True when the next section is an `AnswerBlock`, whose arch rides over this hero. */
  seam?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      className={`site-canvas relative overflow-hidden ${seam ? "pad-seam" : ""}`}
    >
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover object-center"
          />
          {/* The copy is centred now, so the wash is even rather than
              weighted to one side: paper at the edges, a window of photo
              behind the headline. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,var(--paper)_0%,rgb(250_248_243/88%)_45%,var(--paper)_100%)]"
          />
        </>
      )}
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[900px] flex-col items-center py-16 text-center lg:py-24">
          <SiteEyebrow>{eyebrow}</SiteEyebrow>
          <h1 className="mt-6 max-w-[16ch] text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-[58ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
            {description}
          </p>
          {children && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function MarketingCta({
  title = "Make the next visit more likely.",
  description = "Set up a clear, useful loyalty program in one afternoon.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="panel shadow-lift relative mx-auto max-w-[1400px] overflow-hidden bg-[var(--ink)] px-6 py-14 text-center text-[var(--paper)] sm:px-10 lg:py-20">
        {/* Two of the loop's objects keep the panel company on wide screens:
            the reward and the return. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/obj-gift.webp"
          alt=""
          aria-hidden="true"
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          className="drift absolute -left-6 bottom-6 hidden w-[200px] lg:block"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/obj-return.webp"
          alt=""
          aria-hidden="true"
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          className="drift-late absolute -right-4 top-6 hidden w-[180px] lg:block"
        />
        <div className="relative mx-auto flex max-w-[760px] flex-col items-center">
          <SiteEyebrow inverse>Start with KYP Rewards</SiteEyebrow>
          <h2 className="mt-5 max-w-[18ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-white/70 sm:text-base">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <SiteButton href="/partners" tone="accent">
              Apply to join
            </SiteButton>
            <SiteButton href="/product" tone="light">
              See how it works
            </SiteButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ReceiptDemo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="receipt-float receipt-paper relative mx-auto w-full max-w-[390px] px-8 py-10 shadow-diffuse sm:px-10">
      <div className="text-center">
        {/* The shop's own badge, not a generic stamp glyph. A loyalty card is
            the merchant's surface — the platform's mark belongs in the footer,
            not at the top of their receipt. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/sweet-crumbs-mark.webp"
          alt=""
          aria-hidden="true"
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className="mx-auto size-16"
        />
        <p className="mt-3 text-lg font-extrabold tracking-[-0.02em]">
          SWEET CRUMBS
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Loyalty visit 005
        </p>
      </div>
      <div className="perforated mt-7 pt-7">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-[var(--muted-strong)]">Today&apos;s visit</span>
          <span className="font-bold">+1 stamp</span>
        </div>
        <div className="mt-3 flex justify-between gap-4 text-sm">
          <span className="text-[var(--muted-strong)]">Progress</span>
          <span className="font-bold">5 of 8</span>
        </div>
        {!compact && (
          <div className="mt-3 flex justify-between gap-4 text-sm">
            <span className="text-[var(--muted-strong)]">Next reward</span>
            <span className="font-bold">Free pastry</span>
          </div>
        )}
      </div>
      <div
        className="mt-7 grid grid-cols-8 gap-2"
        role="img"
        aria-label="Five of eight stamps collected"
      >
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            /* ponytail: mirrors StampDots by hand — that one is fixed-width and
               this receipt needs fluid columns. Keep the two in sync. */
            className={`font-display grid aspect-square place-items-center rounded-full text-[10px] font-bold tracking-tight ${index < 5 ? "bg-[var(--accent)] text-[var(--ink)]" : "border border-dashed border-[var(--line-strong)]"}`}
          >
            {/* A tick, which is what a collected stamp shows unless the shop
                picks one of the presets or, from Core, uploads a mark of
                their own. It used to read "SC", and before that "K". */}
            {index < 5 ? <Check size={13} strokeWidth={2.6} aria-hidden="true" /> : ""}
          </span>
        ))}
      </div>
      <div className="perforated mt-7 pt-7 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Come back soon
        </p>
        <div className="mx-auto mt-4 flex size-20 items-center justify-center rounded-xl border border-[var(--line)]">
          <QrCode size={48} strokeWidth={1.2} />
        </div>
      </div>
      <div className="stamp-arrive ink-stamp absolute -right-5 top-[44%] grid size-24 place-items-center rounded-full bg-[var(--surface)] text-center text-[9px] font-extrabold uppercase leading-tight tracking-[0.12em] text-[var(--accent-strong)]">
        Reward
        <br />
        in reach
      </div>
    </div>
  );
}

export function CheckList({
  items,
  inverse = false,
}: {
  items: string[];
  inverse?: boolean;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item}
          className={`flex items-start gap-3 text-sm ${inverse ? "text-white/80" : "text-[var(--muted-strong)]"}`}
        >
          <span
            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${inverse ? "bg-white/10 text-[var(--accent)]" : "bg-[rgb(232_163_61/16%)] text-[var(--accent-strong)]"}`}
          >
            <Check size={12} strokeWidth={3} />
          </span>
          {item}
        </div>
      ))}
    </div>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-[var(--accent-strong)] transition hover:gap-3"
    >
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}

/**
 * Answer-first block for answer and generative engines.
 *
 * The `aeo-answer` class is what the page's `speakable` selector points at, so
 * keep the body to two or three self-contained sentences that still make sense
 * quoted away from this page. Facts become a definition list because a
 * label/value pair survives extraction better than prose numbers.
 */
export function AnswerBlock({
  question,
  answer,
  facts,
  points,
  image,
}: {
  question: string;
  answer: string;
  facts?: { label: string; value: string }[];
  /**
   * Scannable follow-ups under the lead. The lead stays one short paragraph
   * because it is the `speakable` passage answer engines quote; everything a
   * human would rather scan than read goes here as label + line.
   */
  points?: { label: string; text: string }[];
  /**
   * Path under /public. The answer is capped at 78ch for reading, which left
   * the right half of this card empty on a wide screen; an illustration on
   * the page's own subject fills it. Decorative — the text carries the
   * meaning, so it is hidden from assistive tech.
   */
  image?: string;
}) {
  return (
    <section className="seam-top bg-[var(--paper)] px-4 pt-14 pb-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="panel shadow-soft border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-10">
          <div
            className={
              image
                ? "grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center"
                : undefined
            }
          >
            <div>
              <h2 className="font-display text-xl font-bold tracking-[-0.02em] sm:text-2xl">
                {question}
              </h2>
              <p className="aeo-answer mt-4 max-w-[78ch] text-base leading-relaxed text-[var(--ink-soft)]">
                {answer}
              </p>
              {points && (
                <ul className="mt-6 max-w-[78ch] space-y-3">
                  {points.map((point) => (
                    <li
                      key={point.label}
                      className="grid grid-cols-[14px_1fr] gap-3 text-sm leading-relaxed text-[var(--muted-strong)]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[7px] size-2.5 rounded-full bg-[var(--accent)]"
                      />
                      <span>
                        <strong className="font-extrabold text-[var(--ink)]">
                          {point.label}
                        </strong>{" "}
                        {point.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={image}
                alt=""
                aria-hidden="true"
                width={960}
                height={640}
                loading="lazy"
                decoding="async"
                className="mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-[460px] lg:justify-self-end"
              />
            )}
          </div>
          {facts && (
            <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="bg-[var(--surface)] p-4">
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {fact.label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-bold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
