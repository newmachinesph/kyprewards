"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  PREVIEW_WRITE_REASON,
  idempotencyKey,
  isPreview,
  keys,
  sendGift,
  useApiMutation,
  useCustomerGifts,
  type GiftTransfer,
} from "@kyprewards/api";
import { Button, Eyebrow, PreviewBadge, QueryBoundary } from "@kyprewards/ui";
import { Field, FormMessage, Input, Select, Textarea } from "@kyprewards/ui/form";
import { formatMemberCode, looksLikeMemberCode, relativeTime } from "@kyprewards/ui/format";
import { ArrowDownLeft, ArrowUpRight, Gift } from "lucide-react";
import { SheetFrame } from "@/components/Sheet";
import { useCustomerState } from "@/components/CustomerState";

/**
 * Pasalubong: a reward or points sent to another member of the same shop.
 *
 * The list is what the API says was sent and received. The form posts to the
 * gift route with the card's membership and the friend's member code; a
 * preview card cannot send, and the button says so.
 */
export function GiftsSheet({ close }: { close: () => void }) {
  const gifts = useCustomerGifts();
  const rows = gifts.data ?? [];
  const [sending, setSending] = useState(false);
  const received = rows.filter((gift) => gift.direction === "received");
  const sent = rows.filter((gift) => gift.direction === "sent");

  return (
    <SheetFrame title="Gifts" labelledBy="gifts-title" close={close}>
      <div className="px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6">
        <Eyebrow>Pasalubong</Eyebrow>
        <h2 id="gifts-title" className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">
          Gifts
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-strong)]">
          Send a held reward or points to another member of the same shop.
        </p>
        <Button
          size="lg"
          aria-expanded={sending}
          onClick={() => setSending((open) => !open)}
          icon={<Gift size={16} aria-hidden="true" />}
          className="mt-5 w-full"
        >
          {sending ? "Close the gift form" : "Send a gift"}
        </Button>
        {sending && <SendGiftForm onSent={() => setSending(false)} />}

        <div className="mt-7">
          <QueryBoundary
            isPending={gifts.isPending}
            error={gifts.error}
            onRetry={() => void gifts.refetch()}
            label="gifts"
            rows={3}
          >
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-7 text-center">
                <Gift className="mx-auto text-[var(--muted)]" aria-hidden="true" />
                <p className="mt-3 text-sm font-extrabold">No gifts yet.</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Gifts you send and receive are listed here with the shop they belong to.
                </p>
              </div>
            ) : (
              <>
                <GiftList title="Received" rows={received} />
                <GiftList title="Sent" rows={sent} />
              </>
            )}
          </QueryBoundary>
        </div>
      </div>
    </SheetFrame>
  );
}

