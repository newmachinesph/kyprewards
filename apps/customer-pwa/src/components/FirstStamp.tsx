"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import {
  ApiError,
  claimFirstStamp,
  getSession,
  offerFirstStamp,
  readFirstStamp,
  type FirstStampOffer,
} from "@kypstamping/api";
import { BrandMark, StampDots } from "@kypstamping/ui";

/**
 * What the counter poster lands on.
 *
 * The stamp is claimed and shown before a single question is asked - that is
 * the entire point of the flow. Registration comes after, when there is
 * already something on the card worth keeping.
 */

/**
 * Survives the hop through registration and the OTP screen.
 *
 * The claim cannot settle until there is an account to settle it against, so
 * the token has to outlive three navigations. sessionStorage, because it
 * should not outlive the tab: a token left in localStorage would sit there
 * long after the visit it belonged to.
 */
export const PENDING_CLAIM_KEY = "kypstamping-pending-first-stamp";
/** The shop the pending stamp belongs to, so the sign-up screen can say what
 *  it is holding. Ten seconds after "That's your first stamp", /create-account
 *  talked about wallets in general and never mentioned the shop or the stamp,
 *  which is the moment somebody decides this was a waste of time. */
export const PENDING_CLAIM_SHOP_KEY = "kypstamping-pending-first-stamp-shop";

export function rememberClaim(token: string, shop = "") {
  try {
    window.sessionStorage.setItem(PENDING_CLAIM_KEY, token);
    if (shop) window.sessionStorage.setItem(PENDING_CLAIM_SHOP_KEY, shop);
  } catch {
    // A private window. The stamp is lost, which is a shame and not a crash;
    // staff can still scan them in at the counter.
  }
}

