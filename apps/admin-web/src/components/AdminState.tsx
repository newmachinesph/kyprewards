"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { admin } from "@kypstamping/demo-data";
import type { Environment, RecoveryItem, SupportTicket } from "@kypstamping/demo-data";

/**
 * The control room's state, above the view switch.
 *
 * Every admin view previously owned its own `useState`, so assigning a ticket,
 * writing an investigation note, or flipping a platform flag was destroyed by
 * the next click — and the sidebar badge never moved because it counted the
 * fixture rather than the queue. This is the single copy, and the seam the
 * FastAPI service replaces.
 */

export type TriagedTicket = SupportTicket & { note: string };

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
  const [tickets, setTickets] = useState<TriagedTicket[]>(() =>
    admin.support.map((ticket) => ({ ...ticket, note: "" })),
  );
  const [flags, setFlags] = useState<Record<string, boolean>>({
    automaticPausing: true,
    publicStatus: true,
    newTenantReview: true,
    adminMfa: true,
  });
  const [recoveryQueue, setRecoveryQueue] = useState<RecoveryItem[]>(() =>
    admin.recoveryQueue.map((item) => ({ ...item })),
  );
  const [environment, setEnvironment] = useState<Environment>("production");

  const patchTicket = useCallback(
    (id: string, patch: Partial<TriagedTicket>) =>
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === id ? { ...ticket, ...patch } : ticket,
        ),
      ),
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
    let moved = 0;
    setRecoveryQueue((current) => {
      moved = current.length;
      return [];
    });
    return moved;
  }, []);

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
