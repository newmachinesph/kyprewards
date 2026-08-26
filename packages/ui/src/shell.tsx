"use client";

/**
 * Shared demo-shell primitives.
 *
 * The business and admin shells were byte-for-byte copies of the toast block
 * and the hash-routing effect, and had already drifted apart (the toast border
 * used `--line` in one app and `white/10` in the other, on the same dark
 * surface). These are the single copies.
 */

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";

/** One "today" for every app, so a screen-share of all four agrees. */
export function todayLabel(date: Date = new Date()) {
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function useToast(timeoutMs = 2800) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [toast, timeoutMs]);

  return { toast, setToast, dismiss: useCallback(() => setToast(null), []) };
}

export function Toast({
  message,
  onDismiss,
  placement = "corner",
}: {
  message: string;
  onDismiss: () => void;
  /** `corner` for desktop shells, `sheet` for the phone-width PWA. */
  placement?: "corner" | "sheet";
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`z-[70] flex items-start gap-3 rounded-2xl border border-white/10 bg-[var(--ink)] px-4 py-3 text-sm font-bold text-[var(--paper)] shadow-2xl ${
        placement === "corner"
          ? "fixed bottom-5 right-5 max-w-sm"
          : "absolute bottom-24 left-4 right-4"
      }`}
    >
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--success)]">
        <Check size={12} strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="shrink-0 text-white/70 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/**
 * Keeps a view enum in sync with the URL hash so demo views are linkable and
 * the browser back button works.
 */
export function useHashView<T extends string>(views: readonly T[], initial: T) {
  const [view, setView] = useState<T>(initial);

  useEffect(() => {
    const valid = new Set<string>(views);
    function syncFromHash() {
      const next = window.location.hash.slice(1);
      if (valid.has(next)) setView(next as T);
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
    // `views` is a module-level constant in every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((next: T) => {
    setView(next);
    const url = new URL(window.location.href);
    url.hash = next;
    window.history.pushState({ view: next }, "", url);
  }, []);

  return { view, navigate };
}

/**
 * Marks which plan unlocks a feature, so the product agrees with the pricing
 * page instead of quietly showing everything to everyone.
 */
export function PlanTag({
  plan,
  included = false,
}: {
  plan: "Launch" | "Core" | "Grow" | "Scale";
  /** True when the current workspace's plan already covers it. */
  included?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.11em] ${
        included
          ? "border-[rgb(15_118_85/28%)] text-[var(--success)]"
          : "border-[rgb(143_85_16/30%)] bg-[rgb(232_163_61/14%)] text-[var(--accent-strong)]"
      }`}
    >
      {included ? `${plan} plan` : `${plan} feature`}
    </span>
  );
}

/** Standard header row for the demo data tables, so they stop drifting apart. */
export function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
      <tr>
        {columns.map((column) => (
          <th key={column} scope="col" className="px-5 py-3 font-extrabold">
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}
