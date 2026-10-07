"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ApiError, recordVisit } from "@kyprewards/api";

/**
 * A stamp taken while the till had no signal.
 *
 * Carries its own idempotency key rather than minting one at sync time: the
 * key is what stops a replay from stamping twice, so it has to be decided
 * when the sale happened and survive with it.
 */
export type HeldVisit = {
  idempotencyKey: string;
  customerId: string;
  customerName: string;
  amountCentavos: number;
  occurredAt: string;
  /** The till's branch, so a replayed sale lands where it was rung up. */
  branchId?: string;
};

/** What a drain did: sales recorded, and held visits the API turned away. */
export type SyncOutcome = {
  settled: number;
  /** One line per visit that will never record, named for the cashier. */
  refused: string[];
};

/**
 * localStorage rather than memory: losing signal and losing the tab are the
 * same evening, and a queue a refresh empties is worse than no queue - it
 * looks like the sale was recorded.
 */
const QUEUE_KEY = "kyprewards-offline-queue";

let cache: HeldVisit[] = [];
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function readQueue(): HeldVisit[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(QUEUE_KEY) ?? window.localStorage.getItem("kypstamping-offline-queue");
  } catch {
    // A private window, or storage the browser refuses. The counter still
    // works online; it just cannot promise to remember.
    raw = null;
  }
  // The same array identity for the same stored string: useSyncExternalStore
  // compares snapshots by reference, and parsing afresh on every call is an
  // infinite render.
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? (JSON.parse(raw) as HeldVisit[]) : [];
    } catch {
      cache = [];
    }
  }
  return cache;
}

function writeQueue(queue: HeldVisit[]) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Nothing useful to do. The visit is still in memory for this session.
  }
  cacheRaw = null;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab of the same till counts: two registers, one queue.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The server has no localStorage, so it renders an empty queue. */
const EMPTY: HeldVisit[] = [];
const emptyOnServer = () => EMPTY;

function subscribeToConnection(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

const isOnline = () => navigator.onLine;
/** Optimistic on the server: a page rendered there reached the network. */
const onlineOnServer = () => true;

/**
 * The counter's offline queue, and the replay that drains it.
 *
 * Deliberately not `POST /counter/offline-sync`: that endpoint wants each
 * entry HMAC-signed with the workspace's signing secret, which is a
 * server-side secret a browser must never hold. It exists for a POS sidecar
 * that does hold one. A browser has a better tool for the same job - the
 * per-visit `Idempotency-Key` the API already honours - so a held stamp is
 * replayed as the ordinary transaction it always was, and replaying it twice
 * settles once.
 */
export function useOfflineQueue(onSynced: (outcome: SyncOutcome) => void) {
  const queue = useSyncExternalStore(subscribe, readQueue, emptyOnServer);
  const online = useSyncExternalStore(subscribeToConnection, isOnline, onlineOnServer);

  const enqueue = useCallback((visit: HeldVisit) => {
    writeQueue([...readQueue(), visit]);
  }, []);

  const sync = useCallback(async () => {
    const pending = readQueue();
    if (pending.length === 0) return;

    // Out of the queue: every visit the API answered for good, recorded or
    // refused. Only a missing network, a server fault or a rate limit is worth
    // another try. A 409 used to count as "already settled" - but a replay of
    // a settled key answers 201 with the stored result, and a 409 is a refusal
    // (the cooldown, no live program), so real refusals vanished as "synced".
    const done: string[] = [];
    const refused: string[] = [];
    let settled = 0;
    for (const visit of pending) {
      try {
        const result = await recordVisit(
          {
            customerId: visit.customerId,
            amountCentavos: visit.amountCentavos,
            branchId: visit.branchId,
          },
          visit.idempotencyKey,
        );
        done.push(visit.idempotencyKey);
        settled += 1;
        if (result.earned === false) {
          refused.push(`${visit.customerName}: recorded, no stamp - ${result.reason ?? "not eligible"}`);
        }
      } catch (failure) {
        const retryable =
          !(failure instanceof ApiError) || failure.status >= 500 || failure.status === 429;
        if (retryable) continue;
        done.push(visit.idempotencyKey);
        refused.push(`${visit.customerName}: not recorded - ${failure.message}`);
      }
    }

    if (done.length === 0) return;
    writeQueue(pending.filter((visit) => !done.includes(visit.idempotencyKey)));
    onSynced({ settled, refused });
  }, [onSynced]);

  // Drain on reconnect: the counter should not need anybody to press anything.
  useEffect(() => {
    if (online && queue.length > 0) void sync();
  }, [online, queue.length, sync]);

  return { queue, online, enqueue, sync };
}
