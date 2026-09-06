"use client";

/**
 * What every view file shares: the notify signature, the export helper, the
 * input class, a labelled field, and the small "why is this disabled" line.
 */

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  downloadExport,
  getSession,
  keys,
  type ExportKind,
  type PlanName,
} from "@kypstamping/api";
import { PlanTag, type NotifyIntent } from "@kypstamping/ui/shell";

export type Notify = (message: string, intent?: NotifyIntent) => void;

/** Who is signed in, for "issued by" lines. Cached under the session key. */
export const useSessionInfo = () =>
  useQuery({
    queryKey: keys.session.current(),
    queryFn: getSession,
    staleTime: 60_000,
  });

/** A fresh reference for an idempotency key. Same fallback as the counter store. */
export const newReference = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

export const inputClass =
  "min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)] disabled:opacity-60";

export const darkInputClass =
  "min-h-11 w-full rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-60";

/** Initials from a name, since a counter lookup does not return them. */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Streams a CSV and hands it to the browser.
 *
 * Shared by the customers, redemptions and message-log screens: three buttons
 * that promised an export and produced a toast until the endpoints existed.
 */
export function useExport(notify: Notify) {
  const [busy, setBusy] = useState<ExportKind | null>(null);
  return {
    busy,
    runExport: async (kind: ExportKind) => {
      setBusy(kind);
      try {
        await downloadExport(kind);
        notify(`${kind} export downloaded.`);
      } catch (failure) {
        notify(
          failure instanceof ApiError
            ? failure.message
            : "Could not prepare that export.",
          "error",
        );
      } finally {
        setBusy(null);
      }
    },
  };
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold">
      {label}
      {children}
      {hint ? (
        <span className="text-[10px] font-semibold text-[var(--muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/**
 * What a panel says when it has nothing to show.
 *
 * Six panels rendered a heading, or a table's header row, over blank space -
 * campaign history, the delivery desk, connected services, counter activity,
 * top regular choices, redemptions. A merchant cannot tell a screen with no
 * data yet from one that failed to load, and the ones here are the screens
 * they check when they are already worried.
 */
export function NothingYet({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 py-8 text-center text-xs leading-relaxed text-[var(--muted-strong)]">
      {children}
    </p>
  );
}

/** The one line under a disabled write, so no screen invents its own. */
export function BlockedNote({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return (
    <p
      role="note"
      className="text-[11px] font-semibold text-[var(--muted-strong)]"
    >
      {reason}
    </p>
  );
}

/** A section heading with the tier tag beside it. */
export function TierHeading({
  title,
  needed,
  covered,
  children,
}: {
  title: string;
  needed: PlanName;
  covered: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <span className="flex items-center gap-2">
        {children}
        <PlanTag plan={needed} included={covered} />
      </span>
    </div>
  );
}

/** `"2026-09-04"` from a Date, in local time. */
export const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const onlyDigits = (typed: string) => typed.replace(/[^0-9]/g, "");
export const onlyMoney = (typed: string) => typed.replace(/[^0-9.]/g, "");
export const pesosToCentavos = (typed: string) =>
  Math.round((Number.parseFloat(typed) || 0) * 100);
