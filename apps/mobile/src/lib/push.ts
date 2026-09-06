import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import type * as NotificationsModule from "expo-notifications";
import { registerExpoPush } from "@kypstamping/api";

/**
 * Real push, for the one moment it matters: a reward waiting for approval.
 *
 * The web wallet has Web Push. The app registers its Expo push token in the
 * same table, under `kind: "expo"`, and the API's sender picks the socket.
 * Asked for once there is a session, never on the sign-in screen - a
 * permission prompt before somebody has a wallet is a prompt for nothing.
 *
 * `expo-notifications` throws the moment it is imported inside Expo Go on
 * Android (remote push left Expo Go in SDK 53), and the whole route tree
 * failed to load with it. It is required lazily, once, so a build without
 * it runs with the in-app inbox alone.
 */
type Notifications = typeof NotificationsModule;

let loaded: Notifications | null | undefined;

function notifications(): Notifications | null {
  if (loaded !== undefined) return loaded;
  // Expo Go on Android throws on import, and Metro's require guard reports
  // that as a fatal error before a try/catch here could see it. Do not ask.
  if (
    Platform.OS === "android" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    loaded = null;
    return loaded;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const api = require("expo-notifications") as Notifications;
    api.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    loaded = api;
  } catch {
    loaded = null;
  }
  return loaded;
}

export async function registerForPush(): Promise<
  "registered" | "denied" | "unavailable"
> {
  const api = notifications();
  // A simulator has no push service to register with; Expo Go has no module.
  if (!api || !Device.isDevice) return "unavailable";

  if (Platform.OS === "android") {
    await api.setNotificationChannelAsync("rewards", {
      name: "Rewards and visits",
      importance: api.AndroidImportance.HIGH,
      lightColor: "#e8a33d",
    });
  }

  const current = await api.getPermissionsAsync();
  const status =
    current.status === "granted"
      ? current.status
      : (await api.requestPermissionsAsync()).status;
  if (status !== "granted") return "denied";

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    // Not linked to an EAS project yet - a local dev build before
    // `eas init`. Nothing to register with; the in-app inbox still works.
    return "unavailable";
  }
  const { data: token } = await api.getExpoPushTokenAsync({ projectId });
  await registerExpoPush(token);
  return "registered";
}

/**
 * Calls `open` with the native route a tapped notification asked for.
 * Returns the unsubscribe; a no-op where there is no notification module.
 */
export function onNotificationOpened(
  open: (route: string) => void,
): () => void {
  const api = notifications();
  if (!api) return () => undefined;
  const subscription = api.addNotificationResponseReceivedListener(
    (response) => {
      const route = routeFrom(response);
      if (route) open(route);
    },
  );
  return () => subscription.remove();
}

/** The route a tapped notification asked for, or null. */
export function routeFrom(
  response: NotificationsModule.NotificationResponse,
): string | null {
  const data = response.notification.request.content.data as
    Record<string, unknown> | undefined;
  const url = data?.url;
  if (typeof url !== "string") return null;
  // `https://app.kyp.ph/#approve` from the web payload, or a bare route.
  const hash = url.split("#")[1];
  if (hash === "approve") return "/approvals";
  if (hash === "gifts") return "/gifts";
  if (hash === "activity") return "/activity";
  if (hash === "notifications") return "/notifications";
  return null;
}
