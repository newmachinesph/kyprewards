"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRecoveryQueue, useSupportQueue } from "@kypstamping/api";
import type { Environment, RecoveryItem, SupportTicket } from "@kypstamping/api";

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
  assignTicket: (id: string, owner: string) => void;
  setTicketNote: (id: string, note: string) => void;
  setTicketStatus: (id: string, status: string) => void;

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
  const [flags, setFlags] = useState<Record<string, boolean>>({
    automaticPausing: true,
    publicStatus: true,
    newTenantReview: true,
    adminMfa: true,
  });
  const { data: pendingRecovery = [] } = useRecoveryQueue();
  const [replayed, setReplayed] = useState<string[]>([]);
  const recoveryQueue = useMemo<RecoveryItem[]>(
    () => pendingRecovery.filter((item) => !replayed.includes(item.id)),
    [pendingRecovery, replayed],
  );
  const [environment, setEnvironment] = useState<Environment>("production");

  const patchTicket = useCallback(
    (id: string, patch: Partial<TriagedTicket>) =>
      setTriage((current) => ({ ...current, [id]: { ...current[id], ...patch } })),
    [],
  );

  const assignTicket = useCallback(
    (id: string, owner: string) => patchTicket(id, { owner }),
    [patchTicket],
  );
  const setTicketNote = useCallback(
    (id: string, note: string) => patchTicket(id, { note }),
    [patchTicket],
  );
  const setTicketStatus = useCallback(
    (id: string, status: string) => patchTicket(id, { status }),
    [patchTicket],
  );

  const toggleFlag = useCallback((key: string) => {
    let next = false;
    setFlags((current) => {
      next = !current[key];
      return { ...current, [key]: next };
    });
    return next;
  }, []);

  /** Moving deliveries into replay empties the queue, so the count that drove
   *  the headline actually changes. Returns how many were queued. */
  const replayRecovery = useCallback(() => {
    const moved = recoveryQueue.map((item) => item.id);
    setReplayed((current) => [...current, ...moved]);
    return moved.length;
  }, [recoveryQueue]);

  const openTicketCount = tickets.filter(
    (ticket) => ticket.status === "Open",
  ).length;

  const value = useMemo<AdminState>(
    () => ({
      tickets,
      openTicketCount,
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
