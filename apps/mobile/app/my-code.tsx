import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Brightness from "expo-brightness";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MemberQr, useMemberCode } from "@/components/MemberQr";
import { BrandMark } from "@/components/Brand";
import { Eyebrow } from "@/components/ui";
import { colors } from "@/lib/theme";

/**
 * The code as a full-screen sheet, opened from a card. The tab shows the same
 * thing; this one keeps the card screen underneath so closing lands back on
 * it. Brightness is raised while it is up.
 */
export default function MyCodeSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name } = useMemberCode();

  useEffect(() => {
    let previous: number | null = null;
    let live = true;
    (async () => {
      if (!live) return;
      previous = await Brightness.getBrightnessAsync().catch(() => null);
      await Brightness.setBrightnessAsync(1).catch(() => undefined);
    })();
    return () => {
      live = false;
      if (previous !== null)
        void Brightness.setBrightnessAsync(previous).catch(() => undefined);
    };
  }, []);

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <View className="h-14 flex-row items-center justify-between border-b border-line px-4">
        <BrandMark tagline={null} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full border border-line bg-surface"
        >
          <X size={18} color={colors.ink} />
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Eyebrow>Your member code</Eyebrow>
        <Text className="mt-2 text-center font-display text-[24px] tracking-[-0.5px] text-ink">
          Show this at the counter
        </Text>
        {name ? (
          <Text className="mt-1 font-sans-bold text-[12px] text-muted-strong">
            {name}
          </Text>
        ) : null}
        <View className="mt-8">
          <MemberQr size={240} />
        </View>
        <Text className="mt-6 max-w-[30ch] text-center font-sans text-[12px] leading-[18px] text-muted-strong">
          Staff scan this to add a stamp, and to hand over a reward once you
          have earned one.
        </Text>
      </View>
    </View>
  );
}
