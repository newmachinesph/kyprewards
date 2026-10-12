"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  ApiError,
  chooseCatalogItem,
  isPreview,
  keys,
  useApiMutation,
  useHeld,
  type HeldCoupon,
  type HeldShop,
  type WalletCard,
} from "@kyprewards/api";
import { Button, QueryBoundary } from "@kyprewards/ui";
import { FormMessage } from "@kyprewards/ui/form";
import { longDate, pesoShortFromCentavos } from "@kyprewards/ui/format";
import { BadgeCheck, Coins, Crown, Gift, Percent, Ticket } from "lucide-react";

/**
 * What a shopper holds at a shop, as opposed to what they are filling up:
 * coupons, passes, gift cards, a membership, a discount rate, cashback.
 * The API sends numbers; every sentence is built here.
 */

const money = pesoShortFromCentavos;

/** `1250` basis points → `12.5%`. */
export const percent = (bps: number) => `${Number((bps / 100).toFixed(2))}%`;

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export function couponValue(coupon: Pick<HeldCoupon, "valueCentavos" | "percentBps">): string {
  if (coupon.valueCentavos > 0) return `${money(coupon.valueCentavos)} off`;
  if (coupon.percentBps > 0) return `${percent(coupon.percentBps)} off`;
  return "";
}

const COUPON_STATE: Record<HeldCoupon["state"], string> = {
  active: "Ready to use",
  scheduled: "Not valid yet",
  redeemed: "Used",
  expired: "Expired",
};

/** The one line a wallet row has room for: "2 coupons · ₱150 gift card". */
export function heldSummary(shop: HeldShop | undefined): string {
  if (!shop) return "";
  const parts: string[] = [];
  const coupons = shop.coupons.filter((coupon) => coupon.state === "active").length;
  if (coupons) parts.push(plural(coupons, "coupon"));
  const gift = shop.giftCards
    .filter((card) => card.status === "active")
    .reduce((sum, card) => sum + card.balanceCentavos, 0);
  if (gift) parts.push(`${money(gift)} gift card`);
  const passes = shop.passes.reduce((sum, pass) => sum + pass.remaining, 0);
  if (passes) parts.push(plural(passes, "pass", "passes"));
  const member = shop.memberships.find((m) => m.status === "current" || m.status === "due");
  if (member) parts.push(member.status === "due" ? "Membership due" : "Member");
  if (shop.discount && shop.discount.rateBps > 0) parts.push(`${percent(shop.discount.rateBps)} off`);
  if (shop.cashbackCentavos > 0) parts.push(`${money(shop.cashbackCentavos)} cashback`);
  return parts.join(" · ");
}

/** A card's balance as the shopper counts it: pesos on a cashback card. */
export function balanceLine(card: WalletCard): string {
  if (card.earning?.mode === "cashback") return `${money(card.cashbackCentavos ?? 0)} cashback`;
  return card.balance;
}

function membershipLine(status: string, renewsOn: string | null): string {
  const date = renewsOn ? longDate(renewsOn) : "";
  if (status === "current") return date ? `Active · renew by ${date}` : "Active";
  if (status === "due")
    return date ? `Payment was due ${date} · renew at the counter to keep it` : "Payment due · renew at the counter";
  if (status === "lapsed") return "Lapsed · pay at the counter to start it again";
  if (status === "cancelled") return "Cancelled";
  return status;
}

function Row({
  icon,
  title,
  value,
  children,
}: {
  icon: ReactNode;
  title: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-extrabold">{title}</p>
          {value && <p className="shrink-0 font-mono text-sm font-bold">{value}</p>}
        </div>
        <div className="mt-0.5 space-y-0.5 text-[11px] leading-relaxed text-[var(--muted-strong)]">{children}</div>
      </div>
    </li>
  );
}

function Code({ code }: { code: string }) {
  return (
    <span className="mt-1 inline-block rounded-md border border-dashed border-[var(--line-strong)] px-2 py-0.5 font-mono text-xs font-bold tracking-[0.08em] text-[var(--ink)]">
      {code}
    </span>
  );
}

/** Everything held at one shop, for that shop's card sheet. Nothing when it
 *  holds nothing; a short error with a retry when /customer/held failed. */
