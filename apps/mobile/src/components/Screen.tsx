import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type ScrollViewProps,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

/**
 * A screen: safe areas, the paper ground, a scroll body.
 *
 * Tabs give it no header; a pushed screen gets a back button and a title.
 * Bottom padding leaves room under the last item for the tab bar and for the
 * floating code button on the tab screens - the web wallet learned the hard
 * way that a scroller running under a floating control hides its last card.
 */
export function Screen({
  children,
  title,
  back = false,
  refreshControl,
  padded = true,
  bottom = 120,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
  padded?: boolean;
  bottom?: number;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      {back || title ? (
        <View className="h-14 flex-row items-center justify-between border-b border-line px-4">
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
              className="size-10 items-center justify-center rounded-full border border-line bg-surface"
            >
              <ArrowLeft size={18} color={colors.ink} />
            </Pressable>
          ) : (
            <View className="size-10" />
          )}
          <Text className="font-sans-extrabold text-[13px] text-ink">
            {title}
          </Text>
          <View className="size-10" />
        </View>
      ) : null}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: padded ? 20 : 0,
          paddingTop: padded ? 20 : 0,
          paddingBottom: bottom + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </View>
  );
}