export function FirstStamp({ slug }: { slug: string }) {
  const router = useRouter();
  const [offer, setOffer] = useState<FirstStampOffer | null>(null);
  const [failed, setFailed] = useState("");
  /**
   * Whether there is already a wallet to put this in.
   *
   * The poster is scanned by regulars too, and the flow sent every one of
   * them to /create-account to register an account they already had. Null
   * while it is being asked, so the button does not flicker between two
   * different promises.
   */
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  // StrictMode invokes an effect twice in development, and this one has a
  // side effect on the server. Guarding by slug rather than a flag, so a
  // genuine change still re-runs.
  const askedFor = useRef<string | null>(null);

  useEffect(() => {
    if (askedFor.current === slug) return;
    askedFor.current = slug;
    // No live flag alongside the guard. StrictMode mounts twice, so the
    // first pass fires the request and its cleanup would cancel it, while
    // the second is blocked by the guard - and the answer is thrown away.
    // Setting state after unmount is a no-op here, which is the cheaper
    // trade.
    readFirstStamp(slug)
      .then(setOffer)
      .catch((failure) => {
        setFailed(
          failure instanceof ApiError && failure.status === 404
            ? "That counter code is not one we recognise. Ask staff to scan you in."
            : "We could not reach the counter just now. Ask staff to scan you in.",
        );
      });
  }, [slug]);

  useEffect(() => {
    let live = true;
    getSession()
      .then((session) => live && setSignedIn(session.kind === "customer"))
      // Not signed in is the overwhelmingly common answer here, and it comes
      // back as a 401. Either way the sign-up path is the safe default.
      .catch(() => live && setSignedIn(false));
    return () => {
      live = false;
    };
  }, []);

  const [busy, setBusy] = useState(false);

  /**
   * Mint the claim, then carry on to `destination`.
   *
   * Both onward paths mint. Only "Save my stamp" used to: somebody who tapped
   * "I already have a wallet" went to sign-in with nothing remembered, so the
   * stamp they had just been shown was dropped on the floor - and that is the
   * returning customer, which is most of them once a shop has regulars.
   *
   * A mint that fails is now said out loud rather than swallowed. It used to
   * navigate on regardless, so a 429 during a queue - the busiest moment the
   * poster ever sees, on an endpoint that shares the anonymous budget - sent
   * people through a full sign-up that granted them nothing.
   */
  async function keep(destination: string) {
    setBusy(true);
    setFailed("");
    try {
      const claimed = await offerFirstStamp(slug);
      rememberClaim(claimed.claimToken, offer?.business ?? "");
    } catch (failure) {
      setBusy(false);
      setFailed(
        failure instanceof ApiError
          ? failure.message
          : "We could not hold that stamp just now. Ask staff to scan you in.",
      );
      return;
    }
    router.push(destination);
  }

  /**
   * The signed-in path: claim it here rather than parking a token for the
   * wallet to settle, so the answer can be shown on this screen.
   *
   * An existing member gets a 409 with a message worth reading - "You are
   * already a member here. Ask staff to scan your code." - which used to be
   * thrown away while the app navigated home as though it had worked.
   */
  async function keepOnExistingWallet() {
    setBusy(true);
    setFailed("");
    try {
      const claimed = await offerFirstStamp(slug);
      await claimFirstStamp(claimed.claimToken);
    } catch (failure) {
      setBusy(false);
      setFailed(
        failure instanceof ApiError
          ? failure.message
          : "We could not add that stamp just now. Ask staff to scan you in.",
      );
      return;
    }
    router.push("/");
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 py-10">
      <div className="w-full">
        <BrandMark />

        {failed && !offer ? (
          <div
            aria-live="polite"
            className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7"
          >
            <h1 className="text-2xl font-extrabold tracking-[-0.02em]">
              Something went sideways.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">{failed}</p>
            {/* This page is what a printed poster points at, and it had no
                link, no button, nothing - on a phone the only way out was to
                type a URL by hand. A mis-scan is the likeliest cause, and
                either way no visit is lost: staff can add it at the till. */}
            <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
              A code can be misread by a camera. Staff can add your visit at
              the counter, so nothing is lost either way.
            </p>
            <Link
              href="/"
              className="focus-ring mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] text-sm font-extrabold text-[var(--paper)]"
            >
              Open my wallet <ArrowRight size={16} />
            </Link>
          </div>
        ) : !offer ? (
          <div className="mt-8 grid place-items-center rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12">
            <Loader2 className="animate-spin text-[var(--muted)]" />
            <p className="mt-4 text-sm font-bold text-[var(--muted-strong)]">
              Getting your stamp…
            </p>
          </div>
        ) : (
          <div aria-live="polite" className="mt-8">
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--accent)]">
                <Check size={26} strokeWidth={3} />
              </span>
              <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.03em]">
                {/* Only the anonymous visitor is definitely new. A signed-in
                    member with four stamps was being told this was their
                    first, above a card reading 1 of 8. */}
                {signedIn ? "A stamp for you." : "That’s your first stamp."}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                At {offer.business} · {offer.branch}
              </p>

              <div className="mt-7 rounded-2xl bg-[var(--paper)] p-5">
                <div className="overflow-x-auto">
                  <StampDots filled={offer.stamps} total={offer.target} />
                </div>
                <p className="mt-4 text-sm font-extrabold">
                  {offer.stamps} of {offer.target} toward {offer.reward}
                </p>
              </div>
            </div>

            {/* The ask, and only now. They can already see what they are
                keeping, which is the whole reason it comes second. */}
            <div className="mt-4 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7">
              <p className="text-sm font-extrabold">
                {signedIn ? "Keep it." : "Keep it with your number."}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                {signedIn
                  ? "It goes on the card you already have."
                  : "One number, no app, no password. It saves this stamp and every one after it."}
              </p>
              {/* The claim is minted here, on the tap, rather than when the
                  page loaded - so opening a poster link costs nothing and
                  only somebody who wants the stamp creates one. If the
                  request fails the journey continues anyway: staff can scan
                  them in, which is the fallback the error copy already
                  points at. */}
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  signedIn ? keepOnExistingWallet() : keep("/create-account")
                }
                className="focus-ring mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink)] text-sm font-extrabold text-[var(--paper)] disabled:opacity-60"
              >
                {busy
                  ? "Holding it…"
                  : signedIn
                    ? "Add it to my wallet"
                    : "Save my stamp"}{" "}
                {!busy && <ArrowRight size={16} />}
              </button>
              {!signedIn && (
                <button
                  type="button"
                  disabled={busy}
                  // Mints first. This was a bare link to sign-in, so the
                  // returning customer's stamp was never held at all.
                  onClick={() => keep("/login")}
                  className="focus-ring mt-2 flex min-h-11 w-full items-center justify-center text-xs font-extrabold text-[var(--muted-strong)] disabled:opacity-60"
                >
                  I already have a wallet
                </button>
              )}
              {failed && (
                <p
                  aria-live="polite"
                  className="mt-3 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-xs font-bold text-[var(--muted-strong)]"
                >
                  {failed}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
