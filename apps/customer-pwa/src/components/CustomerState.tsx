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
import { customer } from "@stampr/demo-data";
import type { CustomerProfile, WalletCard } from "@stampr/demo-data";

/**
 * Everything the wallet owns, in one place.
 *
 * These values were spread across `CustomerApp` and prop-drilled eight at a
 * time into `ProfileSheet`, which meant editing a name updated a field nothing
 * else read, and leaving a business marked a row "Left" while the card stayed
 * in the wallet. Holding them together is what lets one action affect every
 * screen that describes it — and gives the FastAPI service a single seam.
 */

export type ChannelKey =
  | "service"
  | "promoPush"
  | "promoEmail"
  | "promoSms"
  | "nearby";

export const CHANNELS: {
  key: ChannelKey;
  label: string;
  detail: string;
  locked?: boolean;
}[] = [
  {
    key: "service",
    label: "Reward and service updates",
    detail: "Needed to keep balances and visits clear",
    locked: true,
  },
  { key: "promoPush", label: "Promotional push", detail: "Offers from businesses you joined" },
  { key: "promoEmail", label: "Email promotions", detail: "Longer news and birthday offers" },
  { key: "promoSms", label: "SMS promotions", detail: "Paid channel, used sparingly" },
  { key: "nearby", label: "Nearby reminders", detail: "Uses location only while enabled" },
];

/** The name the sign-up flow captured, if the customer came through it. */
const SIGNUP_NAME_KEY = "stampr-customer-signup-name";
let signupNameCache: string | null | undefined;

const subscribeToSignupName = () => () => {};

function readSignupName(): string | null {
  if (signupNameCache !== undefined) return signupNameCache;
  try {
    signupNameCache = window.sessionStorage.getItem(SIGNUP_NAME_KEY);
  } catch {
    signupNameCache = null;
  }
  return signupNameCache;
}

const noSignupNameOnServer = () => null;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

type CustomerState = {
  /** The profile as edited, not the fixture. Every screen reads this one. */
  profile: CustomerProfile;
  updateProfile: (patch: Partial<CustomerProfile>) => void;

  channels: Record<ChannelKey, boolean>;
  toggleChannel: (key: ChannelKey) => boolean;

  /** Cards still in the wallet — a business the customer left is gone. */
  wallet: WalletCard[];
  leftBusinessIds: string[];
  leaveBusiness: (walletId: string) => void;

  joinedIds: string[];
  joinBusiness: (discoverId: string) => void;

  notificationsRead: boolean;
  markNotificationsRead: () => void;

  deletionRequested: boolean;
  requestDeletion: () => void;
  exportRequested: boolean;
  requestExport: () => void;
};

const CustomerStateContext = createContext<CustomerState | null>(null);

export function CustomerStateProvider({ children }: { children: ReactNode }) {
  const signupName = useSyncExternalStore(
    subscribeToSignupName,
    readSignupName,
    noSignupNameOnServer,
  );

  const [edits, setEdits] = useState<Partial<CustomerProfile>>({});
  const [channels, setChannels] = useState<Record<ChannelKey, boolean>>({
    service: true,
    promoPush: true,
    promoEmail: true,
    promoSms: false,
    nearby: false,
  });
  const [leftBusinessIds, setLeftBusinessIds] = useState<string[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>(() =>
    customer.discover.filter((place) => place.joined).map((place) => place.id),
  );
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [exportRequested, setExportRequested] = useState(false);

  const profile = useMemo<CustomerProfile>(() => {
    // A name captured at sign-up is a real answer the customer gave; the
    // fixture profile is only the fallback for someone who signed in.
    const name = edits.name ?? signupName ?? customer.profile.name;
    return {
      ...customer.profile,
      ...edits,
      name,
      initials: initials(name),
    };
  }, [edits, signupName]);

  const updateProfile = useCallback((patch: Partial<CustomerProfile>) => {
    setEdits((current) => ({ ...current, ...patch }));
  }, []);

  const toggleChannel = useCallback((key: ChannelKey) => {
    let next = false;
    setChannels((current) => {
      next = !current[key];
      return { ...current, [key]: next };
    });
    return next;
  }, []);

  const leaveBusiness = useCallback((walletId: string) => {
    setLeftBusinessIds((current) =>
      current.includes(walletId) ? current : [...current, walletId],
    );
  }, []);

  const joinBusiness = useCallback((discoverId: string) => {
    setJoinedIds((current) =>
      current.includes(discoverId) ? current : [...current, discoverId],
    );
  }, []);

  const markNotificationsRead = useCallback(() => setNotificationsRead(true), []);
  const requestDeletion = useCallback(() => setDeletionRequested(true), []);
  const requestExport = useCallback(() => setExportRequested(true), []);

  const wallet = useMemo(
    () => customer.wallet.filter((card) => !leftBusinessIds.includes(card.id)),
    [leftBusinessIds],
  );

  const value = useMemo<CustomerState>(
    () => ({
      profile,
      updateProfile,
      channels,
      toggleChannel,
      wallet,
      leftBusinessIds,
      leaveBusiness,
      joinedIds,
      joinBusiness,
      notificationsRead,
      markNotificationsRead,
      deletionRequested,
      requestDeletion,
      exportRequested,
      requestExport,
    }),
    [
      profile,
      updateProfile,
      channels,
      toggleChannel,
      wallet,
      leftBusinessIds,
      leaveBusiness,
      joinedIds,
      joinBusiness,
      notificationsRead,
      markNotificationsRead,
      deletionRequested,
      requestDeletion,
      exportRequested,
      requestExport,
    ],
  );

  return (
    <CustomerStateContext.Provider value={value}>
      {children}
    </CustomerStateContext.Provider>
  );
}

export function useCustomerState() {
  const value = useContext(CustomerStateContext);
  if (!value) {
    throw new Error("useCustomerState must be used inside CustomerStateProvider");
  }
  return value;
}