export function HeldSection({ shop }: { shop: HeldShop | undefined }) {
  const held = useHeld();
  if (!held.data && held.error) {
    return (
      <div className="mt-4">
        <QueryBoundary
          isPending={false}
          error={held.error}
          onRetry={() => void held.refetch()}
          label="what you hold"
        >
          {null}
        </QueryBoundary>
      </div>
    );
  }
  if (!shop) return null;
  const member = shop.memberships;
  const empty =
    shop.coupons.length +
      shop.passes.length +
      shop.giftCards.length +
      member.length ===
      0 &&
    !(shop.discount && shop.discount.rateBps > 0) &&
    shop.cashbackCentavos <= 0;
  if (empty) return null;

  return (
    <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 pb-2 pt-5">
      <p className="text-sm font-extrabold">What you hold here</p>
      <ul className="mt-1 divide-y divide-[var(--line)]">
        {member.map((m) => (
          <Row key={m.subscriptionId} icon={<Crown size={16} />} title={m.program}>
            <p className="font-semibold text-[var(--ink)]">{membershipLine(m.status, m.renewsOn)}</p>
            {(m.status === "current" || m.status === "due") && (
              <>
                <p>
                  {m.benefitsIncluded > 0
                    ? `${m.benefitsUsed} of ${m.benefitsIncluded} benefits used this period`
                    : `Unlimited benefits · ${m.benefitsUsed} used this period`}
                </p>
                {m.discountBps > 0 && <p>{percent(m.discountBps)} member discount</p>}
              </>
            )}
          </Row>
        ))}
        {shop.discount && shop.discount.rateBps > 0 && (
          <Row
            icon={<Percent size={16} />}
            title="Your discount"
            value={percent(shop.discount.rateBps)}
          >
            <p>
              {shop.discount.tier ? `${shop.discount.tier} tier` : "Every member's rate"} · taken off at the
              counter
            </p>
          </Row>
        )}
        {shop.cashbackCentavos > 0 && (
          <Row icon={<Coins size={16} />} title="Cashback" value={money(shop.cashbackCentavos)}>
            <p>Spend it at the counter, all at once or a little at a time.</p>
          </Row>
        )}
        {shop.giftCards.map((card) => (
          <Row key={card.code} icon={<Gift size={16} />} title="Gift card" value={money(card.balanceCentavos)}>
            <Code code={card.code} />
            <p>
              {card.status !== "active"
                ? card.status.charAt(0).toUpperCase() + card.status.slice(1)
                : card.expiresOn
                  ? `Free voucher · use by ${longDate(card.expiresOn)}`
                  : "Never expires"}
            </p>
          </Row>
        ))}
        {shop.passes.map((pass) => (
          <Row
            key={pass.programId}
            icon={<Ticket size={16} />}
            title={pass.program}
            value={`${pass.remaining} of ${pass.included}`}
          >
            <p>
              {plural(pass.remaining, "pass", "passes")} left
              {pass.expiresOn ? ` · the oldest expires ${longDate(pass.expiresOn)}` : " · no expiry"}
            </p>
          </Row>
        ))}
        {shop.coupons.map((coupon) => (
          <Row key={coupon.code} icon={<Ticket size={16} />} title={coupon.name} value={couponValue(coupon)}>
            {coupon.state === "active" && <Code code={coupon.code} />}
            <p>
              {COUPON_STATE[coupon.state]}
              {coupon.state === "active" || coupon.state === "scheduled"
                ? ` · valid until ${longDate(coupon.validUntil)}`
                : ""}
            </p>
          </Row>
        ))}
      </ul>
      {shop.coupons.some((coupon) => coupon.state === "active") ||
      shop.giftCards.some((card) => card.status === "active") ? (
        <p className="pb-3 text-[11px] text-[var(--muted)]">Show the code at the counter.</p>
      ) : null}
    </section>
  );
}

/**
 * What a points balance buys at this shop. Choosing spends the points now and
 * holds the reward; staff hand it over with the usual approval on this phone.
 */
export function CatalogSection({ card, shop }: { card: WalletCard; shop: HeldShop | undefined }) {
  const items = (shop?.catalog ?? []).filter((item) => item.programId === card.programId);
  const [confirming, setConfirming] = useState("");
  const [chosen, setChosen] = useState("");
  // After a choice the held list refetches; until it lands, `affordable` is stale.
  const { isFetching: refreshing } = useHeld();
  const choose = useApiMutation(
    // Keyed by the balance it spends from: a retried tap replays the first
    // choice, while a second choice comes from a lower balance and is new.
    (itemId: string) =>
      chooseCatalogItem(card.id, itemId, `choose_${card.id}_${itemId}_${card.progress}`),
    {
      invalidates: keys.customer.afterCatalogChoice(),
      onSuccess: (result) => {
        setConfirming("");
        setChosen(result.rewardName || result.name);
      },
    },
  );
  if (items.length === 0) return null;
  const preview = isPreview(card);

  return (
    <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-extrabold">Spend your points</p>
      <p className="mt-1 text-[11px] text-[var(--muted-strong)]">You have {card.balance}.</p>
      {chosen && (
        <FormMessage tone="success" className="mt-3">
          {chosen} is held for you. Show your code at the counter; staff reserve it and you approve it here.
        </FormMessage>
      )}
      <ul className="mt-2 divide-y divide-[var(--line)]">
        {items.map((item) => {
          const short = Math.max(0, item.cost - card.progress);
          const open = confirming === item.id;
          return (
            <li key={item.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-strong)]">
                    {plural(item.cost, "point")}
                    {item.kind === "discount" && item.valueCentavos > 0
                      ? ` · ${money(item.valueCentavos)} off at the counter`
                      : ""}
                  </p>
                  {/* How far off, once some points are in: at zero it only
                      repeats the price above. */}
                  {!item.affordable && short < item.cost && (
                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
                      {plural(short || 1, "more point")}
                    </p>
                  )}
                </div>
                {item.affordable && !open && (
                  <Button
                    size="sm"
                    disabled={preview || choose.isPending || refreshing}
                    onClick={() => {
                      choose.reset();
                      setChosen("");
                      setConfirming(item.id);
                    }}
                  >
                    Choose
                  </Button>
                )}
              </div>
              {open && (
                <div className="mt-3 rounded-xl bg-[var(--surface-2)] p-3">
                  <p className="text-xs font-semibold">
                    Spend {plural(item.cost, "point")} on {item.name}? The points leave your card now.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button tone="quiet" size="sm" onClick={() => setConfirming("")} disabled={choose.isPending}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      icon={<BadgeCheck size={14} aria-hidden="true" />}
                      disabled={choose.isPending}
                      onClick={() => choose.mutate(item.id)}
                    >
                      {choose.isPending ? "Choosing…" : "Spend points"}
                    </Button>
                  </div>
                  {choose.error && (
                    <FormMessage tone="error" className="mt-2">
                      {choose.error.message}
                      {choose.error instanceof ApiError && choose.error.requestId ? (
                        <span className="mt-1 block font-mono font-normal text-[var(--muted)]">
                          Ref {choose.error.requestId}
                        </span>
                      ) : null}
                    </FormMessage>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
