import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Brightness from "expo-brightness";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import QRCode from "react-native-qrcode-svg";
import { Download, ShieldCheck, WifiOff } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { MemberQr, useMemberCode } from "@/components/MemberQr";
import { notify } from "@/components/Toast";
import { Button, Eyebrow, Notice, Title } from "@/components/ui";
import { colors } from "@/lib/theme";

/**
 * The member code, at full brightness while it is on screen.
 *
 * A dim phone under a counter's scanner is the commonest way a stamp fails
 * to happen. The brightness is put back when the tab loses focus. Works
 * without data: the code is kept on the device after the first load.
 */
export default function MyCode() {
  const { code, name, offline } = useMemberCode();
  const printable = useRef<{
    toDataURL: (done: (base64: string) => void) => void;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // The share sheet is where "Save image", Photos and Files live on both
  // platforms; nothing is written outside the app's own cache.
  async function saveImage() {
    const svg = printable.current;
    if (!svg) return;
    setSaving(true);
    try {
      const base64 = await new Promise<string>((done) => svg.toDataURL(done));
      const file = new File(Paths.cache, `kyp-${code}.png`);
      file.create({ overwrite: true });
      file.write(base64, { encoding: "base64" });
      await Sharing.shareAsync(file.uri, {
        mimeType: "image/png",
        UTI: "public.png",
      });
    } catch {
      notify("This phone could not save the image.", "error");
    } finally {
      setSaving(false);
    }
  }

  // Raised while the tab is on screen, put back when it is not. A dim phone
  // under a counter's scanner is the commonest way a stamp fails to happen.
  useFocusEffect(
    useCallback(() => {
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
    }, []),
  );

  return (
    <Screen>
      <Eyebrow>Your member code</Eyebrow>
      <Title>Show this at the counter</Title>
      <Text className="mt-2 font-sans text-[14px] leading-[21px] text-muted-strong">
        Staff scan this to add a stamp, and to hand over a reward once you have
        earned one.
      </Text>
      {name ? (
        <Text className="mt-1 font-sans-bold text-[12px] text-muted-strong">
          {name}
        </Text>
      ) : null}

      <View className="mt-8 items-center">
        <MemberQr size={220} />
      </View>

      {code ? (
        <>
          <Button
            tone="quiet"
            className="mt-5"
            busy={saving}
            icon={<Download size={16} color={colors.ink} />}
            onPress={() => void saveImage()}
          >
            Save image
          </Button>
          {/* What the saved image is drawn from, off screen. Same rules as the
              web wallet's printable code: level Q and a four-module margin,
              so it scans from paper. */}
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ position: "absolute", left: -10000 }}
          >
            <QRCode
              value={code}
              size={720}
              // ponytail: four modules of a 21-module symbol, which is what a
              // thirteen-digit code makes at level Q. A longer code makes a
              // denser symbol, and the same margin is then more modules.
              quietZone={(720 / 21) * 4}
              ecl="Q"
              color={colors.ink}
              backgroundColor="#ffffff"
              getRef={(svg) => (printable.current = svg)}
            />
          </View>
        </>
      ) : null}

      {offline ? (
        <View className="mt-5">
          <Notice>
            <WifiOff size={14} color={colors.success} /> You are offline. This
            is the code we saved on your phone; it works exactly the same at the
            counter.
          </Notice>
        </View>
      ) : null}

      <View className="mt-6 gap-3">
        <View className="flex-row items-start gap-2 rounded-2xl bg-success/10 p-3">
          <WifiOff size={16} color={colors.success} />
          <Text className="flex-1 font-sans text-[12px] leading-[18px] text-muted-strong">
            Works without data. Once you have opened the app with a connection,
            the code stays on your phone.
          </Text>
        </View>
        <View className="flex-row items-start gap-2 px-1">
          <ShieldCheck size={14} color={colors.mutedStrong} />
          <Text className="flex-1 font-sans text-[11px] leading-[17px] text-muted">
            The code identifies your account only. It carries no contact
            details, and it cannot be used to spend money or change your
            account.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
