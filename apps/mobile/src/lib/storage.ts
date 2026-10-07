import * as SecureStore from "expo-secure-store";

/**
 * The device keychain, behind the three calls the app needs.
 *
 * Everything the app remembers between launches goes through here: the
 * session token, the member code for offline, a pending poster claim. None
 * of it belongs in plain app storage, and SecureStore is encrypted at rest
 * on both platforms. Keys are namespaced so a future value cannot collide
 * with a past one by accident.
 */
const NS = "kyp.";

export async function remember(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(NS + key, value);
}

export async function recall(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(NS + key);
  } catch {
    // A keychain that refuses to answer - a corrupted entry, a device that
    // just restored from backup - is an empty answer, not a crash on boot.
    return null;
  }
}

export async function forget(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(NS + key);
}

export const KEYS = {
  session: "session",
  memberCode: "member-code",
  memberName: "member-name",
  claim: "pending-claim",
  claimShop: "pending-claim-shop",
  claimAt: "pending-claim-at",
  otpIdentifier: "otp-identifier",
  biometricLock: "biometric-lock",
  pushToken: "push-token",
  pushOff: "push-off",
} as const;
