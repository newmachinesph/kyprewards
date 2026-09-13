import { useState } from "react";
import { Image, Linking, Modal, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CakeSlice,
  Check,
  Clock,
  Mail,
  MapPin,
  Navigation,
  Phone,
  QrCode,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react-native";
import {
  joinBusiness,
  keys,
  useApiMutation,
  useCustomerProfile,
  useDiscover,
} from "@kypstamping/api";
import { formatDistance } from "@kypstamping/ui/format";
import { Screen } from "@/components/Screen";
import { Button, EmptyState, Panel } from "@/components/ui";
import { notify } from "@/components/Toast";
import { useCoordinates } from "@/lib/location";
import { colors } from "@/lib/theme";

/**
 * A shop from Discover, and the one action: join it.
 *
 * Joining shares the loyalty ID and the profile fields the dialog lists, and
 * nothing else; promotional channels stay off until the customer turns them
 * on. The shop's welcome stamp lands pending, the same as from the poster.
 */
export default function Place() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const where = useCoordinates("ask");
  const { data: discover = [] } = useDiscover(where);
  const place = discover.find((item) => item.id === id);
  const [consentOpen, setConsentOpen] = useState(false);
  const join = useApiMutation(joinBusiness, {
    invalidates: [keys.customer.wallet(), keys.customer.discoverAll()],
    onSuccess: () => {
      notify(
        `You joined ${place?.name ?? "the shop"}. The card is in your wallet.`,
      );
      router.replace("/(tabs)/wallet");
    },
    onError: (failure) => notify(failure.message, "error"),
  });

  if (!place) {
    return (
      <Screen title="Program details" back>
        <EmptyState
          title="That shop is not listed right now."
          detail="It may have paused its program."
        />
      </Screen>
    );
  }

  return (
    <Screen title="Program details" back padded={false} bottom={40}>
      <View className="bg-ink px-5 py-8">
        <View className="flex-row items-start justify-between">
          <View className="size-14 items-center justify-center rounded-xl bg-accent">
            <Store size={24} color={colors.ink} />
          </View>
          <Text className="rounded-full border border-white/15 px-3 py-1.5 font-sans-extrabold text-[10px] uppercase tracking-[1px] text-white/70">
            {place.open ? "Open now" : "Closed"}
          </Text>
        </View>
        <Text className="mt-8 font-display text-[30px] leading-[34px] tracking-[-0.9px] text-paper">
          {place.name}
        </Text>
        <Text className="mt-2 font-sans text-[14px] text-white/60">
          {place.category} · {place.neighborhood}
          {place.distanceMetres === null
            ? ""
            : ` · ${formatDistance(place.distanceMetres)}`}
        </Text>
        {/* The shop in its own words, the same paragraph kyp.ph carries.
            Nothing at all until they write one, rather than an empty gap. */}
        {place.about ? (
          <Text className="mt-4 font-sans text-[13px] leading-[20px] text-white/70">
            {place.about}
          </Text>
        ) : null}
        {place.image ? (
          <View className="mt-6 h-40 overflow-hidden rounded-2xl border border-white/10">
            <Image
              source={{ uri: place.image }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              accessibilityLabel={`Inside ${place.name}`}
            />
          </View>
        ) : null}
        <View className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <Text className="font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-accent">
            Program
          </Text>
          <Text className="mt-2 font-sans-extrabold text-[20px] text-paper">
            {place.reward}
          </Text>
          <Text className="mt-2 font-sans text-[12px] leading-[18px] text-white/60">
            Earn after an eligible purchase. Staff confirm every earn and
            redemption.
          </Text>
        </View>
      </View>

      <View className="px-5 pt-6">
        <Panel>
          <View className="flex-row items-start gap-3">
            <MapPin size={17} color={colors.muted} />
            <View className="flex-1">
              <Text className="font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-muted">
                Address
              </Text>
              <Text className="mt-1 font-sans-extrabold text-[14px] leading-[20px] text-ink">
                {place.address || "Address not listed yet"}
              </Text>
              {/* Only when the merchant pasted one. An address describes
                  where a shop is; this walks somebody to the door. */}
              {place.mapsLink ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(place.mapsLink)}
                  className="mt-3 flex-row items-center gap-2 self-start rounded-xl border border-line px-3 py-2"
                >
                  <Navigation size={14} color={colors.accent} />
                  <Text className="font-sans-extrabold text-[12px] text-ink">
                    Get directions
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <View className="mt-4 flex-row items-start gap-3 border-t border-line pt-4">
            <Clock size={17} color={colors.muted} />
            <View className="flex-1">
              <Text className="font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-muted">
                Opening hours
              </Text>
              {place.hours.map((slot) => (
                <View
                  key={slot.days}
                  className="mt-1 flex-row items-baseline justify-between gap-4"
                >
                  <Text className="font-sans text-[14px] text-muted-strong">
                    {slot.days}
                  </Text>
                  <Text className="font-sans-extrabold text-[14px] text-ink">
                    {slot.time}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Panel>

        <View className="mt-4 flex-row flex-wrap gap-3">
          {[
            ["One private QR", "Works across places you join"],
            ["Clear terms", "See earning, expiry, and value"],
            ["Your permissions", "Choose each contact channel"],
            ["Full history", "Review earns and redemptions"],
          ].map(([title, detail]) => (
            <View
              key={title}
              className="w-[47%] rounded-xl border border-line bg-surface p-4"
            >
              <Check size={16} color={colors.success} />
              <Text className="mt-5 font-sans-extrabold text-[14px] text-ink">
                {title}
              </Text>
              <Text className="mt-1 font-sans text-[10px] leading-[15px] text-muted">
                {detail}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-5 flex-row items-start gap-3 rounded-xl bg-success/10 p-4">
          <ShieldCheck size={17} color={colors.success} />
          <Text className="flex-1 font-sans text-[12px] leading-[18px] text-muted-strong">
            Joining shares your loyalty ID and chosen profile fields with{" "}
            {place.name}. Promotional permissions stay off until you turn them
            on.
          </Text>
        </View>

        <Button
          className="mt-5"
          disabled={place.joined}
          tone={place.joined ? "quiet" : "dark"}
          onPress={() => setConsentOpen(true)}
        >
          {place.joined ? "Already in your wallet" : `Join ${place.name}`}
        </Button>
      </View>

      <JoinConsent
        open={consentOpen}
        businessName={place.name}
        onCancel={() => setConsentOpen(false)}
        onConfirm={() => {
          setConsentOpen(false);
          join.mutate(place.businessId);
        }}
      />
    </Screen>
  );
}

function JoinConsent({
  open,
  businessName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  businessName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { data: profile } = useCustomerProfile();
  const shared = [
    ["Loyalty ID", profile?.id ?? "", QrCode],
    ["Name", profile?.name ?? "", UserRound],
    ["Mobile number", profile?.mobile ?? "", Phone],
    ["Email", profile?.email ?? "", Mail],
    ["Birthday", profile?.birthday ?? "Not given", CakeSlice],
  ] as const;
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityLabel="Cancel joining"
        onPress={onCancel}
        className="flex-1 bg-ink/55"
      />
      <View className="rounded-t-[18px] bg-surface p-5 pb-10">
        <Text className="font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-accent-strong">
          Before you join
        </Text>
        <Text className="mt-2 font-display text-[20px] tracking-[-0.4px] text-ink">
          Share your profile with {businessName}?
        </Text>
        <Text className="mt-2 font-sans text-[12px] leading-[18px] text-muted-strong">
          Joining shares the details below so {businessName} can run your
          rewards. Promotional messages stay off until you turn them on.
        </Text>
        <View className="mt-4 rounded-xl border border-line">
          {shared.map(([label, value, Icon], index) => (
            <View
              key={label}
              className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-line" : ""}`}
            >
              <Icon size={15} color={colors.muted} />
              <Text className="w-28 font-sans-extrabold text-[11px] uppercase tracking-[0.8px] text-muted-strong">
                {label}
              </Text>
              <Text
                className="flex-1 font-sans-bold text-[12px] text-ink"
                numberOfLines={1}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
        <View className="mt-4 flex-row items-start gap-3 rounded-xl bg-success/10 p-3.5">
          <ShieldCheck size={16} color={colors.success} />
          <Text className="flex-1 font-sans text-[11px] leading-[17px] text-muted-strong">
            You can leave the program and revoke access anytime from your
            profile. KYP never sells your data.
          </Text>
        </View>
        <View className="mt-5 flex-row gap-2">
          <View className="flex-1">
            <Button tone="quiet" onPress={onCancel}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={onConfirm}>Share &amp; join</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
