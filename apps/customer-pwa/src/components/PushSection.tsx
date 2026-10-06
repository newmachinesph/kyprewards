"use client";

import { useSyncExternalStore } from "react";
import {
  PREVIEW_WRITE_REASON,
  isPreview,
  keys,
  subscribePush,
  unsubscribePush,
  useApiMutation,
  usePushState,
} from "@kypstamping/api";
import { Button, PreviewBadge, QueryBoundary } from "@kypstamping/ui";
import { FormMessage } from "@kypstamping/ui/form";
import { BellRing } from "lucide-react";

/**
 * Alerts on a closed phone, once there is a subscription behind them.
 *
 * The in-app inbox always works. This section is only about web push, and
 * it says nothing about alerts arriving until the browser has handed over a
 * subscription and the API has kept it.
 */

type Support = "unsupported" | "denied" | "ready";

const subscribeNothing = () => () => {};
const readSupport = (): Support => {
  if (typeof window === "undefined" || !("Notification" in window) || !("PushManager" in window)) {
    return "unsupported";
  }
  return Notification.permission === "denied" ? "denied" : "ready";
};
const serverSupport = (): Support => "unsupported";

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const raw = window.atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function PushSection() {
  const support = useSyncExternalStore(subscribeNothing, readSupport, serverSupport);
  const push = usePushState();
  const state = push.data;
  const preview = isPreview(state);
  const invalidates = [keys.wallet.push()];

  const subscribe = useApiMutation(async () => {
    if (!state?.vapidPublicKey) throw new Error("This wallet has no push key yet.");
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToBytes(state.vapidPublicKey),
    });
    return subscribePush(subscription.toJSON());
  }, { invalidates });

  const unsubscribe = useApiMutation(async () => {
    const registration = await navigator.serviceWorker.ready;
    await (await registration.pushManager.getSubscription())?.unsubscribe();
    return unsubscribePush();
  }, { invalidates });

  const busy = subscribe.isPending || unsubscribe.isPending;
  const failure = subscribe.error ?? unsubscribe.error;

  // No key on this deployment means nothing can ever be sent: offering the
  // switch only led to "This wallet has no push key yet."
  if (state && !state.vapidPublicKey && !preview) return null;

  return (
    <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
          <BellRing size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">Alerts on this phone</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
            Your inbox above always works while the wallet is open. Allowing
            notifications lets a reward waiting at the counter reach you when it is closed.
          </p>
        </div>
        {preview && <PreviewBadge className="shrink-0" />}
      </div>
      <div className="mt-3">
        <QueryBoundary isPending={push.isPending} error={push.error} onRetry={() => void push.refetch()} label="notification settings" rows={1}>
          {support === "unsupported" ? (
            <p className="text-xs text-[var(--muted-strong)]">
              This browser does not support notifications. Your inbox still has everything.
            </p>
          ) : support === "denied" ? (
            <p className="text-xs text-[var(--muted-strong)]">
              Notifications are blocked for this site in your browser settings. Turn them on there first.
            </p>
          ) : state?.subscribed ? (
            <>
              <p className="text-xs font-bold text-[var(--success)]">Notifications are on for this phone.</p>
              <Button
                tone="quiet"
                disabled={preview || busy}
                title={preview ? PREVIEW_WRITE_REASON : undefined}
                onClick={() => unsubscribe.mutate()}
                className="mt-2 w-full"
              >
                {unsubscribe.isPending ? "Turning off…" : "Turn off on this phone"}
              </Button>
            </>
          ) : (
            <Button
              disabled={preview || busy}
              title={preview ? PREVIEW_WRITE_REASON : undefined}
              onClick={() => subscribe.mutate()}
              className="w-full"
            >
              {subscribe.isPending ? "Asking your browser…" : "Allow notifications on this phone"}
            </Button>
          )}
          {preview && <p className="mt-2 text-[11px] text-[var(--muted-strong)]">{PREVIEW_WRITE_REASON}</p>}
          <FormMessage tone="error" className="mt-2">
            {failure?.message}
          </FormMessage>
        </QueryBoundary>
      </div>
    </section>
  );
}
