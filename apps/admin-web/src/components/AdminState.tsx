"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  keys,
  replayRecoveryQueue,
  setPlatformFlag,
  updateSupportTicket,
  useApiMutation,
  usePlatformFlags,
  useQueryClient,
  useRecoveryQueue,
  useSupportQueue,
} from "@kypstamping/api";
import type {
  Environment,
  RecoveryItem,
  SupportTicket,
  ToggleResult,
} from "@kypstamping/api";

/**
 * The control room's state, above the view switch.
 *
 * Every admin view previously owned its own `useState`, so assigning a ticket,
 * writing an investigation note, or flipping a platform flag was destroyed by
 * the next click — and the sidebar badge never moved because it counted the
 * fixture rather than the queue. This is the single copy, and the seam the
 * FastAPI service replaces.
 */

// The API carries the triage note now, so this is SupportTicket unchanged.
// The alias stays because the app names it in a dozen places.
export type TriagedTicket = SupportTicket;

type AdminState = {
  /** Support queue with local triage applied. */
  tickets: TriagedTicket[];
  openTicketCount: number;
  /**
   * Several triage fields at once.
   *
   * The API refuses "Investigating" without a note, so a status change that
   * depends on a note still being written has to carry it - two PATCHes race,
   * and the status one loses.
   */
  updateTicket: (
    id: string,
    patch: Partial<TriagedTicket>,
    onFailure?: (message: string) => void,
  ) => void;
  assignTicket: (id: string, owner: string, onFailure?: (message: string) => void) => void;
  setTicketNote: (id: string, note: string, onFailure?: (message: string) => void) => void;
  setTicketStatus: (id: string, status: string, onFailure?: (message: string) => void) => void;

  /** Network-wide safety defaults. */
  flags: Record<string, boolean>;
  toggleFlag: (key: string) => boolean;

  /** Deliveries awaiting replay. Counted in two places that used to disagree. */
  recoveryQueue: RecoveryItem[];
  replayRecovery: () => number;

  /** Which dataset the integration control room is looking at. */
  environment: Environment;
  setEnvironment: (next: Environment) => void;
};

const AdminStateContext = createContext<AdminState | null>(null);

