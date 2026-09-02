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
import { Check, TriangleAlert, X } from "lucide-react";

/** How a demo notification should surface. "review" opens the confirm dialog
 *  that discloses nothing is persisted; "info" is a passive toast. */
export type NotifyIntent = "info" | "review" | "error";

/** Date and money formatting live in `./format`. Re-exported here because
 *  every shell already imports from this module. */
export { greeting, peso, pesoCompact, pesoFromCentavos, relativeTime, todayLabel } from "./format";

/**
 * A toast that clears itself, unless it is carrying a refusal.
 *
 * Pass `0` to keep it up until dismissed. Every plan wall in the merchant app
 * reports through here, and at 2.8 seconds the answer was gone before it
 * could be read: a tester searched a whole rendered page for "higher plan",
 * "Launch" and "upgrade" and found none of them, and concluded the button
 * simply did nothing. A refusal has to outlast the glance that follows it.
 */
export function useToast(timeoutMs = 2800) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast || timeoutMs <= 0) return;
    const timeout = window.setTimeout(() => setToast(null), timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [toast, timeoutMs]);

  return { toast, setToast, dismiss: useCallback(() => setToast(null), []) };
}

export function Toast({
  message,
  onDismiss,
  placement = "corner",
  tone = "success",
}: {
  message: string;
  onDismiss: () => void;
  /** `corner` for desktop shells, `sheet` for the phone-width PWA. */
  placement?: "corner" | "sheet";
  /** `error` swaps the tick for a warning mark and announces assertively. */
  tone?: "success" | "error";
}) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`z-[70] flex items-start gap-3 rounded-2xl border border-white/10 bg-[var(--ink)] px-4 py-3 text-sm font-bold text-[var(--paper)] shadow-2xl ${
        placement === "corner"
          ? "fixed bottom-5 right-5 max-w-sm"
          : "absolute bottom-24 left-4 right-4"
      }`}
    >
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${isError ? "bg-[var(--danger)]" : "bg-[var(--success)]"}`}
      >
        {isError ? (
          <TriangleAlert size={12} strokeWidth={3} />
        ) : (
          <Check size={12} strokeWidth={3} />
        )}
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
      if (valid.has(next)) {
        setView(next as T);
        return;
      }
      // No hash means the user navigated back past the first view. Returning
      // to the initial view is what Back is expected to do; ignoring it left
      // the UI stranded on the previous view with the URL already reset.
      if (next === "") setView(initial);
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
