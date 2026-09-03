import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
      {children}
    </span>
  );
}

/**
 * The one link style. `dark` is the page's action; `outline` is the way out.
 * External hosts get a plain anchor so Next never tries to prefetch them.
 */
export function ActionLink({
  href,
  children,
  tone = "dark",
  arrow = true,
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: "dark" | "outline" | "accent";
  arrow?: boolean;
  className?: string;
}) {
  const tones = {
    dark: "border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] shadow-[0_2px_0_rgb(24_18_12/16%)] hover:-translate-y-0.5 hover:bg-[var(--ink-soft)]",
    accent:
      "border border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)] shadow-[0_2px_0_rgb(0_0_0/12%)] hover:-translate-y-0.5",
    outline:
      "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--ink)]",
  };
  const external = href.startsWith("http");
  const classes = `focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-extrabold transition duration-200 active:translate-y-0 active:scale-[0.98] ${tones[tone]} ${className}`;
  const Arrow = external ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      {children}
      {arrow && <Arrow size={16} aria-hidden="true" />}
    </>
  );
  return external ? (
    <a href={href} className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

/** Eyebrow, heading and one paragraph: the top of every inner page. */
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-[var(--line)] px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] py-12 lg:py-16">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-[18ch] text-4xl font-bold leading-[1.02] tracking-[-0.02em] sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}