function GiftList({ title, rows }: { title: string; rows: GiftTransfer[] }) {
  return (
    <section className="mt-5">
      <h3 className="text-base font-extrabold tracking-[-0.02em]">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--muted)]">Nothing {title.toLowerCase()} yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {rows.map((gift) => {
            const Icon = gift.direction === "received" ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={gift.id} className="flex items-start gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">
                    {gift.kind === "reward" ? gift.reward : `${gift.units} points`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-strong)]">
                    {gift.direction === "received" ? `From ${gift.fromName}` : `To ${gift.toName}`} · {gift.business}
                  </p>
                  {gift.message && (
                    <p className="mt-1 text-xs italic text-[var(--muted-strong)]">&ldquo;{gift.message}&rdquo;</p>
                  )}
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {relativeTime(gift.sentAt)} · {gift.status === "accepted" ? "accepted" : "sent"}
                  </p>
                </div>
                {isPreview(gift) && <PreviewBadge className="shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SendGiftForm({ onSent }: { onSent: () => void }) {
  const { wallet } = useCustomerState();
  const cards = wallet.filter((card) => card.rewardsAvailable > 0 || card.kind === "Points");
  const [cardKey, setCardKey] = useState(cards[0] ? `${cards[0].id}:${cards[0].programId}` : "");
  const card = cards.find((item) => `${item.id}:${item.programId}` === cardKey);
  const [kind, setKind] = useState<"reward" | "points">("reward");
  const [toMemberCode, setToMemberCode] = useState("");
  const [units, setUnits] = useState("");
  const [message, setMessage] = useState("");
  const send = useApiMutation(
    (body: Parameters<typeof sendGift>[0]) =>
      sendGift(body, idempotencyKey("gift", `${body.membershipId}_${body.toMemberCode}_${Date.now()}`)),
    { invalidates: [keys.wallet.gifts(), keys.customer.wallet()], onSuccess: onSent },
  );

  const preview = card ? isPreview(card) : false;
  const canReward = Boolean(card && card.rewardsAvailable > 0);
  const canPoints = Boolean(card && card.kind === "Points");
  const effectiveKind: "reward" | "points" = kind === "reward" && canReward ? "reward" : canPoints ? "points" : "reward";
  const digits = toMemberCode.replace(/\D/g, "");
  const unitsNumber = Number(units);
  const ready =
    Boolean(card) &&
    looksLikeMemberCode(toMemberCode) &&
    (effectiveKind === "reward" ? canReward : Number.isInteger(unitsNumber) && unitsNumber > 0) &&
    message.trim().length > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!card || !ready) return;
    send.mutate({
      membershipId: card.id,
      toMemberCode: digits,
      // A card carries no reward id, so a reward gift names the membership
      // only and the API picks from what is held there.
      ...(effectiveKind === "reward" ? {} : { units: unitsNumber }),
      message: message.trim(),
    });
  }

  if (cards.length === 0) {
    return (
      <p className="mt-3 rounded-2xl border border-dashed border-[var(--line-strong)] p-4 text-xs leading-relaxed text-[var(--muted-strong)]">
        Nothing to give yet. A gift is a reward you are holding, or points on a points card.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <Field label="From which card">
        <Select value={cardKey} onChange={(event) => setCardKey(event.target.value)}>
          {cards.map((item) => (
            <option key={`${item.id}:${item.programId}`} value={`${item.id}:${item.programId}`}>
              {item.business} · {item.program}
            </option>
          ))}
        </Select>
      </Field>
      {card && isPreview(card) && <PreviewBadge className="mt-2" />}

      <fieldset className="mt-4">
        <legend className="text-xs font-extrabold">What to send</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(
            [
              ["reward", "A held reward", canReward],
              ["points", "Points", canPoints],
            ] as const
          ).map(([value, label, allowed]) => (
            <label
              key={value}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border text-xs font-extrabold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--accent-strong)] ${
                effectiveKind === value ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)]"
              } ${allowed ? "" : "opacity-45"}`}
            >
              <input
                type="radio"
                name="gift-kind"
                value={value}
                checked={effectiveKind === value}
                disabled={!allowed}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        {card && !canReward && effectiveKind === "points" && (
          <p className="mt-1.5 text-[11px] text-[var(--muted)]">No reward is held on this card, so points it is.</p>
        )}
      </fieldset>

      {effectiveKind === "points" && (
        <Field label="How many points" className="mt-4">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={units}
            onChange={(event) => setUnits(event.target.value)}
          />
        </Field>
      )}

      <Field
        label="Your friend's member code"
        hint={`Thirteen digits, from the back of their card. They must be a member of ${card?.business ?? "the same shop"}.`}
        className="mt-4"
      >
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={toMemberCode}
          onChange={(event) => setToMemberCode(event.target.value)}
          onBlur={() => setToMemberCode((value) => (looksLikeMemberCode(value) ? formatMemberCode(value) : value))}
          placeholder="2988 7165 8005 5"
          className="font-mono tracking-[0.08em]"
        />
      </Field>

      <Field label="A message" className="mt-4">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          maxLength={200}
          placeholder="Pasalubong, para sa iyo"
        />
      </Field>

      <Button
        type="submit"
        size="lg"
        disabled={preview || !ready || send.isPending}
        title={preview ? PREVIEW_WRITE_REASON : undefined}
        className="mt-5 w-full"
      >
        {send.isPending ? "Sending…" : "Send the gift"}
      </Button>
      {preview && <p className="mt-2 text-[11px] text-[var(--muted-strong)]">{PREVIEW_WRITE_REASON}</p>}
      <FormMessage tone="error" className="mt-2">
        {send.error?.message}
      </FormMessage>
    </form>
  );
}
