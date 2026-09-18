import { Alert, Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  Building2,
  Download,
  Fingerprint,
  Gift,
  History,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react-native";
import { useCustomerProfile, useWallet } from "@kypstamping/api";
import { longDate } from "@kypstamping/ui/format";
import { Screen } from "@/components/Screen";
import { Eyebrow, Row, Switch, Title } from "@/components/ui";
import { notify } from "@/components/Toast";
import { useAuth } from "@/lib/auth";
import { useLock } from "@/lib/lock";
import { MARKETPLACE_URL, SITE_URL } from "@/lib/config";
import { colors } from "@/lib/theme";

export default function Profile() {
  const router = useRouter();
  const { data: profile } = useCustomerProfile();
  const { data: wallet = [] } = useWallet();
  const signOut = useAuth((state) => state.signOut);
  const lockAvailable = useLock((state) => state.available);
  const lockOn = useLock((state) => state.enabled);
  const enableLock = useLock((state) => state.enable);
  // Memberships, not cards: a shop running stamps beside points is one shop.
  const shops = new Set(wallet.map((card) => card.id)).size;

  return (
    <Screen>
      <Eyebrow>Your account</Eyebrow>
      <Title>Profile</Title>
      <View className="mt-6 flex-row items-center gap-4">
        <View className="size-16 items-center justify-center rounded-2xl bg-accent">
          <Text className="font-sans-extrabold text-[20px] text-ink">
            {profile?.initials ?? ""}
          </Text>
        </View>
        <View>
          <Text className="font-sans-extrabold text-[16px] text-ink">
            {profile?.name ?? " "}
          </Text>
          <Text className="mt-1 font-sans text-[12px] text-muted">
            Member since{" "}
            {profile?.memberSince ? longDate(profile.memberSince) : "…"}
          </Text>
        </View>
      </View>

      <View className="mt-7 overflow-hidden rounded-2xl border border-line bg-surface">
        <Row
          first
          icon={<UserRound size={17} color={colors.ink} />}
          label="Personal information"
          detail="Name, birthday, mobile"
          onPress={() => router.push("/profile/personal")}
        />
        <Row
          icon={<Bell size={17} color={colors.ink} />}
          label="Notifications"
          detail="Rewards and local offers"
          onPress={() => router.push("/profile/notifications")}
        />
        <Row
          icon={<LockKeyhole size={17} color={colors.ink} />}
          label="Privacy center"
          detail="Control what businesses see"
          onPress={() => router.push("/profile/privacy")}
        />
        <Row
          icon={<Gift size={17} color={colors.ink} />}
          label="Gifts"
          detail="Pasalubong sent and received"
          onPress={() => router.push("/gifts")}
        />
        {/* Only where the device has a face or fingerprint enrolled. Offering
            a lock that nothing can open is worse than not offering one. */}
        {lockAvailable ? (
          <Row
            icon={<Fingerprint size={17} color={colors.ink} />}
            label="Lock my wallet"
            detail={
              lockOn
                ? "Asked for every time you open KYP"
                : "Use your face or fingerprint to open KYP"
            }
            trailing={
              <Switch
                on={lockOn}
                label="Lock my wallet"
                onToggle={() => {
                  void enableLock(!lockOn).then((now) => {
                    if (!lockOn && !now) {
                      notify("The lock was not turned on.", "error");
                    }
                  });
                }}
              />
            }
          />
        ) : null}
      </View>

      <View className="mt-4 flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-5">
        <View className="size-10 items-center justify-center rounded-2xl bg-success/10">
          <ShieldCheck size={18} color={colors.success} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans-extrabold text-[14px] text-ink">
            Your data stays yours.
          </Text>
          <Text className="mt-1 font-sans text-[12px] leading-[18px] text-muted-strong">
            KYP does not sell customer data. Shops only see the details you
            choose to share.
          </Text>
        </View>
      </View>

      <View className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <View className="border-b border-line p-4">
          <Eyebrow>Data and rights</Eyebrow>
          <Text className="mt-1 font-sans-extrabold text-[14px] text-ink">
            You stay in control
          </Text>
        </View>
        <Row
          first
          icon={<Building2 size={17} color={colors.ink} />}
          label="Joined businesses"
          detail={`${shops} business${shops === 1 ? "" : "es"} can see your shared profile`}
          onPress={() => router.push("/profile/businesses")}
        />
        <Row
          icon={<History size={17} color={colors.ink} />}
          label="Consent history"
          detail="Review every permission and change"
          onPress={() => router.push("/profile/consent")}
        />
        <Row
          icon={<Download size={17} color={colors.ink} />}
          label="Download my data"
          detail="Request a portable copy"
          onPress={() => router.push("/profile/export")}
        />
        <Row
          icon={<Trash2 size={17} color={colors.ink} />}
          label="Leave or delete"
          detail="Exit a program or request account deletion"
          onPress={() => router.push("/profile/leave")}
        />
      </View>

      <View className="mt-5 flex-row flex-wrap justify-center gap-x-4 gap-y-1">
        {[
          ["Privacy", `${MARKETPLACE_URL}/privacy`],
          ["Terms", `${MARKETPLACE_URL}/terms`],
          ["How it works", `${MARKETPLACE_URL}/how-it-works`],
          ["I run a shop", `${SITE_URL}/partners`],
        ].map(([label, url]) => (
          <Pressable
            key={label}
            accessibilityRole="link"
            onPress={() =>
              label === "I run a shop"
                ? Linking.openURL(url)
                : router.push({
                    pathname: "/web/[page]",
                    params: { page: url.split("/").pop() ?? "" },
                  })
            }
          >
            <Text className="font-sans-bold text-[11px] text-muted-strong underline">
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert(
            "Sign out of this device?",
            "Your cards stay in your wallet. Sign back in with your password.",
            [
              { text: "Stay signed in", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => void signOut(),
              },
            ],
          )
        }
        className="mt-3 min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/5"
      >
        <LogOut size={16} color={colors.danger} />
        <Text className="font-sans-extrabold text-[14px] text-danger">
          Sign out of this device
        </Text>
      </Pressable>
    </Screen>
  );
}
