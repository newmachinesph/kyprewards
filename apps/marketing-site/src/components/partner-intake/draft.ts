"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The application, as the merchant has filled it in so far.
 *
 * Deliberately smaller than it could be. Every field here has to survive the
 * question "does approval depend on it?" - a branch nickname, a reward
 * mechanic and a username all fail that test, so they belong in the
 * dashboard after approval rather than in front of somebody deciding whether
 * to start at all.
 */
export type PartnerDraft = {
  // Step 1 — the shop
  businessName: string;
  category: string;
  branches: string;
  address: string;
  mapsLink: string;
  notOnMaps: boolean;
  // Step 2 — the person
  ownerName: string;
  mobile: string;
  email: string;
  facebook: string;
  // Step 3 — the counter
  volume: string;
  existing: string;
  mechanic: string;
};

export const EMPTY_DRAFT: PartnerDraft = Object.freeze({
  businessName: "",
  category: "",
  branches: "1",
  address: "",
  mapsLink: "",
  notOnMaps: false,
  ownerName: "",
  mobile: "",
  email: "",
  facebook: "",
  volume: "",
  existing: "",
  mechanic: "",
});

/**
 * Kept in `localStorage`, not in React state.
 *
 * A partner application is filled in behind a counter, between customers, on
 * a phone that rings. Losing it to a refresh is the single most expensive
 * thing this form could do, and it is the thing most application forms do.
 */
const KEY = "kyprewards-partner-draft";

let cache: PartnerDraft = EMPTY_DRAFT;
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function read(): PartnerDraft {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY) ?? window.localStorage.getItem("kypstamping-partner-draft");
  } catch {
    // A private window, or storage the browser refuses. The form still works;
    // it just cannot promise to remember.
    raw = null;
  }
  // One object identity per stored string. `useSyncExternalStore` compares
  // snapshots by reference, so parsing afresh every call is an infinite
  // render rather than a slow one.
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as PartnerDraft) } : EMPTY_DRAFT;
    } catch {
      cache = EMPTY_DRAFT;
    }
  }
  return cache;
}

function write(next: PartnerDraft) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Nothing useful to do. The value is still in memory for this session.
  }
  cacheRaw = null;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab counts: the same person, one application.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The server has no storage, so it renders the empty form and hydrates cleanly. */
const emptyOnServer = () => EMPTY_DRAFT;

export function usePartnerDraft() {
  const draft = useSyncExternalStore(subscribe, read, emptyOnServer);

  const patch = useCallback((changes: Partial<PartnerDraft>) => {
    write({ ...read(), ...changes });
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Same as above: best effort.
    }
    cacheRaw = null;
    for (const listener of listeners) listener();
  }, []);

  return { draft, patch, clear };
}

/* ── Formatting and validation ─────────────────────────────────────── */

/**
 * Any way a Filipino writes their own number, into one shape.
 *
 * 0917…, +63917…, 63917…, and the same with spaces or dashes all mean the
 * same eleven digits. Rejecting nine of those ten spellings is a form
 * blaming a merchant for its own narrowness.
 */
export function normalizeMobile(typed: string): string {
  const digits = typed.replace(/\D/g, "");
  if (digits.startsWith("63")) return digits.slice(2, 12);
  if (digits.startsWith("0")) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

/** `917 123 4567` — grouped the way it is read aloud. */
export function displayMobile(national: string): string {
  const [, a = "", b = "", c = ""] =
    /^(\d{0,3})(\d{0,3})(\d{0,4})$/.exec(national) ?? [];
  return [a, b, c].filter(Boolean).join(" ");
}

export const isCompleteMobile = (national: string) =>
  /^9\d{9}$/.test(national);

export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

// The intake and the dashboard's location editor accept the same four
// formats; the rule lives with the schemas so it can only be one rule.
export { isMapsLink } from "@kyprewards/api/maps-link";
