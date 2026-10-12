import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { History, QrCode, Ticket } from "lucide-react-native";
import {
  ApiError,
  keys,
  redeemPromoCode,
  useActivity,
  useApiMutation,
  useHeld,
  useWallet,
} from "@kyprewards/api";
import {
  longDate,
  peso,
  pesoFromCentavos,
  relativeTime,
} from "@kyprewards/ui/format";
import { Screen } from "@/components/Screen";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { HeldAtShop } from "@/components/Held";
import {
  Button,
  EmptyState,
  Eyebrow,
  Panel,
  QueryState,
  Term,
  Title,
} from "@/components/ui";
import { cardTerms } from "@/lib/cards";
import { activityValue, couponValue, isGain } from "@/lib/held";
import { colors } from "@/lib/theme";

/**
 * One card: the card itself, what is held on it, its history at this shop,
 * its terms in plain language, and a place to type a promo code.
 */
export default function CardScreen() {
  const router = useRouter();
  const { id, programId } = useLocalSearchParams<{
    id: string;
    programId?: string;
  }>();
  const walletQuery = useWallet();
  const wallet = walletQuery.data ?? [];
  const { data: activity = [] } = useActivity();
  const heldQuery = useHeld();
  const held = heldQuery.data ?? [];
  // A failed /customer/held says so with a retry, rather than showing nothing.
  const heldError =
    !heldQuery.data && heldQuery.error ? (
      <View className="mt-4">
        <QueryState
          isPending={false}
          error={heldQuery.error}
          onRetry={() => void heldQuery.refetch()}
          label="what you hold here"
        >
          {null}
        </QueryState>
      </View>
    ) : null;
  // By the pair: a shop running stamps beside points has two cards on one
  // membership id, and matching the id alone opened whichever came first.
  const card = wallet.find(
    (item) => item.id === id && (!programId || item.programId === programId),
  );
  // A shop the shopper holds a gift card at without having joined has no
  // card; the wallet opens it by business id instead.
  const shop = held.find((s) => s.businessId === (card?.businessId ?? id));

  if (!card && shop) {
    return (
      <Screen title={shop.business} back>
        <Eyebrow>What you hold</Eyebrow>
        <Title>{shop.business}</Title>
        <HeldAtShop shop={shop} cards={[]} />
        <Button
          className="mt-5"
          icon={<QrCode size={16} color={colors.paper} />}
          onPress={() => router.push("/my-code")}
        >
          Show my code for this place
        </Button>
      </Screen>
    );
  }

  // Not "not in your wallet" while the lists that would hold it are loading,
  // or when the held list failed.
  if (!card && (walletQuery.isPending || heldQuery.isPending || heldError)) {
    return (
      <Screen title="Wallet card" back>
        {heldError ?? (
          <QueryState
            isPending
            error={null}
            onRetry={() => undefined}
            label="this card"
          >
            {null}
          </QueryState>
        )}
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen title="Wallet card" back>
        <EmptyState
          title="That card is not in your wallet."
          detail="It may have been left, or the run has closed."
        />
      </Screen>
    );
  }

  // By shop id: two shops can share a short name.
  const mine = activity.filter(
    (entry) => entry.businessId === card.businessId,
  );
  const terms = cardTerms(card);
  // Only a stamp card has settings still to come; a points or rewards card
  // carries everything it has in the rows above.
  const termsPending = !card.rules && card.kind === "Stamps";

  return (
    <Screen title="Wallet card" back>
      <LoyaltyCard card={card} />

      {card.rewardsAvailable > 0 ? (
        <View className="mt-4 rounded-2xl border border-success/30 bg-success/10 p-5">
          <Text className="font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-success">
            Held for you
          </Text>
          <Text className="mt-2 font-sans-extrabold text-[14px] text-ink">
            {card.kind !== "Stamps"
              ? `${card.rewardsAvailable} ${card.rewardsAvailable === 1 ? "reward" : "rewards"} from the catalog`
              : card.rewardsAvailable === 1
                ? `1 ${card.reward}`
                : `${card.rewardsAvailable} × ${card.reward}`}
          </Text>
          <Text className="mt-1 font-sans text-[12px] leading-[18px] text-muted-strong">
            Show your code at the counter. Staff reserve it, you approve it
            here, and it is handed over.
            {card.redeemBy ? ` Redeem by ${longDate(card.redeemBy)}.` : ""}
          </Text>
        </View>
      ) : null}

      {card.storeCreditCentavos ? (
        <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4">
          <Text className="font-sans-extrabold text-[14px] text-ink">
            Store credit
          </Text>
          <Text className="font-mono text-[14px] text-ink">
            {pesoFromCentavos(card.storeCreditCentavos)}
          </Text>
        </View>
      ) : null}

      {shop ? (
        <HeldAtShop
          shop={shop}
          cards={wallet.filter((item) => item.businessId === card.businessId)}
        />
      ) : (
        heldError
      )}

      {card.missions && card.missions.length > 0 ? (
        <Panel className="mt-4">
          <Text className="font-sans-extrabold text-[14px] text-ink">
            Missions
          </Text>
          {card.missions.map((mission) => {
            const pct =
              mission.target > 0
                ? Math.min(
                    100,
                    Math.round((mission.progress / mission.target) * 100),
                  )
                : 0;
            return (
              <View key={mission.missionId} className="mt-4">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 font-sans-extrabold text-[12px] text-ink">
                    {mission.name}
                  </Text>
                  <Text
                    className={`font-sans-bold text-[11px] ${mission.completed ? "text-success" : "text-muted-strong"}`}
                  >
                    {mission.completed
                      ? "Done"
                      : mission.goal === "spend"
                        ? `${peso(mission.progress)} of ${peso(mission.target)}`
                        : `${mission.progress} of ${mission.target}`}
                  </Text>
                </View>
                <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <View
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </View>
                <Text className="mt-1.5 font-sans text-[10px] text-muted">
                  {mission.bonus} · ends {longDate(mission.endsOn)}
                </Text>
              </View>
            );
          })}
        </Panel>
      ) : null}

      <View className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        {mine.length === 0 ? (
          <Text className="p-4 font-sans text-[12px] text-muted">
            No activity recorded yet. Your first visit will appear here.
          </Text>
        ) : (
          mine.map((entry, index) => (
            <View
              key={entry.id}
              className={`flex-row items-center gap-3 p-4 ${index > 0 ? "border-t border-line" : ""}`}
            >
              <View className="size-10 items-center justify-center rounded-2xl bg-surface-2">
                <History size={17} color={colors.ink} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-extrabold text-[14px] text-ink">
                  {entry.action}
                </Text>
                <Text className="mt-0.5 font-sans text-[10px] text-muted">
                  {entry.detail} · {relativeTime(entry.occurredAt)}
                </Text>
              </View>
              <Text
                className={`font-sans-extrabold text-[12px] ${isGain(entry) ? "text-success" : "text-ink"}`}
              >
                {activityValue(entry)}
              </Text>
            </View>
          ))
        )}
      </View>

      {terms.length > 0 || termsPending ? (
        <Panel className="mt-4">
          <Text className="font-sans-extrabold text-[14px] text-ink">
            Card terms
          </Text>
          <View className="mt-3">
            {terms.map(([term, detail], index) => (
              <Term key={term} term={term} detail={detail} first={index === 0} />
            ))}
          </View>
          {termsPending ? (
            <Text className="mt-3 font-sans text-[11px] leading-[17px] text-muted">
              Cooldown, minimum spend and expiry appear here once the
              shop&apos;s settings arrive with the card. Rewards have no cash
              value.
            </Text>
          ) : null}
        </Panel>
      ) : null}

      <PromoCodeEntry businessId={card.businessId} business={card.business} />

      <Button
        className="mt-5"
        icon={<QrCode size={16} color={colors.paper} />}
        onPress={() => router.push("/my-code")}
      >
        Show my code for this place
      </Button>
    </Screen>
  );
}

