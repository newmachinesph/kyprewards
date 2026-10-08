"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  ApiError,
  PREVIEW_WRITE_REASON,
  isPreview,
  keys,
  redeemPromoCode,
  useApiMutation,
  type WalletCard,
} from "@kyprewards/api";
import { Button, PreviewBadge } from "@kyprewards/ui";
import { Field, FormMessage, Input } from "@kyprewards/ui/form";
import { earningLine, longDate, peso, pesoFromCentavos, timeOfDay } from "@kyprewards/ui/format";
import { Check, Sparkles, Ticket } from "lucide-react";
import { couponValue } from "@/components/held";

/**
 * Everything a stamp card says about its own state and terms.
 *
 * Nothing here computes a rule. Each line is a sentence built from a field the
 * API put on the card; a card without the field gets no sentence.
 */

/** Stamps that count. A pending welcome stamp sits inside `progress` but has
 *  not been earned, so it is never drawn as a filled dot. */
export function earnedStamps(card: WalletCard): number {
  return card.state === "pending" ? Math.max(0, card.progress - 1) : card.progress;
}

const DAY_MINUTES = 1440;

export function cooldownLabel(minutes: number): string {
  if (minutes <= 0) return "no cooldown";
  if (minutes === DAY_MINUTES) return "once a day";
  if (minutes % DAY_MINUTES === 0) return `once every ${minutes / DAY_MINUTES} days`;
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `once every ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `once every ${minutes} minutes`;
}

/** "at 6:00 AM", "tomorrow at 6:00 AM", or "on 12 October 2026". */
export function untilLabel(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(at, today)) return `at ${timeOfDay(iso)}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(at, tomorrow)) return `tomorrow at ${timeOfDay(iso)}`;
  return `on ${longDate(iso.slice(0, 10))}`;
}

/** The one sentence about where this card stands, or null for a plain active card. */
export function cardStateLine(card: WalletCard): string | null {
  switch (card.state) {
    case "pending":
      return card.pendingStamp
        ? `Pending until your first visit · expires ${longDate(card.pendingStamp.expiresAt.slice(0, 10))}`
        : "Pending until your first visit";
    case "completed":
      return card.rules && card.rules.maxCompletions > 0
        ? `Completed · ${card.completions ?? 0} of ${card.rules.maxCompletions} this run`
        : "Completed";
    case "closed":
      if (card.closeOutcome === "expired") return "This run closed. Unfinished stamps expired.";
      if (card.closeOutcome === "carriedOver")
        return `This run closed. Unfinished stamps moved to ${card.successorProgram ?? "the next card"}.`;
      return "This run closed.";
    default:
      return card.nextStampAt ? `Next stamp available ${untilLabel(card.nextStampAt)}` : null;
  }
}

/** State, held reward deadline, tier, bonus window and badge, as small lines
 *  under a card. `onCard` sets the ink for the ticket ground; the card sets
 *  `--card-soft` to 100% over a photo so these lines keep AA there. */
export function CardStatus({ card, onCard = false }: { card: WalletCard; onCard?: boolean }) {
  const line = cardStateLine(card);
  const soft = onCard ? { color: "color-mix(in oklab, var(--card-ink) var(--card-soft, 72%), transparent)" } : undefined;
  const softClass = onCard ? "" : "text-[var(--muted-strong)]";
  return (
    <div className="mt-3 space-y-1.5 text-[11px] font-semibold">
      {line && (
        <p className={softClass} style={soft}>
          {line}
        </p>
      )}
      {card.redeemBy && card.rewardsAvailable > 0 && (
        <p className={softClass} style={soft}>
          Redeem by {longDate(card.redeemBy)}
        </p>
      )}
      {card.bonusWindow?.live && (
        <p className="flex items-center gap-1.5 font-extrabold">
          <Sparkles size={12} aria-hidden="true" />
          {card.bonusWindow.multiplier}× stamps until {timeOfDay(card.bonusWindow.endsAt)}
        </p>
      )}
      {card.tier && <TierChip card={card} onCard={onCard} />}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {card.badge && <KypBadge onCard={onCard} />}
        {isPreview(card) && <PreviewBadge />}
      </div>
    </div>
  );
}