export function AdminStateProvider({ children }: { children: ReactNode }) {
  // The queue is the API's; triage edits are layered over it rather than
  // seeding a copy that stops agreeing with the server on the first refetch.
  const { data: queue = [] } = useSupportQueue();
  const [triage, setTriage] = useState<Record<string, Partial<TriagedTicket>>>({});
  const tickets = useMemo<TriagedTicket[]>(
    () => queue.map((ticket) => ({ ...ticket, ...triage[ticket.id] })),
    [queue, triage],
  );
  const queryClient = useQueryClient();
  // The switches are the database's, not four hardcoded `true`s: a flag
  // disabled network-wide used to render as on, and a reload put an admin's
  // own change back the way it was.
  const { data: platformFlags = [] } = usePlatformFlags();
  const flags = useMemo(
    () => Object.fromEntries(platformFlags.map((flag) => [flag.id, flag.enabled])),
    [platformFlags],
  );
  const { data: pendingRecovery = [] } = useRecoveryQueue();
  const [replayed, setReplayed] = useState<string[]>([]);
  const recoveryQueue = useMemo<RecoveryItem[]>(
    () => pendingRecovery.filter((item) => !replayed.includes(item.id)),
    [pendingRecovery, replayed],
  );
  const [environment, setEnvironment] = useState<Environment>("production");

  /**
   * Triage is written, then kept locally until the queue refetches.
   *
   * The overlay is what stops an assignment flickering back to unassigned in
   * the moment between the response and the refresh; it is not a second copy
   * of the queue, only of what this admin just changed.
   */
  const write = useApiMutation(
    ({ id, patch }: { id: string; patch: Partial<TriagedTicket> }) =>
      updateSupportTicket(id, patch),
    { invalidates: [keys.admin.support()] },
  );
  const patchTicket = useCallback(
    (id: string, patch: Partial<TriagedTicket>, onFailure?: (message: string) => void) => {
      setTriage((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
      write.mutate(
        { id, patch },
        {
          /**
           * The API refuses some transitions - "Investigating" without an
           * internal note is one - and the overlay kept showing the move
           * regardless: nothing cleared it, and the refetch only runs on
           * success. The console went on reporting a status the database
           * never accepted.
           */
          onError: (failure) => {
            setTriage((current) => {
              const existing = current[id];
              if (!existing) return current;
              const reverted = { ...existing };
              for (const field of Object.keys(patch)) {
                delete reverted[field as keyof TriagedTicket];
              }
              const next = { ...current };
              if (Object.keys(reverted).length) next[id] = reverted;
              else delete next[id];
              return next;
            });
            onFailure?.(failure.message);
          },
        },
      );
    },
    [write],
  );

  const updateTicket = patchTicket;
  const assignTicket = useCallback(
    (id: string, owner: string, onFailure?: (message: string) => void) =>
      patchTicket(id, { owner }, onFailure),
    [patchTicket],
  );
  const setTicketNote = useCallback(
    (id: string, note: string, onFailure?: (message: string) => void) =>
      patchTicket(id, { note }, onFailure),
    [patchTicket],
  );
  const setTicketStatus = useCallback(
    (id: string, status: string, onFailure?: (message: string) => void) =>
      patchTicket(id, { status }, onFailure),
    [patchTicket],
  );

  /**
   * A platform flag is network-wide, so it is the server's answer that counts.
   *
   * Written straight into the cached list rather than invalidated: the switch
   * has to move on the press, and a refetch racing the optimistic flip is
   * what makes a toggle appear to bounce back on its own. The API returns the
   * value it settled on, so that replaces the guess; a refusal restores it.
   */
  const patchFlag = useCallback(
    (key: string, enabled: boolean) =>
      queryClient.setQueryData<ToggleResult[]>(keys.admin.flags(), (current) =>
        (current ?? []).map((flag) => (flag.id === key ? { ...flag, enabled } : flag)),
      ),
    [queryClient],
  );
  const flagWrite = useApiMutation(
    ({ key, value }: { key: string; value: boolean }) => setPlatformFlag(key, value),
  );
  const toggleFlag = useCallback(
    (key: string) => {
      const next = !flags[key];
      patchFlag(key, next);
      flagWrite.mutate(
        { key, value: next },
        {
          onSuccess: (result) => patchFlag(result.id, result.enabled),
          onError: () => patchFlag(key, !next),
        },
      );
      return next;
    },
    [flags, flagWrite, patchFlag],
  );

  /** Moving deliveries into replay empties the queue, so the count that drove
   *  the headline actually changes. Returns how many were queued. */
  /**
   * Moves every dead-lettered delivery back into the send queue. The count
   * that drove the headline is the API's, not the length of a local array.
   */
  const replay = useApiMutation(replayRecoveryQueue, {
    invalidates: [keys.admin.recoveryQueue()],
  });
  const replayRecovery = useCallback(() => {
    const moved = recoveryQueue.map((item) => item.id);
    setReplayed((current) => [...current, ...moved]);
    replay.mutate(undefined, {
      onError: () =>
        setReplayed((current) => current.filter((id) => !moved.includes(id))),
    });
    return moved.length;
  }, [recoveryQueue, replay]);

  const openTicketCount = tickets.filter(
    (ticket) => ticket.status === "Open",
  ).length;

  const value = useMemo<AdminState>(
    () => ({
      tickets,
      openTicketCount,
      updateTicket,
      assignTicket,
      setTicketNote,
      setTicketStatus,
      flags,
      toggleFlag,
      recoveryQueue,
      replayRecovery,
      environment,
      setEnvironment,
    }),
    [
      tickets,
      openTicketCount,
      updateTicket,
      assignTicket,
      setTicketNote,
      setTicketStatus,
      flags,
      toggleFlag,
      recoveryQueue,
      replayRecovery,
      environment,
    ],
  );

  return (
    <AdminStateContext.Provider value={value}>
      {children}
    </AdminStateContext.Provider>
  );
}

export function useAdminState() {
  const value = useContext(AdminStateContext);
  if (!value) {
    throw new Error("useAdminState must be used inside AdminStateProvider");
  }
  return value;
}
