import { useEffect, useState } from "react";
import { AppState, Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { joinSlugFrom } from "@/lib/claim";
import { colors } from "@/lib/theme";

/**
 * The camera, pointed at a counter poster.
 *
 * The poster's QR encodes the web wallet's join link; the app reads the
 * slug and runs the same claim flow natively - no browser, no tab to lose
 * while reading an SMS. Anything that is not a KYP join link is said so and
 * scanning continues; a menu QR at the same counter is not an error.
 */
export default function Scan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [notice, setNotice] = useState("");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void getPermission();
    });
    return () => subscription.remove();
  }, [getPermission]);

  function onScanned({ data }: { data: string }) {
    if (locked) return;
    const slug = joinSlugFrom(data);
    if (!slug) {
      setNotice(
        "That code is not a KYP poster. Look for the KYP mark on the counter card.",
      );
      return;
    }
    setLocked(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/join/[slug]", params: { slug } });
  }

  return (
    <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
      <View className="h-14 flex-row items-center justify-between px-4">
        <Text className="font-sans-extrabold text-[13px] text-paper">
          Scan a counter poster
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full bg-white/10"
        >
          <X size={18} color={colors.paper} />
        </Pressable>
      </View>

      {!permission?.granted ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-sans-extrabold text-[18px] text-paper">
            The camera reads the poster.
          </Text>
          <Text className="mt-2 max-w-[30ch] text-center font-sans text-[13px] leading-[19px] text-white/65">
            KYP uses it only while this screen is open, to find the shop&apos;s
            join code. Nothing is recorded.
          </Text>
          {permission?.canAskAgain === false ? (
            <Text className="mt-2 max-w-[30ch] text-center font-sans text-[13px] leading-[19px] text-white/65">
              Camera access is off. You can change it in Settings to scan a
              poster, or close this screen to keep using KYP.
            </Text>
          ) : null}
          <Button
            tone="accent"
            className="mt-6"
            full={false}
            disabled={!permission}
            onPress={() => {
              if (permission?.canAskAgain === false) {
                void Linking.openSettings();
              } else {
                void requestPermission();
              }
            }}
          >
            {permission?.canAskAgain === false
              ? "Open Settings"
              : "Continue"}
          </Button>
        </View>
      ) : (
        <View className="flex-1">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={locked ? undefined : onScanned}
          />
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center"
          >
            <View className="size-64 rounded-3xl border-2 border-accent" />
          </View>
          <View
            className="px-6 py-6"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            <Text className="text-center font-sans-bold text-[13px] text-paper">
              {locked
                ? "Got it."
                : "Point at the QR on the shop's counter card."}
            </Text>
            {notice ? (
              <Text
                accessibilityRole="alert"
                className="mt-2 text-center font-sans text-[12px] text-accent"
              >
                {notice}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}
