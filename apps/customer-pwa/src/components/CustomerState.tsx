"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ApiError,
  joinBusiness as joinBusinessCall,
  keys,
  leaveBusiness as leaveBusinessCall,
  markNotificationsRead as markNotificationsReadCall,
  requestData,
  setChannelPreference,
  updateCustomerProfile,
  useApiMutation,
  useQueryClient,
  useChannelPreferences,
  useCustomerProfile,
  claimFirstStamp,
  useDataRequests,
  useDiscover,
  useWallet,
} from "@kypstamping/api";
import type { CustomerProfile, WalletCard } from "@kypstamping/api";
import { useCoordinates } from "@/components/useCoordinates";
import { PENDING_CLAIM_KEY } from "@/components/FirstStamp";

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

/**
 * Settles a stamp claimed at the counter, once there is a wallet to put it in.
 *
 * The claim is made before registration - that is the whole point - so it
 * waits in sessionStorage across the sign-up and the OTP screen and is
 * redeemed here, on the first render that has a session.
 *
 * A refusal is swallowed deliberately. The common ones are "already a member"
 * and an expired token, and neither is worth interrupting somebody who has
 * just arrived in their wallet; staff can stamp them at the counter.
 *
 * A failure to *reach* the server is a different thing and the token is kept
 * for it. This used to drop the token whatever happened, so a customer who
 * scanned the poster in the shop, signed up, and hit one dropped request lost
 * the stamp for good and was told nothing about it. A server that answered is
 * an answer; a server that did not is worth asking again on the next load.
 */
function usePendingFirstStamp() {
  const queryClient = useQueryClient();
  const settled = useRef(false);

  useEffect(() => {
    if (settled.current) return;
    let token: string | null = null;
    try {
      token = window.sessionStorage.getItem(PENDING_CLAIM_KEY);
    } catch {
      token = null;
    }
    if (!token) return;
    settled.current = true;

    // Kept on anything that is not the server's own answer, so the next load
    // asks again. One request per load, so a server that stays down costs a
    // retry a page rather than a loop.
    claimFirstStamp(token)
      .then(() => true)
      .catch((failure) => failure instanceof ApiError)
      .then((settledByServer) => {
        if (settledByServer) {
          try {
            window.sessionStorage.removeItem(PENDING_CLAIM_KEY);
          } catch {
            // Nothing to do; the guard above stops a retry loop either way.
          }
        }
        void queryClient.invalidateQueries({ queryKey: keys.customer.all });
      });
  }, [queryClient]);
}


