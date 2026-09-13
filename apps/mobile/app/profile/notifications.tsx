import { useState } from "react";
import { Linking, Text, View } from "react-native";
import {
  keys,
  setChannelPreference,
  useApiMutation,
  useChannelPreferences,
  usePushState,
} from "@kypstamping/api";
import { Screen } from "@/components/Screen";
import { Button, Eyebrow, Panel, Switch, Title } from "@/components/ui";
import { notify } from "@/components/Toast";
import { registerForPush } from "@/lib/push";

type ChannelKey = "promoPush" | "promoEmail" | "promoSms" | "nearby";

const CHANNELS: { key: ChannelKey; label: string; detail: string }[] = [
  {
    key: "promoPush",
    label: "Promotional push",
    detail: "Offers from businesses you joined",
  },
  {
    key: "promoEmail",
    label: "Email promotions",
    detail: "Longer news and birthday offers",
  },
  {
    key: "promoSms",
    label: "SMS promotions",
    detail: "Paid channel, used sparingly",
  },
  {
    key: "nearby",
    label: "Nearby reminders",
    detail: "Uses location only while enabled",
  },
];

/**
 * One request per switch, because each flip is its own consent event under
 * the Data Privacy Act. Flipped locally first so the switch moves under the
 * thumb, and put back if the API refuses.
 */
export default function NotificationSettings() {
  const { data: saved } = useChannelPreferences();
  const [overrides, setOverrides] = useState<
    Partial<Record<ChannelKey, boolean>>
  >({});
  const channels = {
    promoPush: false,
    promoEmail: false,
    promoSms: false,
    nearby: false,
    ...saved,
    ...overrides,
  };
  const write = useApiMutation(
    ({ key, value }: { key: ChannelKey; value: boolean }) =>
      setChannelPreference(key, value),
    { invalidates: [keys.customer.consentHistory(), keys.customer.channels()] },
  );
  const push = usePushState();
  const [pushBusy, setPushBusy] = useState(false);

  function toggle(key: ChannelKey, label: string) {
    const next = !channels[key];
    setOverrides((current) => ({ ...current, [key]: next }));
    write.mutate(
      { key, value: next },
      {
        onSuccess: () =>
          notify(`${label} ${next ? "turned on" : "turned off"}.`),
        onError: (failure) => {
          setOverrides((current) => ({ ...current, [key]: !next }));
          notify(failure.message, "error");
        },
      },
    );
  }

  return (
    <Screen title="Notifications" back bottom={48}>
      <Eyebrow>Your control</Eyebrow>
      <Title>Notifications</Title>
      <Text className="mt-4 font-sans text-[12px] leading-[18px] text-muted-strong">
        Service messages keep your balances and visits clear and are always on.
        Push and email promotions start on and SMS starts off; each one can be
        turned off here without leaving a program.
      </Text>

      <Panel className="mt-4 flex-row items-start gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-muted">
            Service
          </Text>
          <Text className="mt-1 font-sans-extrabold text-[14px] text-ink">
            Reward and service updates
          </Text>
          <Text className="mt-1 font-sans text-[10px] leading-[15px] text-muted">
            Needed to keep balances and visits clear · always on
          </Text>
        </View>
        <Text className="rounded-full bg-success/10 px-2 py-0.5 font-sans-extrabold text-[9px] uppercase tracking-[0.8px] text-success">
          On
        </Text>
      </Panel>

      <Text className="mt-6 font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-muted">
        Promotional
      </Text>
      <View className="mt-2 rounded-2xl border border-line bg-surface">
        {CHANNELS.map((channel, index) => (
          <View
            key={channel.key}
            className={`flex-row items-start gap-3 p-4 ${index > 0 ? "border-t border-line" : ""}`}
          >
            <View className="min-w-0 flex-1">
              <Text className="font-sans-extrabold text-[14px] text-ink">
                {channel.label}
              </Text>
              <Text className="mt-1 font-sans text-[10px] leading-[15px] text-muted">
                {channel.detail}
              </Text>
            </View>
            <Switch
              on={channels[channel.key]}
              onToggle={() => toggle(channel.key, channel.label)}
              label={channel.label}
            />
          </View>
        ))}
      </View>

      <Panel className="mt-6">
        <Text className="font-sans-extrabold text-[14px] text-ink">
          Push on this phone
        </Text>
        <Text className="mt-1 font-sans text-[12px] leading-[18px] text-muted-strong">
          A reward waiting for your approval is the one message worth a buzz.
          Everything else stays in the inbox.
          {push.data?.subscribed ? " This phone is registered." : ""}
        </Text>
        <Button
          tone="quiet"
          className="mt-4"
          busy={pushBusy}
          onPress={async () => {
            setPushBusy(true);
            const result = await registerForPush().catch(
              () => "unavailable" as const,
            );
            setPushBusy(false);
            if (result === "registered") notify("Push is on for this phone.");
            else if (result === "denied") {
              notify("Push is off in your phone's settings.", "error");
              void Linking.openSettings();
            } else
              notify("Push needs a real phone and a linked build.", "error");
            void push.refetch();
          }}
        >
          {push.data?.subscribed
            ? "Register this phone again"
            : "Turn on push for this phone"}
        </Button>
      </Panel>
    </Screen>
  );
}
