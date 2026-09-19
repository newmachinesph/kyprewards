import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, ChevronDown } from "lucide-react-native";
import { ApiError, registerCustomer } from "@kypstamping/api";
import { isCompleteMobile, normalizeMobile } from "@kypstamping/ui/format";
import { AuthShell, Field, MobileField } from "@/components/AuthShell";
import { SocialSignIn } from "@/components/SocialSignIn";
import { Button } from "@/components/ui";
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
  const [pickingMonth, setPickingMonth] = useState(false);
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
        label="Name"
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Birthday month"
            accessibilityValue={{ text: month ? MONTHS[month - 1] : "Not set" }}
            onPress={() => setPickingMonth(true)}
            className="min-h-[50px] flex-1 flex-row items-center justify-between rounded-2xl border border-line-strong bg-surface px-4"
          >
            <Text
              className={`font-sans-semibold text-[15px] ${month ? "text-ink" : "text-muted"}`}
            >
              {month ? MONTHS[month - 1] : "Month"}
            </Text>
            <ChevronDown size={16} color={colors.muted} />
          </Pressable>
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
        </View>
        <MonthSheet
          open={pickingMonth}
          selected={month}
          onPick={(picked) => {
            setMonth(picked);
            setPickingMonth(false);
          }}
          onClose={() => setPickingMonth(false)}
        />
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
        className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4"
      >
        <View
          className={`size-5 items-center justify-center rounded-md border ${accepted ? "border-ink bg-ink" : "border-line-strong"}`}
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

/** The twelve months as one list in a sheet, instead of twelve buttons on the form. */
function MonthSheet({
  open,
  selected,
  onPick,
  onClose,
}: {
  open: boolean;
  selected: number | null;
  onPick: (month: number | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close"
        onPress={onClose}
        className="flex-1 bg-ink/55"
      />
      <View className="max-h-[70%] rounded-t-[18px] bg-surface pb-8 pt-4">
        <Text className="px-5 pb-2 font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-accent-strong">
          Birthday month
        </Text>
        <ScrollView>
          {MONTHS.map((label, index) => {
            const picked = selected === index + 1;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityState={{ selected: picked }}
                onPress={() => onPick(index + 1)}
                className="flex-row items-center justify-between border-t border-line px-5 py-3.5"
              >
                <Text
                  className={`text-[15px] text-ink ${picked ? "font-sans-extrabold" : "font-sans-semibold"}`}
                >
                  {label}
                </Text>
                {picked ? <Check size={16} color={colors.ink} strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
          {selected ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onPick(null)}
              className="border-t border-line px-5 py-3.5"
            >
              <Text className="font-sans-bold text-[14px] text-muted-strong">
                Clear birthday month
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
