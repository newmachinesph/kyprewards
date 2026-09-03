"use client";

import { useSyncExternalStore } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * Google Analytics, loaded only after the visitor says yes.
 *
 * The cookies page promises that no analytics script loads before consent,
 * and the whole site sells "consent is per purpose" as a product principle.
 * Loading a third-party tag on first paint and asking afterwards would break
 * both. So: nothing is fetched from Google until the choice below is
 * "granted", the choice lives in this browser only, and it can be changed on
 * the cookies page at any time.
 *
 * The choice is read through `useSyncExternalStore` rather than an effect:
 * browser storage is an external store, the server snapshot is "pending" so
 * the first client render matches the server exactly, and both components
 * on the page re-render when either one writes.
 */

const KEY = "kyp-analytics-consent";
type Choice = "granted" | "denied";
/** `pending` = not yet known on this render (server, or hydrating). */
type Snapshot = Choice | "unset" | "pending";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Snapshot {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    return "unset";
  }
}

function getServerSnapshot(): Snapshot {
  return "pending";
}

function write(choice: Choice) {
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    // Storage blocked: the choice simply does not persist past this page.
  }
  listeners.forEach((notify) => notify());
}

function useChoice() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function AnalyticsConsent({ gaId }: { gaId: string }) {
  const choice = useChoice();

  if (choice === "granted") return <GoogleAnalytics gaId={gaId} />;
  if (choice !== "unset") return null;

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-[560px] rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgb(24_18_12/22%)] sm:inset-x-6 sm:bottom-6"
    >
      <p id="consent-title" className="text-sm font-extrabold">
        Can we count visits?
      </p>
      <p
        id="consent-body"
        className="mt-1.5 text-sm leading-relaxed text-[var(--muted-strong)]"
      >
        We would like to use Google Analytics to see which pages actually help
        people. Nothing loads until you say yes, and you can change your mind
        on the cookies page.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => write("granted")}
          className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--surface)] transition hover:-translate-y-0.5"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => write("denied")}
          className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-5 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--ink)]"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}

/** The control on the cookies page that lets a visitor change their answer. */
export function AnalyticsPreference() {
  const choice = useChoice();

  function decide(next: Choice) {
    write(next);
    // The tag, if it was loaded, is already on the page; a reload is the
    // honest way to make "off" mean off.
    if (next === "denied") window.location.reload();
  }

  const label =
    choice === "granted"
      ? "Analytics is on for this browser."
      : choice === "denied"
        ? "Analytics is off for this browser."
        : choice === "unset"
          ? "You have not been asked yet."
          : " ";

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-extrabold">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide("granted")}
          disabled={choice === "granted"}
          className="focus-ring inline-flex min-h-10 items-center rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-4 text-xs font-extrabold text-[var(--surface)] disabled:opacity-40"
        >
          Turn on
        </button>
        <button
          type="button"
          onClick={() => decide("denied")}
          disabled={choice === "denied"}
          className="focus-ring inline-flex min-h-10 items-center rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-xs font-bold disabled:opacity-40"
        >
          Turn off
        </button>
      </div>
    </div>
  );
}
