"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isPreview, keys, usePayment, type QrPayment } from "@kypstamping/api";
import { Button, Dialog, PreviewBadge } from "@kypstamping/ui";
import { pesoFromCentavos } from "@kypstamping/ui/format";
import { Check, TriangleAlert } from "lucide-react";

/** `mm:ss` left until an instant; never negative. */
function countdown(expiresAt: string, now: number) {
  const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
}

/**
 * The QR Ph payment sheet: the code, the amount, a countdown to `expiresAt`,
 * and the status polled while it is on screen. The only payment method.
 */
export function PaymentSheet({
  intent,
  title,
  onClose,
}: {
  intent: QrPayment;
  title: string;
  onClose: () => void;
}) {
  const { data: payment = intent } = usePayment(intent.intentId, { initialData: intent });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);
  const expired = payment.status === "expired" || new Date(payment.expiresAt).getTime() <= now;
  const settled = payment.status === "paid";
  // What the payment bought has to show as bought: billing, featured
  // placement and branch reporting all read state the settlement changed.
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!settled) return;
    for (const queryKey of [
      keys.business.billing(),
      keys.business.profile(),
      keys.levers.featured(),
      keys.business.analytics.branchReporting(),
    ]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [settled, queryClient]);

  return (
    <Dialog title={title} eyebrow="Pay by QR Ph" onClose={onClose}>
      <div className="grid gap-4 text-center">
        {isPreview(payment) && <PreviewBadge className="justify-self-center" />}
        <p className="text-3xl font-extrabold tracking-[-0.02em]">
          {pesoFromCentavos(payment.amountCentavos)}
        </p>
        <p className="font-mono text-[11px] text-[var(--muted)]">Reference {payment.reference}</p>
        {settled ? (
          <div className="grid place-items-center gap-3 rounded-2xl bg-[rgb(15_118_85/10%)] p-6">
            <span className="grid size-12 place-items-center rounded-full bg-[var(--success)] text-white">
              <Check size={22} strokeWidth={3} />
            </span>
            <p className="text-sm font-extrabold">Paid. Thank you.</p>
          </div>
        ) : expired || payment.status === "failed" ? (
          <div className="grid place-items-center gap-3 rounded-2xl bg-[rgb(178_59_43/10%)] p-6">
            <TriangleAlert className="text-[var(--danger)]" />
            <p className="text-sm font-extrabold">
              {payment.status === "failed" ? "The payment failed." : "This code expired."}
            </p>
            <p className="text-xs text-[var(--muted-strong)]">Close this and start again for a fresh code.</p>
          </div>
        ) : (
          <>
            <div className="mx-auto w-fit rounded-2xl border border-[var(--line)] bg-white p-4">
              {/* A data URL from the API; nothing for the image optimiser to do. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={payment.qrImage} alt="QR Ph code to scan with GCash, Maya or a bank app" width={240} height={240} className="size-60" />
            </div>
            <p className="text-sm font-bold">Scan with GCash, Maya or your bank app.</p>
            <p className="text-xs text-[var(--muted-strong)]" role="status" aria-live="polite">
              Waiting for payment · expires in {countdown(payment.expiresAt, now)}
            </p>
          </>
        )}
        <Button tone={settled ? "dark" : "quiet"} onClick={onClose}>
          {settled ? "Done" : "Close"}
        </Button>
      </div>
    </Dialog>
  );
}
