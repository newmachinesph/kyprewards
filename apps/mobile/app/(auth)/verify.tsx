import { useEffect, useState } from "react";
import { Text } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ApiError, requestOtp, verifyOtp } from "@kyprewards/api";
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
  // Every code screen sets the password the code is proving the number for:
  // sign-up, forgot password, or a wallet from before passwords.
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [resent, setResent] = useState(false);
  // Whether the keychain has been asked. Until then an empty identifier only
  // means "not read yet", not "nothing was sent".
  const [looked, setLooked] = useState(Boolean(params.identifier));

  useEffect(() => {
    if (identifier) return;
    recall(KEYS.otpIdentifier).then((saved) => {
      if (saved) setIdentifier(saved);
      setLooked(true);
    });
  }, [identifier]);

  async function submit() {
    // Never verifyOtp(""): the API's answer is a validation error nobody can
    // act on.
    if (!identifier) return;
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setNotice("Enter the six-digit code.");
      return;
    }
    if (password.length < 8) {
      setNotice("Choose a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const result = await verifyOtp(identifier, digits, password);
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
    if (!identifier) return;
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

  // Opened cold - a stale link, a restore after the keychain was wiped - with
  // no code ever sent. Nothing to check the digits against, so say what to do.
  if (looked && !identifier) {
    return (
      <AuthShell
        eyebrow="Verify"
        title="Ask for a fresh code."
        description="This screen was opened without a code being sent. Start again from sign-in and we will text you one."
      >
        <Button onPress={() => router.replace("/(auth)/login")}>
          Back to sign in
        </Button>
        <CreateWalletLink />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Verify"
      title="Enter the code."
      description={
        identifier
          ? `We sent six digits to ${identifier}. Enter them and choose a password for next time.`
          : "Enter the six digits we sent you and choose a password for next time."
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
      <Field
        label="Choose a password"
        value={password}
        onChange={setPassword}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        hint="At least 8 characters. Next time you sign in with it, no code needed."
      />
      {notice ? (
        <Text
          accessibilityRole="alert"
          className="font-sans-bold text-[12px] text-danger"
        >
          {notice}
        </Text>
      ) : null}
      <Button
        onPress={submit}
        busy={busy}
        disabled={code.length !== 6 || password.length < 8}
      >
        Verify and open my wallet
      </Button>
      <Button tone="quiet" onPress={resend} disabled={resent}>
        {resent ? "Code sent again" : "Send the code again"}
      </Button>
      <Button tone="quiet" onPress={() => router.replace("/(auth)/login")}>
        Use a different number
      </Button>
      <CreateWalletLink />
    </AuthShell>
  );
}

/**
 * A number with no wallet is still told a code was sent - the API does not
 * say whether an account exists - and then every code is refused. This is
 * the way out for a mistyped digit or somebody who never had a wallet.
 */
function CreateWalletLink() {
  return (
    <Link
      href="/(auth)/create-account"
      replace
      className="min-h-[44px] py-3 text-center font-sans-extrabold text-[13px] text-accent-strong"
    >
      No code arriving? Create a wallet
    </Link>
  );
}
