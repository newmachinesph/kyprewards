import "../global.css";

import { useEffect } from "react";
import { AppState, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { Sora_700Bold } from "@expo-google-fonts/sora";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  ApiError,
  ApiProvider,
  claimFirstStamp,
  keys,
  useQueryClient,
} from "@kyprewards/api";
import { useAuth } from "@/lib/auth";
import { forgetClaim, readClaim } from "@/lib/claim";
import { useLock } from "@/lib/lock";
import {
  onNotificationOpened,
  pushTurnedOff,
  registerForPush,
} from "@/lib/push";
import { colors } from "@/lib/theme";
import { LockScreen } from "@/components/LockScreen";
import { ToastHost } from "@/components/Toast";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsReady] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Sora_700Bold,
  });
  const status = useAuth((state) => state.status);
  const bootstrap = useAuth((state) => state.bootstrap);
  const lockReady = useLock((state) => state.ready);
  const engage = useLock((state) => state.engage);
  const locked = useLock((state) => state.locked);

  useEffect(() => {
    void bootstrap();
    void lockReady();
  }, [bootstrap, lockReady]);

  // Only "background". iOS reports "inactive" for the app switcher and for
  // every system prompt the app itself raises - including the biometric one -
  // so locking on that would fight the unlock it just asked for.
  useEffect(() => {
    const watch = AppState.addEventListener("change", (next) => {
      if (next === "background") engage();
    });
    return () => watch.remove();
  }, [engage]);

  useEffect(() => {
    if (fontsReady && status !== "booting") void SplashScreen.hideAsync();
  }, [fontsReady, status]);

  if (!fontsReady || status === "booting") return null;

  return (
    <SafeAreaProvider>
      <ApiProvider>
        <SignedInEffects />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="scan"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="my-code"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen name="approvals" options={{ presentation: "modal" }} />
          <Stack.Screen
            name="notifications"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen name="activity" options={{ presentation: "modal" }} />
          <Stack.Screen name="gifts" options={{ presentation: "modal" }} />
        </Stack>
        {/* Laid over the navigator rather than replacing it: unmounting the
            Stack would throw away where the customer was, so a lock and an
            unlock would also be a trip back to Home. */}
        {status === "signed-in" && locked ? (
          <View className="absolute inset-0 z-50">
            <LockScreen />
          </View>
        ) : null}
        <ToastHost />
      </ApiProvider>
    </SafeAreaProvider>
  );
}

/**
 * What happens once somebody is signed in and nowhere else:
 * push registration, a pending poster claim, and notification taps.
 *
 * Inside the provider because the claim invalidates the wallet's cache.
 */
function SignedInEffects() {
  const status = useAuth((state) => state.status);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== "signed-in") return;
    void pushTurnedOff()
      .then((off) => (off ? undefined : registerForPush()))
      .catch(() => undefined);
  }, [status]);

  // A stamp claimed from a poster before sign-up, settled on the first render
  // that has a session. A server that answered is an answer - already a
  // member, an expired token - and the claim is forgotten; a server that did
  // not is asked again next launch. Same rule as the web wallet.
  useEffect(() => {
    if (status !== "signed-in") return;
    let live = true;
    readClaim().then((claim) => {
      if (!claim || !live) return;
      claimFirstStamp(claim.token)
        .then(() => true)
        .catch((failure) => failure instanceof ApiError)
        .then((answered) => {
          if (answered) void forgetClaim();
          void queryClient.invalidateQueries({ queryKey: keys.customer.all });
        });
    });
    return () => {
      live = false;
    };
  }, [status, queryClient]);

  useEffect(
    () => onNotificationOpened((route) => router.push(route as never)),
    [router],
  );

  // A session revoked while the app is open - signed out elsewhere, a lost
  // phone reported, the server's own sweep - answers 401 on the next request.
  // Seen on a device: every screen said "Session expired or revoked" with a
  // Try again that could never work. Re-checking the session clears it and
  // the auth layout shows sign-in; a 401 that was a fluke re-verifies fine.
  useEffect(() => {
    if (status !== "signed-in") return;
    const onError = (failure: unknown) => {
      if (failure instanceof ApiError && failure.status === 401) {
        void useAuth.getState().refresh();
      }
    };
    const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") onError(event.action.error);
    });
    const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") onError(event.action.error);
    });
    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [status, queryClient]);

  return null;
}
