import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { ApiError, registerCustomer } from "@kypstamping/api";
import { isCompleteMobile, normalizeMobile } from "@kypstamping/ui/format";
import { AuthShell, Field, MobileField } from "@/components/AuthShell";
import { SocialSignIn } from "@/components/SocialSignIn";
import { Button, Chip } from "@/components/ui";
import { readClaim } from "@/lib/claim";
import { MARKETPLACE_URL } from "@/lib/config";
import { KEYS, remember } from "@/lib/storage";
import { colors } from "@/lib/theme";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * A wallet, from a name and a number. Email and birthday are optional - the
 * birthday is day and month only, because a treat needs to know when to
 * fire and not how old anyone is, and both halves go together or neither.
 */
export default function CreateAccount() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingShop, setPendingShop] = useState("");

  useEffect(() => {
    readClaim().then((claim) => claim && setPendingShop(claim.shop));
  }, []);

  async function submit() {
    if (!name.trim()) return setNotice("Enter your name.");
    if (!isCompleteMobile(normalizeMobile(mobile)))
      return setNotice("Enter your ten-digit mobile number.");
    if ((day && !month) || (!day && month))
      return setNotice("Give both the day and the month, or neither.");
    if (!accepted) return setNotice("Accept the terms to continue.");
    setBusy(true);
    setNotice("");
    try {
      await registerCustomer({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        ...(day && month
          ? { birthdayDay: Number(day), birthdayMonth: month }
          : {}),
        acceptedTerms: accepted,
      });
      await remember(KEYS.otpIdentifier, mobile.trim());
      router.push({
        pathname: "/(auth)/verify",
        params: { identifier: mobile.trim() },
      });
    } catch (failure) {
      setNotice(
        failure instanceof ApiError
          ? failure.message
          : "Could not set that up.",
      );
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Join KYP"
      title={pendingShop ? "Save your stamp." : "Set up your wallet."}
      description={
        pendingShop
          ? `Your first stamp at ${pendingShop} is waiting. Give us a number and it goes on your card.`
          : "Keep rewards from nearby shops together, with permissions you can change anytime."
      }
    >
      <Field
        label="Full name"
        value={name}
        onChange={setName}
        autoComplete="name"
      />
      <MobileField value={mobile} onChange={setMobile} />
      <Field
        label="Email, optional"
        value={email}
        onChange={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <View className="gap-2">
        <Text className="font-sans-extrabold text-[12px] text-ink">
          Birthday, optional
        </Text>
        <View className="flex-row gap-2">
          <View className="w-24">
            <Field
              label=""
              value={day}
              onChange={(typed) => setDay(typed.replace(/\D/g, "").slice(0, 2))}
              placeholder="Day"
              keyboardType="number-pad"
              autoCapitalize="none"
            />
          </View>
          <View className="flex-1 flex-row flex-wrap gap-1.5">
            {MONTHS.map((label, index) => (
              <Chip
                key={label}
                label={label.slice(0, 3)}
                selected={month === index + 1}
                onPress={() => setMonth(month === index + 1 ? null : index + 1)}
              />
            ))}
          </View>
        </View>
        <Text className="font-sans-semibold text-[11px] text-muted-strong">
          Shops you join can send you something on your birthday. We ask for the
          day and month only - never the year - and you can add or change it
          later.
        </Text>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => setAccepted((on) => !on)}
        className="flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-4"
      >
        <View
          className={`mt-0.5 size-5 items-center justify-center rounded-md border ${accepted ? "border-ink bg-ink" : "border-line-strong"}`}
        >
          {accepted ? (
            <Check size={13} color={colors.paper} strokeWidth={3} />
          ) : null}
        </View>
        <Text className="flex-1 font-sans text-[12px] leading-[18px] text-muted-strong">
          I agree to the{" "}
          <Text
            className="font-sans-bold underline"
            onPress={() => Linking.openURL(`${MARKETPLACE_URL}/terms`)}
          >
            terms
          </Text>{" "}
          and the{" "}
          <Text
            className="font-sans-bold underline"
            onPress={() => Linking.openURL(`${MARKETPLACE_URL}/privacy`)}
          >
            privacy notice
          </Text>
          .
        </Text>
      </Pressable>

      {/* Said before the wallet exists, as the web wallet does: the API
          starts push and email promotions on. This line used to promise
          every channel stayed off, which was not what the account got. */}
      <Text className="font-sans text-[12px] leading-[18px] text-muted-strong">
        Offers from shops you join arrive by push and email; SMS stays off.
        Turn any of them off in Notifications at any time.
      </Text>

      {notice ? (
        <Text
          accessibilityRole="alert"
          className="font-sans-bold text-[12px] text-danger"
        >
          {notice}
        </Text>
      ) : null}
      <Button onPress={submit} busy={busy}>
        Text me a code
      </Button>
      <SocialSignIn onNotice={setNotice} />
      <Button tone="quiet" onPress={() => router.replace("/(auth)/login")}>
        I already have a wallet
      </Button>
    </AuthShell>
  );
}
