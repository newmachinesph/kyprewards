"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { ApiError, offerFirstStamp, type FirstStampOffer } from "@kypstamping/api";
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

export function rememberClaim(token: string) {
  try {
    window.sessionStorage.setItem(PENDING_CLAIM_KEY, token);
  } catch {
    // A private window. The stamp is lost, which is a shame and not a crash;
    // staff can still scan them in at the counter.
  }
}

export function FirstStamp({ slug }: { slug: string }) {
  const [offer, setOffer] = useState<FirstStampOffer | null>(null);
  const [failed, setFailed] = useState("");
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
    offerFirstStamp(slug)
      .then((found) => {
        rememberClaim(found.claimToken);
        setOffer(found);
      })
      .catch((failure) => {
        setFailed(
          failure instanceof ApiError && failure.status === 404
            ? "That counter code is not one we recognise. Ask staff to scan you in."
            : "We could not reach the counter just now. Ask staff to scan you in.",
        );
      });
  }, [slug]);

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 py-10">
      <div className="w-full">
        <BrandMark />

        {failed ? (
          <div
            aria-live="polite"
            className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7"
          >
            <h1 className="text-2xl font-extrabold tracking-[-0.02em]">
              Something went sideways.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">{failed}</p>
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
                That&rsquo;s your first stamp.
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
              <p className="text-sm font-extrabold">Keep it with your number.</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                One number, no app, no password. It saves this stamp and every
                one after it.
              </p>
              <a
                href="/create-account"
                className="focus-ring mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] text-sm font-extrabold text-[var(--paper)]"
              >
                Save my stamp <ArrowRight size={16} />
              </a>
              <a
                href="/login"
                className="focus-ring mt-2 flex min-h-11 items-center justify-center text-xs font-extrabold text-[var(--muted-strong)]"
              >
                I already have a wallet
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