export function TierChip({ card, onCard = false }: { card: WalletCard; onCard?: boolean }) {
  const tier = card.tier;
  if (!tier) return null;
  const next =
    tier.nextName && tier.nextIn !== null
      ? `${tier.basis === "visits" ? `${tier.nextIn} visits` : peso(tier.nextIn)} to ${tier.nextName}`
      : "Top suki tier";
  return (
    <p className="flex flex-wrap items-center gap-1.5">
      <span
        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] ${
          onCard ? "bg-[var(--card-ink)]/12" : "bg-[rgb(232_163_61/16%)] text-[var(--accent-strong)]"
        }`}
      >
        {tier.name}
      </span>
      <span
        className={onCard ? "" : "text-[var(--muted-strong)]"}
        style={onCard ? { color: "color-mix(in oklab, var(--card-ink) var(--card-soft, 72%), transparent)" } : undefined}
      >
        {next}
      </span>
    </p>
  );
}

/** The small, quiet mark on a Launch shop's card. */
export function KypBadge({ onCard = false }: { onCard?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] ${
        onCard ? "border-current" : "border-[var(--line-strong)] text-[var(--muted)]"
      }`}
      style={onCard ? { color: "color-mix(in oklab, var(--card-ink) var(--card-soft, 60%), transparent)" } : undefined}
      title="This shop is on the free Launch plan."
    >
      KYP Rewards
    </span>
  );
}

