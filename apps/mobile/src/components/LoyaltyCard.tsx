import { Image, Text, View } from "react-native";
import {
  Coins,
  Crown,
  Gift,
  Sparkles,
  Stamp,
  WalletCards,
} from "lucide-react-native";
import type { WalletCard } from "@kyprewards/api";
import { longDate, timeOfDay } from "@kyprewards/ui/format";
import {
  balanceLine,
  cardHeadline,
  cardStateLine,
  earnedStamps,
} from "@/lib/cards";
import { brandColor, withAlpha } from "@/lib/theme";
import { StampDots } from "@/components/StampDots";

export const walletIcons: Record<string, typeof Stamp> = {
  Stamps: Stamp,
  Points: Coins,
  Rewards: Gift,
  Membership: Crown,
};

/**
 * The card itself, in the shop's colour with their storefront behind it.
 *
 * Every sentence on it is built from a field the API sent; nothing here
 * decides a rule. "Ready" means a reward exists, not that the bar looks full.
 */
export function LoyaltyCard({
  card,
  compact = false,
}: {
  card: WalletCard;
  compact?: boolean;
}) {
  const brand = brandColor(card.color);
  const Icon = walletIcons[card.kind] ?? WalletCards;
  const soft = withAlpha(brand.foreground, 0.62);
  const state = cardStateLine(card);
  return (
    <View
      className="overflow-hidden rounded-2xl px-5 py-5"
      style={{ backgroundColor: brand.background }}
      accessibilityLabel={`${card.business}, ${balanceLine(card)}`}
    >
      {card.imageUrl ? (
        <Image
          source={{ uri: card.imageUrl }}
          accessibilityElementsHidden
          style={{ position: "absolute", inset: 0, opacity: 0.18 }}
          resizeMode="cover"
        />
      ) : null}
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className="size-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: withAlpha(brand.foreground, 0.12) }}
          >
            <Icon size={22} color={brand.foreground} />
          </View>
          <View>
            <Text
              className="font-sans-extrabold text-[16px] tracking-[-0.4px]"
              style={{ color: brand.foreground }}
            >
              {card.business}
            </Text>
            <Text
              className="mt-0.5 font-sans text-[11px]"
              style={{ color: soft }}
            >
              {card.category}
            </Text>
          </View>
        </View>
        <Text
          className="rounded-full px-2.5 py-1 font-sans-extrabold text-[9px] uppercase tracking-[1px]"
          style={{
            borderWidth: 1,
            borderColor: withAlpha(brand.foreground, 0.24),
            color: withAlpha(brand.foreground, 0.72),
          }}
        >
          {card.state ?? card.status}
        </Text>
      </View>

      {!compact ? (
        <Text
          className="mt-7 max-w-[19ch] font-sans-extrabold text-[23px] leading-[26px] tracking-[-0.5px]"
          style={{ color: brand.foreground }}
        >
          {cardHeadline(card)}
        </Text>
      ) : null}

      <View className={compact ? "mt-5" : "mt-7"}>
        {card.target > 0 ? (
          <StampDots
            filled={earnedStamps(card)}
            total={card.target}
            ink={brand.foreground}
            icon={card.stampIcon}
            imageUrl={card.stampImageUrl}
          />
        ) : null}
        <View className="mt-3 flex-row items-center justify-between">
          <Text
            className="font-sans-semibold text-[11px]"
            style={{ color: soft }}
          >
            {balanceLine(card)}
          </Text>
          <Text
            className="font-sans-semibold text-[11px]"
            style={{ color: brand.foreground }}
          >
            {card.reward}
          </Text>
        </View>
        {state ? (
          <Text
            className="mt-3 font-sans-semibold text-[11px]"
            style={{ color: withAlpha(brand.foreground, 0.72) }}
          >
            {state}
          </Text>
        ) : null}
        {card.redeemBy && card.rewardsAvailable > 0 ? (
          <Text
            className="mt-1 font-sans-semibold text-[11px]"
            style={{ color: withAlpha(brand.foreground, 0.72) }}
          >
            Redeem by {longDate(card.redeemBy)}
          </Text>
        ) : null}
        {card.bonusWindow?.live ? (
          <View className="mt-1 flex-row items-center gap-1.5">
            <Sparkles size={12} color={brand.foreground} />
            <Text
              className="font-sans-extrabold text-[11px]"
              style={{ color: brand.foreground }}
            >
              {card.bonusWindow.multiplier}× stamps until{" "}
              {timeOfDay(card.bonusWindow.endsAt)}
            </Text>
          </View>
        ) : null}
        {card.tier ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            <Text
              className="rounded-full px-2 py-0.5 font-sans-extrabold text-[9px] uppercase tracking-[1px]"
              style={{
                backgroundColor: withAlpha(brand.foreground, 0.12),
                color: brand.foreground,
              }}
            >
              {card.tier.name}
            </Text>
            <Text
              className="font-sans-semibold text-[11px]"
              style={{ color: withAlpha(brand.foreground, 0.72) }}
            >
              {card.tier.nextName && card.tier.nextIn !== null
                ? `${card.tier.basis === "visits" ? `${card.tier.nextIn} visits` : `₱${card.tier.nextIn}`} to ${card.tier.nextName}`
                : "Top suki tier"}
            </Text>
          </View>
        ) : null}
        {card.badge ? (
          <Text
            className="mt-2 self-start rounded-full px-2 py-0.5 font-sans-semibold text-[8px] uppercase tracking-[1.2px]"
            style={{
              borderWidth: 1,
              borderColor: withAlpha(brand.foreground, 0.4),
              color: withAlpha(brand.foreground, 0.6),
            }}
          >
            KYP Rewards
          </Text>
        ) : null}
      </View>
    </View>
  );
}
