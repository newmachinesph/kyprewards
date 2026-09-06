import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function AuthLayout() {
  const status = useAuth((state) => state.status);
  // Pressing Back after signing in landed the web wallet on its own sign-up
  // screen. Here the group is simply not reachable with a session.
  if (status === "signed-in") return <Redirect href="/(tabs)" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
      }}
    />
  );
}
