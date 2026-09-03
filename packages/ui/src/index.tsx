"use client";

import { useEffect, useId, useRef } from "react";
import type React from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Minus,
  ShieldCheck,
  X,
} from "lucide-react";
import { ApiError } from "@kypstamping/api";

/**
 * The colour tokens a merchant may pick for their card.
 *
 * Names rather than hex values, because the API stores a token and the
 * palette lives here: an arbitrary colour would break the contrast the design
 * system guarantees. `ink` is the default every merchant starts on.
 */
export const BRAND_COLORS = {
  ink: { label: "Ink", background: "var(--ink)", foreground: "var(--paper)" },
  accent: { label: "Amber", background: "var(--accent)", foreground: "var(--ink)" },
  green: { label: "Green", background: "var(--success)", foreground: "var(--paper)" },
  paper: { label: "Paper", background: "var(--surface-2)", foreground: "var(--ink)" },
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;

/** Falls back to `ink` for a token this build does not know. */
export function brandColor(token: string) {
  return BRAND_COLORS[token as BrandColor] ?? BRAND_COLORS.ink;
}

type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
  /** "KYP Stamping" on merchant surfaces; "KYP" alone on kyp.ph and the wallet. */
  label?: string;
  /** The lockup line under the wordmark. `null` removes it. */
  tagline?: string | null;
};

/* Seal badge — 16 rounded scallops around a solid disc, gold ring, K monogram.
   Bump centres are precomputed at r=186 on a 512 grid (docs/BRAND.md). */
const SEAL_BUMPS = Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI) / 8;
  return [256 + 186 * Math.cos(a), 256 + 186 * Math.sin(a)] as const;
});

export function SealMark({
  size = 40,
  inverse = false,
}: {
  size?: number;
  inverse?: boolean;
}) {
  const badge = inverse ? "var(--accent)" : "var(--ink)";
  const mono = inverse ? "var(--ink)" : "var(--paper)";
  const ring = inverse ? "var(--ink)" : "var(--accent)";
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <g fill={badge}>
        {SEAL_BUMPS.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r={40} />
        ))}
        <circle cx={256} cy={256} r={190} />
      </g>
      <circle
        cx={256}
        cy={256}
        r={126}
        fill="none"
        stroke={ring}
        strokeWidth={15}
        opacity={inverse ? 0.35 : 1}
      />
      <text
        x={256}
        y={313}
        textAnchor="middle"
        fontFamily="var(--font-display), Arial, sans-serif"
        fontSize={160}
        fontWeight={700}
        fill={mono}
      >
        K
      </text>
    </svg>
  );
}

