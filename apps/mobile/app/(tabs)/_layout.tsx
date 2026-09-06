import { Redirect, Tabs } from "expo-router";
import {
  Compass,
  Home,
  QrCode,
  UserRound,
  WalletCards,
} from "lucide-react-native";
import { View } from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

/**
 * Home · Wallet · Code · Discover · Profile.
 *
 * The code sits in the middle because it is the thing a shopper reaches for
 * every visit - staff scan it to stamp and to hand over a reward. Scanning
 * a poster is a first-visit act and lives one tap off Home and Discover.
 */
export default function TabsLayout() {
  const status = useAuth((state) => state.status);
  if (status !== "signed-in") return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentStrong,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: "Inter_700Bold", fontSize: 10 },
        // No fixed height: the navigator adds the bottom inset itself, and a
        // height set here put the labels under Android's navigation bar.
        tabBarStyle: {
          backgroundColor: "rgba(255, 254, 251, 0.96)",
          borderTopColor: colors.line,
        },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <WalletCards color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="code"
        options={{
          title: "My code",
          tabBarIcon: ({ focused }) => (
            <View
              className={`-mt-5 size-14 items-center justify-center rounded-full border-4 border-paper ${focused ? "bg-accent" : "bg-ink"}`}
            >
              <QrCode color={focused ? colors.ink : colors.paper} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Compass color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
