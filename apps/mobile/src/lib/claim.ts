import { create } from "zustand";
import { KEYS, forget, recall, remember } from "@/lib/storage";

/**
 * A first stamp from a counter poster, held across sign-up.
 *
 * The web wallet keeps this in localStorage with a timestamp because a cheap
 * Android discards the tab while the person reads their SMS. The app has no
 * tab to lose, but it has the same half-hour rule: far longer than a sign-up,
 * far shorter than a second visit.
 */
const CLAIM_TTL_MS = 30 * 60 * 1000;

export async function rememberClaim(token: string, shop = ""): Promise<void> {
  await Promise.all([
    remember(KEYS.claim, token),
    remember(KEYS.claimAt, String(Date.now())),
    shop ? remember(KEYS.claimShop, shop) : Promise.resolve(),
  ]);
}

export async function readClaim(): Promise<{
  token: string;
  shop: string;
} | null> {
  const token = await recall(KEYS.claim);
  if (!token) return null;
  const at = Number((await recall(KEYS.claimAt)) ?? 0);
  if (!at || Date.now() - at > CLAIM_TTL_MS) {
    await forgetClaim();
    return null;
  }
  return { token, shop: (await recall(KEYS.claimShop)) ?? "" };
}

export async function forgetClaim(): Promise<void> {
  await Promise.all([
    forget(KEYS.claim),
    forget(KEYS.claimAt),
    forget(KEYS.claimShop),
  ]);
}

/**
 * True while a held claim is being sent after sign-in. The wallet can load
 * empty a moment before the stamp lands, and Home must not say "No cards yet"
 * to somebody who just scanned a poster. Same as the web wallet's
 * claimSettling.
 */
export const useClaimSettling = create<{ settling: boolean }>()(() => ({
  settling: false,
}));

/**
 * The slug inside a scanned poster: `https://app.kyp.ph/join/<slug>`.
 *
 * Also accepts the bare `kyp://join/<slug>` a future poster might print, and
 * nothing else - a random QR at a counter is not a join link.
 */
export function joinSlugFrom(scanned: string): string | null {
  try {
    const url = new URL(scanned.trim());
    const isWallet =
      /(^|\.)kyp\.ph$/i.test(url.hostname) || url.protocol === "kyp:";
    if (!isWallet) return null;
    const match = /^\/?join\/([a-z0-9-]+)\/?$/i.exec(
      url.pathname || url.hostname + url.pathname,
    );
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}
