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
import { useCustomerProfile, useDiscover, useWallet } from "@kypstamping/api";
import type { CustomerProfile, WalletCard } from "@kypstamping/api";

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
const SIGNUP_NAME_KEY = "kypstamping-customer-signup-name";
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

/**
 * What a profile looks like before the request answers.
 *
 * Every screen reads `profile` unconditionally, which was safe while it came
 * from a fixture that was always there. Empty strings render as empty rather
 * than as "undefined", and fill in when the API replies.
 */
const EMPTY_PROFILE: CustomerProfile = {
  id: "",
  name: "",
  initials: "",
  city: "",
  memberSince: "",
  memberCode: "",
  birthday: "",
  email: "",
  mobile: "",
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
  // Which businesses the customer has joined is the API's answer, seeded
  // once the discover list arrives rather than at mount from a fixture.
  const { data: discover = [] } = useDiscover();
  const [joinedLocally, setJoinedLocally] = useState<string[]>([]);
  const joinedIds = useMemo(
    () => [
      ...discover.filter((place) => place.joined).map((place) => place.id),
      ...joinedLocally,
    ],
    [discover, joinedLocally],
  );
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [exportRequested, setExportRequested] = useState(false);

  const { data: apiProfile } = useCustomerProfile();

  const profile = useMemo<CustomerProfile>(() => {
    // A name captured at sign-up is a real answer the customer gave; the
    // API's own record is what it falls back to.
    const name = edits.name ?? signupName ?? apiProfile?.name ?? "";
    return {
      ...EMPTY_PROFILE,
      ...apiProfile,
      ...edits,
      name,
      initials: initials(name),
    };
  }, [apiProfile, edits, signupName]);

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
    setJoinedLocally((current) =>
      current.includes(discoverId) ? current : [...current, discoverId],
    );
  }, []);

  const markNotificationsRead = useCallback(() => setNotificationsRead(true), []);
  const requestDeletion = useCallback(() => setDeletionRequested(true), []);
  const requestExport = useCallback(() => setExportRequested(true), []);

  const { data: cards = [] } = useWallet();
  const wallet = useMemo(
    () => cards.filter((card) => !leftBusinessIds.includes(card.id)),
    [cards, leftBusinessIds],
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
