import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";

/** The app's front door: the wallet if signed in, sign-in if not. */
export default function Index() {
  const status = useAuth((state) => state.status);
  return (
    <Redirect href={status === "signed-in" ? "/(tabs)" : "/(auth)/login"} />
  );
}
