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
import { sharedScenario } from "@kypstamping/demo-data";
import type { Credential, Delivery } from "@kypstamping/api";

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
 * The integration credentials and webhook deliveries below are still local.
 * They have endpoints — `/integration-credentials` and `/webhook-deliveries` —
 * and moving them is the next piece of this migration, not a different one.
 */

export type { Credential, Delivery };

/** What the onboarding wizard wrote to session storage before handing over. */
export type WorkspaceProfile = {
  businessName: string;
  category: string;
  city: string;
  locations: number;
  program: string;
  method: string;
};

const INITIAL_CREDENTIALS: Credential[] = [
  {
    id: "key_counter_01",
    label: "Main counter",
    clientKey: "st_test_sc_7K9P2D4M",
    // The live counter in the shared scenario. Legazpi Village is still in
    // setup, so scoping the main counter key there made no sense.
    branch: "Kapitolyo",
    scopes: ["customers:read", "transactions:write", "rewards:read"],
    lastUsed: "18 seconds ago",
    status: "Active",
    environment: "sandbox",
  },
  {
    id: "key_staging_02",
    label: "Developer staging",
    clientKey: "st_test_sc_1H3F8W6Q",
    branch: "All sandbox branches",
    scopes: ["customers:read", "transactions:write", "rewards:read", "redemptions:write"],
    lastUsed: "Yesterday, 4:18 PM",
    status: "Active",
    environment: "sandbox",
  },
  {
    id: "key_live_03",
    label: "Production counter (preview)",
    clientKey: "st_live_demo_sc_3B7T1Y5E",
    branch: "Kapitolyo",
    scopes: ["customers:read", "transactions:write"],
    lastUsed: "Never used",
    status: "Active",
    environment: "production",
  },
];

/**
 * The first row is the shared scenario's own delivery. It previously carried
 * an unrelated ID scheme, which broke the one claim the demo makes about all
 * four apps showing the same event.
 */
const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: sharedScenario.loyaltyEvent.id,
    event: sharedScenario.loyaltyEvent.type,
    source: "POS sandbox",
    status: sharedScenario.loyaltyEvent.status,
    detail: `202 ms · ${sharedScenario.loyaltyEvent.occurredAt}`,
    requestId: sharedScenario.delivery.requestId,
  },
  {
    id: "evt_SC_10481",
    event: "visit.recorded",
    source: "POS sandbox",
    status: "Ignored safely",
    detail: "Duplicate idempotency key · Today, 9:41 AM",
    requestId: "req_SC_10481",
  },
  {
    id: "evt_SC_10477",
    event: "reward.redeemed",
    source: "Sweet Crumbs endpoint",
    status: "Retrying",
    detail: "Attempt 2 of 8 · Next retry in 48s",
    requestId: "req_SC_10477",
  },
  {
    id: "evt_SC_10463",
    event: "customer.updated",
    source: "Sweet Crumbs endpoint",
    status: "Failed",
    detail: "HTTP 503 · Yesterday, 6:14 PM",
    requestId: "req_SC_10463",
  },
];

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

  credentials: Credential[];
  setCredentials: Dispatch<SetStateAction<Credential[]>>;
  deliveries: Delivery[];
  setDeliveries: Dispatch<SetStateAction<Delivery[]>>;

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
  const [credentials, setCredentials] = useState<Credential[]>(INITIAL_CREDENTIALS);
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_DELIVERIES);
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
      credentials,
      setCredentials,
      deliveries,
      setDeliveries,
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
      credentials,
      deliveries,
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
