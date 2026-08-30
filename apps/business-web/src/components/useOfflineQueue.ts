"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ApiError, recordVisit } from "@kypstamping/api";

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
};

/**
 * localStorage rather than memory: losing signal and losing the tab are the
 * same evening, and a queue a refresh empties is worse than no queue - it
 * looks like the sale was recorded.
 */
const QUEUE_KEY = "kypstamping-offline-queue";

let cache: HeldVisit[] = [];
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function readQueue(): HeldVisit[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(QUEUE_KEY);
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
export function useOfflineQueue(onSynced: (settled: number) => void) {
  const queue = useSyncExternalStore(subscribe, readQueue, emptyOnServer);
  const online = useSyncExternalStore(subscribeToConnection, isOnline, onlineOnServer);

  const enqueue = useCallback((visit: HeldVisit) => {
    writeQueue([...readQueue(), visit]);
  }, []);

  const sync = useCallback(async () => {
    const pending = readQueue();
    if (pending.length === 0) return;

    const settled: string[] = [];
    for (const visit of pending) {
      try {
        await recordVisit(
          { customerId: visit.customerId, amountCentavos: visit.amountCentavos },
          visit.idempotencyKey,
        );
        settled.push(visit.idempotencyKey);
      } catch (failure) {
        // A 409 means this key already settled - the sale is recorded, which
        // is exactly what the queue wanted. Anything else is worth another
        // try, so it stays.
        if (failure instanceof ApiError && failure.status === 409) {
          settled.push(visit.idempotencyKey);
        }
      }
    }

    if (settled.length === 0) return;
    writeQueue(pending.filter((visit) => !settled.includes(visit.idempotencyKey)));
    onSynced(settled.length);
  }, [onSynced]);

  // Drain on reconnect: the counter should not need anybody to press anything.
  useEffect(() => {
    if (online && queue.length > 0) void sync();
  }, [online, queue.length, sync]);

  return { queue, online, enqueue, sync };
}
