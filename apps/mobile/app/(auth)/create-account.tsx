import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import {
  ApiError,
  registerCustomer,
  requestOtp,
  walletExists,
} from "@kyprewards/api";
import { isCompleteMobile, normalizeMobile } from "@kyprewards/ui/format";
import {
  AuthShell,
  ChannelSwitch,
  Field,
  MobileField,
  type Channel,
} from "@/components/AuthShell";
import { BirthdayInput } from "@/components/Birthday";
import { SocialSignIn } from "@/components/SocialSignIn";
import { Button } from "@/components/ui";
import { readClaim } from "@/lib/claim";
import { MARKETPLACE_URL } from "@/lib/config";
import { KEYS, remember } from "@/lib/storage";
import { colors } from "@/lib/theme";

/**
 * A wallet, from a name and a number (a code follows), or a name, an email
 * and a password (a confirmation link follows). A number or email that
 * already has a wallet gets sign-in and "Forgot password?" instead.
 * On the mobile path email is optional; birthday always is - the
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
  const [channel, setChannel] = useState<Channel>("mobile");
  const [password, setPassword] = useState("");
  // The email path's wallet exists and waits on the emailed link.
  const [confirmSent, setConfirmSent] = useState(false);
  // Sign-up by a number or email that already has a wallet.
  const [existing, setExisting] = useState<{
    detail: string;
    via: Channel;
    to: string;
  } | null>(null);
  const byEmail = channel === "email";

  useEffect(() => {
    readClaim().then((claim) => claim && setPendingShop(claim.shop));
  }, []);

  function toSignIn(via: Channel, to: string) {
    router.replace({
      pathname: "/(auth)/login",
      params: { channel: via, identifier: to },
    });
  }

  async function submit() {
    if (!name.trim()) return setNotice("Enter your name.");
    if (byEmail) {
      if (!/^\S+@\S+\.\S+$/.test(email.trim()))
        return setNotice("Enter your email address.");
      if (password.length < 8)
        return setNotice("Choose a password of at least 8 characters.");
    } else if (!isCompleteMobile(normalizeMobile(mobile)))
      return setNotice("Enter your ten-digit mobile number.");
    if ((day && !month) || (!day && month))
      return setNotice("Give both the day and the month, or neither.");
    if (!accepted) return setNotice("Accept the terms to continue.");
    setBusy(true);
    setNotice("");
    setExisting(null);
    const birthday =
      day && month ? { birthdayDay: Number(day), birthdayMonth: month } : {};
    try {
      const result = await registerCustomer(
        byEmail
          ? {
              name: name.trim(),
              email: email.trim(),
              password,
              ...birthday,
              acceptedTerms: accepted,
            }
          : {
              name: name.trim(),
              mobile: mobile.trim(),
              email: email.trim() || undefined,
              ...birthday,
              acceptedTerms: accepted,
            },
      );
      if (result.next === "confirm_email") {
        setConfirmSent(true);
        setBusy(false);
        return;
      }
      await remember(KEYS.otpIdentifier, mobile.trim());
      router.push({
        pathname: "/(auth)/verify",
        params: { identifier: mobile.trim() },
      });
    } catch (failure) {
      // Nothing was sent: the way on is sign-in, or a code from "Forgot
      // password".
      const found = walletExists(failure);
      if (found) {
        setExisting({
          ...found,
          to: found.via === "email" ? email.trim() : mobile.trim(),
        });
      } else {
        setNotice(
          failure instanceof ApiError
            ? failure.message
            : "Could not set that up.",
        );
      }
      setBusy(false);
    }
  }

  /** "Forgot password?", as sign-in does it: a code, then the code screen. */
  async function sendCode(to: string) {
    setBusy(true);
    setNotice("");
    try {
      await requestOtp(to);
      await remember(KEYS.otpIdentifier, to);
      router.push({ pathname: "/(auth)/verify", params: { identifier: to } });
    } catch (failure) {
      setNotice(
        failure instanceof ApiError
          ? failure.message
          : "Could not send a code just now.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (confirmSent) {
    return (
      <AuthShell
        eyebrow="Join KYP"
        title="Check your inbox."
        description={`We sent a link to ${email.trim()}. Tap it, then sign in with your email and password.`}
      >
        <Button onPress={() => toSignIn("email", email.trim())}>
          Go to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join KYP"
      title={pendingShop ? "Save your stamp." : "Set up your wallet."}
      description={
        pendingShop
          ? `Your first stamp at ${pendingShop} is waiting. Set up your wallet and it goes on your card.`
          : "Keep rewards from nearby shops together, with permissions you can change anytime."
      }
    >
      <ChannelSwitch
        value={channel}
        onChange={(key) => {
          setChannel(key);
          setNotice("");
          setExisting(null);
        }}
      />
      <Field
        label="Name"
        value={name}
        onChange={setName}
        autoComplete="name"
      />
      {byEmail ? (
        <>
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            hint="At least 8 characters."
          />
        </>
      ) : (
        <>
          <MobileField value={mobile} onChange={setMobile} />
          <Field
            label="Email, optional"
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </>
      )}
      <View className="gap-2">
        <BirthdayInput
          day={day}
          month={month}
          onChange={(next) => {
            setDay(next.day);
            setMonth(next.month);
          }}
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

      {existing ? (
        <View
          accessibilityRole="alert"
          className="gap-3 rounded-2xl border border-line-strong bg-surface p-4"
        >
          <Text className="font-sans-extrabold text-[14px] leading-[20px] text-ink">
            {existing.detail}
          </Text>
          <Button onPress={() => toSignIn(existing.via, existing.to)}>
            Sign in
          </Button>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void sendCode(existing.to)}
            className="min-h-[44px] items-center justify-center"
          >
            <Text className="font-sans-extrabold text-[13px] text-accent-strong">
              {existing.via === "mobile"
                ? "Forgot password? Text me a code"
                : "Forgot password? Email me a code"}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {notice ? (
        <Text
          accessibilityRole="alert"
          className="font-sans-bold text-[12px] text-danger"
        >
          {notice}
        </Text>
      ) : null}
      <Button onPress={submit} busy={busy}>
        {byEmail ? "Create wallet" : "Text me a code"}
      </Button>
      <SocialSignIn onNotice={setNotice} />
      <Button tone="quiet" onPress={() => router.replace("/(auth)/login")}>
        I already have a wallet
      </Button>
    </AuthShell>
  );
}