export function CustomerStateProvider({ children }: { children: ReactNode }) {
  const signupName = useSyncExternalStore(
    subscribeToSignupName,
    readSignupName,
    noSignupNameOnServer,
  );

  const [edits, setEdits] = useState<Partial<CustomerProfile>>({});
  const { data: savedChannels } = useChannelPreferences();
  const [overrides, setOverrides] = useState<Partial<Record<ChannelKey, boolean>>>({});
  // The API's answer, with whatever the customer just flipped on top of it.
  // Defaults are only what shows before the request lands.
  const channels = useMemo<Record<ChannelKey, boolean>>(
    () => ({
      service: true,
      promoPush: false,
      promoEmail: false,
      promoSms: false,
      nearby: false,
      ...savedChannels,
      ...overrides,
    }),
    [savedChannels, overrides],
  );
  const [leftBusinessIds, setLeftBusinessIds] = useState<string[]>([]);
  // Which businesses the customer has joined is the API's answer, seeded
  // once the discover list arrives rather than at mount from a fixture.
  // Asked for once the customer opens the wallet: every distance the discover
  // list reports is computed from it, and without one the "Nearby only"
  // filter has nothing to compare against.
  const where = useCoordinates(true);
  usePendingFirstStamp();
  const { data: discover = [] } = useDiscover(where);
  const [joinedLocally, setJoinedLocally] = useState<string[]>([]);
  const joinedIds = useMemo(
    () => [
      ...discover.filter((place) => place.joined).map((place) => place.id),
      ...joinedLocally,
    ],
    [discover, joinedLocally],
  );
  const [notificationsRead, setNotificationsRead] = useState(false);


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

  /**
   * Saved, then kept locally until the profile request catches up.
   *
   * The optimistic copy is what stops a name flickering back to its old value
   * for the moment between the response and the refetch.
   */
  const save = useApiMutation(updateCustomerProfile, {
    invalidates: [keys.customer.profile()],
  });
  const updateProfile = useCallback(
    (patch: Partial<CustomerProfile>) => {
      setEdits((current) => ({ ...current, ...patch }));
      save.mutate(patch);
    },
    [save],
  );

  /**
   * One request per switch, because each flip is its own consent event under
   * the Data Privacy Act - a batched save would lose which one the customer
   * changed and when.
   *
   * Flipped locally first so the switch moves under the thumb, and put back
   * if the API refuses.
   */
  const channelWrite = useApiMutation(
    ({ key, value }: { key: ChannelKey; value: boolean }) =>
      setChannelPreference(key, value),
    { invalidates: [keys.customer.consentHistory()] },
  );
  const toggleChannel = useCallback(
    (key: ChannelKey) => {
      const next = !channels[key];
      setOverrides((current) => ({ ...current, [key]: next }));
      channelWrite.mutate(
        { key, value: next },
        {
          onError: () =>
            setOverrides((current) => ({ ...current, [key]: !next })),
        },
      );
      return next;
    },
    [channelWrite, channels],
  );

  const leave = useApiMutation(leaveBusinessCall, {
    invalidates: [keys.customer.wallet(), keys.customer.discover()],
  });
  const leaveBusiness = useCallback(
    (walletId: string) => {
      // Hidden immediately: a card the customer just left should not sit
      // there while the request is in flight.
      setLeftBusinessIds((current) =>
        current.includes(walletId) ? current : [...current, walletId],
      );
      leave.mutate(walletId, {
        onError: () =>
          setLeftBusinessIds((current) => current.filter((id) => id !== walletId)),
      });
    },
    [leave],
  );

  const join = useApiMutation(joinBusinessCall, {
    invalidates: [keys.customer.wallet(), keys.customer.discover()],
  });
  const joinBusiness = useCallback(
    (merchantId: string) => {
      setJoinedLocally((current) =>
        current.includes(merchantId) ? current : [...current, merchantId],
      );
      join.mutate(merchantId, {
        onError: () =>
          setJoinedLocally((current) => current.filter((id) => id !== merchantId)),
      });
    },
    [join],
  );

  const readAll = useApiMutation(markNotificationsReadCall, {
    invalidates: [keys.customer.notifications()],
  });
  const markNotificationsRead = useCallback(() => {
    setNotificationsRead(true);
    readAll.mutate();
  }, [readAll]);

  /**
   * Both are formal requests under the Data Privacy Act, so both are recorded
   * by the API rather than remembered by the browser. The flags below only
   * decide what the screen says afterwards.
   */
  const dataRequest = useApiMutation(requestData, {
    invalidates: [keys.customer.dataRequests()],
  });
  // Whether one is outstanding is the API's answer, not a boolean the browser
  // forgets on reload - and the screen used to say "you will be notified"
  // while holding exactly such a boolean.
  const { data: dataRequests = [] } = useDataRequests();
  const outstanding = (kind: "export" | "delete") =>
    dataRequests.some(
      (request) => request.kind === kind && request.status !== "completed",
    );
  const deletionRequested = outstanding("delete");
  const exportRequested = outstanding("export");
  const requestDeletion = useCallback(() => dataRequest.mutate("delete"), [dataRequest]);
  const requestExport = useCallback(() => dataRequest.mutate("export"), [dataRequest]);

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
