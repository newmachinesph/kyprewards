import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, QrCode, Stamp } from "lucide-react";

export function SiteEyebrow({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}) {
  return (
    <span
      className={`text-[11px] font-extrabold uppercase tracking-[0.17em] ${inverse ? "text-white/70" : "text-[var(--accent-strong)]"}`}
    >
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
    dark: "border border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)] shadow-[0_2px_0_rgb(33_27_23/18%)] hover:-translate-y-0.5 hover:bg-[var(--ink-soft)]",
    accent:
      "border border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)] shadow-[0_2px_0_rgb(0_0_0/12%)] hover:-translate-y-0.5 hover:bg-[#d88c38]",
    light:
      "border border-white/35 bg-[var(--surface)] text-[var(--ink)] shadow-[0_2px_0_rgb(0_0_0/14%)] hover:-translate-y-0.5 hover:bg-white",
    outline:
      "border border-[var(--line-strong)] bg-[rgb(255_253_248/72%)] text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--ink)] hover:bg-[var(--surface)]",
  };
  const external = href.startsWith("http");
  const className = `focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-extrabold transition duration-200 active:translate-y-0 active:scale-[0.98] ${tones[tone]}`;
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
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="site-grid border-b border-[var(--line)]">
      <div className="mx-auto grid min-h-[540px] max-w-[1400px] items-end gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
        <div>
          <SiteEyebrow>{eyebrow}</SiteEyebrow>
          <h1 className="mt-5 max-w-[14ch] text-5xl font-extrabold leading-[0.96] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            {title}
          </h1>
        </div>
        <div className="pb-1 lg:pl-10">
          <p className="max-w-[52ch] text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
            {description}
          </p>
          {children && (
            <div className="mt-7 flex flex-wrap gap-3">{children}</div>
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
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[18px] bg-[var(--ink)] px-6 py-12 text-[var(--paper)] sm:px-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:px-14 lg:py-16">
        <div className="absolute right-10 top-1/2 hidden size-48 -translate-y-1/2 rounded-full border-[38px] border-[var(--accent)] opacity-80 lg:block" />
        <div className="relative">
          <SiteEyebrow inverse>Start with KYPStamping</SiteEyebrow>
          <h2 className="mt-4 max-w-[16ch] text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-white/70 sm:text-base">
            {description}
          </p>
        </div>
        <div className="relative mt-8 flex flex-wrap gap-3 lg:mt-0 lg:pl-20">
          <SiteButton href="/contact" tone="accent">
            Start your program
          </SiteButton>
          <SiteButton href="/product" tone="light">
            See how it works
          </SiteButton>
        </div>
      </div>
    </section>
  );
}

export function ReceiptDemo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="receipt-float receipt-paper relative mx-auto w-full max-w-[390px] px-8 py-10 shadow-diffuse sm:px-10">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--paper)]">
          <Stamp size={21} />
        </span>
        <p className="mt-4 text-lg font-extrabold tracking-[-0.02em]">
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
        aria-label="Five of eight stamps collected"
      >
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className={`grid aspect-square place-items-center rounded-full border text-[9px] font-extrabold ${index < 5 ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--line-strong)]"}`}
          >
            {index < 5 ? "S" : ""}
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

export function ProofStrip() {
  return (
    <div className="border-y border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-[var(--line)] px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {["Sweet Crumbs", "Sage & Steam", "Rooted Studio", "Corner Thread"].map(
          (name) => (
            <div
              key={name}
              className="flex min-h-20 items-center justify-center px-3 text-center text-sm font-extrabold tracking-[-0.03em] text-[var(--muted-strong)]"
            >
              {name}
            </div>
          ),
        )}
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
            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${inverse ? "bg-white/10 text-[var(--accent)]" : "bg-[rgb(242_161_45/16%)] text-[var(--accent-strong)]"}`}
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
