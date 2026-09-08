import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LockKeyhole } from "lucide-react-native";
import { BrandMark } from "@/components/Brand";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useLock } from "@/lib/lock";
import { colors } from "@/lib/theme";

/**
 * What stands in for the wallet while the lock is on.
 *
 * It prompts once on its own, because a customer who just opened the app
 * expects the sensor, not a button. If that is dismissed the button is there,
 * and so is a way out: somebody whose fingerprint has stopped reading, on a
 * phone whose passcode they no longer know, must still be able to sign out
 * rather than be trapped looking at their own locked wallet.
 */
export function LockScreen() {
  const insets = useSafeAreaInsets();
  const unlock = useLock((state) => state.unlock);
  const signOut = useAuth((state) => state.signOut);
  const [refused, setRefused] = useState(false);

  useEffect(() => {
    let live = true;
    void unlock().then((ok) => {
      if (live && !ok) setRefused(true);
    });
    return () => {
      live = false;
    };
  }, [unlock]);

  return (
    <View
      className="flex-1 items-center justify-center bg-paper px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
    >
      <BrandMark />
      <View className="mt-10 size-16 items-center justify-center rounded-3xl bg-surface-2">
        <LockKeyhole size={26} color={colors.ink} />
      </View>
      <Text className="mt-6 text-center font-display text-[24px] leading-[30px] tracking-[-0.6px] text-ink">
        Your wallet is locked
      </Text>
      <Text className="mt-3 text-center font-sans text-[13px] leading-[20px] text-muted-strong">
        {refused
          ? "Unlock with your face, fingerprint or device passcode to open it again."
          : "Waiting for your face or fingerprint."}
      </Text>
      <View className="mt-8 w-full gap-3">
        <Button
          onPress={() => {
            setRefused(false);
            void unlock().then((ok) => {
              if (!ok) setRefused(true);
            });
          }}
        >
          Unlock
        </Button>
        <Button tone="quiet" onPress={() => void signOut()}>
          Sign out instead
        </Button>
      </View>
    </View>
  );
}