/** Mission progress bars for the card sheet. */
export function MissionList({ card }: { card: WalletCard }) {
  const missions = card.missions ?? [];
  if (missions.length === 0) return null;
  return (
    <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-extrabold">Missions</p>
      <ul className="mt-3 space-y-4">
        {missions.map((mission) => {
          const pct = mission.target > 0 ? Math.min(100, Math.round((mission.progress / mission.target) * 100)) : 0;
          return (
            <li key={mission.missionId}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-extrabold">{mission.name}</p>
                <span className="shrink-0 text-[11px] font-bold text-[var(--muted-strong)]">
                  {mission.completed ? (
                    <span className="inline-flex items-center gap-1 text-[var(--success)]">
                      <Check size={12} strokeWidth={3} aria-hidden="true" /> Done
                    </span>
                  ) : (
                    mission.goal === "spend"
                      ? `${peso(mission.progress)} of ${peso(mission.target)}`
                      : `${mission.progress} of ${mission.target}`
                  )}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={mission.name}
                aria-valuemin={0}
                aria-valuemax={mission.target}
                aria-valuenow={mission.progress}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"
              >
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--muted)]">
                {mission.bonus} · ends {longDate(mission.endsOn)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The merchant's settings, in plain language. Only the fields the card carries. */
export function CardTerms({ card }: { card: WalletCard }) {
  const rules = card.rules;
  const rows: [string, string][] = [];
  if (card.target > 0) rows.push(["Target", `${card.target} stamps`]);
  rows.push(["Reward", card.reward]);
  const earns = earningLine(card.earning);
  if (earns) rows.push(["Earning", earns]);
  if (!rules && (card.expiryDays ?? 0) > 0) {
    if (card.kind === "Points" || card.kind === "Rewards")
      rows.push(["Expiry", `${card.expiryDays} days after earning, oldest first`]);
    else if (card.kind === "Multipass") rows.push(["Expiry", `${card.expiryDays} days after purchase`]);
  }
  if (rules) {
    rows.push(["Cooldown", cooldownLabel(rules.cooldownMinutes)]);
    rows.push([
      "Minimum spend",
      rules.minSpendCentavos > 0 ? `${pesoFromCentavos(rules.minSpendCentavos)} per stamp` : "none",
    ]);
    rows.push([
      "Expiry",
      rules.expiryDays > 0
        ? `${rules.expiryDays} days for unclaimed stamps and earned rewards`
        : "stamps and rewards do not expire",
    ]);
    rows.push(["Welcome stamp", rules.welcomeStamp ? "on, pending until your first visit" : "off"]);
    if (rules.startsAt || rules.endsAt) {
      const from = rules.startsAt ? longDate(rules.startsAt.slice(0, 10)) : "now";
      const to = rules.endsAt ? longDate(rules.endsAt.slice(0, 10)) : "no end date";
      rows.push(["Run dates", `${from} to ${to}`]);
      rows.push([
        "After the run",
        rules.onClose === "carryOver"
          ? `unfinished stamps move to ${card.successorProgram ?? "the next card"}`
          : "unfinished stamps expire",
      ]);
      if (rules.rewardGraceDays > 0) {
        rows.push(["Held rewards", `redeemable for ${rules.rewardGraceDays} days after the run ends`]);
      }
    }
    if (rules.maxCompletions > 0) {
      rows.push(["Completions", `up to ${rules.maxCompletions} per member this run`]);
    }
  }
  return (
    <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-extrabold">Card terms</p>
      <dl className="mt-3 divide-y divide-[var(--line)]">
        {rows.map(([term, detail]) => (
          <div key={term} className="flex items-baseline justify-between gap-4 py-2 text-xs">
            <dt className="shrink-0 text-[var(--muted-strong)]">{term}</dt>
            <dd className="text-right font-bold">{detail}</dd>
          </div>
        ))}
      </dl>
      {!rules && (
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
          Cooldown, minimum spend and expiry appear here once the shop&apos;s
          settings arrive with the card. Rewards have no cash value.
        </p>
      )}
    </section>
  );
}

export function StoreCreditLine({ card }: { card: WalletCard }) {
  if (!card.storeCreditCentavos) return null;
  return (
    <p className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 text-sm">
      <span className="font-extrabold">Store credit</span>
      <span className="font-mono font-bold">{pesoFromCentavos(card.storeCreditCentavos)}</span>
    </p>
  );
}

/**
 * "Have a code?" on a card. Preview cards cannot redeem; a real card can try,
 * and the API's refusal is shown as it came.
 */
export function PromoCodeEntry({ card }: { card: WalletCard }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const preview = isPreview(card);
  const redeem = useApiMutation(redeemPromoCode, {
    invalidates: [keys.customer.wallet(), keys.customer.activity(), keys.customer.held()],
  });
  const coupon = redeem.data?.coupon;

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    redeem.mutate({ businessId: card.businessId, code: trimmed });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex min-h-11 w-full items-center gap-2 rounded-2xl border border-dashed border-[var(--line-strong)] px-4 text-xs font-extrabold text-[var(--muted-strong)]"
      >
        <Ticket size={15} aria-hidden="true" /> Have a code?
      </button>
    );
  }

  const failure = redeem.error;
  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <Field label={`Promo code from ${card.business}`}>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="WELCOME"
            disabled={preview || redeem.isPending}
            className="flex-1 font-mono uppercase tracking-[0.08em]"
          />
          <Button
            type="submit"
            disabled={preview || redeem.isPending || !code.trim()}
            title={preview ? PREVIEW_WRITE_REASON : undefined}
          >
            {redeem.isPending ? "Checking…" : "Redeem"}
          </Button>
        </div>
      </Field>
      {preview ? (
        <p className="mt-2 text-[11px] text-[var(--muted-strong)]">{PREVIEW_WRITE_REASON}</p>
      ) : (
        <FormMessage tone={redeem.isSuccess ? "success" : "error"} className="mt-2">
          {redeem.isSuccess ? (
            coupon ? (
              <>
                {coupon.name}
                {couponValue(coupon) ? `, ${couponValue(coupon)}` : ""}, is yours until{" "}
                {longDate(coupon.validUntil)}. Show this code at the counter:{" "}
                <span className="font-mono font-bold tracking-[0.08em]">{coupon.code}</span>
              </>
            ) : (
              "Code applied. Your card is updated."
            )
          ) : failure ? (
            <>
              {failure.message}
              {failure instanceof ApiError && failure.requestId ? (
                <span className="ml-1 font-mono font-normal text-[var(--muted)]">{failure.requestId}</span>
              ) : null}
            </>
          ) : null}
        </FormMessage>
      )}
    </form>
  );
}
