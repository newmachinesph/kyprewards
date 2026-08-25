"use client";

import { useEffect } from "react";
import type React from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  FlaskConical,
  Minus,
  ShieldCheck,
  X,
} from "lucide-react";

type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
  label?: string;
};

export function BrandMark({
  compact = false,
  inverse = false,
  label = "KYPStamping",
}: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3" aria-label={label}>
      <span
        className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-[10px] ${
          inverse ? "ring-1 ring-white/20" : "ring-1 ring-[var(--line)]"
        }`}
      >
        {/* Static brand asset shipped in each app's public/brand directory. */}
        <img
          src="/brand/logo.png"
          alt=""
          width={40}
          height={40}
          className="size-full object-cover"
        />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[16px] font-bold tracking-[-0.03em]">
            {label.startsWith("KYP") ? (
              <>
                <span
                  className={
                    inverse
                      ? "text-[var(--accent)]"
                      : "text-[var(--accent-strong)]"
                  }
                >
                  KYP
                </span>
                {label.slice(3)}
              </>
            ) : (
              label
            )}
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Loyalty, made local
          </span>
        </span>
      )}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "dark" | "accent" | "quiet";
  icon?: ReactNode;
};

export function Button({
  tone = "dark",
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const tones = {
    dark: "bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink-soft)]",
    accent:
      "bg-[var(--accent)] text-[var(--ink)] hover:bg-[#d88c38]",
    quiet:
      "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]",
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition duration-200 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

type Trend = "up" | "down" | "flat";

export function TrendBadge({
  value,
  trend = "up",
}: {
  value: string;
  trend?: Trend;
}) {
  const Icon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted-strong)]">
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {value}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-current opacity-80">
      {children}
    </span>
  );
}

export function StampDots({
  filled = 0,
  total = 8,
  dark = false,
}: {
  filled?: number;
  total?: number;
  dark?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`${filled} of ${total} stamps collected`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`grid size-7 place-items-center rounded-full border text-[9px] font-extrabold ${
            index < filled
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]"
              : dark
                ? "border-white/40 bg-white/5 text-white/50"
                : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--muted)]"
          }`}
        >
          {index < filled ? "S" : ""}
        </span>
      ))}
    </div>
  );
}

export function DemoActionDialog({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="demo-action-title">
      <button type="button" aria-label="Close demo action" onClick={onClose} className="absolute inset-0 cursor-default bg-[rgb(20_16_13/62%)] backdrop-blur-sm" />
      <section className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5 sm:p-6">
          <div>
            <Eyebrow>Interactive demo action</Eyebrow>
            <h2 id="demo-action-title" className="mt-2 text-xl font-extrabold tracking-[-0.02em]">
              {title.replace(/\.$/, "")}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)]">
            <X size={17} />
          </button>
        </header>
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3 rounded-2xl bg-[rgb(15_118_85/8%)] p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--success)]" />
            <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
              Review and confirm this workflow using local sample data. No backend request, message, export, or account change will occur.
            </p>
          </div>
          <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {[["Mode", "Local preview"], ["Persistence", "Current browser session"], ["Network activity", "None"]].map(([term, description]) => (
              <div key={term} className="grid grid-cols-[118px_1fr] gap-3 py-3 text-xs">
                <dt className="font-extrabold text-[var(--muted-strong)]">{term}</dt>
                <dd className="font-bold">{description}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button tone="quiet" onClick={onClose}>Cancel</Button>
            <Button icon={<Check size={15} />} onClick={onConfirm}>Confirm demo action</Button>
          </div>
        </div>
      </section>
    </div>
  );
}


export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "bg-[var(--surface-2)] text-[var(--muted-strong)]",
    success: "bg-[rgb(15_118_85/12%)] text-[var(--success)]",
    warning: "bg-[rgb(149_83_12/12%)] text-[var(--accent-strong)]",
    danger: "bg-[rgb(178_59_43/12%)] text-[var(--danger)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] ${className}`}
    >
      {children}
    </section>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
      {children}
    </span>
  );
}

export function DemoBadge({ label = "Frontend demo only" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(149_83_12/30%)] bg-[rgb(242_161_45/14%)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
      <FlaskConical size={13} aria-hidden="true" /> {label}
    </span>
  );
}

export function ViewFrame({
  eyebrow,
  title,
  description,
  action,
  children,
  wide = false,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <main
      className={`min-h-[calc(100dvh-68px)] px-4 py-6 sm:px-7 lg:px-10 lg:py-8 ${className}`}
    >
      <div className={`mx-auto ${wide ? "max-w-[1500px]" : "max-w-[1400px]"}`}>
        <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-[66ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              {description}
            </p>
          </div>
          {action}
        </header>
        <div className="pt-6">{children}</div>
      </div>
    </main>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
  trend = "up",
  className = "",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ size?: number | string; "aria-hidden"?: boolean | "true" | "false" }>;
  accent?: boolean;
  trend?: "up" | "down" | "flat";
  className?: string;
}) {
  return (
    <article
      className={`min-h-36 rounded-2xl border p-5 ${accent ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--surface)]"} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-9 place-items-center rounded-xl ${accent ? "bg-white/10 text-[var(--accent)]" : "bg-[var(--surface-2)] text-[var(--muted-strong)]"}`}
        >
          <Icon size={17} aria-hidden="true" />
        </span>
        <TrendBadge value={detail} trend={trend} />
      </div>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] opacity-65">
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold tracking-[-0.03em]">{value}</p>
    </article>
  );
}
