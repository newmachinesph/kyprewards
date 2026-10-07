import { useState } from "react";
import {
  Linking,
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
  Compass,
  ExternalLink,
  MapPin,
  ScanLine,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import { useCustomerProfile, useDiscover } from "@kyprewards/api";
import { formatDistance } from "@kyprewards/ui/format";
import { PlaceThumb } from "@/components/PlaceThumb";
import { Screen } from "@/components/Screen";
import {
  Button,
  Chip,
  EmptyState,
  Eyebrow,
  Lede,
  QueryState,
  Switch,
  Title,
} from "@/components/ui";
import { categoriesFrom } from "@/lib/cards";
import { MARKETPLACE_URL, NEARBY_METRES } from "@/lib/config";
import { useCoordinates } from "@/lib/location";
import { colors } from "@/lib/theme";

/**
 * Every shop with a live card, nearest first once the phone says where it is.
 *
 * Native on purpose: the position comes from the device, a tap opens the
 * shop's own screen, and joining drops a card into the same cache the wallet
 * reads - none of which a webview of kyp.ph could do as well.
 */
export default function Discover() {
  const router = useRouter();
  const { data: profile } = useCustomerProfile();
  const where = useCoordinates("ask");
  const discoverQuery = useDiscover(where);
  const discover = discoverQuery.data ?? [];
  const located = discover.some((place) => place.distanceMetres !== null);
  const categories = categoriesFrom(discover.map((place) => place.category));
  const neighborhoods = [
    "All",
    ...new Set(discover.map((place) => place.neighborhood).filter(Boolean)),
  ];
  const [category, setCategory] = useState("All");
  const [neighborhood, setNeighborhood] = useState("All");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [nearestFirst, setNearestFirst] = useState(false);

  const filtered = discover.filter(
    (place) =>
      (category === "All" || place.category === category) &&
      (neighborhood === "All" || place.neighborhood === neighborhood) &&
      (!nearbyOnly ||
        (place.distanceMetres !== null &&
          place.distanceMetres <= NEARBY_METRES)) &&
      `${place.name} ${place.neighborhood}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const visible = nearestFirst
    ? [...filtered].sort(
        (a, b) =>
          (a.distanceMetres ?? Number.POSITIVE_INFINITY) -
          (b.distanceMetres ?? Number.POSITIVE_INFINITY),
      )
    : filtered;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={discoverQuery.isRefetching}
          onRefresh={() => void discoverQuery.refetch()}
        />
      }
    >
      <Eyebrow>Local rewards</Eyebrow>
      <Title>Discover</Title>
      <Lede>Good places, made easier to return to.</Lede>

      <View className="mt-6 flex-row gap-2">
        <View className="min-h-[48px] min-w-0 flex-1 flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4">
          <Search size={17} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Name or neighborhood"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Search nearby shops"
            className="min-w-0 flex-1 py-3 font-sans text-[14px] text-ink"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Discover filters"
          accessibilityState={{ expanded: filtersOpen }}
          onPress={() => setFiltersOpen((open) => !open)}
          className={`size-12 items-center justify-center rounded-2xl border ${filtersOpen || nearbyOnly || nearestFirst ? "border-ink bg-ink" : "border-line bg-surface"}`}
        >
          <SlidersHorizontal
            size={17}
            color={
              filtersOpen || nearbyOnly || nearestFirst
                ? colors.paper
                : colors.ink
            }
          />
        </Pressable>
      </View>

      {filtersOpen ? (
        <View className="mt-3 rounded-2xl border border-line bg-surface">
          {(
            [
              [
                "Nearest first",
                located
                  ? "Sort by distance instead of featured placement"
                  : "Needs your location, which this phone has not shared",
                nearestFirst,
                () => setNearestFirst((on) => !on),
              ],
              [
                "Walking distance",
                located
                  ? "Show places within 1.5 km"
                  : "Needs your location, which this phone has not shared",
                nearbyOnly,
                () => setNearbyOnly((on) => !on),
              ],
            ] as const
          ).map(([label, detail, on, toggle], index) => (
            <View
              key={label}
              className={`flex-row items-center justify-between p-3 ${index > 0 ? "border-t border-line" : ""}`}
            >
              <View className="min-w-0 flex-1 pr-3">
                <Text className="font-sans-extrabold text-[12px] text-ink">
                  {label}
                </Text>
                <Text className="mt-0.5 font-sans text-[10px] text-muted">
                  {detail}
                </Text>
              </View>
              <Switch
                on={on}
                onToggle={toggle}
                label={label}
                disabled={!located}
              />
            </View>
          ))}
        </View>
      ) : null}

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
      {neighborhoods.length > 2 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
          contentContainerStyle={{ gap: 8 }}
        >
          {neighborhoods.map((item) => (
            <Chip
              key={item}
              label={item === "All" ? "Anywhere" : item}
              selected={neighborhood === item}
              onPress={() => setNeighborhood(item)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View className="mt-7 flex-row items-center justify-between">
        <Text className="font-sans-extrabold text-[16px] text-ink">
          {located
            ? "Near you"
            : profile?.city
              ? `In ${profile.city}`
              : "Everywhere"}{" "}
          · {visible.length}
        </Text>
        {profile?.city ? (
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color={colors.muted} />
            <Text className="font-sans-bold text-[11px] text-muted">
              {profile.city}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-3 gap-3">
        <QueryState
          isPending={discoverQuery.isPending}
          error={discoverQuery.error}
          onRetry={() => void discoverQuery.refetch()}
          label="places near you"
        >
          {visible.map((place, index) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/place/[id]",
                  params: { id: place.id },
                })
              }
              // Painted from the API's flag, never from a position in the list:
              // the top row is only "featured" when a shop paid for it.
              className={`flex-row items-center gap-4 rounded-2xl p-3.5 active:opacity-90 ${place.featured ? "bg-accent" : "border border-line bg-surface"}`}
            >
              <PlaceThumb image={place.image} category={place.category} />
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-2">
                  <Text
                    className="shrink font-sans-extrabold text-[14px] text-ink"
                    numberOfLines={1}
                  >
                    {place.name}
                  </Text>
                  {place.joined ? (
                    <Text className="rounded-full bg-success/10 px-2 py-0.5 font-sans-extrabold text-[8px] uppercase tracking-[0.8px] text-success">
                      Joined
                    </Text>
                  ) : null}
                </View>
                <Text
                  className={`mt-1 font-sans text-[11px] ${place.featured ? "text-ink/80" : "text-muted"}`}
                >
                  {place.category}
                  {place.distanceMetres === null
                    ? ""
                    : ` · ${formatDistance(place.distanceMetres)}`}
                </Text>
              </View>
              <ChevronRight size={17} color={colors.ink} />
            </Pressable>
          ))}
          {visible.length === 0 ? (
            <EmptyState
              icon={<Search size={22} color={colors.muted} />}
              title="No places match this search."
              detail="Try another neighborhood, name, or category."
            />
          ) : null}
        </QueryState>
      </View>

      <View className="mt-7 gap-3">
        <Button
          tone="quiet"
          icon={<ScanLine size={16} color={colors.ink} />}
          onPress={() => router.push("/scan")}
        >
          Scan a counter poster
        </Button>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(`${MARKETPLACE_URL}/discover`)}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <View className="size-11 items-center justify-center rounded-2xl bg-surface-2">
            <Compass size={20} color={colors.mutedStrong} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-extrabold text-[14px] text-ink">
              Browse all shops on KYP
            </Text>
            <Text className="mt-0.5 font-sans text-[11px] text-muted">
              Every shop with a live card, by category and neighborhood.
            </Text>
          </View>
          <ExternalLink size={16} color={colors.muted} />
        </Pressable>
      </View>
    </Screen>
  );
}
