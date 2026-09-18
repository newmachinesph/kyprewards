import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Mail, Smartphone } from "lucide-react-native";
import { ApiError, customerLogin, requestOtp } from "@kypstamping/api";
import { isCompleteMobile, normalizeMobile } from "@kypstamping/ui/format";
import { AuthShell, Field, MobileField } from "@/components/AuthShell";
import { SocialSignIn } from "@/components/SocialSignIn";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { KEYS, remember } from "@/lib/storage";
import { colors } from "@/lib/theme";

type Channel = "mobile" | "email";

/**
 * Sign in with a mobile or an email and a password. A code is sent only to
 * prove the number: "Forgot or never set a password?" goes to the code
 * screen, which takes a new password with the code.
 */
export default function Login() {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("mobile");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useAuth((state) => state.signIn);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const ready =
    channel === "mobile"
      ? isCompleteMobile(normalizeMobile(identifier))
      : /^\S+@\S+\.\S+$/.test(identifier.trim());

  function checkIdentifier(): boolean {
    if (ready) return true;
    setNotice(
      channel === "mobile"
        ? "Enter your ten-digit mobile number."
        : "Enter your email address.",
    );
    return false;
  }

  async function submit() {
    if (!checkIdentifier()) return;
    if (!password) {
      setNotice("Enter your password.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const result = await customerLogin(identifier.trim(), password);
      if (!result.sessionToken) {
        throw new Error("The server did not return a session for this app.");
      }
      await signIn(result.sessionToken);
    } catch (failure) {
      setNotice(
        failure instanceof ApiError
          ? failure.message
          : "Could not sign in just now.",
      );
      setBusy(false);
    }
  }

  /** A code to prove the number; the code screen sets the password. */
  async function sendCode() {
    if (!checkIdentifier()) return;
    setBusy(true);
    setNotice("");
    try {
      await requestOtp(identifier.trim());
      await remember(KEYS.otpIdentifier, identifier.trim());
      router.push({
        pathname: "/(auth)/verify",
        params: { identifier: identifier.trim() },
      });
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

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Open your wallet."
      description="Use your mobile number or email and your password."
    >
      <View className="flex-row rounded-2xl border border-line bg-surface p-1">
        {(
          [
            ["mobile", "Mobile", Smartphone],
            ["email", "Email", Mail],
          ] as const
        ).map(([key, label, Icon]) => {
          const on = channel === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setChannel(key);
                setIdentifier("");
                setNotice("");
              }}
              className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-xl ${on ? "bg-ink" : ""}`}
            >
              <Icon size={15} color={on ? colors.paper : colors.mutedStrong} />
              <Text
                className={`font-sans-extrabold text-[13px] ${on ? "text-paper" : "text-muted-strong"}`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {channel === "mobile" ? (
        <MobileField value={identifier} onChange={setIdentifier} />
      ) : (
        <Field
          label="Email"
          value={identifier}
          onChange={setIdentifier}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      )}

      <Field
        label="Password"
        value={password}
        onChange={setPassword}
        secure
        autoCapitalize="none"
        autoComplete="current-password"
      />

      {notice ? (
        <Text
          accessibilityRole="alert"
          className="font-sans-bold text-[12px] text-danger"
        >
          {notice}
        </Text>
      ) : null}

      <Button onPress={submit} busy={busy}>
        Sign in
      </Button>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void sendCode()}
        className="min-h-[44px] items-center justify-center"
      >
        <Text className="font-sans-extrabold text-[13px] text-accent-strong">
          Forgot or never set a password? Get a code
        </Text>
      </Pressable>

      <SocialSignIn onNotice={setNotice} />

      <Text className="text-center font-sans text-[12px] text-muted-strong">
        New to KYP?{" "}
        <Link
          href="/(auth)/create-account"
          className="font-sans-extrabold text-accent-strong"
        >
          Create your wallet
        </Link>
      </Text>
    </AuthShell>
  );
}
