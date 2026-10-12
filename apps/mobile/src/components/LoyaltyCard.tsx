import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  Coins,
  Crown,
  Gift,
  Sparkles,
  Stamp,
  WalletCards,
} from "lucide-react-native";
import { useHeld, type WalletCard } from "@kyprewards/api";
import { earningLine, longDate, peso, timeOfDay } from "@kyprewards/ui/format";
import {
  balanceLine,
  cardHeadline,
  cardStateLine,
  earnedStamps,
} from "@/lib/cards";
import { heldSummary } from "@/lib/held";
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
  // Over a photo every small line is full-strength ink: the shade under it
  // lets at most ~5% of the photo through, which keeps 11px text at AA 4.5:1
  // for all four brand colours against a white or a black photo. Without a
  // photo the quiet lines keep their softer ink on the flat ground.
  // Green is the exception without a photo too: 62% paper on it is ~3:1.
  const ink = (alpha: number) =>
    withAlpha(brand.foreground, card.imageUrl || card.color === "green" ? 1 : alpha);
  const soft = ink(0.62);
  const state = cardStateLine(card);
  const { data: held = [] } = useHeld();
  // A card with no balance (a shop whose programs are all things held) says
  // what is held there, then the program's name.
  const balance =
    balanceLine(card) ||
    heldSummary(held.find((shop) => shop.businessId === card.businessId)) ||
    card.program;
  const earns = earningLine(card.earning);
  const headline = cardHeadline(card, balance);
  // A card with no finish line leads with its balance; the full card does
  // not say it a second time under the headline.
  const footnote = !compact && headline === balance ? "" : balance;
  return (
    <View
      className="overflow-hidden rounded-2xl px-5 py-5"
      style={{ backgroundColor: brand.background }}
      accessibilityLabel={`${card.business}, ${balance || card.reward}`}
    >
      {card.imageUrl ? (
        <>
          <Image
            source={{ uri: card.imageUrl }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <BrandShade color={brand.background} />
        </>
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
            // Top right is where the photo shows most; the pill carries its
            // own ground there so the label keeps its contrast.
            backgroundColor: card.imageUrl
              ? withAlpha(brand.background, 0.94)
              : undefined,
            color: ink(0.72),
          }}
        >
          {card.state ?? card.status}
        </Text>
      </View>

      {!compact ? (
        <Text
          className="mt-7 max-w-[19ch] font-sans-extrabold text-[23px] leading-[26px] tracking-[-0.5px]"
          style={{
            color: brand.foreground,
            // Over a photo the headline's tail reaches the lighter shade;
            // a soft halo in the brand colour keeps it readable there.
            ...(card.imageUrl
              ? { textShadowColor: brand.background, textShadowRadius: 8 }
              : null),
          }}
        >
          {headline}
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
            {footnote}
          </Text>
          <Text
            className="font-sans-semibold text-[11px]"
            style={{ color: brand.foreground }}
          >
            {card.reward}
          </Text>
        </View>
        {earns ? (
          <Text
            className="mt-1 font-sans-semibold text-[11px]"
            style={{ color: soft }}
          >
            Earn {earns}
          </Text>
        ) : null}
        {state ? (
          <Text
            className="mt-3 font-sans-semibold text-[11px]"
            style={{ color: ink(0.72) }}
          >
            {state}
          </Text>
        ) : null}
        {card.redeemBy && card.rewardsAvailable > 0 ? (
          <Text
            className="mt-1 font-sans-semibold text-[11px]"
            style={{ color: ink(0.72) }}
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
              {card.bonusWindow.multiplier}×{" "}
              {card.kind === "Stamps" ? "stamps" : "points"} until{" "}
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
            {/* One line: the perk is what the tier is for, the rung count is
                what is left, and the card has no room for a second row. */}
            <Text
              numberOfLines={1}
              className="min-w-0 shrink font-sans-semibold text-[11px]"
              style={{ color: ink(0.72) }}
            >
              {card.tier.nextName && card.tier.nextIn !== null
                ? `${card.tier.basis === "visits" ? `${card.tier.nextIn} visits` : peso(card.tier.nextIn)} to ${card.tier.nextName}`
                : "Top suki tier"}
              {card.tier.benefit?.trim() ? ` · ${card.tier.benefit.trim()}` : ""}
            </Text>
          </View>
        ) : null}
        {card.badge ? (
          <Text
            className="mt-2 self-start rounded-full px-2 py-0.5 font-sans-semibold text-[8px] uppercase tracking-[1.2px]"
            style={{
              borderWidth: 1,
              borderColor: withAlpha(brand.foreground, 0.4),
              color: ink(0.6),
            }}
          >
            KYP Rewards
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * The legibility shade over a storefront photo, mirroring the web card: the
 * brand colour at 97% across the first 45% where the words sit, falling to
 * 40% and 12% toward the right, plus a shade rising from the bottom that
 * holds 94%+ under the text rows and 72% under the headline. Drawn with
 * react-native-svg, already a dependency for the member code.
 */
function BrandShade({ color }: { color: string }) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient id="across" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={0.97} />
          <Stop offset="0.45" stopColor={color} stopOpacity={0.97} />
          <Stop offset="0.72" stopColor={color} stopOpacity={0.4} />
          <Stop offset="1" stopColor={color} stopOpacity={0.12} />
        </LinearGradient>
        <LinearGradient id="rise" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.3" stopColor={color} stopOpacity={0.72} />
          <Stop offset="0.65" stopColor={color} stopOpacity={0.94} />
          <Stop offset="1" stopColor={color} stopOpacity={0.97} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#across)" />
      <Rect width="100%" height="100%" fill="url(#rise)" />
    </Svg>
  );
}
