import { Image, Linking, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Clock, MapPin, Navigation, Store } from "lucide-react-native";
import { usePublicShop } from "@kypstamping/api";
import { Screen } from "@/components/Screen";
import { Button, EmptyState, Panel, QueryState } from "@/components/ui";
import { colors } from "@/lib/theme";

/**
 * `kyp.ph/shops/<slug>`, opened in the app instead of the browser.
 *
 * The public listing carries no membership state, so "join" here goes
 * through the branch's poster slug - the same claim flow the counter card
 * starts, welcome stamp and all. A shopper who tapped a link on kyp.ph
 * gets exactly what they would have got at the counter.
 */
export default function Shop() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const shop = usePublicShop(slug ?? "");

  return (
    <Screen title="Shop" back padded={false} bottom={40}>
      <QueryState
        isPending={shop.isPending}
        error={shop.error}
        onRetry={() => void shop.refetch()}
        label="this shop"
      >
        {shop.data ? (
          <>
            <View className="bg-ink px-5 py-8">
              <View className="h-40 overflow-hidden rounded-2xl bg-white/5">
                {shop.data.image ? (
                  <Image
                    source={{ uri: shop.data.image }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Store size={36} color={colors.accent} />
                  </View>
                )}
              </View>
              <Text className="mt-6 font-sans-extrabold text-[11px] uppercase tracking-[1.6px] text-accent">
                {shop.data.category}
              </Text>
              <Text className="mt-2 font-display text-[30px] leading-[34px] tracking-[-0.9px] text-paper">
                {shop.data.name}
              </Text>
              <Text className="mt-3 font-sans-extrabold text-[18px] text-paper">
                {shop.data.reward}
              </Text>
              {shop.data.about ? (
                <Text className="mt-3 font-sans text-[13px] leading-[19px] text-white/65">
                  {shop.data.about}
                </Text>
              ) : null}
            </View>
            <View className="gap-3 px-5 pt-6">
              {shop.data.branches.map((branch) => (
                <Panel key={branch.slug}>
                  <View className="flex-row items-start gap-3">
                    <MapPin size={17} color={colors.muted} />
                    <View className="flex-1">
                      <Text className="font-sans-extrabold text-[14px] text-ink">
                        {branch.name}
                      </Text>
                      <Text className="mt-0.5 font-sans text-[12px] text-muted-strong">
                        {branch.address ||
                          `${branch.neighborhood}, ${branch.city}`}
                      </Text>
                      {/* Only when the merchant pasted one. An address
                          describes where a shop is; this walks somebody to
                          the door. */}
                      {branch.mapsLink ? (
                        <Pressable
                          accessibilityRole="link"
                          onPress={() => Linking.openURL(branch.mapsLink)}
                          className="mt-2 flex-row items-center gap-2 self-start rounded-xl border border-line px-3 py-2"
                        >
                          <Navigation size={14} color={colors.accent} />
                          <Text className="font-sans-extrabold text-[12px] text-ink">
                            Get directions
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <Text
                      className={`font-sans-bold text-[11px] ${branch.open ? "text-success" : "text-muted"}`}
                    >
                      {branch.open ? "Open now" : "Closed now"}
                    </Text>
                  </View>
                  {branch.hours.length ? (
                    <View className="mt-3 flex-row items-start gap-3 border-t border-line pt-3">
                      <Clock size={15} color={colors.muted} />
                      <View className="flex-1">
                        {branch.hours.map((slot) => (
                          <View
                            key={slot.days}
                            className="flex-row justify-between"
                          >
                            <Text className="font-sans text-[12px] text-muted-strong">
                              {slot.days}
                            </Text>
                            <Text className="font-sans-bold text-[12px] text-ink">
                              {slot.time}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                  <Button
                    className="mt-4"
                    onPress={() =>
                      router.push({
                        pathname: "/join/[slug]",
                        params: { slug: branch.slug },
                      })
                    }
                  >
                    Join at {branch.name}
                  </Button>
                </Panel>
              ))}
              {shop.data.branches.length === 0 ? (
                <EmptyState
                  title="No branch is taking members yet."
                  detail="Check back once the shop switches its card on."
                />
              ) : null}
            </View>
          </>
        ) : null}
      </QueryState>
    </Screen>
  );
}
