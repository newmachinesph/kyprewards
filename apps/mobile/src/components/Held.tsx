import { useRef } from "react";
import { Alert, Text, View } from "react-native";
import {
  ApiError,
  chooseCatalogItem,
  keys,
  useApiMutation,
  useHeld,
  type HeldCatalogItem,
  type HeldShop,
  type WalletCard,
} from "@kyprewards/api";
import { longDate, pesoShortFromCentavos } from "@kyprewards/ui/format";
import { Button, Notice, Panel } from "@/components/ui";
import {
  benefitsLine,
  couponStates,
  couponValue,
  membershipLine,
  percent,
} from "@/lib/held";

/**
 * Everything the shopper holds at one shop that is not a card to fill:
 * coupons, prepaid passes, gift cards, memberships, a discount rate, cashback,
 * and the catalog their points buy from. A section appears only when the API
 * sent something for it.
 */
export function HeldAtShop({
  shop,
  cards,
  programId,
}: {
  shop: HeldShop;
  /** This shop's wallet cards, for the balance a catalog item is short of. */
  cards: WalletCard[];
  /** The card being read: its catalog only, as the web shows it. Absent on a
   *  shop with no card, which lists the whole catalog. */
  programId?: string;
}) {
  const catalog = programId
    ? shop.catalog.filter((item) => item.programId === programId)
    : shop.catalog;
  const heading = "font-sans-extrabold text-[14px] text-ink";
  const line = "mt-1 font-sans text-[11px] leading-[17px] text-muted";
  return (
    <>
      {shop.coupons.length > 0 ? (
        <Panel className="mt-4">
          <Text className={heading}>Coupons</Text>
          {shop.coupons.map((coupon, index) => {
            const live = coupon.state === "active";
            return (
              <View
                key={coupon.code}
                className={`py-3 ${index > 0 ? "border-t border-line" : "mt-1"} ${live ? "" : "opacity-60"}`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 font-sans-extrabold text-[12px] text-ink">
                    {coupon.name}
                  </Text>
                  <Text className="font-sans-extrabold text-[12px] text-ink">
                    {couponValue(coupon)}
                  </Text>
                </View>
                <Text
                  selectable
                  accessibilityLabel={`Coupon code ${coupon.code.split("").join(" ")}`}
                  className="mt-2 self-start rounded-xl border border-dashed border-line-strong px-3 py-2 font-mono text-[16px] tracking-[2px] text-ink"
                >
                  {coupon.code}
                </Text>
                <Text className={line}>
                  {couponStates[coupon.state]} · valid until{" "}
                  {longDate(coupon.validUntil)}
                  {live ? " · show this code at the counter" : ""}
                </Text>
              </View>
            );
          })}
        </Panel>
      ) : null}

      {shop.passes.length > 0 ? (
        <Panel className="mt-4">
          <Text className={heading}>Prepaid passes</Text>
          {shop.passes.map((pass, index) => (
            <View
              key={pass.programId}
              className={`py-3 ${index > 0 ? "border-t border-line" : "mt-1"}`}
            >
              <View className="flex-row items-baseline justify-between gap-3">
                <Text className="flex-1 font-sans-extrabold text-[12px] text-ink">
                  {pass.program}
                </Text>
                <Text className="font-sans-extrabold text-[12px] text-ink">
                  {pass.remaining} of {pass.included} left
                </Text>
              </View>
              <Text className={line}>
                {pass.expiresOn
                  ? `Oldest pass expires ${longDate(pass.expiresOn)}`
                  : "Passes do not expire"}
              </Text>
            </View>
          ))}
        </Panel>
      ) : null}

      {shop.giftCards.length > 0 ? (
        <Panel className="mt-4">
          <Text className={heading}>Gift cards</Text>
          {shop.giftCards.map((card, index) => (
            <View
              key={card.code}
              className={`py-3 ${index > 0 ? "border-t border-line" : "mt-1"} ${card.status === "active" ? "" : "opacity-60"}`}
            >
              <View className="flex-row items-baseline justify-between gap-3">
                <Text
                  selectable
                  className="flex-1 font-mono text-[13px] tracking-[1px] text-ink"
                >
                  {card.code}
                </Text>
                <Text className="font-sans-extrabold text-[14px] text-ink">
                  {pesoShortFromCentavos(card.balanceCentavos)}
                </Text>
              </View>
              <Text className={line}>
                {card.status !== "active"
                  ? card.status.charAt(0).toUpperCase() + card.status.slice(1)
                  : `${card.expiresOn ? `Expires ${longDate(card.expiresOn)}` : "Never expires"}${
                      card.paidCentavos > 0
                        ? ` · bought for ${pesoShortFromCentavos(card.paidCentavos)}`
                        : ""
                    }`}
              </Text>
            </View>
          ))}
        </Panel>
      ) : null}

      {shop.memberships.length > 0 ? (
        <Panel className="mt-4">
          <Text className={heading}>Membership</Text>
          {shop.memberships.map((m, index) => {
            const good = m.status === "current" || m.status === "due";
            return (
              <View
                key={m.subscriptionId}
                className={`py-3 ${index > 0 ? "border-t border-line" : "mt-1"}`}
              >
                <Text className="font-sans-extrabold text-[12px] text-ink">
                  {m.program}
                </Text>
                <Text
                  className={`mt-1 font-sans-bold text-[11px] ${m.status === "current" ? "text-success" : m.status === "due" ? "text-accent-strong" : "text-muted-strong"}`}
                >
                  {membershipLine(m)}
                </Text>
                {good ? (
                  <Text className={line}>
                    {benefitsLine(m)}
                    {m.discountBps > 0
                      ? ` · ${percent(m.discountBps)} member discount`
                      : ""}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </Panel>
      ) : null}

      {shop.discount && shop.discount.rateBps > 0 ? (
        <Panel className="mt-4">
          <View className="flex-row items-baseline justify-between gap-3">
            <Text className={heading}>Member discount</Text>
            <Text className="font-sans-extrabold text-[14px] text-ink">
              {percent(shop.discount.rateBps)} off
            </Text>
          </View>
          <Text className={line}>
            {shop.discount.tier
              ? `Your ${shop.discount.tier} rate, applied at the counter.`
              : "Applied at the counter when you show your code."}
          </Text>
        </Panel>
      ) : null}

      {shop.cashbackCentavos > 0 ? (
        <Panel className="mt-4">
          <View className="flex-row items-baseline justify-between gap-3">
            <Text className={heading}>Cashback</Text>
            <Text className="font-sans-extrabold text-[14px] text-ink">
              {pesoShortFromCentavos(shop.cashbackCentavos)}
            </Text>
          </View>
          <Text className={line}>Spend it at the counter, all or part.</Text>
        </Panel>
      ) : null}

      {catalog.length > 0 && shop.membershipId ? (
        <Catalog
          membershipId={shop.membershipId}
          items={catalog}
          cards={cards}
        />
      ) : null}
    </>
  );
}

const points = (n: number) => `${n} ${n === 1 ? "point" : "points"}`;

/** Points spent on an item from the wallet. The reward is then held and
 *  handed over at the counter through the usual approval. */
function Catalog({
  membershipId,
  items,
  cards,
}: {
  membershipId: string;
  items: HeldCatalogItem[];
  cards: WalletCard[];
}) {
  // After a choice the held list refetches; until it lands, `affordable` is stale.
  const { isFetching: refreshing } = useHeld();
  const choose = useApiMutation(
    // Keyed by the balance it spends from: a retried tap replays the first
    // choice, while a second choice comes from a lower balance and is new.
    // By program: a shop with stamps beside points has two cards on one
    // membership id, and the stamp card's progress does not move.
    (item: HeldCatalogItem) =>
      chooseCatalogItem(
        membershipId,
        item.id,
        `choose_${membershipId}_${item.id}_${cards.find((card) => card.programId === item.programId)?.progress ?? 0}`,
      ),
    { invalidates: keys.customer.afterCatalogChoice() },
  );
  // One question at a time: a double tap must not open two Alerts and spend
  // points twice. Cleared on cancel, dismiss, and when the choice settles.
  const asking = useRef(false);
  const release = () => {
    asking.current = false;
  };
  const confirm = (item: HeldCatalogItem) => {
    if (asking.current || choose.isPending) return;
    asking.current = true;
    Alert.alert(
      `Choose ${item.name}?`,
      `Spend ${points(item.cost)} on ${item.name}? The points leave your card now and it is held for you. Show your code at the counter and approve it here when staff reserve it.`,
      [
        { text: "Not now", style: "cancel", onPress: release },
        {
          text: "Choose",
          onPress: () => choose.mutate(item, { onSettled: release }),
        },
      ],
      { cancelable: true, onDismiss: release },
    );
  };

  return (
    <Panel className="mt-4">
      <Text className="font-sans-extrabold text-[14px] text-ink">
        Reward catalog
      </Text>
      {items.map((item, index) => {
        const balance = cards.find((c) => c.programId === item.programId)
          ?.progress;
        const short =
          balance === undefined ? null : Math.max(0, item.cost - balance);
        return (
          <View
            key={item.id}
            className={`flex-row items-center gap-3 py-3 ${index > 0 ? "border-t border-line" : "mt-1"}`}
          >
            <View className="min-w-0 flex-1">
              <Text className="font-sans-extrabold text-[12px] text-ink">
                {item.name}
              </Text>
              <Text className="mt-1 font-sans text-[11px] text-muted">
                {points(item.cost)}
                {item.kind === "discount" && item.valueCentavos > 0
                  ? ` · ${pesoShortFromCentavos(item.valueCentavos)} off your bill`
                  : ""}
              </Text>
              {/* How far off, once some points are in: at zero it only
                  repeats the price above. */}
              {!item.affordable && short !== item.cost ? (
                <Text className="mt-1 font-sans-bold text-[11px] text-muted-strong">
                  {short
                    ? `${short} more ${short === 1 ? "point" : "points"}`
                    : "Not enough points yet"}
                </Text>
              ) : null}
            </View>
            {item.affordable ? (
              <Button
                full={false}
                tone="accent"
                busy={choose.isPending && choose.variables?.id === item.id}
                disabled={choose.isPending || refreshing}
                accessibilityLabel={`Choose ${item.name} for ${points(item.cost)}`}
                onPress={() => confirm(item)}
              >
                Choose
              </Button>
            ) : null}
          </View>
        );
      })}
      {choose.isSuccess ? (
        <View className="mt-3">
          <Notice>
            {choose.data.rewardName || choose.data.name} is held for you. Show
            your code at the counter; staff reserve it and you approve it here.
          </Notice>
        </View>
      ) : choose.error ? (
        <View className="mt-3">
          <Text className="font-sans-bold text-[11px] text-danger">
            {choose.error instanceof ApiError
              ? choose.error.message
              : "That could not be chosen. Try again."}
          </Text>
          {choose.error instanceof ApiError && choose.error.requestId ? (
            <Text selectable className="mt-1 font-mono text-[10px] text-muted">
              Ref {choose.error.requestId}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Panel>
  );
}
