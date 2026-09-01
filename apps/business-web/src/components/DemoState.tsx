"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
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

/** What the onboarding wizard wrote to session storage before handing over. */
export type WorkspaceProfile = {
  businessName: string;
  category: string;
  city: string;
  locations: number;
  program: string;
  method: string;
};

/**
 * The onboarding wizard writes the merchant's answers to session storage
 * before handing over. Reading them is what makes that wizard mean something.
 *
 * Session storage is an external store, so it is read through
 * `useSyncExternalStore` rather than an effect: the server snapshot is `null`,
 * the client snapshot is cached so the value stays referentially stable, and
 * there is no hydration mismatch to paper over.
 */
const WORKSPACE_KEY = "kypstamping-business-profile";
let workspaceCache: WorkspaceProfile | null | undefined;

function subscribeToWorkspace() {
  // Written once, before this app mounts. Nothing to unsubscribe from.
  return () => {};
}

function readWorkspace(): WorkspaceProfile | null {
  if (workspaceCache !== undefined) return workspaceCache;
  try {
    const saved = window.sessionStorage.getItem(WORKSPACE_KEY);
    workspaceCache = saved ? (JSON.parse(saved) as WorkspaceProfile) : null;
  } catch {
    // A malformed or blocked store just means the fixture workspace.
    workspaceCache = null;
  }
  return workspaceCache;
}

const noWorkspaceOnServer = () => null;

type DemoState = {

  /** Dashboard setup ledger — owned here so it survives navigation. */
  testStampDone: boolean;
  completeTestStamp: () => void;

  /** Set when the dashboard scanner hands off to the counter view, so the
   *  merchant is not asked to pick the demo customer a second time. */
  scanHandoff: boolean;
  startScanHandoff: () => void;
  consumeScanHandoff: () => void;

  /** Whatever the onboarding wizard configured, or null when the merchant
   *  entered through the login screen instead. */
  workspace: WorkspaceProfile | null;
};

const DemoStateContext = createContext<DemoState | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [testStampDone, setTestStampDone] = useState(false);
  const [scanHandoff, setScanHandoff] = useState(false);
  const workspace = useSyncExternalStore(
    subscribeToWorkspace,
    readWorkspace,
    noWorkspaceOnServer,
  );

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
      workspace,
    }),
    [
      testStampDone,
      completeTestStamp,
      scanHandoff,
      startScanHandoff,
      consumeScanHandoff,
      workspace,
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
