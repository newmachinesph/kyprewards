import { Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Megaphone,
  ScanLine,
  Sparkles,
  Store,
} from "lucide-react-native";
import {
  useActivity,
  useCustomerProfile,
  useDiscover,
  useNearby,
  useNotifications,
  usePendingApprovals,
  useWallet,
} from "@kyprewards/api";
import {
  formatDistance,
  greeting,
  relativeTime,
  todayLabel,
} from "@kyprewards/ui/format";
import { CategoryIcon } from "@/components/PlaceThumb";
import { Screen } from "@/components/Screen";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { BrandMark } from "@/components/Brand";
import {
  Button,
  EmptyState,
  Eyebrow,
  Panel,
  QueryState,
} from "@/components/ui";
import { balanceLine, closestReward, earnedStamps } from "@/lib/cards";
import { useCoordinates } from "@/lib/location";
import { colors } from "@/lib/theme";

/**
 * The day, at a glance: a reward waiting for approval, the shops close by,
 * the card nearest its reward, two places worth a walk, the latest thing a
 * shop did. Every line comes from a request; nothing here is a fixture.
 */
export default function Home() {
  const router = useRouter();
  const { data: profile } = useCustomerProfile();
  const wallet = useWallet();
  const cards = wallet.data ?? [];
  const where = useCoordinates("granted-only");
  const { data: discover = [] } = useDiscover(where);
  const { data: approvals = [] } = usePendingApprovals();
  const { data: nudges = [] } = useNearby(where);
  const { data: activity = [] } = useActivity();
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.some((n) => !n.read);

  const best = closestReward(cards);
  const held = cards.reduce((sum, card) => sum + card.rewardsAvailable, 0);
  const suggestions = discover.filter((place) => !place.joined).slice(0, 2);
  const latest = activity[0];

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={wallet.isRefetching}
          onRefresh={() => void wallet.refetch()}
        />
      }
    >
      <View className="flex-row items-center justify-between">
        <BrandMark tagline={null} />
        <View className="flex-row gap-2">
          {approvals.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${approvals.length} reward${approvals.length === 1 ? "" : "s"} waiting for your approval`}
              onPress={() => router.push("/approvals")}
              className="size-10 items-center justify-center rounded-full bg-accent"
            >
              <BadgeCheck size={18} color={colors.ink} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push("/notifications")}
            className="size-10 items-center justify-center rounded-full border border-line bg-surface"
          >
            <Bell size={18} color={colors.ink} />
            {unread ? (
              <View className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
            ) : null}
          </Pressable>
        </View>
      </View>

      <View className="mt-6">
        <Eyebrow>{todayLabel()}</Eyebrow>
        <View className="mt-2 flex-row items-end justify-between gap-3">
          <View>
            <Text className="font-sans text-[14px] text-muted-strong">
              {greeting()},
            </Text>
            <Text className="font-display text-[30px] leading-[34px] tracking-[-0.9px] text-ink">
              {profile?.name ? `${profile.name.split(" ")[0]}.` : " "}
            </Text>
          </View>
          {best && earnedStamps(best) > 0 ? (
            <View className="mb-1 flex-row items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5">
              <Sparkles size={13} color={colors.success} />
              <Text className="font-sans-extrabold text-[11px] text-success">
                {best.target > 0
                  ? `${earnedStamps(best)} of ${best.target} stamps`
                  : balanceLine(best)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {approvals.length > 0 ? (
        <View className="mt-7 rounded-3xl bg-ink p-5">
          <Text className="font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-accent">
            Waiting for your approval
          </Text>
          <Text className="mt-2 font-sans-extrabold text-[16px] tracking-[-0.3px] text-paper">
            {approvals.length === 1
              ? `${approvals[0].reward} at ${approvals[0].business}`
              : `${approvals.length} rewards at the counter`}
          </Text>
          <Text className="mt-1 font-sans text-[12px] text-white/60">
            Your approval releases the reward at the counter.
          </Text>
          <Button
            tone="accent"
            className="mt-4"
            icon={<BadgeCheck size={16} color={colors.ink} />}
            onPress={() => router.push("/approvals")}
          >
            Approve
          </Button>
        </View>
      ) : null}

      {nudges.length > 0 ? (
        <View className="mt-7 rounded-3xl border border-accent-strong bg-accent p-5">
          <Text className="font-sans-extrabold text-[11px] uppercase tracking-[1.6px] text-ink">
            You are close by
          </Text>
          {nudges.slice(0, 2).map((nudge) => (
            <View key={nudge.branchId} className="mt-3">
              <Text className="font-sans-extrabold text-[16px] tracking-[-0.3px] text-ink">
                {nudge.business}
              </Text>
              <Text className="mt-0.5 font-sans-semibold text-[12px] text-ink">
                {nudge.branch} · {formatDistance(nudge.metres)} ·{" "}
                {nudge.open ? "open now" : "closed"}
              </Text>
              {nudge.reward ? (
                <Text className="mt-1 font-sans-bold text-[12px] text-ink">
                  {nudge.reward} waiting
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-7">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-sans-extrabold text-[16px] tracking-[-0.4px] text-ink">
            Closest reward
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/wallet")}
          >
            <Text className="font-sans-bold text-[12px] text-accent-strong">
              My wallet
            </Text>
          </Pressable>
        </View>
        <QueryState
          isPending={wallet.isPending}
          error={wallet.error}
          onRetry={() => void wallet.refetch()}
          label="your cards"
        >
          {best ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/card/[id]",
                  params: { id: best.id, programId: best.programId },
                })
              }
            >
              <LoyaltyCard card={best} />
            </Pressable>
          ) : (
            <EmptyState
              icon={<Store size={22} color={colors.muted} />}
              title="No cards yet."
              detail="Scan a counter poster or join a shop from Discover to start one."
              action={
                <Button
                  tone="quiet"
                  icon={<ScanLine size={16} color={colors.ink} />}
                  onPress={() => router.push("/scan")}
                >
                  Scan a poster
                </Button>
              }
            />
          )}
        </QueryState>
        {cards.length > 0 ? (
          <View className="mt-3 flex-row gap-2">
            {[
              ["Cards", String(cards.length)],
              ["Held rewards", String(held)],
              ["To approve", String(approvals.length)],
            ].map(([label, value]) => (
              <View
                key={label}
                className="flex-1 items-center rounded-2xl border border-line bg-surface px-2 py-3"
              >
                <Text className="font-sans-bold text-[10px] uppercase tracking-[0.8px] text-muted">
                  {label}
                </Text>
                <Text className="mt-1 font-sans-extrabold text-[18px] tracking-[-0.4px] text-ink">
                  {value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View className="mt-7">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-sans-extrabold text-[16px] tracking-[-0.4px] text-ink">
            Worth a short walk
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/discover")}
          >
            <Text className="font-sans-bold text-[12px] text-accent-strong">
              Explore
            </Text>
          </Pressable>
        </View>
        {suggestions.length === 0 ? (
          <Panel>
            <Text className="font-sans text-[11px] text-muted">
              {discover.length === 0
                ? "Looking for places near you…"
                : "You have joined everything nearby. Explore to find more."}
            </Text>
          </Panel>
        ) : (
          <View className="flex-row gap-3">
            {suggestions.map((place) => {
              // The API's flag, never a position in the list.
              const featured = place.featured;
              return (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/place/[id]",
                      params: { id: place.id },
                    })
                  }
                  className={`rounded-2xl p-4 ${featured ? "flex-[0.8] bg-accent" : "flex-[1.2] border border-line bg-surface"}`}
                >
                  <View className="flex-row items-start justify-between">
                    <View
                      className={`size-11 items-center justify-center rounded-2xl ${featured ? "bg-surface" : "bg-accent/15"}`}
                    >
                      <CategoryIcon
                        category={place.category}
                        size={20}
                        color={featured ? colors.ink : colors.accentStrong}
                      />
                    </View>
                    {featured ? null : (
                      <ArrowRight size={16} color={colors.muted} />
                    )}
                  </View>
                  <Text className="mt-8 font-sans-extrabold text-[14px] text-ink">
                    {place.name}
                  </Text>
                  <Text
                    className={`mt-1 font-sans text-[11px] ${featured ? "text-ink/80" : "text-muted"}`}
                  >
                    {place.category}
                    {place.distanceMetres === null
                      ? ""
                      : ` · ${formatDistance(place.distanceMetres)}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View className="mt-7">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-sans-extrabold text-[16px] tracking-[-0.4px] text-ink">
            Fresh from your places
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/activity")}
          >
            <Text className="font-sans-bold text-[12px] text-accent-strong">
              View activity
            </Text>
          </Pressable>
        </View>
        {latest ? (
          <View className="flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-4">
            <View className="size-10 items-center justify-center rounded-2xl bg-surface-2">
              <Megaphone size={17} color={colors.ink} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-extrabold text-[14px] text-ink">
                {latest.action}
              </Text>
              <Text className="mt-1 font-sans text-[12px] leading-[18px] text-muted-strong">
                {latest.detail}
              </Text>
              <Text className="mt-2 font-sans-semibold text-[10px] text-muted">
                {latest.business} · {relativeTime(latest.occurredAt)}
              </Text>
            </View>
          </View>
        ) : (
          <Panel>
            <Text className="font-sans text-[12px] text-muted-strong">
              Nothing yet. Stamps, rewards and notes from the shops you have
              joined show up here.
            </Text>
          </Panel>
        )}
      </View>

      <View className="mt-7">
        <Button
          tone="quiet"
          icon={<ScanLine size={16} color={colors.ink} />}
          onPress={() => router.push("/scan")}
        >
          Scan a counter poster
        </Button>
      </View>
    </Screen>
  );
}
