import { Text, View } from "react-native";
import { Building2, ShieldCheck } from "lucide-react-native";
import { useChannelPreferences, useWallet } from "@kypstamping/api";
import { Screen } from "@/components/Screen";
import { Eyebrow, Panel, Title } from "@/components/ui";
import { colors } from "@/lib/theme";

export default function JoinedBusinesses() {
  const { data: wallet = [] } = useWallet();
  const { data: channels } = useChannelPreferences();
  // One row per shop: a shop running two programs is one membership.
  const shops = wallet.filter(
    (card, index, all) =>
      all.findIndex((other) => other.id === card.id) === index,
  );
  // The account setting is the fallback for a card the API did not annotate;
  // every card now carries the shop's own flags.
  const accountPromos = [
    channels?.promoPush ? "push" : "",
    channels?.promoEmail ? "email" : "",
    channels?.promoSms ? "SMS" : "",
  ].filter(Boolean);
  const promosFor = (card: (typeof shops)[number]) =>
    card.consent
      ? [
          card.consent.push ? "push" : "",
          card.consent.email ? "email" : "",
          card.consent.sms ? "SMS" : "",
        ].filter(Boolean)
      : accountPromos;

  return (
    <Screen title="Joined businesses" back bottom={48}>
      <Eyebrow>Your control</Eyebrow>
      <Title>Joined businesses</Title>
      <Panel className="mt-6">
        <ShieldCheck size={22} color={colors.success} />
        <Text className="mt-5 font-sans-extrabold text-[14px] text-ink">
          Businesses you have joined
        </Text>
        <Text className="mt-2 font-sans text-[12px] leading-[18px] text-muted-strong">
          Each of these can see the fields you approved when you joined, and
          nothing else.
        </Text>
      </Panel>
      <View className="mt-4 border-y border-line">
        {shops.map((card, index) => {
          const promos = promosFor(card);
          return (
          <View
            key={card.id}
            className={`flex-row items-center gap-3 py-4 ${index > 0 ? "border-t border-line" : ""}`}
          >
            <View className="size-9 items-center justify-center rounded-xl bg-surface-2">
              <Building2 size={15} color={colors.ink} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-extrabold text-[14px] text-ink">
                {card.business}
              </Text>
              <Text className="mt-0.5 font-sans text-[10px] leading-[15px] text-muted">
                Your member code and name are shared for service messages.{" "}
                {promos.length > 0
                  ? `This shop may send promotions by ${promos.join(", ")}. Turn a channel off under Notifications and every shop follows.`
                  : "No promotional channel is on for this shop, so it can only send service messages."}
              </Text>
            </View>
          </View>
          );
        })}
        {shops.length === 0 ? (
          <Text className="py-4 font-sans text-[12px] text-muted">
            You have not joined a shop yet.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
