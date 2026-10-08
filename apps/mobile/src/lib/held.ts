import type {
  ActivityEntry,
  HeldCoupon,
  HeldMembership,
  HeldShop,
} from "@kyprewards/api";
import { longDate, pesoFromCentavos } from "@kyprewards/ui/format";

/**
 * What a shopper holds at a shop, in words. The API sends numbers only
 * (GET /customer/held); every sentence is built here from a field it sent.
 */

/** 1250 bps -> "12.5%". */
export function percent(bps: number): string {
  const n = bps / 100;
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace(/0+$/, "")}%`;
}

/** Pesos first, as the web does; "" when the coupon carries neither. */
export function couponValue(coupon: HeldCoupon): string {
  if (coupon.valueCentavos > 0)
    return `${pesoFromCentavos(coupon.valueCentavos)} off`;
  if (coupon.percentBps > 0) return `${percent(coupon.percentBps)} off`;
  return "";
}

export const couponStates: Record<HeldCoupon["state"], string> = {
  active: "Ready to use",
  scheduled: "Not valid yet",
  redeemed: "Used",
  expired: "Expired",
};

export function membershipLine(m: HeldMembership): string {
  const date = m.renewsOn ? longDate(m.renewsOn) : null;
  switch (m.status) {
    case "current":
      return date ? `Active · renews ${date}` : "Active";
    case "due":
      return date
        ? `Renewal was due ${date} · renew at the counter`
        : "Renewal due · renew at the counter";
    case "lapsed":
      return "Lapsed · subscribe again at the counter";
    case "cancelled":
      return "Cancelled";
    default:
      return m.status;
  }
}

/** Benefits used this period; zero included means unlimited. */
export function benefitsLine(m: HeldMembership): string {
  return m.benefitsIncluded > 0
    ? `${m.benefitsUsed} of ${m.benefitsIncluded} benefits used`
    : `${m.benefitsUsed} benefits used · unlimited`;
}

/** The one line a wallet row has room for: "2 coupons · 3 passes · ₱500.00 gift card". */
export function heldSummary(shop: HeldShop | undefined): string | null {
  if (!shop) return null;
  const parts: string[] = [];
  const coupons = shop.coupons.filter((c) => c.state === "active").length;
  if (coupons) parts.push(`${coupons} ${coupons === 1 ? "coupon" : "coupons"}`);
  const passes = shop.passes.reduce((sum, p) => sum + p.remaining, 0);
  if (passes) parts.push(`${passes} ${passes === 1 ? "pass" : "passes"} left`);
  const gift = shop.giftCards
    .filter((g) => g.status === "active")
    .reduce((sum, g) => sum + g.balanceCentavos, 0);
  if (gift) parts.push(`${pesoFromCentavos(gift)} gift card`);
  const member = shop.memberships.find(
    (m) => m.status === "current" || m.status === "due",
  );
  if (member) parts.push(member.status === "due" ? "Renewal due" : "Member");
  if (shop.discount && shop.discount.rateBps > 0)
    parts.push(`${percent(shop.discount.rateBps)} off`);
  if (shop.cashbackCentavos > 0)
    parts.push(`${pesoFromCentavos(shop.cashbackCentavos)} cashback`);
  return parts.length ? parts.join(" · ") : null;
}

/** The API's value, or the money behind it when it sent none. */
export function activityValue(entry: ActivityEntry): string {
  if (entry.value) return entry.value;
  return entry.amountCentavos
    ? pesoFromCentavos(Math.abs(entry.amountCentavos))
    : "";
}

/** Whether an entry added to what the shopper holds. From the numbers, not
 *  the wording: "₱150.00" for a membership payment carries no sign. */
export function isGain(entry: ActivityEntry): boolean {
  if (entry.kind === undefined) return entry.value.startsWith("+");
  if (entry.kind === "membership_payment") return false;
  if (entry.delta) return entry.delta > 0;
  return (entry.amountCentavos ?? 0) > 0;
}