/** "Have a code?" - the API's refusal is shown as it came. */
function PromoCodeEntry({
  businessId,
  business,
}: {
  businessId: string;
  business: string;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const redeem = useApiMutation(redeemPromoCode, {
    invalidates: [
      keys.customer.wallet(),
      keys.customer.activity(),
      keys.customer.held(),
    ],
  });
  const coupon = redeem.data?.coupon;

  if (!open) {
    return (
      <Button
        tone="quiet"
        className="mt-4"
        icon={<Ticket size={15} color={colors.ink} />}
        onPress={() => setOpen(true)}
      >
        Have a code?
      </Button>
    );
  }
  return (
    <Panel className="mt-4">
      <Text className="font-sans-extrabold text-[12px] text-ink">
        Promo code from {business}
      </Text>
      <View className="mt-2 flex-row gap-2">
        <TextInput
          value={code}
          onChangeText={(typed) => setCode(typed.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="WELCOME"
          placeholderTextColor={colors.muted}
          editable={!redeem.isPending}
          className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 font-mono text-[14px] uppercase tracking-[1px] text-ink"
        />
        <Button
          full={false}
          busy={redeem.isPending}
          disabled={!code.trim()}
          onPress={() => redeem.mutate({ businessId, code: code.trim() })}
        >
          Redeem
        </Button>
      </View>
      {coupon ? (
        <View className="mt-3 rounded-2xl bg-success/10 p-4">
          <Text className="font-sans-extrabold text-[12px] text-success">
            {[coupon.name, couponValue(coupon)].filter(Boolean).join(" · ")}
          </Text>
          <Text
            selectable
            className="mt-2 self-start rounded-xl border border-dashed border-line-strong bg-surface px-3 py-2 font-mono text-[16px] tracking-[2px] text-ink"
          >
            {coupon.code}
          </Text>
          <Text className="mt-2 font-sans text-[11px] leading-[17px] text-muted-strong">
            Show this code at the counter. Valid until{" "}
            {longDate(coupon.validUntil)}.
          </Text>
        </View>
      ) : redeem.isSuccess ? (
        <Text className="mt-2 font-sans-bold text-[11px] text-success">
          Code applied. Your card is updated.
        </Text>
      ) : redeem.error ? (
        <View className="mt-2">
          <Text className="font-sans-bold text-[11px] text-danger">
            {redeem.error instanceof ApiError
              ? redeem.error.message
              : "That code did not work."}
          </Text>
          {redeem.error instanceof ApiError && redeem.error.requestId ? (
            <Text selectable className="mt-1 font-mono text-[10px] text-muted">
              Ref {redeem.error.requestId}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Panel>
  );
}
