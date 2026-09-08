import { create } from "zustand";
import * as LocalAuthentication from "expo-local-authentication";
import { forget, KEYS, recall, remember } from "./storage";

/**
 * An optional lock over the wallet, on the device's own face or fingerprint.
 *
 * The wallet holds a member code, stored value and someone's history of where
 * they shop, on a phone that gets handed around. This is the one screen worth
 * a second factor, and the device already has one.
 *
 * Every failure here fails *open*. A phone with no biometrics enrolled, a
 * module that throws, a keychain that will not answer - none of them are a
 * reason to hold somebody out of their own wallet. The lock only ever
 * engages when the device said it could and the customer asked for it, and
 * the lock screen always offers a way out.
 *
 * The session is untouched either way: this hides the UI, it does not sign
 * anyone out. Losing the phone is what `signOut` and server-side revocation
 * are for.
 */
type LockState = {
  /** Undefined until the device has been asked. */
  available: boolean | undefined;
  /** What the customer chose, as read from the keychain. */
  enabled: boolean;
  /** Whether the wallet is hidden right now. */
  locked: boolean;
  ready: () => Promise<void>;
  enable: (on: boolean) => Promise<boolean>;
  engage: () => void;
  unlock: () => Promise<boolean>;
};

/** Hardware present *and* something enrolled. Either missing is unavailable. */
async function deviceCanLock(): Promise<boolean> {
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

async function prompt(reason: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      // The device passcode is a fine second factor and the only way back in
      // for someone whose fingerprint stops reading. Never disable it.
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });
    return result.success;
  } catch {
    return false;
  }
}

export const useLock = create<LockState>()((set, get) => ({
  available: undefined,
  enabled: false,
  locked: false,

  /** Read the device's capability and the saved preference, once, at boot. */
  async ready() {
    const available = await deviceCanLock();
    const saved = (await recall(KEYS.biometricLock)) === "on";
    // A preference that outlived the biometrics it depended on - the customer
    // removed their fingerprints, or restored onto a phone without a sensor -
    // must not lock the wallet with nothing able to open it.
    const enabled = available && saved;
    set({ available, enabled, locked: enabled });
  },

  /** Turn the lock on or off. Turning it on has to pass once first. */
  async enable(on: boolean) {
    if (!on) {
      await forget(KEYS.biometricLock);
      set({ enabled: false, locked: false });
      return false;
    }
    if (!get().available) return false;
    if (!(await prompt("Turn on the lock for your wallet"))) return false;
    await remember(KEYS.biometricLock, "on");
    set({ enabled: true, locked: false });
    return true;
  },

  /** The app went to the background. Hide the wallet behind the lock. */
  engage() {
    if (get().enabled) set({ locked: true });
  },

  async unlock() {
    const ok = await prompt("Unlock your wallet");
    if (ok) set({ locked: false });
    return ok;
  },
}));
