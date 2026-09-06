import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ApiError, requestOtp, verifyOtp } from "@kypstamping/api";
import { AuthShell, Field } from "@/components/AuthShell";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { KEYS, forget, recall } from "@/lib/storage";

/**
 * The six digits. The identifier rides in the route params, and in the
 * keychain for the case where the person left to read the SMS and the OS
 * dropped the app behind it.
 */
export default function Verify() {
  const router = useRouter();
  const params = useLocalSearchParams<{ identifier?: string }>();
  const signIn = useAuth((state) => state.signIn);
  const [identifier, setIdentifier] = useState(params.identifier ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!identifier)
      recall(KEYS.otpIdentifier).then((saved) => saved && setIdentifier(saved));
  }, [identifier]);

  async function submit() {
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setNotice("Enter the six-digit code.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const result = await verifyOtp(identifier, digits);
      if (!result.sessionToken) {
        // The API answered without a token, which means it did not recognise
        // this as the app. Nothing to keep; say so rather than sign in to
        // nothing.
        throw new Error("The server did not return a session for this app.");
      }
      await forget(KEYS.otpIdentifier);
      await signIn(result.sessionToken);
      router.replace("/(tabs)");
    } catch (failure) {
      setNotice(
        failure instanceof ApiError
          ? failure.message
          : (failure as Error).message,
      );
      setBusy(false);
    }
  }

  async function resend() {
    try {
      await requestOtp(identifier);
      setResent(true);
      setNotice("");
    } catch (failure) {
      setNotice(
        failure instanceof ApiError
          ? failure.message
          : "Could not resend just now.",
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Verify"
      title="Enter the code."
      description={
        identifier
          ? `We sent six digits to ${identifier}. It expires in a few minutes.`
          : "We sent you six digits."
      }
    >
      <Field
        label="Verification code"
        value={code}
        onChange={(typed) => setCode(typed.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        autoCapitalize="none"
      />
      {notice ? (
        <Text
          accessibilityRole="alert"
          className="font-sans-bold text-[12px] text-danger"
        >
          {notice}
        </Text>
      ) : null}
      <Button onPress={submit} busy={busy} disabled={code.length !== 6}>
        Verify and open my wallet
      </Button>
      <Button tone="quiet" onPress={resend} disabled={resent}>
        {resent ? "Code sent again" : "Send the code again"}
      </Button>
      <Button tone="quiet" onPress={() => router.replace("/(auth)/login")}>
        Use a different number
      </Button>
    </AuthShell>
  );
}
