import { useEffect, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as AppleAuthentication from "expo-apple-authentication";
import { ApiError, socialSignIn } from "@kyprewards/api";
import { useAuth } from "@/lib/auth";
import {
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  MARKETPLACE_URL,
} from "@/lib/config";

type GoogleModule = typeof import("@react-native-google-signin/google-signin");

let google: GoogleModule | null | undefined;

/**
 * The Google module, or null where it cannot run: no client ID configured,
 * or Expo Go, which does not carry the native side and throws on import.
 * Required lazily for the same reason `push.ts` requires notifications so.
 */
function googleModule(): GoogleModule | null {
  if (google !== undefined) return google;
  if (
    !GOOGLE_WEB_CLIENT_ID ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    google = null;
    return google;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-google-signin/google-signin") as GoogleModule;
    mod.GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
    });
    google = mod;
  } catch {
    google = null;
  }
  return google;
}

/**
 * "Continue with Apple" (iOS only, where Apple requires it beside any other
 * third-party sign-in) and "Continue with Google" (both platforms).
 *
 * A first sign-in creates the wallet, and the line under the buttons is the
 * terms acceptance for that case - shown before the tap, sent with it.
 */
export function SocialSignIn({ onNotice }: { onNotice: (text: string) => void }) {
  const signIn = useAuth((state) => state.signIn);
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState(false);
  const googleReady = googleModule() !== null;

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setApple)
      .catch(() => setApple(false));
  }, []);

  async function finish(
    provider: "google" | "apple",
    idToken: string,
    name?: string,
    authorizationCode?: string,
  ) {
    const result = await socialSignIn({
      provider,
      idToken,
      name,
      acceptedTerms: true,
      ...(authorizationCode ? { authorizationCode } : {}),
    });
    if (!result.sessionToken) {
      throw new Error("The server did not return a session for this app.");
    }
    await signIn(result.sessionToken);
  }

  async function withGoogle() {
    const mod = googleModule();
    if (!mod || busy) return;
    setBusy(true);
    onNotice("");
    try {
      await mod.GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await mod.GoogleSignin.signIn();
      if (!mod.isSuccessResponse(response)) return; // cancelled
      const idToken = response.data.idToken;
      if (!idToken) throw new Error("Google did not return a sign-in token.");
      await finish("google", idToken);
    } catch (failure) {
      if (
        mod.isErrorWithCode(failure) &&
        (failure.code === mod.statusCodes.SIGN_IN_CANCELLED ||
          failure.code === mod.statusCodes.IN_PROGRESS)
      ) {
        return;
      }
      onNotice(
        failure instanceof ApiError
          ? failure.message
          : "Google sign-in did not finish. Try again, or use a code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function withApple() {
    if (busy) return;
    setBusy(true);
    onNotice("");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error("Apple did not return a sign-in token.");
      }
      // Apple gives the name once, on the very first sign-in, and never
      // puts it in the token.
      const name = [
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(" ");
      // The authorization code lets the API revoke this Apple sign-in if the
      // wallet is ever deleted, as Apple requires.
      await finish(
        "apple",
        credential.identityToken,
        name || undefined,
        credential.authorizationCode ?? undefined,
      );
    } catch (failure) {
      if ((failure as { code?: string }).code === "ERR_REQUEST_CANCELED") return;
      onNotice(
        failure instanceof ApiError
          ? failure.message
          : "Apple sign-in did not finish. Try again, or use a code.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!apple && !googleReady) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-line" />
        <Text className="font-sans-bold text-[11px] uppercase tracking-[1.2px] text-muted">
          or
        </Text>
        <View className="h-px flex-1 bg-line" />
      </View>
      {apple ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={16}
          style={{ height: 48, width: "100%", opacity: busy ? 0.5 : 1 }}
          onPress={() => void withApple()}
        />
      ) : null}
      {googleReady ? (
        // The library's own button, Google's branding as Google specifies
        // it; the module is known to be loaded when googleReady is true.
        (() => {
          const { GoogleSigninButton } = googleModule() as GoogleModule;
          return (
            <GoogleSigninButton
              accessibilityLabel="Continue with Google"
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Light}
              disabled={busy}
              onPress={() => void withGoogle()}
              style={{ width: "100%", height: 52 }}
            />
          );
        })()
      ) : null}
      <Text className="text-center font-sans text-[11px] leading-[16px] text-muted-strong">
        New here? Continuing creates your wallet and means you accept the{" "}
        <Text
          accessibilityRole="link"
          onPress={() => void Linking.openURL(`${MARKETPLACE_URL}/terms`)}
          className="font-sans-extrabold text-accent-strong"
        >
          terms
        </Text>{" "}
        and{" "}
        <Text
          accessibilityRole="link"
          onPress={() => void Linking.openURL(`${MARKETPLACE_URL}/privacy`)}
          className="font-sans-extrabold text-accent-strong"
        >
          privacy notice
        </Text>
        .
      </Text>
    </View>
  );
}
