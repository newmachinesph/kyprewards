import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
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
  label = "Stampr",
}: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3" aria-label={label}>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-[14px] text-[15px] font-black tracking-[-0.06em] ${
          inverse
            ? "bg-[var(--paper)] text-[var(--ink)]"
            : "bg-[var(--ink)] text-[var(--paper)]"
        }`}
      >
        S
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[16px] font-bold tracking-[-0.03em]">
            {label}
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
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition duration-200 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]} ${className}`}
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
          className={`grid size-7 place-items-center rounded-full border text-[9px] font-black ${
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
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="demo-action-title">
      <button type="button" aria-label="Close demo action" onClick={onClose} className="absolute inset-0 cursor-default bg-[rgb(20_16_13/62%)] backdrop-blur-sm" />
      <section className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5 sm:p-6">
          <div>
            <Eyebrow>Interactive demo action</Eyebrow>
            <h2 id="demo-action-title" className="mt-2 text-xl font-black tracking-[-0.035em]">
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
                <dt className="font-black text-[var(--muted-strong)]">{term}</dt>
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
