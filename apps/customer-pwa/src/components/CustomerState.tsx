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
  useNotifications,
  useWalletWithPreview,
} from "@kyprewards/api";
import type { CustomerProfile, WalletCard } from "@kyprewards/api";
import { useCoordinates } from "@/components/useCoordinates";
import { forgetClaim, readClaim } from "@/components/FirstStamp";

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
  { key: "nearby", label: "Nearby reminders", detail: "A reward waiting at a shop you are near. Location is never stored" },
];

/** The name the sign-up flow captured, if the customer came through it. */
const SIGNUP_NAME_KEY = "kyprewards-customer-signup-name";
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

/** What a write's caller hears once the API has answered - so no screen says
 *  "turned off" or "you left" before the server agreed. */
type Outcome<T = undefined> = { onDone?: (value: T) => void; onFailed?: (message: string) => void };

/** The profile fields, plus the birthday as the API takes it: `birthday` is
 *  the "5 March" the screen shows, the two numbers are what is sent. */
export type ProfilePatch = Partial<CustomerProfile> & {
  birthdayDay?: number;
  birthdayMonth?: number;
};

type CustomerState = {
  /** The profile as edited, not the fixture. Every screen reads this one. */
  profile: CustomerProfile;
  updateProfile: (patch: ProfilePatch) => void;

  channels: Record<ChannelKey, boolean>;
  toggleChannel: (key: ChannelKey, outcome?: Outcome<boolean>) => void;

  /** Cards still in the wallet — a business the customer left is gone.
   *  Real cards first; locally, preview samples follow them under a badge. */
  wallet: WalletCard[];
  walletQuery: { isPending: boolean; error: Error | null; refetch: () => void };
  /** Whether the last profile edit reached the API. */
  profileSave: { isPending: boolean; error: Error | null; isSuccess: boolean };
  leftBusinessIds: string[];
  leaveBusiness: (walletId: string, outcome?: Outcome) => void;

  joinedIds: string[];
  joinBusiness: (
    discoverId: string,
    businessId: string,
    outcome?: { onJoined?: () => void; onFailed?: (message: string) => void },
  ) => void;

  notificationsRead: boolean;
  markNotificationsRead: () => void;

  deletionRequested: boolean;
  requestDeletion: (outcome?: Outcome) => void;
  exportRequested: boolean;
  requestExport: (outcome?: Outcome) => void;

  /**
   * A first stamp from the counter poster is still being settled.
   *
   * The wallet loads before the claim lands, so somebody who scanned the
   * poster, signed up and arrived home was shown an empty wallet for a beat
   * before their stamp appeared - at the exact moment they are deciding
   * whether this thing works.
   */
  claimSettling: boolean;
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
  // Null, as the API says it: "" read as given-but-blank, so
  // `birthday ?? "Not given"` showed nothing at all.
  birthday: null,
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
function usePendingFirstStamp(): boolean {
  const queryClient = useQueryClient();
  const settled = useRef(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (settled.current) return;
    const token = readClaim();
    if (!token) return;
    settled.current = true;
    // Marks the start of an async job this effect owns, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClaiming(true);

    // Kept on anything that is not the server's own answer, so the next load
    // asks again. One request per load, so a server that stays down costs a
    // retry a page rather than a loop.
    claimFirstStamp(token)
      .then(() => true)
      .catch((failure) => failure instanceof ApiError)
      .then((settledByServer) => {
        if (settledByServer) forgetClaim();
        void queryClient.invalidateQueries({ queryKey: keys.customer.all });
        setClaiming(false);
      });
  }, [queryClient]);

  return claiming;
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
  // Only with "Nearby reminders" on. Asked on every wallet open, the position
  // went to the API while the privacy centre told the customer location was
  // never shared. The Discover tab asks for itself, where the browser prompt
  // is the customer's own choice on a screen about distance.
  const where = useCoordinates(channels.nearby);
  const claimSettling = usePendingFirstStamp();
  const { data: discover = [] } = useDiscover(where);
  const [joinedLocally, setJoinedLocally] = useState<string[]>([]);
  const joinedIds = useMemo(
    () => [
      ...discover.filter((place) => place.joined).map((place) => place.id),
      ...joinedLocally,
    ],
    [discover, joinedLocally],
  );
  // The inbox's own answer, with a local "marked read" on top until the
  // refetch lands. A bare flag starting false lit the bell on every load.
  const { data: notifications = [] } = useNotifications();
  const [markedRead, setNotificationsRead] = useState(false);
  const notificationsRead = markedRead || notifications.every((n) => n.read);


  const { data: apiProfile } = useCustomerProfile();

  const profile = useMemo<CustomerProfile>(() => {
    // The API's record first; the name typed at sign-up only fills the moment
    // before the profile arrives. Preferred the other way, a second person
    // signing in on the same tab was greeted by the first one's name.
    const name = edits.name ?? apiProfile?.name ?? signupName ?? "";
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
    (patch: ProfilePatch) => {
      const { birthday, birthdayDay, birthdayMonth, ...fields } = patch;
      setEdits((current) => ({ ...current, ...fields, ...(birthday ? { birthday } : {}) }));
      save.mutate({ ...fields, birthdayDay, birthdayMonth });
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
    (key: ChannelKey, outcome?: Outcome<boolean>) => {
      const next = !channels[key];
      setOverrides((current) => ({ ...current, [key]: next }));
      channelWrite.mutate(
        { key, value: next },
        {
          onSuccess: () => outcome?.onDone?.(next),
          onError: (failure) => {
            setOverrides((current) => ({ ...current, [key]: !next }));
            outcome?.onFailed?.(failure.message);
          },
        },
      );
    },
    [channelWrite, channels],
  );

  const leave = useApiMutation(leaveBusinessCall, {
    invalidates: [keys.customer.wallet(), keys.customer.discoverAll()],
  });
  const leaveBusiness = useCallback(
    (walletId: string, outcome?: Outcome) => {
      // Hidden immediately: a card the customer just left should not sit
      // there while the request is in flight.
      setLeftBusinessIds((current) =>
        current.includes(walletId) ? current : [...current, walletId],
      );
      leave.mutate(walletId, {
        onSuccess: () => outcome?.onDone?.(undefined),
        onError: (failure) => {
          setLeftBusinessIds((current) => current.filter((id) => id !== walletId));
          outcome?.onFailed?.(failure.message);
        },
      });
    },
    [leave],
  );

  const join = useApiMutation(joinBusinessCall, {
    invalidates: [keys.customer.wallet(), keys.customer.discoverAll()],
  });
  const joinBusiness = useCallback(
    (
      discoverId: string,
      businessId: string,
      outcome?: { onJoined?: () => void; onFailed?: (message: string) => void },
    ) => {
      // Marked joined by the list row it was tapped on; joined on the server
      // by the shop's own id.
      setJoinedLocally((current) =>
        current.includes(discoverId) ? current : [...current, discoverId],
      );
      join.mutate(businessId, {
        onSuccess: () => outcome?.onJoined?.(),
        onError: (failure) => {
          setJoinedLocally((current) => current.filter((id) => id !== discoverId));
          outcome?.onFailed?.(
            failure instanceof Error && failure.message
              ? failure.message
              : "Could not add that shop. Try again.",
          );
        },
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
  // "deletion" is the kind the API stores; "delete" never matched, so the
  // button never locked and every tap filed another request.
  const outstanding = (kind: "export" | "deletion") =>
    dataRequests.some(
      (request) => request.kind === kind && request.status !== "completed",
    );
  const deletionRequested = outstanding("deletion");
  const exportRequested = outstanding("export");
  const requestDeletion = useCallback(
    (outcome?: Outcome) =>
      dataRequest.mutate("deletion", {
        onSuccess: () => outcome?.onDone?.(undefined),
        onError: (failure) => outcome?.onFailed?.(failure.message),
      }),
    [dataRequest],
  );
  const requestExport = useCallback(
    (outcome?: Outcome) =>
      dataRequest.mutate("export", {
        onSuccess: () => outcome?.onDone?.(undefined),
        onError: (failure) => outcome?.onFailed?.(failure.message),
      }),
    [dataRequest],
  );

  const walletRead = useWalletWithPreview();
  const cards = useMemo(() => walletRead.data ?? [], [walletRead.data]);
  const walletQuery = useMemo(
    () => ({
      isPending: walletRead.isPending,
      error: walletRead.error,
      refetch: () => void walletRead.refetch(),
    }),
    [walletRead],
  );
  const profileSave = useMemo(
    () => ({ isPending: save.isPending, error: save.error, isSuccess: save.isSuccess }),
    [save.isPending, save.error, save.isSuccess],
  );
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
      walletQuery,
      profileSave,
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
      claimSettling,
    }),
    [
      profile,
      updateProfile,
      channels,
      toggleChannel,
      wallet,
      walletQuery,
      profileSave,
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
      claimSettling,
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
