/**
 * Client state — and only client state.
 *
 * The split that matters: anything the server owns is a query, anything the
 * browser owns is a store. Copying server data into zustand gives you two
 * copies that disagree the moment one refetches, and the bug reads as "the
 * list is stale" rather than "we cached it twice".
 *
 * So: no customers, programs, campaigns or metrics here. Those are queries.
 * What lives here is what the server has never heard of — which tab is open,
 * what the counter has scanned but not yet submitted, whether the sidebar is
 * collapsed.
 *
 * `apps/business-web/src/components/DemoState.tsx` currently holds both kinds
 * in one context. Its server half is superseded by the hooks in `queries.ts`;
 * its client half is what these stores replace.
 */

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

export { useShallow };

/* ── Session ──────────────────────────────────────────────────────────
   Who is signed in is server state - it comes from GET /auth/session, and
   the session itself is an httpOnly cookie this code cannot read. What is
   client state is which workspace the user picked, because a user with two
   merchants has to choose and that choice should survive a reload. */

type SessionStore = {
  /** Selected merchant, or null before a workspace is chosen. */
  merchantId: string | null;
  selectWorkspace: (merchantId: string) => void;
  clearWorkspace: () => void;
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      merchantId: null,
      selectWorkspace: (merchantId) => set({ merchantId }),
      clearWorkspace: () => set({ merchantId: null }),
    }),
    {
      name: "stampr.session",
      // sessionStorage, not local: a shared counter tablet should not still
      // be in the last user's workspace tomorrow morning.
      storage: createJSONStorage(() => sessionStorage),
      // `skipHydration` is not set, so the store rehydrates on mount. Read it
      // through `useHydrated()` below before branching on it during render.
    },
  ),
);

/* ── Counter ──────────────────────────────────────────────────────────
   The one screen where losing client state costs money: a cashier has
   scanned a customer and is mid-transaction. None of this is on the server
   until Submit, and all of it must survive a navigation. */

export type ScannedCustomer = {
  id: string;
  name: string;
  memberCode: string;
  isMember: boolean;
};

type CounterStore = {
  scanned: ScannedCustomer | null;
  /** Pesos as typed; converted to centavos at submit. */
  amount: string;
  programId: string | null;
  /**
   * Stable per attempt, regenerated only after a submit settles. A retry
   * after a timeout reuses it, so the API replays the first response instead
   * of recording a second visit.
   */
  idempotencyReference: string;

  scan: (customer: ScannedCustomer) => void;
  setAmount: (amount: string) => void;
  setProgram: (programId: string | null) => void;
  /** Clears the customer and starts a new idempotency reference. */
  reset: () => void;
};

const newReference = () =>
  // crypto.randomUUID is unavailable on http:// origins other than localhost,
  // which is exactly how a counter tablet reaches a LAN dev server.
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

export const useCounterStore = create<CounterStore>()((set) => ({
  scanned: null,
  amount: "",
  programId: null,
  idempotencyReference: newReference(),

  scan: (customer) => set({ scanned: customer }),
  setAmount: (amount) => set({ amount }),
  setProgram: (programId) => set({ programId }),
  reset: () =>
    set({
      scanned: null,
      amount: "",
      programId: null,
      idempotencyReference: newReference(),
    }),
}));

/* ── Per-app interface state ──────────────────────────────────────── */

type UiStore = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  /** Live-region text. Announced once, then cleared by the announcer. */
  announcement: string;
  announce: (message: string) => void;
  clearAnnouncement: () => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      announcement: "",
      announce: (announcement) => set({ announcement }),
      clearAnnouncement: () => set({ announcement: "" }),
    }),
    {
      name: "stampr.ui",
      storage: createJSONStorage(() => localStorage),
      // An announcement is for the screen reader in this moment, not for
      // tomorrow. Only the layout preference is worth persisting.
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);

/* ── Hydration ────────────────────────────────────────────────────── */

/**
 * `false` until the persisted stores have rehydrated in the browser.
 *
 * The server renders with the store's initial state and the client rehydrates
 * from storage immediately after, so anything that branches on a persisted
 * value renders differently on the two passes — which React reports as a
 * hydration mismatch and resolves by throwing away the server HTML. Gate on
 * this and render the initial state until it flips.
 *
 * ```tsx
 * const hydrated = useHydrated();
 * const collapsed = useUiStore((s) => s.sidebarCollapsed);
 * <nav data-collapsed={hydrated && collapsed}>
 * ```
 */
export function useHydrated(): boolean {
  // Whether we are on the client is a fact about the environment, not React
  // state, and `useSyncExternalStore` is the sanctioned way to read one: the
  // server snapshot is used through hydration and the client snapshot after.
  // Same approach `DemoState.tsx` already takes for session storage, and
  // unlike a `useState` + `useEffect` pair it does not set state from an
  // effect body.
  return useSyncExternalStore(subscribeNever, onClient, onServer);
}

const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;