export function BrandMark({
  compact = false,
  inverse = false,
  label = "KYP Stamping",
  tagline = "Keep stamping · Earn the reward",
}: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3" role="img" aria-label={label}>
      <SealMark size={40} inverse={inverse} />
      {!compact && (
        <span className="leading-none">
          <span className="font-display block text-[16px] font-bold tracking-[-0.02em]">
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
                {/* The brand is two words. A plain text node would lose the
                    leading space to whitespace collapsing, so it is written
                    as an entity. */}
                {label.slice(3).replace(/^ /, " ")}
              </>
            ) : (
              label
            )}
          </span>
          {tagline ? (
            <span
              className={`mt-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${
                inverse ? "text-white/55" : "text-[var(--muted)]"
              }`}
            >
              {tagline}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}

/**
 * Marks data that came from preview mode rather than the API.
 *
 * Rendered wherever `isPreview(data)` is true, and nowhere else: a merchant
 * on production never sees it because production never renders samples.
 */
export function PreviewBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--accent-strong)] bg-[rgb(232_163_61/10%)] px-2.5 py-1 font-mono text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--accent-strong)] ${className}`}
      title="Sample data. This endpoint is not connected yet."
    >
      Preview · not connected
    </span>
  );
}

/**
 * The panel a preview screen opens with: what is being shown, and that the
 * writes beside it are disabled until the API ships the route.
 */
export function PreviewNotice({
  feature,
  detail,
}: {
  feature: string;
  detail?: string;
}) {
  return (
    <div
      role="note"
      className="flex flex-col gap-2 rounded-2xl border border-dashed border-[var(--accent-strong)] bg-[rgb(232_163_61/8%)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm">
        <span className="font-extrabold">{feature}</span>
        <span className="text-[var(--muted-strong)]">
          {" "}
          is shown from sample data. {detail ?? "Saving opens when the API ships this route."}
        </span>
      </p>
      <PreviewBadge />
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
  mark,
}: {
  filled?: number;
  total?: number;
  dark?: boolean;
  /** The merchant's own stamp mark, e.g. their initials. Optional — a
   *  collected stamp reads as a solid dot without one. */
  mark?: React.ReactNode;
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
          className={`font-display grid size-7 place-items-center rounded-full text-[10px] font-bold ${
            index < filled
              ? "bg-[var(--accent)] text-[var(--ink)]"
              : dark
                ? "border border-dashed border-white/40 text-white/50"
                : "border border-dashed border-[var(--line-strong)] text-[var(--muted)]"
          }`}
        >
          {index < filled ? mark : null}
        </span>
      ))}
    </div>
  );
}

/**
 * A modal shell with the focus handling every dialog needs.
 *
 * Extracted from `DemoActionDialog`, which owned it while also insisting that
 * nothing would happen - true for the two previews that still use it, and not
 * for the forms that write to the API.
 */
export function Dialog({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));

    focusables()[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Keep Tab inside the dialog; a modal the user can tab behind is not modal.
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Scrim is decorative: a focusable element before the content would put
          "cancel" first in the tab order. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgb(20_16_13/62%)] backdrop-blur-sm"
      />
      <section
        ref={panelRef}
        className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5 sm:p-6">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 id={titleId} className="mt-2 text-xl font-extrabold tracking-[-0.02em]">
              {title.replace(/\.$/, "")}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)]"
          >
            <X size={17} />
          </button>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
}

/**
 * The preview dialog, for the two screens whose action really is local.
 *
 * Its promise - no request, no message, no account change - is now a claim
 * about those two screens specifically, not about the product.
 */
export function DemoActionDialog({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog title={title} eyebrow="Interactive demo action" onClose={onClose}>
      <div className="flex items-start gap-3 rounded-2xl bg-[rgb(15_118_85/8%)] p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--success)]" />
        <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
          Review and confirm this workflow using local sample data. No backend
          request, message, export, or account change will occur.
        </p>
      </div>
      <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {[
          ["Mode", "Local preview"],
          ["Persistence", "None"],
          ["Network activity", "None"],
        ].map(([term, description]) => (
          <div key={term} className="grid grid-cols-[118px_1fr] gap-3 py-3 text-xs">
            <dt className="font-extrabold text-[var(--muted-strong)]">{term}</dt>
            <dd className="font-bold">{description}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button tone="quiet" onClick={onClose}>
          Cancel
        </Button>
        <Button icon={<Check size={15} />} onClick={onConfirm}>
          Confirm demo action
        </Button>
      </div>
    </Dialog>
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
    warning: "bg-[rgb(143_85_16/12%)] text-[var(--accent-strong)]",
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

/**
 * A grey block standing in for content that has not arrived.
 *
 * Sized by the caller, because a skeleton that does not match the shape of
 * what replaces it makes the page jump when the data lands.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--line)] ${className}`}
      // Decorative: a screen reader should hear the live region below, not a
      // pile of empty boxes.
      aria-hidden
    />
  );
}

/**
 * The three states every screen backed by a request has, in one place.
 *
 * Views used to read a fixture that was always there, so none of them had a
 * loading or an error branch. Rather than add two to each of fourteen views,
 * they wrap in this - and the empty case stays the view's own business,
 * because "no customers yet" and "no campaigns yet" want different words.
 *
 * `isPending` and `error` are plain props rather than a query object, so this
 * package keeps knowing nothing about TanStack Query.
 */
export function QueryBoundary({
  isPending,
  error,
  onRetry,
  label,
  rows = 4,
  children,
}: {
  isPending: boolean;
  error: Error | null;
  onRetry?: () => void;
  /** Names what is loading, for the screen reader. */
  label: string;
  rows?: number;
  children: ReactNode;
}) {
  if (isPending) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading {label}</span>
        <div className="space-y-3">
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // A plan limit is not a failure. Every gated panel routes its error through
  // here, so all of them used to report "That did not load" over a working
  // API and offer a Try again that could only fail the same way. 402 is the
  // API saying the tier does not include this - which is an answer, not a
  // fault, and the one case where retrying is guaranteed to be pointless.
  if (error instanceof ApiError && error.status === 402) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
        <p className="text-sm font-extrabold">Not on your plan</p>
        <p className="mt-1 text-sm text-[var(--muted-strong)]">{error.message}.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"
      >
        <p className="text-sm font-extrabold">That did not load</p>
        <p className="mt-1 text-sm text-[var(--muted-strong)]">
          {error.message}
        </p>
        {onRetry ? (
          <Button className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
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
