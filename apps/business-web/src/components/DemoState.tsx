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
import { business, sharedScenario } from "@kypstamping/demo-data";
import type {
  Campaign,
  Credential,
  Delivery,
  Program,
  StaffMember,
} from "@kypstamping/demo-data";

/**
 * Views are unmounted when the merchant navigates, so anything they own is
 * destroyed on the next click. In a real workspace this state lives on the
 * server; here it lives above the view switch so a toggle, a draft, or a new
 * credential survives navigation the way a merchant would expect.
 *
 * Seed values come from `@kypstamping/demo-data`'s synchronous mirrors. When the
 * FastAPI service lands, this provider awaits the async accessors in
 * `api.ts` instead — the view contracts below do not change.
 */

export type ProgramDraft = Program;
export type { Credential, Delivery };

/** The API's Campaign, which already carries the composer's two fields. */
export type ScheduledCampaign = Campaign;

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
  automations: Record<string, boolean>;
  toggleAutomation: (id: string) => boolean;

  integrations: Record<string, boolean>;
  toggleIntegration: (id: string) => boolean;

  programs: ProgramDraft[];
  duplicateProgram: (id: string) => string | null;
  updateProgramRule: (id: string, patch: Partial<ProgramDraft>) => void;

  campaigns: ScheduledCampaign[];
  scheduleCampaign: (campaign: Omit<ScheduledCampaign, "id">) => void;

  staff: StaffMember[];
  inviteStaff: (invite: { name: string; role: string; location: string }) => void;

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
  const [automations, setAutomations] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      business.automations.map((item) => [item.id, item.status === "Live"]),
    ),
  );
  const [integrations, setIntegrations] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      business.integrations.map((item) => [
        item.id,
        item.status === "Connected",
      ]),
    ),
  );
  const [programs, setPrograms] = useState<ProgramDraft[]>(() =>
    business.programs.map((item) => ({ ...item })),
  );
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>(() =>
    business.campaigns.map((item) => ({
      ...item,
      channels: [...item.channels],
    })),
  );
  const [staff, setStaff] = useState<StaffMember[]>(() =>
    business.staff.map((item) => ({ ...item })),
  );
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

  const toggleAutomation = useCallback((id: string) => {
    let next = false;
    setAutomations((current) => {
      next = !current[id];
      return { ...current, [id]: next };
    });
    return next;
  }, []);

  const toggleIntegration = useCallback((id: string) => {
    let next = false;
    setIntegrations((current) => {
      next = !current[id];
      return { ...current, [id]: next };
    });
    return next;
  }, []);

  const duplicateProgram = useCallback((id: string) => {
    let draftName: string | null = null;
    setPrograms((current) => {
      const source = current.find((item) => item.id === id);
      if (!source) return current;
      const copies = current.filter((item) =>
        item.name.startsWith(`${source.name} copy`),
      ).length;
      draftName = copies ? `${source.name} copy ${copies + 1}` : `${source.name} copy`;
      return [
        ...current,
        {
          ...source,
          id: `${source.id}_draft_${copies + 1}`,
          name: draftName,
          status: "Draft",
          members: 0,
          completion: 0,
          redemption: 0,
          liability: 0,
        },
      ];
    });
    return draftName;
  }, []);

  const updateProgramRule = useCallback(
    (id: string, patch: Partial<ProgramDraft>) => {
      setPrograms((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const scheduleCampaign = useCallback(
    (campaign: Omit<ScheduledCampaign, "id">) => {
      setCampaigns((current) => [
        { ...campaign, id: `cmp_local_${current.length + 1}` },
        ...current,
      ]);
    },
    [],
  );

  const inviteStaff = useCallback(
    ({ name, role, location }: { name: string; role: string; location: string }) => {
      setStaff((current) => [
        ...current,
        {
          id: `staff_invite_${current.length + 1}`,
          name,
          initials: name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase() ?? "")
            .join(""),
          role,
          location,
          // An invited member has never been active. The API sends the
          // instant or nothing; "Invitation sent" in a timestamp field was a
          // display string masquerading as data.
          lastActiveAt: null,
          status: "Invited",
        },
      ]);
    },
    [],
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
      automations,
      toggleAutomation,
      integrations,
      toggleIntegration,
      programs,
      duplicateProgram,
      updateProgramRule,
      campaigns,
      scheduleCampaign,
      staff,
      inviteStaff,
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
      automations,
      toggleAutomation,
      integrations,
      toggleIntegration,
      programs,
      duplicateProgram,
      updateProgramRule,
      campaigns,
      scheduleCampaign,
      staff,
      inviteStaff,
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
