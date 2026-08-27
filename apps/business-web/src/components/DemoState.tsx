"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoData } from "@stampr/demo-data";

/**
 * Views are unmounted when the merchant navigates, so anything they own is
 * destroyed on the next click. In a real workspace this state lives on the
 * server; here it lives above the view switch so a toggle, a draft, or a new
 * credential survives navigation the way a merchant would expect.
 */

const business = demoData.business;

export type ProgramDraft = {
  id: string;
  name: string;
  type: string;
  status: string;
  members: number;
  completion: number;
  redemption: number;
  liability: number;
};

export type ScheduledCampaign = {
  id: string;
  name: string;
  audience: string;
  channels: string[];
  sent: number;
  visited: number;
  revenue: number;
  cost: number;
  status: string;
};

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

  settings: Record<string, boolean>;
  setSetting: (key: string, value: boolean) => void;
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
  const [settings, setSettings] = useState<Record<string, boolean>>({});

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

  const setSetting = useCallback((key: string, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

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
      settings,
      setSetting,
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
      settings,
      setSetting,
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
