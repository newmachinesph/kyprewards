import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useCustomerProfile } from "@kyprewards/api";
import { formatMemberCode } from "@kyprewards/ui/format";
import { KEYS, recall, remember } from "@/lib/storage";
import { useAuth } from "@/lib/auth";
import { Barcode } from "@/components/Barcode";
import { colors } from "@/lib/theme";

/**
 * The customer's own code, from the profile - or from the keychain when the
 * profile cannot be fetched.
 *
 * This is the "works without data" the web wallet promises with a saved
 * image. Once the profile has loaded once, the code is kept on the device and
 * shown from there whenever the network is not, which at a counter with no
 * signal is the whole point of having an app.
 */
export function useMemberCode(): {
  code: string;
  name: string;
  offline: boolean;
} {
  const { data: profile, isError } = useCustomerProfile();
  const status = useAuth((state) => state.status);
  const [cached, setCached] = useState<{ code: string; name: string }>({
    code: "",
    name: "",
  });

  useEffect(() => {
    if (profile?.memberCode) {
      void remember(KEYS.memberCode, profile.memberCode);
      void remember(KEYS.memberName, profile.name);
      return;
    }
    if (status !== "signed-in") return;
    Promise.all([recall(KEYS.memberCode), recall(KEYS.memberName)]).then(
      ([code, name]) => {
        if (code) setCached({ code, name: name ?? "" });
      },
    );
  }, [profile?.memberCode, profile?.name, status]);

  return profile?.memberCode
    ? { code: profile.memberCode, name: profile.name, offline: false }
    : {
        code: cached.code,
        name: cached.name,
        offline: isError && Boolean(cached.code),
      };
}

/** White plate under the symbol on purpose: a scanner needs the contrast. */
export function MemberQr({ size }: { size: number }) {
  const { code } = useMemberCode();
  if (!code) {
    return (
      <View
        className="rounded bg-surface-2"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <View
      className="items-center rounded-2xl bg-white p-4"
      accessibilityRole="image"
      accessibilityLabel={`Loyalty code ${formatMemberCode(code)}`}
    >
      <QRCode
        value={code}
        size={size}
        color={colors.ink}
        backgroundColor="#ffffff"
        ecl="M"
      />
      <View className="mt-3">
        <Barcode code={code} width={size} />
      </View>
      <Text className="mt-2 font-mono text-[13px] tracking-[1.2px] text-ink">
        {formatMemberCode(code)}
      </Text>
    </View>
  );
}
