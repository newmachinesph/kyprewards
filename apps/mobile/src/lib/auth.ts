import { create } from "zustand";
import {
  ApiError,
  getSession,
  logout as logoutCall,
  setApiBase,
  setAuthToken,
  setClientKind,
  type SessionInfo,
} from "@kypstamping/api";
import { API_BASE } from "@/lib/config";
import { KEYS, forget, recall, remember } from "@/lib/storage";

/**
 * Who is signed in, for every screen.
 *
 * The browser wallet never sees its session: it is an httpOnly cookie the
 * browser sends. Here the token lives in the keychain and rides on every
 * request as a bearer, so this store is the one place that knows it - the
 * rest of the app asks `status`, never the token.
 */
type Status = "booting" | "signed-out" | "signed-in";

type AuthState = {
  status: Status;
  session: SessionInfo | null;
  /** Read the keychain and ask the API who that token belongs to. */
  bootstrap: () => Promise<void>;
  /** After a one-time code is accepted: keep the token, load the session. */
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

// Set once, at module load, before any query can fire. Every request from
// this app carries the client kind so the OTP verify answers with a token.
setApiBase(API_BASE);
setClientKind("mobile");

export const useAuth = create<AuthState>()((set, get) => ({
  status: "booting",
  session: null,

  async bootstrap() {
    const token = await recall(KEYS.session);
    if (!token) {
      set({ status: "signed-out", session: null });
      return;
    }
    setAuthToken(token);
    await get().refresh();
  },

  async signIn(token) {
    await remember(KEYS.session, token);
    setAuthToken(token);
    await get().refresh();
  },

  async signOut() {
    // Revoked server-side first, so a token lifted from a lost phone is dead
    // even if the keychain wipe below never runs. A failure to reach the
    // server still signs the device out: the token is gone from here.
    await logoutCall().catch(() => undefined);
    setAuthToken(null);
    await Promise.all([
      forget(KEYS.session),
      forget(KEYS.memberCode),
      forget(KEYS.memberName),
    ]);
    set({ status: "signed-out", session: null });
  },

  async refresh() {
    try {
      const session = await getSession();
      if (session.kind !== "customer") {
        // A staff token has no business in a shopper's wallet.
        await get().signOut();
        return;
      }
      set({ status: "signed-in", session });
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        // Expired or revoked. Clear it rather than retrying it forever.
        setAuthToken(null);
        await forget(KEYS.session);
        set({ status: "signed-out", session: null });
        return;
      }
      // Offline. The token may well be fine; keep it and let the screens
      // show what they have cached rather than bouncing to sign-in.
      set((state) => ({ status: state.session ? "signed-in" : "signed-out" }));
    }
  },
}));
