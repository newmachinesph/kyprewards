import { Text, View } from "react-native";
import { Check, ShieldCheck, X } from "lucide-react-native";
import { useChannelPreferences } from "@kypstamping/api";
import { Screen } from "@/components/Screen";
import { Eyebrow, Notice, Panel, Title } from "@/components/ui";
import { colors } from "@/lib/theme";

export default function Privacy() {
  const { data: channels } = useChannelPreferences();
  const rows: [string, string, boolean][] = [
    ["Loyalty ID", "Always shared", true],
    ["Name", "Shared with joined businesses", true],
    [
      "Mobile number",
      channels?.promoSms
        ? "Shared, and used for SMS promotions"
        : "Shared for service messages only",
      true,
    ],
    [
      "Email",
      channels?.promoEmail
        ? "Shared, and used for email promotions"
        : "Shared for service messages only",
      true,
    ],
    ["Birthday", "Optional, for birthday rewards", true],
    [
      "Location",
      channels?.nearby
        ? "Used for nearby reminders while that is on"
        : "Never shared. Discovery matches by city only",
      Boolean(channels?.nearby),
    ],
  ];
  return (
    <Screen title="Privacy center" back bottom={48}>
      <Eyebrow>Your control</Eyebrow>
      <Title>Privacy center</Title>
      <Panel className="mt-6">
        <ShieldCheck size={22} color={colors.success} />
        <Text className="mt-5 font-sans-extrabold text-[14px] text-ink">
          What businesses can see
        </Text>
        <Text className="mt-2 font-sans text-[12px] leading-[18px] text-muted-strong">
          Only the fields you approved when joining. A business never sees your
          activity at another business.
        </Text>
      </Panel>
      <View className="mt-4 rounded-2xl border border-line bg-surface">
        {rows.map(([field, note, shared], index) => (
          <View
            key={field}
            className={`flex-row items-start gap-3 p-4 ${index > 0 ? "border-t border-line" : ""}`}
          >
            <View
              className={`mt-0.5 size-5 items-center justify-center rounded-full ${shared ? "bg-success/15" : "bg-surface-2"}`}
            >
              {shared ? (
                <Check size={12} color={colors.success} strokeWidth={3} />
              ) : (
                <X size={12} color={colors.muted} strokeWidth={3} />
              )}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-extrabold text-[14px] text-ink">
                {field}
              </Text>
              <Text className="mt-0.5 font-sans text-[10px] text-muted">
                {note}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View className="mt-4">
        <Notice tone="muted">
          You can withdraw any permission from Notifications, or leave a program
          entirely from Leave or delete.
        </Notice>
      </View>
    </Screen>
  );
}
