import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Gift,
  Search,
  Sparkles,
  WalletCards,
} from "lucide-react-native";
import { useDiscover, useWallet } from "@kyprewards/api";
import { longDate } from "@kyprewards/ui/format";
import { Screen } from "@/components/Screen";
import { LoyaltyCard, walletIcons } from "@/components/LoyaltyCard";
import {
  Chip,
  EmptyState,
  Eyebrow,
  Lede,
  QueryState,
  Row,
  Title,
} from "@/components/ui";
import {
  balanceLine,
  cardStateLine,
  categoriesFrom,
  percentOf,
} from "@/lib/cards";
import { colors } from "@/lib/theme";

/**
 * Every card, one private member code. The first card is shown in full; the
 * rest as rows with their progress. Chips come from the data, so a chip can
 * never fail to match a card the way a hand-written list did.
 */
export default function Wallet() {
  const router = useRouter();
  const wallet = useWallet();
  const cards = wallet.data ?? [];
  const { data: discover = [] } = useDiscover();
  const categories = categoriesFrom([
    ...cards.map((c) => c.category),
    ...discover.map((p) => p.category),
  ]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const term = query.trim().toLowerCase();
  const visible = cards.filter(
    (card) =>
      (category === "All" || card.category === category) &&
      card.business.toLowerCase().includes(term),
  );
  const walletBusinessIds = new Set(cards.map((card) => card.businessId));
  const newlyJoined = discover.filter(
    (place) =>
      place.joined &&
      !walletBusinessIds.has(place.businessId) &&
      place.name.toLowerCase().includes(term),
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={wallet.isRefetching}
          onRefresh={() => void wallet.refetch()}
        />
      }
    >
      <Eyebrow>Your collection</Eyebrow>
      <Title>Wallet</Title>
      <Lede>Every shop you have joined, one private member code.</Lede>

      <View className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        <Row
          first
          icon={<Gift size={18} color={colors.ink} />}
          label="Gifts"
          detail="Pasalubong sent and received, and a way to send one."
          onPress={() => router.push("/gifts")}
        />
      </View>

      <View className="mt-6 min-h-[48px] flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4">
        <Search size={17} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your cards"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Search loyalty cards"
          className="min-w-0 flex-1 py-3 font-sans text-[14px] text-ink"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {categories.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </ScrollView>

      <View className="mt-5 gap-3">
        <QueryState
          isPending={wallet.isPending}
          error={wallet.error}
          onRetry={() => void wallet.refetch()}
          label="your cards"
        >
          {visible.map((card, index) => {
            const Icon = walletIcons[card.kind] ?? WalletCards;
            const pct = percentOf(card);
            const feature = index === 0 && !query && category === "All";
            const state = cardStateLine(card);
            const open = () =>
              router.push({
                pathname: "/card/[id]",
                params: { id: card.id, programId: card.programId },
              });
            if (feature) {
              return (
                <Pressable
                  key={`${card.id}:${card.programId}`}
                  accessibilityRole="button"
                  onPress={open}
                >
                  <LoyaltyCard card={card} compact />
                </Pressable>
              );
            }
            return (
              <Pressable
                key={`${card.id}:${card.programId}`}
                accessibilityRole="button"
                onPress={open}
                className="flex-row items-center gap-4 rounded-2xl border border-line bg-surface p-4 active:opacity-90"
              >
                <View className="size-12 items-center justify-center rounded-2xl bg-surface-2">
                  <Icon size={19} color={colors.ink} />
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="shrink font-sans-extrabold text-[14px] text-ink"
                      numberOfLines={1}
                    >
                      {card.business}
                    </Text>
                    <Text className="rounded-full bg-surface-2 px-2 py-0.5 font-sans-extrabold text-[8px] uppercase tracking-[0.8px] text-ink">
                      {card.kind}
                    </Text>
                  </View>
                  <Text
                    className="mt-1 font-sans text-[11px] text-muted"
                    numberOfLines={1}
                  >
                    {card.program} · {balanceLine(card)}
                  </Text>
                  {state ? (
                    <Text className="mt-1 font-sans-semibold text-[11px] text-muted-strong">
                      {state}
                    </Text>
                  ) : null}
                  {card.rewardsAvailable > 0 ? (
                    <Text className="mt-1 font-sans-extrabold text-[11px] text-success">
                      {card.rewardsAvailable === 1
                        ? "1 reward held"
                        : `${card.rewardsAvailable} rewards held`}
                      {card.redeemBy
                        ? ` · redeem by ${longDate(card.redeemBy)}`
                        : ""}
                    </Text>
                  ) : null}
                  {pct !== null && card.state !== "closed" ? (
                    <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <View
                        className="h-full rounded-full bg-success"
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                  ) : null}
                </View>
                <ChevronRight size={16} color={colors.muted} />
              </Pressable>
            );
          })}
          {newlyJoined.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/place/[id]",
                  params: { id: place.id },
                })
              }
              className="flex-row items-center gap-4 rounded-2xl border border-line bg-surface p-4"
            >
              <View className="size-12 items-center justify-center rounded-2xl bg-surface-2">
                <Sparkles size={19} color={colors.ink} />
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-2">
                  <Text
                    className="shrink font-sans-extrabold text-[14px] text-ink"
                    numberOfLines={1}
                  >
                    {place.name}
                  </Text>
                  <Text className="rounded-full bg-success/10 px-2 py-0.5 font-sans-extrabold text-[8px] uppercase tracking-[0.8px] text-success">
                    Joined
                  </Text>
                </View>
                <Text
                  className="mt-1 font-sans text-[11px] text-muted"
                  numberOfLines={1}
                >
                  {place.reward}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.muted} />
            </Pressable>
          ))}
          {visible.length + newlyJoined.length === 0 ? (
            <EmptyState
              icon={<Search size={22} color={colors.muted} />}
              title={
                query ? "No wallet cards found." : "Nothing in your wallet yet."
              }
              detail={
                query
                  ? "Try a different name or card category."
                  : "Scan a counter code or join a shop from Discover to start one."
              }
            />
          ) : null}
        </QueryState>
      </View>

      <View className="mt-7 items-center rounded-2xl border border-dashed border-line-strong p-6">
        <View className="size-11 items-center justify-center rounded-2xl bg-surface-2">
          <WalletCards size={20} color={colors.mutedStrong} />
        </View>
        <Text className="mt-4 font-sans-extrabold text-[14px] text-ink">
          One code, every shop.
        </Text>
        <Text className="mt-1 max-w-[30ch] text-center font-sans text-[12px] leading-[18px] text-muted">
          Join a shop from its counter poster or from Discover and its card
          lands here with the terms in plain language.
        </Text>
      </View>
    </Screen>
  );
}
