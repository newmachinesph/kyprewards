"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
/**
 * Client state, and only client state.
 *
 * This used to hold the workspace itself — programs, campaigns, staff,
 * automations and integrations — seeded from the fixture and edited in place.
 * All of that is server state now: it comes from the hooks in
 * `@kypstamping/api` and changes through the mutations beside them, so there
 * is one copy of it and a refetch cannot disagree with a local edit.
 *
 * What is left is what the API has never heard of. Views are unmounted when
 * the merchant navigates, so anything they own is destroyed on the next
 * click; these four things have to outlive that.
 *
 * The integration credentials, webhook deliveries and the outbound endpoint
 * that used to live here moved out with the rest: all of them are the API's,
 * and holding a copy of a credential list beside the one the server keeps is
 * how a revoked key goes on looking active.
 */

type DemoState = {

  /** Dashboard setup ledger — owned here so it survives navigation. */
  testStampDone: boolean;
  completeTestStamp: () => void;

  /** Set when the dashboard scanner hands off to the counter view, so the
   *  merchant is not asked to pick the demo customer a second time. */
  scanHandoff: boolean;
  startScanHandoff: () => void;
  consumeScanHandoff: () => void;
};

const DemoStateContext = createContext<DemoState | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [testStampDone, setTestStampDone] = useState(false);
  const [scanHandoff, setScanHandoff] = useState(false);

  const completeTestStamp = useCallback(() => setTestStampDone(true), []);
  const startScanHandoff = useCallback(() => setScanHandoff(true), []);
  const consumeScanHandoff = useCallback(() => setScanHandoff(false), []);

  const value = useMemo<DemoState>(
    () => ({
      testStampDone,
      completeTestStamp,
      scanHandoff,
      startScanHandoff,
      consumeScanHandoff,
    }),
    [
      testStampDone,
      completeTestStamp,
      scanHandoff,
      startScanHandoff,
      consumeScanHandoff,
    ],
  );

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}

export function useDemoState() {
  const value = useContext(DemoStateContext);
  if (!value) {
    throw new Error("useDemoState must be used inside DemoStateProvider");
  }
  return value;
}
