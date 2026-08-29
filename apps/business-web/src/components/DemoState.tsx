"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
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
 * click; these five things have to outlive that.
 *
 * The integration credentials and webhook deliveries that used to live here
 * moved out with the rest: both are the API's, and holding a copy of a
 * credential list beside the one the server keeps is how a revoked key goes
 * on looking active.
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

const DEFAULT_WEBHOOK_URL = "https://pos.sweetcrumbs.ph/webhooks/kypstamping";

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
  settings: Record<string, boolean>;
  setSetting: (key: string, value: boolean) => void;

  /** The input the merchant is editing. */
  webhookUrl: string;
  setWebhookUrl: Dispatch<SetStateAction<string>>;
  /** The last value they committed with Save, so the button means something. */
  savedWebhookUrl: string;
  saveWebhookUrl: () => void;

  subscribedEvents: string[];
  setSubscribedEvents: Dispatch<SetStateAction<string[]>>;

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
  const [settings, setSettings] = useState<Record<string, boolean>>({
    autoTopUpSms: true,
    invoiceEmails: true,
  });
  const [webhookUrl, setWebhookUrl] = useState(DEFAULT_WEBHOOK_URL);
  const [savedWebhookUrl, setSavedWebhookUrl] = useState(DEFAULT_WEBHOOK_URL);
  const [subscribedEvents, setSubscribedEvents] = useState([
    "visit.recorded",
    "reward.redeemed",
  ]);
  const [testStampDone, setTestStampDone] = useState(false);
  const [scanHandoff, setScanHandoff] = useState(false);
  const workspace = useSyncExternalStore(
    subscribeToWorkspace,
    readWorkspace,
    noWorkspaceOnServer,
  );

  const setSetting = useCallback((key: string, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const saveWebhookUrl = useCallback(() => {
    setWebhookUrl((current) => {
      setSavedWebhookUrl(current);
      return current;
    });
  }, []);

  const completeTestStamp = useCallback(() => setTestStampDone(true), []);
  const startScanHandoff = useCallback(() => setScanHandoff(true), []);
  const consumeScanHandoff = useCallback(() => setScanHandoff(false), []);

  const value = useMemo<DemoState>(
    () => ({
      settings,
      setSetting,
      webhookUrl,
      setWebhookUrl,
      savedWebhookUrl,
      saveWebhookUrl,
      subscribedEvents,
      setSubscribedEvents,
      testStampDone,
      completeTestStamp,
      scanHandoff,
      startScanHandoff,
      consumeScanHandoff,
      workspace,
    }),
    [
      settings,
      setSetting,
      webhookUrl,
      savedWebhookUrl,
      saveWebhookUrl,
      subscribedEvents,
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
